import asyncio
import os
import re
import zipfile
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit

import httpx
import yt_dlp

from app.gallery_extractor import extract_tiktok_photos, is_tiktok_photo_url
from app.image_processor import convert_image
from app.jobs import Job, JobManager
from app.security import is_safe_url

MAX_DOWNLOAD_SIZE = int(os.environ.get("MAX_DOWNLOAD_SIZE", 500 * 1024 * 1024))  # 500 MB
CONNECT_TIMEOUT = float(os.environ.get("CONNECT_TIMEOUT", 10.0))
READ_TIMEOUT = float(os.environ.get("READ_TIMEOUT", 30.0))
TOTAL_JOB_TIMEOUT = float(os.environ.get("TOTAL_JOB_TIMEOUT", 600.0))  # 10 minutes
MAX_CONCURRENT_JOBS = int(os.environ.get("MAX_CONCURRENT_JOBS", 3))

_semaphore = asyncio.Semaphore(MAX_CONCURRENT_JOBS)


def get_platform_ytdlp_opts(format_choice: str, quality_choice: str, output_template: str) -> dict:
    fmt_lower = format_choice.lower()
    qual_lower = quality_choice.lower()

    opts: dict = {
        "outtmpl": output_template,
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
    }

    if fmt_lower in ("audio", "mp3"):
        bitrate = "0"  # Best
        if "320" in qual_lower:
            bitrate = "320"
        elif "192" in qual_lower:
            bitrate = "192"
        elif "128" in qual_lower:
            bitrate = "128"

        opts.update({
            "format": "bestaudio/best",
            "postprocessors": [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": bitrate,
            }],
        })
    else:
        # Video
        height = None
        if "720" in qual_lower:
            height = 720
        elif "1080" in qual_lower:
            height = 1080

        if height:
            video_fmt = f"bestvideo[height<={height}]+bestaudio/best[height<={height}]/best"
        else:
            video_fmt = "bestvideo+bestaudio/best"

        opts.update({
            "format": video_fmt,
            "merge_output_format": "mp4",
        })

    return opts


def _extract_filename_from_headers_or_url(headers: dict, url: str) -> str:
    content_disp = headers.get("content-disposition", "")
    match = re.search(r'filename\*?=(?:UTF-8\'\')?"?([^";]+)"?', content_disp, re.IGNORECASE)
    if match:
        name = match.group(1).strip()
        if name:
            return unquote(name)

    path = urlsplit(url).path
    name = Path(path).name
    if name:
        return unquote(name)
    return "downloaded_file"


