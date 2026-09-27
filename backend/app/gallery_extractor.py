import asyncio
import json
import re
import sys
from dataclasses import dataclass, field
from typing import Any
from urllib.parse import urlsplit


class LoginRequiredError(Exception):
    """Raised when media cannot be accessed anonymously due to login/privacy wall."""
    pass


class ExtractorConfigurationError(Exception):
    """Raised when the underlying gallery-dl CLI configuration or options fail (e.g. unrecognized arguments)."""
    pass


def sanitize_instagram_url(url: str) -> str:
    """Normalize Instagram URL and strip tracking query parameters."""
    try:
        parts = urlsplit(url)
        host = (parts.hostname or "").lower()
        if not (host == "instagram.com" or host.endswith(".instagram.com")):
            return url.strip()
        path = parts.path
        m_p = re.search(r'/p/([A-Za-z0-9_-]+)', path)
        if m_p:
            return f"https://www.instagram.com/p/{m_p.group(1)}/"
        m_r = re.search(r'/(?:reel|reels|tv)/([A-Za-z0-9_-]+)', path)
        if m_r:
            return f"https://www.instagram.com/reel/{m_r.group(1)}/"
        return url.split("?")[0].strip()
    except Exception:
        return url.strip()


@dataclass
class GalleryItem:
    index: int
    type: str  # "image" | "video"
    url: str
    width: int | None = None
    height: int | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "index": self.index,
            "type": self.type,
            "url": self.url,
            "width": self.width,
            "height": self.height,
        }


@dataclass
class GalleryResult:
    platform: str
    post_id: str
    title: str
    items: list[GalleryItem] = field(default_factory=list)

    @property
    def image_count(self) -> int:
        return sum(1 for it in self.items if it.type == "image")

    @property
    def video_count(self) -> int:
        return sum(1 for it in self.items if it.type == "video")

    @property
    def images(self) -> list[dict[str, Any]]:
        # Alias for backward compatibility with 8.8.1 code and tests
        return [it.to_dict() for it in self.items if it.type == "image"]

    @property
    def items_dict(self) -> list[dict[str, Any]]:
        return [it.to_dict() for it in self.items]


def build_gallery_dl_command(url: str, user_agent: str | None = None) -> list[str]:
    """Build minimal, highly compatible gallery-dl CLI command arguments."""
    cmd = [sys.executable, "-m", "gallery_dl", "--dump-json"]
    if user_agent:
        cmd.extend(["--user-agent", user_agent])
    cmd.append(url)
    return cmd


async def run_gallery_dl_subprocess(cmd: list[str], timeout: float = 15.0) -> tuple[str, str, int]:
    """Execute a gallery-dl command in an isolated subprocess."""
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
        raise TimeoutError(f"gallery-dl extraction timed out after {timeout} seconds")
    except Exception as exc:
        raise RuntimeError(f"gallery-dl process execution failed: {exc}")

    return (
        stdout.decode("utf-8", errors="replace"),
        stderr.decode("utf-8", errors="replace"),
        proc.returncode,
    )


def check_gallery_dl_subprocess_error(stderr: str, returncode: int) -> None:
    """Classify subprocess stderr into typed exceptions."""
    if returncode == 0:
        return
    err_msg = stderr.strip()
    err_lower = err_msg.lower()
    # 1. Configuration / CLI syntax errors
    if any(k in err_lower for k in ("unrecognized arguments", "unknown option", "error: unrecognized")) or "usage:" in err_lower:
        raise ExtractorConfigurationError(f"extractor_error: {err_msg}")
    # 2. Authentic login or private post restriction
    if any(k in err_lower for k in ("login", "private", "checkpoint", "authentication", "unauthorized")) or any(c in err_msg for c in ("401", "403")):
        raise LoginRequiredError(f"login_required: {err_msg}")
    # 3. Generic failure
    raise RuntimeError(f"gallery-dl failed with code {returncode}: {err_msg}")


def parse_gallery_dl_entries(raw_text: str, default_title: str = "") -> tuple[str, list[GalleryItem]]:
    """Parse gallery-dl --dump-json output into (title, list[GalleryItem])."""
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

    items: list[GalleryItem] = []
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

        if not url:
            continue

        raw_type = meta.get("type", "")
        post_type = meta.get("post_type", "")
        ext = urlsplit(url).path.lower()

        # Audio tracks (e.g. TikTok background music) are not gallery items
        if raw_type == "audio" or url.startswith("ytdl:") or ext.endswith((".mp3", ".m4a", ".wav", ".aac")):
            continue

        if raw_type == "video" or post_type == "video" or ext.endswith((".mp4", ".mov", ".webm")):
            item_type = "video"
        else:
            item_type = "image"

        items.append(
            GalleryItem(
                index=len(items),
                type=item_type,
                url=url,
                width=meta.get("width"),
                height=meta.get("height"),
            )
        )

    return title or default_title, items


