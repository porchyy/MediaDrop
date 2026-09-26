import asyncio
import os
import shutil
from contextlib import asynccontextmanager
from pathlib import Path
from urllib.parse import urlsplit

import httpx
import yt_dlp
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from app.gallery_extractor import extract_tiktok_photos, is_tiktok_photo_url
from app.downloader import run_job
from app.jobs import job_manager
from app.security import is_safe_host, is_safe_url, validate_url_syntax

STORAGE_TTL_MINUTES = float(os.environ.get("STORAGE_TTL_MINUTES", "30"))
STORAGE_TTL_SECONDS = STORAGE_TTL_MINUTES * 60.0
REQUEST_TIMEOUT = float(os.environ.get("REQUEST_TIMEOUT", "5"))
YTDLP_TIMEOUT = float(os.environ.get("YTDLP_TIMEOUT", "15"))

_EXTENSION_TYPES: dict[str, str] = {
    ext: mt
    for mt, exts in {
        "image": [".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg"],
        "video": [".mp4", ".webm", ".mov", ".avi", ".mkv", ".m4v"],
        "audio": [".mp3", ".m4a", ".wav", ".ogg", ".flac", ".aac"],
    }.items()
    for ext in exts
}

_AVAILABLE_FORMATS: dict[str, list[str]] = {
    "image": ["image"],
    "gallery": ["image"],
    "video": ["video", "audio"],
    "audio": ["audio"],
}


class MediaInfo(BaseModel):
    title: str
    media_type: str
    thumbnail: str | None
    duration: int | None
    source: str
    available_formats: list[str]
    image_count: int | None = None
    images: list[dict[str, Any]] | None = None


class AnalyzeRequest(BaseModel):
    url: str | None = None


class DownloadRequest(BaseModel):
    url: str
    format: str = "video"
    quality: str | None = "Best"
    output_format: str = "original"
    image_index: int = 0
    download_all: bool = False


class _UnsupportedMedia(Exception):
    pass


def _media_type_from_content_type(content_type: str) -> str | None:
    ct = content_type.lower().split(";")[0].strip()
    for prefix in ("image/", "video/", "audio/"):
        if ct.startswith(prefix):
            return prefix.rstrip("/")
    return None


def _media_type_from_extension(url: str) -> str | None:
    path = urlsplit(url).path.lower()
    for ext, mt in _EXTENSION_TYPES.items():
        if path.endswith(ext):
            return mt
    return None


def _probe_direct_media(url: str) -> tuple[bool, str | None, bool]:
    """Determine if a URL is direct media. Returns (is_direct, media_type, head_returned_html)."""
    # 1. Quick extension check
    ext_type = _media_type_from_extension(url)

    # 2. Probe with safe HEAD request (follow_redirects=False to respect per-hop checks)
    media_type: str | None = None
    head_returned_html = False
    try:
        with httpx.Client(timeout=REQUEST_TIMEOUT, follow_redirects=False) as client:
            resp = client.head(url, headers={"User-Agent": "MediaDrop/1.0"})
            ct = resp.headers.get("content-type", "")
            media_type = _media_type_from_content_type(ct)
            if ct.lower().startswith("text/html"):
                head_returned_html = True
    except Exception:
        pass

    if media_type is not None:
        return True, media_type, head_returned_html
    if ext_type is not None and not head_returned_html:
        return True, ext_type, head_returned_html
    return False, None, head_returned_html


def _build_direct_media_info(url: str, media_type: str) -> MediaInfo:
    path = urlsplit(url).path
    title = path.split("/")[-1] or url
    return MediaInfo(
        title=title,
        media_type=media_type,
        thumbnail=url if media_type == "image" else None,
        duration=None,
        source="direct",
        available_formats=_AVAILABLE_FORMATS[media_type],
    )


def _analyze_platform(url: str) -> MediaInfo:
    opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "socket_timeout": YTDLP_TIMEOUT,
    }
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=False)
    except yt_dlp.utils.DownloadError as exc:
        raise _UnsupportedMedia() from exc

    media_type = "video"
    title = info.get("title") or url
    raw_duration = info.get("duration")
    duration = int(raw_duration) if raw_duration is not None else None
    thumbnail = info.get("thumbnail") or None

    formats = list(_AVAILABLE_FORMATS[media_type])
    if thumbnail:
        formats.append("thumbnail")

    return MediaInfo(
        title=title,
        media_type=media_type,
        thumbnail=thumbnail,
        duration=duration,
        source="platform",
        available_formats=formats,
    )