async def download_direct_file(job: Job, manager: JobManager) -> None:
    current_url = job.url
    job_dir = manager.storage_dir / job.job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    manager.update_job(job.job_id, status="downloading", progress=0.0)

    timeout = httpx.Timeout(READ_TIMEOUT, connect=CONNECT_TIMEOUT)
    max_redirects = 5

    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=False) as client:
            for _ in range(max_redirects):
                if not is_safe_url(current_url):
                    manager.update_job(job.job_id, status="failed", error="Invalid or unsafe destination URL", error_code="invalid_url")
                    return

                if manager.is_cancelled(job.job_id):
                    return

                async with client.stream("GET", current_url, headers={"User-Agent": "MediaDrop/1.0"}) as response:
                    if response.status_code in (301, 302, 303, 307, 308):
                        location = response.headers.get("location")
                        if not location:
                            manager.update_job(job.job_id, status="failed", error="Missing redirect location", error_code="redirect_failed")
                            return
                        current_url = urljoin(current_url, location)
                        continue

                    if response.status_code != 200:
                        manager.update_job(job.job_id, status="failed", error=f"Server returned status {response.status_code}", error_code="download_failed")
                        return

                    # 200 OK — examine headers
                    resp_headers = {k.lower(): v for k, v in response.headers.items()}
                    total_bytes_header = resp_headers.get("content-length")
                    total_bytes = int(total_bytes_header) if total_bytes_header and total_bytes_header.isdigit() else None

                    if total_bytes and total_bytes > MAX_DOWNLOAD_SIZE:
                        manager.update_job(job.job_id, status="failed", error="File exceeds the 500 MB limit", error_code="file_too_large")
                        return

                    filename = _extract_filename_from_headers_or_url(resp_headers, current_url)
                    # Clean filename
                    filename = "".join(c for c in filename if c not in '<>:"/\\|?*').strip() or "output_file"
                    output_path = job_dir / filename

                    downloaded = 0
                    with open(output_path, "wb") as f:
                        async for chunk in response.aiter_bytes(chunk_size=65536):
                            if manager.is_cancelled(job.job_id):
                                output_path.unlink(missing_ok=True)
                                return

                            f.write(chunk)
                            downloaded += len(chunk)

                            if downloaded > MAX_DOWNLOAD_SIZE:
                                output_path.unlink(missing_ok=True)
                                manager.update_job(job.job_id, status="failed", error="File exceeds the 500 MB limit", error_code="file_too_large")
                                return

                            prog = (downloaded / total_bytes * 100) if total_bytes else None
                            manager.update_job(job.job_id, downloaded_bytes=downloaded, total_bytes=total_bytes, progress=round(prog, 1) if prog is not None else None)

                    # Convert image format if requested (jpg / png)
                    if job.output_format.lower() in ("jpg", "jpeg", "png"):
                        try:
                            converted_path = convert_image(output_path, job.output_format)
                            if converted_path.resolve() != output_path.resolve():
                                output_path.unlink(missing_ok=True)
                                output_path = converted_path
                                filename = converted_path.name
                            downloaded = output_path.stat().st_size
                        except Exception as exc:
                            output_path.unlink(missing_ok=True)
                            manager.update_job(
                                job.job_id,
                                status="failed",
                                error=f"Image conversion failed: {exc}",
                                error_code="conversion_failed",
                            )
                            return

                    manager.update_job(
                        job.job_id,
                        status="ready",
                        progress=100.0,
                        file_size=downloaded,
                        filename=filename,
                        file_path=str(output_path),
                    )
                    return

            manager.update_job(job.job_id, status="failed", error="Too many redirects", error_code="too_many_redirects")

    except Exception as exc:
        if not manager.is_cancelled(job.job_id):
            manager.update_job(job.job_id, status="failed", error=str(exc), error_code="download_failed")


def _run_platform_download_sync(job: Job, manager: JobManager) -> None:
    job_dir = manager.storage_dir / job.job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    out_tmpl = str(job_dir / "%(title).60s.%(ext)s")

    opts = get_platform_ytdlp_opts(job.format, job.quality, out_tmpl)

    def progress_hook(progress_data: dict):
        if manager.is_cancelled(job.job_id):
            raise yt_dlp.utils.DownloadCancelled("Job cancelled by user")

        status = progress_data.get("status")
        if status == "downloading":
            downloaded = progress_data.get("downloaded_bytes") or 0
            total = progress_data.get("total_bytes") or progress_data.get("total_bytes_estimate")
            if downloaded > MAX_DOWNLOAD_SIZE or (total and total > MAX_DOWNLOAD_SIZE):
                raise ValueError("file_too_large")
            prog = (downloaded / total * 100) if total else None
            manager.update_job(
                job.job_id,
                status="downloading",
                downloaded_bytes=downloaded,
                total_bytes=total,
                progress=round(prog, 1) if prog is not None else None,
            )
        elif status == "finished":
            manager.update_job(job.job_id, status="processing")

    opts["progress_hooks"] = [progress_hook]

    try:
        manager.update_job(job.job_id, status="downloading", progress=0.0)
        with yt_dlp.YoutubeDL(opts) as ydl:
            ydl.download([job.url])

        if manager.is_cancelled(job.job_id):
            return

        # Find the produced output file
        candidates = [
            f for f in job_dir.iterdir()
            if f.is_file() and f.name != "metadata.json" and not f.name.endswith(".part") and not f.name.endswith(".ytdl")
        ]
        if candidates:
            # Sort by mtime descending (most recently created/processed)
            out_file = max(candidates, key=lambda f: f.stat().st_mtime)
            manager.update_job(
                job.job_id,
                status="ready",
                progress=100.0,
                file_size=out_file.stat().st_size,
                filename=out_file.name,
                file_path=str(out_file),
            )
        else:
            manager.update_job(job.job_id, status="failed", error="Output file not found after processing", error_code="file_not_found")
    except yt_dlp.utils.DownloadCancelled:
        manager.update_job(job.job_id, status="cancelled")
    except ValueError as ve:
        if str(ve) == "file_too_large":
            manager.update_job(job.job_id, status="failed", error="File exceeds the 500 MB limit", error_code="file_too_large")
        else:
            manager.update_job(job.job_id, status="failed", error=str(ve), error_code="download_failed")
    except Exception as exc:
        if not manager.is_cancelled(job.job_id):
            manager.update_job(job.job_id, status="failed", error=str(exc), error_code="download_failed")


