import asyncio
import os
import re
import shutil
import zipfile
from pathlib import Path
from typing import Any
from urllib.parse import unquote, urljoin, urlsplit

import httpx
import yt_dlp

from app.diagnostics import (
    ERROR_CANCELLED,
    ERROR_EXTRACTION_FAILED,
    ERROR_FILE_TOO_LARGE,
    ERROR_UNKNOWN,
    ERROR_VERIFICATION_FAILED,
    classify_error,
    log_diagnostic,
)
from app.gallery_extractor import extract_tiktok_photos, is_tiktok_photo_url, gallery_extractor
from app.image_processor import convert_image
from app.jobs import Job, JobManager
from app.security import is_safe_url
from app.transfer import ReliableDownloader
from app.verifier import verify_file

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
        # MediaDrop Resilient Profile
        "retries": 5,
        "fragment_retries": 5,
        "file_access_retries": 3,
        "extractor_retries": 3,
        "retry_sleep": "exp",
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


def _cleanup_dir(job_dir: Path) -> None:
    try:
        for f in job_dir.iterdir():
            if f.is_file() and f.name != "metadata.json":
                f.unlink(missing_ok=True)
    except Exception:
        pass


async def download_direct_file(job: Job, manager: JobManager) -> None:
    """Download a direct media file using the ReliableDownloader and verify before marking READY."""
    job_dir = manager.storage_dir / job.job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    manager.update_job(job.job_id, status="downloading", current_stage="downloading", progress=0.0)
    downloader = ReliableDownloader(max_size=MAX_DOWNLOAD_SIZE)

    try:
        part_path, filename = await downloader.download_file(
            url=job.url,
            output_dir=job_dir,
            job=job,
            manager=manager,
        )

        if manager.is_cancelled(job.job_id):
            if part_path and part_path.exists():
                part_path.unlink(missing_ok=True)
            return

        # Verification stage on .part before final rename
        manager.update_job(job.job_id, status="verifying", current_stage="verifying")
        expected_type = job.format
        if job.output_format.lower() in ("jpg", "jpeg", "png"):
            expected_type = "image"
        verify_file(part_path, expected_type=expected_type)

        output_path = job_dir / filename
        # Convert image format if requested (jpg / png)
        if job.output_format.lower() in ("jpg", "jpeg", "png"):
            manager.update_job(job.job_id, status="processing", current_stage="processing")
            try:
                converted_path = convert_image(part_path, job.output_format, output_path=output_path)
                if converted_path.resolve() != part_path.resolve() and part_path.exists():
                    part_path.unlink(missing_ok=True)
                output_path = converted_path
                filename = converted_path.name
                verify_file(output_path, expected_type=job.output_format)
            except Exception as exc:
                if part_path.exists():
                    part_path.unlink(missing_ok=True)
                if output_path.exists():
                    output_path.unlink(missing_ok=True)
                manager.update_job(
                    job.job_id,
                    status="failed",
                    error=f"Image conversion failed: {exc}",
                    error_code="conversion_failed",
                )
                return
        else:
            # Atomic rename from .part to final output path
            part_path.replace(output_path)
            verify_file(output_path, expected_type=expected_type)

        downloaded = output_path.stat().st_size
        manager.update_job(
            job.job_id,
            status="ready",
            current_stage="ready",
            progress=100.0,
            file_size=downloaded,
            filename=filename,
            file_path=str(output_path),
        )

    except asyncio.CancelledError:
        manager.update_job(job.job_id, status="cancelled")
    except Exception as exc:
        err_code, _ = classify_error(exc)
        if not manager.is_cancelled(job.job_id):
            manager.update_job(
                job.job_id,
                status="failed",
                error=str(exc),
                error_code=err_code,
            )


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
                current_stage="downloading",
                downloaded_bytes=downloaded,
                total_bytes=total,
                progress=round(prog, 1) if prog is not None else None,
            )
        elif status == "finished":
            manager.update_job(job.job_id, status="processing", current_stage="processing")

    opts["progress_hooks"] = [progress_hook]

    try:
        manager.update_job(job.job_id, status="downloading", current_stage="downloading", progress=0.0)
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
            out_file = max(candidates, key=lambda f: f.stat().st_mtime)
            manager.update_job(job.job_id, status="verifying", current_stage="verifying")
            try:
                verify_file(out_file, expected_type=job.format)
            except Exception as ve:
                out_file.unlink(missing_ok=True)
                manager.update_job(
                    job.job_id,
                    status="failed",
                    error=f"Verification failed: {ve}",
                    error_code=ERROR_VERIFICATION_FAILED,
                )
                return

            manager.update_job(
                job.job_id,
                status="ready",
                current_stage="ready",
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
            err_code, _ = classify_error(exc)
            manager.update_job(job.job_id, status="failed", error=str(exc), error_code=err_code)


def _extract_platform_thumbnail_url(page_url: str) -> str | None:
    try:
        with yt_dlp.YoutubeDL({"quiet": True, "no_warnings": True, "skip_download": True}) as ydl:
            info = ydl.extract_info(page_url, download=False)
            return info.get("thumbnail")
    except Exception:
        return None


async def download_single_gallery_photo(job: Job, manager: JobManager) -> None:
    """Download a single selected photo or video from a gallery/carousel post with recovery."""
    if manager.is_cancelled(job.job_id):
        return
    manager.update_job(job.job_id, status="extracting", current_stage="extracting", progress=0.0)
    job_dir = manager.storage_dir / job.job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    platform_prefix = "gallery"

    async def _resolve_items() -> tuple[str, list[dict[str, Any]]]:
        if is_tiktok_photo_url(job.url):
            _, images = await extract_tiktok_photos(job.url, timeout=15.0)
            m = re.search(r'/photo/(\d+)', job.url)
            p_id = m.group(1) if m else job.job_id
            return f"tiktok_{p_id}", images
        else:
            adapter = gallery_extractor.get_adapter(job.url)
            if adapter:
                res = await adapter.extract(job.url, timeout=15.0)
                if res.image_count == 0 and res.video_count > 0 and job.format.lower() in ("video", "audio"):
                    loop = asyncio.get_running_loop()
                    await loop.run_in_executor(None, _run_platform_download_sync, job, manager)
                    return "", []
                return f"{res.platform}_{res.post_id}", res.items_dict
            else:
                raise ValueError("Unsupported gallery URL")

    try:
        platform_prefix, items = await _resolve_items()
    except Exception as exc:
        if not manager.is_cancelled(job.job_id):
            err_code, _ = classify_error(exc)
            manager.update_job(job.job_id, status="failed", error=f"Photo extraction failed: {exc}", error_code="extraction_failed")
        return

    if not items:
        job_now = manager.get_job(job.job_id)
        if job_now and job_now.status in ("ready", "failed", "processing", "cancelled"):
            return
        if not manager.is_cancelled(job.job_id):
            manager.update_job(job.job_id, status="failed", error="No images found in gallery", error_code="download_failed")
        return

    idx = job.image_index if 0 <= job.image_index < len(items) else 0
    selected_item = items[idx]
    target_url = selected_item["url"]
    is_video = selected_item.get("type") == "video"

    async def refresh_item_url() -> str | None:
        try:
            _, fresh_items = await _resolve_items()
            if fresh_items and idx < len(fresh_items):
                return fresh_items[idx]["url"]
        except Exception:
            pass
        return None

    raw_ext = Path(urlsplit(target_url).path).suffix or (".mp4" if is_video else ".jpg")
    item_kind = "video" if is_video else "photo"
    suggested_name = f"{platform_prefix}_{item_kind}_{idx+1}{raw_ext}"
    downloader = ReliableDownloader(max_size=MAX_DOWNLOAD_SIZE)

    try:
        part_path, final_filename = await downloader.download_file(
            url=target_url,
            output_dir=job_dir,
            job=job,
            manager=manager,
            suggested_filename=suggested_name,
            on_source_refresh=refresh_item_url,
        )

        if manager.is_cancelled(job.job_id):
            part_path.unlink(missing_ok=True)
            return

        manager.update_job(job.job_id, status="verifying", current_stage="verifying")
        expected_type = "video" if is_video else "image"
        verify_file(part_path, expected_type=expected_type)

        output_path = job_dir / final_filename
        if not is_video and job.output_format.lower() in ("jpg", "jpeg", "png"):
            manager.update_job(job.job_id, status="processing", current_stage="processing")
            target_ext = f".{job.output_format.lower()}"
            target_path = job_dir / f"{platform_prefix}_item_{idx+1}{target_ext}"
            converted = convert_image(part_path, job.output_format, output_path=target_path)
            if converted.resolve() != part_path.resolve() and part_path.exists():
                part_path.unlink(missing_ok=True)
            output_path = converted
            final_filename = converted.name
            verify_file(output_path, expected_type="image")
        else:
            part_path.replace(output_path)
            verify_file(output_path, expected_type=expected_type)

        final_size = output_path.stat().st_size
        manager.update_job(
            job.job_id,
            status="ready",
            current_stage="ready",
            progress=100.0,
            file_size=final_size,
            filename=final_filename,
            file_path=str(output_path),
        )
    except asyncio.CancelledError:
        manager.update_job(job.job_id, status="cancelled")
    except Exception as exc:
        err_code, _ = classify_error(exc)
        if not manager.is_cancelled(job.job_id):
            manager.update_job(job.job_id, status="failed", error=str(exc), error_code=err_code)


async def download_gallery_bundle(job: Job, manager: JobManager) -> None:
    """Download all photos in a gallery/post, convert them, and bundle as a clean sequential ZIP with per-item resilience."""
    if manager.is_cancelled(job.job_id):
        return
    job_dir = manager.storage_dir / job.job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    manager.update_job(job.job_id, status="extracting", current_stage="extracting", progress=0.0)

    async def _resolve_images() -> tuple[str, list[dict[str, Any]]]:
        if is_tiktok_photo_url(job.url):
            _, imgs = await extract_tiktok_photos(job.url, timeout=15.0)
            m = re.search(r'/photo/(\d+)', job.url)
            p_id = m.group(1) if m else job.job_id
            return p_id, imgs
        else:
            adapter = gallery_extractor.get_adapter(job.url)
            if adapter:
                res = await adapter.extract(job.url, timeout=15.0)
                imgs = [it.to_dict() for it in res.items if it.type == "image"]
                return f"{res.platform}_{res.post_id}", imgs
            else:
                raise ValueError("Unsupported gallery URL")

    try:
        platform_prefix, images = await _resolve_images()
    except Exception as exc:
        manager.update_job(job.job_id, status="failed", error=f"Gallery extraction failed: {exc}", error_code="extraction_failed")
        return

    if not images:
        manager.update_job(job.job_id, status="failed", error="No images found in gallery", error_code="download_failed")
        return

    fmt_lower = job.output_format.lower()
    ext = "jpg" if fmt_lower in ("jpg", "jpeg") else "png" if fmt_lower == "png" else "original"
    total_images = len(images)
    converted_files: list[Path] = []
    cumulative_bytes = 0
    warnings: list[str] = []
    downloader = ReliableDownloader(max_size=MAX_DOWNLOAD_SIZE)

    for idx, img_info in enumerate(images):
        if manager.is_cancelled(job.job_id):
            _cleanup_dir(job_dir)
            return

        img_url = img_info["url"]
        raw_ext = Path(urlsplit(img_url).path).suffix or ".jpg"
        raw_name = f"raw_{idx+1}{raw_ext}"

        async def _refresh_single() -> str | None:
            try:
                _, fresh_imgs = await _resolve_images()
                if fresh_imgs and idx < len(fresh_imgs):
                    return fresh_imgs[idx]["url"]
            except Exception:
                pass
            return None

        try:
            part_path, _ = await downloader.download_file(
                url=img_url,
                output_dir=job_dir,
                job=job,
                manager=manager,
                suggested_filename=raw_name,
                on_source_refresh=_refresh_single,
            )

            verify_file(part_path, expected_type="image")
            raw_path = job_dir / raw_name
            part_path.replace(raw_path)

            target_ext = raw_ext if fmt_lower == "original" else f".{ext}"
            target_path = job_dir / f"{idx+1:02d}{target_ext}"

            converted_path = convert_image(raw_path, job.output_format, output_path=target_path)
            if converted_path.resolve() != raw_path.resolve() and raw_path.exists():
                raw_path.unlink(missing_ok=True)
            verify_file(converted_path, expected_type="image")
            converted_files.append(converted_path)
            cumulative_bytes += converted_path.stat().st_size

        except Exception as item_exc:
            log_diagnostic(job.job_id, stage="downloading", attempt=1, action="gallery_item_failed", item_index=idx+1, error=str(item_exc))
            warnings.append(f"Image {idx+1} could not be downloaded: {item_exc}")
            manager.update_job(job.job_id, warnings=warnings)
            for f in job_dir.glob(f"raw_{idx+1}*"):
                f.unlink(missing_ok=True)

        prog = ((idx + 1) / total_images) * 80.0
        manager.update_job(job.job_id, progress=round(prog, 1), downloaded_bytes=cumulative_bytes)

    if manager.is_cancelled(job.job_id):
        _cleanup_dir(job_dir)
        return

    if not converted_files:
        _cleanup_dir(job_dir)
        manager.update_job(
            job.job_id,
            status="failed",
            error="All items in gallery failed to download",
            error_code="download_failed",
            warnings=warnings,
        )
        return

    manager.update_job(job.job_id, status="processing", current_stage="processing", progress=85.0)

    # Create ZIP archive into .part first
    archive_suffix = ext if ext != "original" else "photos"
    zip_name = f"{platform_prefix}_photos_{archive_suffix}.zip"
    zip_part_path = job_dir / f"{zip_name}.part"
    final_zip_path = job_dir / zip_name

    with zipfile.ZipFile(zip_part_path, "w", compression=zipfile.ZIP_DEFLATED) as zip_file:
        for file_path in converted_files:
            if manager.is_cancelled(job.job_id):
                _cleanup_dir(job_dir)
                return
            zip_file.write(file_path, arcname=file_path.name)

    manager.update_job(job.job_id, status="verifying", current_stage="verifying", progress=95.0)
    verify_file(zip_part_path, expected_type="zip")
    zip_part_path.replace(final_zip_path)

    # Clean up individual converted image files
    for file_path in converted_files:
        if file_path.resolve() != final_zip_path.resolve():
            file_path.unlink(missing_ok=True)

    final_size = final_zip_path.stat().st_size
    if final_size > MAX_DOWNLOAD_SIZE:
        _cleanup_dir(job_dir)
        manager.update_job(job.job_id, status="failed", error="File exceeds the 500 MB limit", error_code="file_too_large")
        return

    manager.update_job(
        job.job_id,
        status="ready",
        current_stage="ready",
        progress=100.0,
        file_size=final_size,
        filename=zip_name,
        file_path=str(final_zip_path),
        warnings=warnings,
    )


async def run_job(job_id: str, manager: JobManager, is_direct: bool) -> None:
    async with _semaphore:
        job = manager.get_job(job_id)
        if not job or manager.is_cancelled(job_id):
            return

        async def _execute():
            loop = asyncio.get_running_loop()
            if job.download_all:
                await download_gallery_bundle(job, manager)
            elif job.format.lower() == "audio":
                await loop.run_in_executor(None, _run_platform_download_sync, job, manager)
            elif gallery_extractor.can_handle(job.url) or is_tiktok_photo_url(job.url):
                await download_single_gallery_photo(job, manager)
            elif job.format.lower() == "thumbnail" and not is_direct:
                manager.update_job(job.job_id, status="extracting", current_stage="extracting", progress=0.0)
                thumb_url = await loop.run_in_executor(None, _extract_platform_thumbnail_url, job.url)
                if not thumb_url:
                    manager.update_job(job.job_id, status="failed", error="Thumbnail not found for this platform URL", error_code="thumbnail_not_found")
                    return
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
