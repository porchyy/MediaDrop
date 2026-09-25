import ipaddress
import os
from urllib.parse import urlsplit

import httpx
import yt_dlp
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel

app = FastAPI(title="MediaDrop API")

REQUEST_TIMEOUT = float(os.environ.get("REQUEST_TIMEOUT", "5"))
YTDLP_TIMEOUT = float(os.environ.get("YTDLP_TIMEOUT", "15"))

# Hostnames always blocked regardless of DNS (SSRF guard — non-IP form)
_BLOCKED_HOSTNAMES = frozenset({"localhost", "0.0.0.0"})

# Map file extensions to media types
_EXTENSION_TYPES: dict[str, str] = {
    ext: mt
    for mt, exts in {
        "image": [".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg"],
        "video": [".mp4", ".webm", ".mov", ".avi", ".mkv", ".m4v"],
        "audio": [".mp3", ".m4a", ".wav", ".ogg", ".flac", ".aac"],
    }.items()
    for ext in exts
}

# Map media type to the output formats available to the user
_AVAILABLE_FORMATS: dict[str, list[str]] = {
    "image": ["image"],
    "video": ["video", "audio"],
    "audio": ["audio"],
}


# --- Schemas ---


class MediaInfo(BaseModel):
    title: str
    media_type: str
    thumbnail: str | None
    duration: int | None
    source: str
    available_formats: list[str]


class AnalyzeRequest(BaseModel):
    url: str | None = None


# --- Internal errors ---


class _UnsupportedMedia(Exception):
    pass


# --- Helpers ---


def _is_private_host(hostname: str) -> bool:
    """Return True when hostname is a private/loopback IP or a blocked name.

    Checks literal IP addresses and a small blocklist of well-known
    dangerous hostnames. Does not resolve DNS.
    """
    if hostname.lower() in _BLOCKED_HOSTNAMES:
        return True
    try:
        ip = ipaddress.ip_address(hostname)
        return ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_unspecified
    except ValueError:
        return False  # not an IP — allow through


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
    """Extract metadata via yt-dlp without downloading any media."""

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

    media_type = "video"  # yt-dlp predominantly handles video/audio platforms
    title = info.get("title") or url
    raw_duration = info.get("duration")
    duration = int(raw_duration) if raw_duration is not None else None
    thumbnail = info.get("thumbnail") or None

    return MediaInfo(
        title=title,
        media_type=media_type,
        thumbnail=thumbnail,
        duration=duration,
        source="platform",
        available_formats=_AVAILABLE_FORMATS[media_type],
    )


# --- Routes ---


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/analyze")
def analyze(body: AnalyzeRequest):
    url = (body.url or "").strip()

    # 1. Validate URL syntax
    try:
        parts = urlsplit(url)
        valid = (
            parts.scheme in ("http", "https")
            and bool(parts.hostname)
            and not any(c.isspace() for c in parts.netloc)
        )
        parts.port  # raises ValueError on malformed port
    except ValueError:
        valid = False
    if not valid:
        return JSONResponse(
            {"code": "invalid_url", "message": "Please enter a valid HTTP or HTTPS URL."},
            status_code=400,
        )

    # 2. SSRF guard — reject private/loopback IP addresses
    if _is_private_host(parts.hostname):
        return JSONResponse(
            {"code": "invalid_url", "message": "Please enter a valid HTTP or HTTPS URL."},
            status_code=400,
        )

    # 3. Probe URL with HEAD to select analyzer
    media_type: str | None = None
    head_returned_html = False
    try:
        with httpx.Client(timeout=REQUEST_TIMEOUT, follow_redirects=True) as client:
            resp = client.head(url, headers={"User-Agent": "MediaDrop/1.0"})
            ct = resp.headers.get("content-type", "")
            media_type = _media_type_from_content_type(ct)
            if ct.lower().startswith("text/html"):
                head_returned_html = True
    except Exception:
        pass  # HEAD failed — fall through to extension check or platform analyzer

    # 4a. Direct Media Analyzer — HEAD identified a media Content-Type
    if media_type is not None:
        return _build_direct_media_info(url, media_type)

    # 4b. Direct Media Analyzer — extension fallback (HEAD failed or returned no type)
    if not head_returned_html:
        ext_type = _media_type_from_extension(url)
        if ext_type is not None:
            return _build_direct_media_info(url, ext_type)

    # 4c. Platform Analyzer — yt-dlp for pages/platform URLs
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