def _extract_platform_thumbnail_url(page_url: str) -> str | None:
    try:
        with yt_dlp.YoutubeDL({"quiet": True, "no_warnings": True, "skip_download": True}) as ydl:
            info = ydl.extract_info(page_url, download=False)
            return info.get("thumbnail")
    except Exception:
        return None


def _cleanup_dir(job_dir: Path) -> None:
    try:
        for f in job_dir.iterdir():
            if f.is_file() and f.name != "metadata.json":
                f.unlink(missing_ok=True)
    except Exception:
        pass


async def download_single_gallery_photo(job: Job, manager: JobManager) -> None:
    """Download a single selected photo from a TikTok photo post."""
    if manager.is_cancelled(job.job_id):
        return
    manager.update_job(job.job_id, status="downloading", progress=0.0)
    try:
        title, images = await extract_tiktok_photos(job.url, timeout=15.0)
    except Exception as exc:
        if not manager.is_cancelled(job.job_id):
            manager.update_job(job.job_id, status="failed", error=f"Photo extraction failed: {exc}", error_code="download_failed")
        return

    if not images:
        if not manager.is_cancelled(job.job_id):
            manager.update_job(job.job_id, status="failed", error="No images found in gallery", error_code="download_failed")
        return

    idx = job.image_index if 0 <= job.image_index < len(images) else 0
    target_url = images[idx]["url"]
    original_url = job.url
    job.url = target_url
    try:
        await download_direct_file(job, manager)
    finally:
        job.url = original_url