class BaseGalleryAdapter:
    platform: str = ""

    def can_handle(self, url: str) -> bool:
        raise NotImplementedError

    def get_post_id(self, url: str) -> str:
        raise NotImplementedError

    def sanitize_url(self, url: str) -> str:
        return url.strip()

    async def extract(self, url: str, timeout: float = 15.0) -> GalleryResult:
        raise NotImplementedError


class TikTokAdapter(BaseGalleryAdapter):
    platform: str = "tiktok"

    def can_handle(self, url: str) -> bool:
        try:
            parts = urlsplit(url)
            host = (parts.hostname or "").lower()
            is_tiktok = host == "tiktok.com" or host.endswith(".tiktok.com")
            path = parts.path.lower()
            return is_tiktok and "/photo/" in path
        except Exception:
            return False

    def get_post_id(self, url: str) -> str:
        match = re.search(r'/photo/(\d+)', url)
        return match.group(1) if match else "tiktok_photo"

    async def extract(self, url: str, timeout: float = 15.0) -> GalleryResult:
        clean_url = self.sanitize_url(url)
        cmd = build_gallery_dl_command(clean_url)
        stdout, stderr, returncode = await run_gallery_dl_subprocess(cmd, timeout=timeout)

        check_gallery_dl_subprocess_error(stderr, returncode)

        title, items = parse_gallery_dl_entries(stdout, default_title="TikTok photo post")
        photo_items = [it for it in items if it.type == "image"]
        if not photo_items:
            raise ValueError("No images found in TikTok post")

        for idx, it in enumerate(photo_items):
            it.index = idx

        return GalleryResult(
            platform=self.platform,
            post_id=self.get_post_id(clean_url),
            title=title or "TikTok photo post",
            items=photo_items,
        )


class InstagramAdapter(BaseGalleryAdapter):
    platform: str = "instagram"

    def can_handle(self, url: str) -> bool:
        try:
            parts = urlsplit(url)
            host = (parts.hostname or "").lower()
            is_ig = host == "instagram.com" or host.endswith(".instagram.com")
            if not is_ig:
                return False
            path = parts.path.lower()
            if "/reel/" in path or "/reels/" in path or "/tv/" in path:
                return False
            return "/p/" in path
        except Exception:
            return False

    def get_post_id(self, url: str) -> str:
        match = re.search(r'/p/([A-Za-z0-9_-]+)', url)
        return match.group(1) if match else "instagram_post"

    def sanitize_url(self, url: str) -> str:
        return sanitize_instagram_url(url)

    async def extract(self, url: str, timeout: float = 15.0) -> GalleryResult:
        clean_url = self.sanitize_url(url)
        ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        cmd = build_gallery_dl_command(clean_url, user_agent=ua)
        stdout, stderr, returncode = await run_gallery_dl_subprocess(cmd, timeout=timeout)

        check_gallery_dl_subprocess_error(stderr, returncode)

        title, items = parse_gallery_dl_entries(stdout, default_title="Instagram post")
        if not items:
            raise ValueError("No items found in Instagram post")

        for idx, it in enumerate(items):
            it.index = idx

        return GalleryResult(
            platform=self.platform,
            post_id=self.get_post_id(clean_url),
            title=title or "Instagram post",
            items=items,
        )


class GalleryExtractor:
    """Registry and dispatcher for platform-specific gallery adapters."""

    def __init__(self):
        self._adapters: list[BaseGalleryAdapter] = []

    def register(self, adapter: BaseGalleryAdapter) -> None:
        self._adapters.append(adapter)

    def get_adapter(self, url: str) -> BaseGalleryAdapter | None:
        for adapter in self._adapters:
            if adapter.can_handle(url):
                return adapter
        return None

    def can_handle(self, url: str) -> bool:
        return self.get_adapter(url) is not None

    async def extract(self, url: str, timeout: float = 15.0) -> GalleryResult:
        adapter = self.get_adapter(url)
        if not adapter:
            raise ValueError(f"No gallery adapter registered for URL: {url}")
        return await adapter.extract(url, timeout=timeout)


# Module-level registry singleton
gallery_extractor = GalleryExtractor()
gallery_extractor.register(TikTokAdapter())
gallery_extractor.register(InstagramAdapter())


# Backward-compatibility helpers for Phase 8.8.1 tests and callers
def is_tiktok_photo_url(url: str) -> bool:
    return TikTokAdapter().can_handle(url)


def parse_gallery_dl_json(raw_text: str) -> tuple[str, list[dict[str, Any]]]:
    raw_text = raw_text.strip()
    if not raw_text:
        return "", []
    title, items = parse_gallery_dl_entries(raw_text, default_title="TikTok photo post")
    images: list[dict[str, Any]] = []
    for it in items:
        if it.type == "image":
            images.append({
                "index": len(images),
                "url": it.url,
                "width": it.width,
                "height": it.height,
            })
    return title or "TikTok photo post", images


async def extract_tiktok_photos(url: str, timeout: float = 15.0) -> tuple[str, list[dict[str, Any]]]:
    adapter = TikTokAdapter()
    res = await adapter.extract(url, timeout=timeout)
    return res.title, res.images