async def _periodic_cleanup_loop():
    while True:
        try:
            await asyncio.sleep(300)  # check every 5 minutes
            job_manager.cleanup_expired_jobs(ttl_seconds=STORAGE_TTL_SECONDS)
        except asyncio.CancelledError:
            break
        except Exception:
            pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    cleanup_task = asyncio.create_task(_periodic_cleanup_loop())
    yield
    cleanup_task.cancel()


app = FastAPI(title="MediaDrop API", lifespan=lifespan)


# --- Routes ---


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "ffmpeg": bool(shutil.which("ffmpeg")),
    }


@app.post("/api/analyze")
async def analyze(body: AnalyzeRequest):
    url = (body.url or "").strip()

    valid, hostname = validate_url_syntax(url)
    if not valid or not hostname or not is_safe_host(hostname):
        return JSONResponse(
            {"code": "invalid_url", "message": "Please enter a valid HTTP or HTTPS URL."},
            status_code=400,
        )

    if is_tiktok_photo_url(url):
        try:
            title, images = await extract_tiktok_photos(url, timeout=YTDLP_TIMEOUT)
            return MediaInfo(
                title=title,
                media_type="gallery",
                thumbnail=images[0]["url"] if images else None,
                duration=None,
                source="platform",
                available_formats=["image"],
                image_count=len(images),
                images=images,
            )
        except Exception:
            return JSONResponse(
                {"code": "unsupported_media", "message": "This link is currently not supported."},
                status_code=422,
            )

    is_direct, media_type, head_returned_html = _probe_direct_media(url)
    if is_direct and media_type is not None:
        return _build_direct_media_info(url, media_type)

    try:
        return _analyze_platform(url)
    except _UnsupportedMedia:
        return JSONResponse(
            {"code": "unsupported_media", "message": "This link is currently not supported."},
            status_code=422,
        )
    except Exception:
        return JSONResponse(
            {"code": "internal_error", "message": "Please try again."},
            status_code=500,
        )


@app.post("/api/download")
async def start_download(body: DownloadRequest):
    url = (body.url or "").strip()
    valid, hostname = validate_url_syntax(url)
    if not valid or not hostname or not is_safe_host(hostname):
        return JSONResponse(
            {"code": "invalid_url", "message": "Please enter a valid HTTP or HTTPS URL."},
            status_code=400,
        )

    is_direct, _, _ = _probe_direct_media(url)

    output_fmt = (body.output_format or "original").strip().lower()
    if output_fmt not in ("original", "jpg", "jpeg", "png"):
        return JSONResponse(
            {"code": "invalid_format", "message": "Invalid image output format."},
            status_code=400,
        )

    # Check FFmpeg dependency when video/audio conversion is requested
    if not is_direct and body.format.lower() in ("video", "audio", "mp3"):
        if not shutil.which("ffmpeg"):
            return JSONResponse(
                {
                    "code": "ffmpeg_missing",
                    "message": "FFmpeg is required for conversion but not found on the system.",
                },
                status_code=500,
            )

    job = job_manager.create_job(
        url=url,
        format=body.format,
        quality=body.quality or "Best",
        output_format=output_fmt,
        image_index=body.image_index,
        download_all=body.download_all,
    )

    # Start download task in background and register for cancellation
    task = asyncio.create_task(run_job(job.job_id, job_manager, is_direct=is_direct))
    job_manager.register_task(job.job_id, task)

    return {"job_id": job.job_id, "status": "queued"}



@app.get("/api/jobs/{job_id}")
def get_job_status(job_id: str):
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "job_id": job.job_id,
        "status": job.status,
        "progress": job.progress,
        "downloaded_bytes": job.downloaded_bytes,
        "total_bytes": job.total_bytes,
        "file_id": job.file_id if job.status == "ready" else None,
        "file_size": job.file_size,
        "filename": job.filename,
        "error": job.error,
        "error_code": job.error_code,
    }


@app.post("/api/jobs/{job_id}/cancel")
def cancel_job(job_id: str):
    success = job_manager.cancel_job(job_id)
    if not success:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"status": "cancelled"}


@app.get("/api/files/{file_id}")
def download_file(file_id: str):
    job = job_manager.get_job_by_file_id(file_id)
    if not job or job.status != "ready" or not job.file_path:
        raise HTTPException(status_code=404, detail="File not found or expired")

    file_path = Path(job.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")

    filename = job.filename or file_path.name
    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type="application/octet-stream",
    )
