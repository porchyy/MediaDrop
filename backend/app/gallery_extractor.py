import asyncio
import json
import sys
from typing import Any
from urllib.parse import urlsplit


def is_tiktok_photo_url(url: str) -> bool:
    """Determine if a URL is a TikTok photo post / gallery."""
    try:
        parts = urlsplit(url)
        host = (parts.hostname or "").lower()
        is_tiktok = host == "tiktok.com" or host.endswith(".tiktok.com")
        path = parts.path.lower()
        return is_tiktok and "/photo/" in path
    except Exception:
        return False


def parse_gallery_dl_json(raw_text: str) -> tuple[str, list[dict[str, Any]]]:
    """Parse gallery-dl --dump-json output.

    Returns (title, images_list), where each item in images_list is:
    {'index': int, 'url': str, 'width': int | None, 'height': int | None}
    """
    raw_text = raw_text.strip()
    if not raw_text:
        return "", []

    entries: list[Any] = []
    try:
        data = json.loads(raw_text)
        if isinstance(data, list):
            entries = data
        elif isinstance(data, dict):
            entries = [data]
    except json.JSONDecodeError:
        # Fallback to line-by-line JSON (NDJSON / JSONL)
        for line in raw_text.splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                item = json.loads(line)
                entries.append(item)
            except Exception:
                pass

    images: list[dict[str, Any]] = []
    title = ""

    for item in entries:
        url: str | None = None
        meta: dict[str, Any] = {}

        if isinstance(item, (list, tuple)):
            if len(item) == 3 and item[0] == 3:  # Message.Url
                url = item[1] if isinstance(item[1], str) else None
                meta = item[2] if isinstance(item[2], dict) else {}
            elif len(item) == 2 and isinstance(item[1], dict):
                meta = item[1]
                url = meta.get("url")
        elif isinstance(item, dict):
            meta = item
            url = item.get("url")

        if not title and meta:
            title = meta.get("title") or meta.get("desc") or meta.get("description") or ""

        # Only process image items
        item_type = meta.get("type", "image")
        if url and item_type == "image":
            if not url.startswith("ytdl:") and not meta.get("post_type") == "video":
                images.append({
                    "index": len(images),
                    "url": url,
                    "width": meta.get("width"),
                    "height": meta.get("height"),
                })

    return title or "TikTok photo post", images


async def extract_tiktok_photos(url: str, timeout: float = 15.0) -> tuple[str, list[dict[str, Any]]]:
    """Execute gallery-dl --dump-json in a subprocess to extract TikTok photo gallery metadata."""
    cmd = [sys.executable, "-m", "gallery_dl", "--dump-json", url]
    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
    except asyncio.TimeoutError:
        try:
            proc.kill()
        except Exception:
            pass
        raise TimeoutError("gallery-dl extraction timed out after 15 seconds")
    except Exception as exc:
        raise RuntimeError(f"gallery-dl process execution failed: {exc}")

    if proc.returncode != 0:
        err_msg = stderr.decode("utf-8", errors="replace").strip()
        raise RuntimeError(f"gallery-dl failed with code {proc.returncode}: {err_msg}")

    raw_output = stdout.decode("utf-8", errors="replace")
    title, images = parse_gallery_dl_json(raw_output)

    if not images:
        raise ValueError("No images found in TikTok post")

    return title, images