async def download_gallery_bundle(job: Job, manager: JobManager) -> None:
    """Download all photos in a TikTok post, convert them, and bundle as a clean sequential ZIP."""
    if manager.is_cancelled(job.job_id):
        return
    job_dir = manager.storage_dir / job.job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    manager.update_job(job.job_id, status="downloading", progress=0.0)

    try:
        title, images = await extract_tiktok_photos(job.url, timeout=15.0)
    except Exception as exc:
        manager.update_job(job.job_id, status="failed", error=f"Gallery extraction failed: {exc}", error_code="download_failed")
        return

    if not images:
        manager.update_job(job.job_id, status="failed", error="No images found in gallery", error_code="download_failed")
        return

    match = re.search(r'/photo/(\d+)', job.url)
    post_id = match.group(1) if match else job.job_id

    fmt_lower = job.output_format.lower()
    ext = "jpg" if fmt_lower in ("jpg", "jpeg") else "png" if fmt_lower == "png" else "original"
    total_images = len(images)
    converted_files: list[Path] = []
    cumulative_bytes = 0
    timeout = httpx.Timeout(READ_TIMEOUT, connect=CONNECT_TIMEOUT)

    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            for idx, img_info in enumerate(images):
                if manager.is_cancelled(job.job_id):
                    _cleanup_dir(job_dir)
                    return

                img_url = img_info["url"]
                raw_ext = Path(urlsplit(img_url).path).suffix or ".jpg"
                raw_path = job_dir / f"raw_{idx+1}{raw_ext}"

                async with client.stream("GET", img_url, headers={"User-Agent": "MediaDrop/1.0"}) as resp:
                    if resp.status_code != 200:
                        _cleanup_dir(job_dir)
                        manager.update_job(job.job_id, status="failed", error=f"Server returned status {resp.status_code} on image {idx+1}", error_code="download_failed")
                        return

                    with open(raw_path, "wb") as f:
                        async for chunk in resp.aiter_bytes(chunk_size=65536):
                            if manager.is_cancelled(job.job_id):
                                _cleanup_dir(job_dir)
                                return
                            f.write(chunk)
                            cumulative_bytes += len(chunk)
                            if cumulative_bytes > MAX_DOWNLOAD_SIZE:
                                _cleanup_dir(job_dir)
                                manager.update_job(job.job_id, status="failed", error="File exceeds the 500 MB limit", error_code="file_too_large")
                                return

                target_ext = raw_ext if fmt_lower == "original" else f".{ext}"
                target_path = job_dir / f"{idx+1:02d}{target_ext}"

                converted_path = convert_image(raw_path, job.output_format, output_path=target_path)
                if converted_path.resolve() != raw_path.resolve() and raw_path.exists():
                    raw_path.unlink(missing_ok=True)
                converted_files.append(converted_path)

                prog = ((idx + 1) / total_images) * 80.0
                manager.update_job(job.job_id, progress=round(prog, 1), downloaded_bytes=cumulative_bytes)

        if manager.is_cancelled(job.job_id):
            _cleanup_dir(job_dir)
            return

        manager.update_job(job.job_id, status="processing", progress=85.0)

        # Create ZIP archive (80% - 100%)
        archive_suffix = ext if ext != "original" else "photos"
        zip_name = f"{post_id}_photos_{archive_suffix}.zip"
        zip_path = job_dir / zip_name

        with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zip_file:
            for file_path in converted_files:
                if manager.is_cancelled(job.job_id):
                    _cleanup_dir(job_dir)
                    return
                zip_file.write(file_path, arcname=file_path.name)

        manager.update_job(job.job_id, progress=95.0)

        # Clean up individual converted image files
        for file_path in converted_files:
            if file_path.resolve() != zip_path.resolve():
                file_path.unlink(missing_ok=True)

        final_size = zip_path.stat().st_size
        if final_size > MAX_DOWNLOAD_SIZE:
            _cleanup_dir(job_dir)
            manager.update_job(job.job_id, status="failed", error="File exceeds the 500 MB limit", error_code="file_too_large")
            return

        manager.update_job(
            job.job_id,
            status="ready",
            progress=100.0,
            file_size=final_size,
            filename=zip_name,
            file_path=str(zip_path),
        )
    except Exception as exc:
        _cleanup_dir(job_dir)
        if not manager.is_cancelled(job.job_id):
            manager.update_job(job.job_id, status="failed", error=str(exc), error_code="download_failed")


async def run_job(job_id: str, manager: JobManager, is_direct: bool) -> None:
    async with _semaphore:
        job = manager.get_job(job_id)
        if not job or manager.is_cancelled(job_id):
            return

        async def _execute():
            loop = asyncio.get_running_loop()
            if is_tiktok_photo_url(job.url):
                if job.download_all:
                    await download_gallery_bundle(job, manager)
                else:
                    await download_single_gallery_photo(job, manager)
            elif job.format.lower() == "thumbnail" and not is_direct:
                # Extract real thumbnail image URL from platform video
                manager.update_job(job.job_id, status="downloading", progress=0.0)
                thumb_url = await loop.run_in_executor(None, _extract_platform_thumbnail_url, job.url)
                if not thumb_url:
                    manager.update_job(job.job_id, status="failed", error="Thumbnail not found for this platform URL", error_code="thumbnail_not_found")
                    return
                # Update job to download the extracted image URL
                job.url = thumb_url
                await download_direct_file(job, manager)
            elif is_direct or job.format.lower() == "image":
                await download_direct_file(job, manager)
            else:
                await loop.run_in_executor(None, _run_platform_download_sync, job, manager)

        try:
            await asyncio.wait_for(_execute(), timeout=TOTAL_JOB_TIMEOUT)
        except asyncio.TimeoutError:
            manager.update_job(job_id, status="failed", error="Job timed out after 10 minutes", error_code="timeout")
        except asyncio.CancelledError:
            manager.update_job(job_id, status="cancelled")
        finally:
            manager.unregister_task(job_id)

