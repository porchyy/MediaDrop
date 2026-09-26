"""Backend API tests — Phase 6.

Tests run at the HTTP seam using starlette TestClient so the full
FastAPI routing is exercised without a live server.
Outbound httpx calls and yt-dlp are patched so no external network
requests are made.
"""

import unittest
from unittest.mock import AsyncMock, MagicMock, patch

from starlette.testclient import TestClient

from app.main import app, job_manager

client = TestClient(app, raise_server_exceptions=False)


def api(method: str, path: str, payload=None):
    if method == "GET":
        return client.get(path)
    return client.post(path, json=payload)


class HealthTest(unittest.TestCase):
    def test_health(self):
        r = api("GET", "/api/health")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["status"], "ok")
        self.assertIn("ffmpeg", r.json())


class UrlValidationTest(unittest.TestCase):
    def test_invalid_urls_return_400(self):
        for value in ("", "ftp://example.com/file", "https://", "https://exa mple.com", None):
            with self.subTest(value=value):
                r = api("POST", "/api/analyze", {"url": value})
                self.assertEqual(r.status_code, 400)
                self.assertEqual(r.json()["code"], "invalid_url")

    def test_missing_url_field_returns_400(self):
        r = api("POST", "/api/analyze", {})
        self.assertEqual(r.status_code, 400)
        self.assertEqual(r.json()["code"], "invalid_url")


class SsrfTest(unittest.TestCase):
    def test_private_ip_rejected(self):
        for url in (
            "http://127.0.0.1/secret",
            "http://10.0.0.1/internal",
            "http://192.168.1.1/router",
            "http://172.16.0.1/corp",
        ):
            with self.subTest(url=url):
                r = api("POST", "/api/analyze", {"url": url})
                self.assertEqual(r.status_code, 400)
                self.assertEqual(r.json()["code"], "invalid_url")

    def test_localhost_rejected(self):
        r = api("POST", "/api/analyze", {"url": "http://localhost/admin"})
        self.assertEqual(r.status_code, 400)

    def test_loopback_ipv6_rejected(self):
        r = api("POST", "/api/analyze", {"url": "http://[::1]/secret"})
        self.assertEqual(r.status_code, 400)


def _fake_head(content_type: str):
    """Return a mock httpx.Client context manager whose HEAD response has content_type."""
    mock_resp = MagicMock()
    mock_resp.headers = {"content-type": content_type}
    mock_client = MagicMock()
    mock_client.head.return_value = mock_resp
    ctx = MagicMock()
    ctx.__enter__ = MagicMock(return_value=mock_client)
    ctx.__exit__ = MagicMock(return_value=False)
    return ctx


class DirectMediaAnalyzerTest(unittest.TestCase):
    def _patch_head(self, content_type: str):
        return patch("app.main.httpx.Client", return_value=_fake_head(content_type))

    def test_image_url_returns_image_media_info(self):
        with self._patch_head("image/jpeg"):
            r = api("POST", "/api/analyze", {"url": "https://example.com/photo.jpg"})
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(data["media_type"], "image")
        self.assertEqual(data["source"], "direct")
        self.assertEqual(data["available_formats"], ["image"])
        self.assertIsNone(data["duration"])
        # thumbnail is the URL itself for images
        self.assertEqual(data["thumbnail"], "https://example.com/photo.jpg")

    def test_video_url_returns_video_media_info(self):
        with self._patch_head("video/mp4"):
            r = api("POST", "/api/analyze", {"url": "https://example.com/clip.mp4"})
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(data["media_type"], "video")
        self.assertIn("video", data["available_formats"])
        self.assertIn("audio", data["available_formats"])
        self.assertIsNone(data["duration"])
        self.assertIsNone(data["thumbnail"])

    def test_audio_url_returns_audio_media_info(self):
        with self._patch_head("audio/mpeg"):
            r = api("POST", "/api/analyze", {"url": "https://example.com/song.mp3"})
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(data["media_type"], "audio")
        self.assertEqual(data["available_formats"], ["audio"])

    def test_extension_fallback_when_head_fails(self):
        """When HEAD raises, fall back to file extension."""
        with patch("app.main.httpx.Client", side_effect=Exception("timeout")):
            r = api("POST", "/api/analyze", {"url": "https://example.com/video.mp4"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["media_type"], "video")
        self.assertEqual(r.json()["source"], "direct")


class PlatformAnalyzerTest(unittest.TestCase):
    def _patch_head_html(self):
        return patch("app.main.httpx.Client", return_value=_fake_head("text/html; charset=utf-8"))

    def _patch_ytdlp(self, info: dict):
        mock_ydl = MagicMock()
        mock_ydl.extract_info.return_value = info
        ctx = MagicMock()
        ctx.__enter__ = MagicMock(return_value=mock_ydl)
        ctx.__exit__ = MagicMock(return_value=False)
        return patch("app.main.yt_dlp.YoutubeDL", return_value=ctx)

    def test_platform_url_returns_real_metadata(self):
        fake_info = {
            "title": "My Great Video",
            "duration": 183,
            "thumbnail": "https://img.example.com/thumb.jpg",
        }
        with self._patch_head_html(), self._patch_ytdlp(fake_info):
            r = api("POST", "/api/analyze", {"url": "https://youtube.com/watch?v=abc"})
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(data["title"], "My Great Video")
        self.assertEqual(data["duration"], 183)
        self.assertEqual(data["thumbnail"], "https://img.example.com/thumb.jpg")
        self.assertEqual(data["source"], "platform")

    def test_unsupported_platform_url_returns_422(self):
        import yt_dlp

        with patch("app.main.is_safe_host", return_value=True), self._patch_head_html():
            with patch("app.main.yt_dlp.YoutubeDL") as mock_cls:
                mock_ydl = MagicMock()
                mock_ydl.extract_info.side_effect = yt_dlp.utils.DownloadError("unsupported")
                mock_cls.return_value.__enter__ = MagicMock(return_value=mock_ydl)
                mock_cls.return_value.__exit__ = MagicMock(return_value=False)
                r = api("POST", "/api/analyze", {"url": "https://notsupported.example.com/"})
        self.assertEqual(r.status_code, 422)
        self.assertEqual(r.json()["code"], "unsupported_media")

    def test_unexpected_platform_error_returns_500(self):
        with self._patch_head_html():
            with patch("app.main.yt_dlp.YoutubeDL") as mock_cls:
                mock_ydl = MagicMock()
                mock_ydl.extract_info.side_effect = RuntimeError("crash")
                mock_cls.return_value.__enter__ = MagicMock(return_value=mock_ydl)
                mock_cls.return_value.__exit__ = MagicMock(return_value=False)
                r = api("POST", "/api/analyze", {"url": "https://example.com/page"})
        self.assertEqual(r.status_code, 500)
        self.assertEqual(r.json()["code"], "internal_error")

    def test_null_duration_when_platform_has_no_duration(self):
        fake_info = {"title": "Livestream", "duration": None, "thumbnail": None}
        with self._patch_head_html(), self._patch_ytdlp(fake_info):
            r = api("POST", "/api/analyze", {"url": "https://youtube.com/watch?v=live"})
        self.assertEqual(r.status_code, 200)
        self.assertIsNone(r.json()["duration"])

    def test_analyze_tiktok_photo_success(self):
        fake_images = [
            {"index": 0, "url": "https://example.com/img1.jpg", "width": 1080, "height": 1920},
            {"index": 1, "url": "https://example.com/img2.jpg", "width": 1080, "height": 1920},
            {"index": 2, "url": "https://example.com/img3.jpg", "width": 1080, "height": 1920},
        ]
        with patch("app.main.is_safe_host", return_value=True), \
             patch("app.main.extract_tiktok_photos", new_callable=AsyncMock) as mock_extract:
            mock_extract.return_value = ("TikTok Sunset", fake_images)
            r = api("POST", "/api/analyze", {"url": "https://www.tiktok.com/@creator/photo/7123456789012345678"})

        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(data["media_type"], "gallery")
        self.assertEqual(data["title"], "TikTok Sunset")
        self.assertEqual(data["source"], "platform")
        self.assertEqual(data["image_count"], 3)
        self.assertEqual(len(data["images"]), 3)
        self.assertEqual(data["thumbnail"], "https://example.com/img1.jpg")
        self.assertEqual(data["available_formats"], ["image"])

    def test_analyze_tiktok_photo_failure_returns_422(self):
        with patch("app.main.is_safe_host", return_value=True), \
             patch("app.main.extract_tiktok_photos", new_callable=AsyncMock) as mock_extract:
            mock_extract.side_effect = RuntimeError("extraction error")
            r = api("POST", "/api/analyze", {"url": "https://www.tiktok.com/@creator/photo/9999999999999999999"})

        self.assertEqual(r.status_code, 422)
        self.assertEqual(r.json()["code"], "unsupported_media")


class DownloadApiTest(unittest.TestCase):
    def test_download_invalid_url_returns_400(self):
        r = api("POST", "/api/download", {"url": "http://127.0.0.1/secret", "format": "video"})
        self.assertEqual(r.status_code, 400)
        self.assertEqual(r.json()["code"], "invalid_url")

    def test_download_creates_job_and_poll(self):
        with patch("app.main.is_safe_host", return_value=True), \
             patch("app.main.run_job") as mock_run:
            mock_run.return_value = None
            r = api("POST", "/api/download", {"url": "https://example.com/video.mp4", "format": "video", "quality": "Best"})

        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIn("job_id", data)
        self.assertEqual(data["status"], "queued")
        job_id = data["job_id"]

        # Poll status
        poll_r = api("GET", f"/api/jobs/{job_id}")
        self.assertEqual(poll_r.status_code, 200)
        poll_data = poll_r.json()
        self.assertEqual(poll_data["job_id"], job_id)
        self.assertEqual(poll_data["status"], "queued")

    def test_cancel_job_endpoint(self):
        with patch("app.main.is_safe_host", return_value=True):
            r = api("POST", "/api/download", {"url": "https://example.com/audio.mp3", "format": "audio", "quality": "192 kbps"})
        job_id = r.json()["job_id"]

        cancel_r = api("POST", f"/api/jobs/{job_id}/cancel")
        self.assertEqual(cancel_r.status_code, 200)
        self.assertEqual(cancel_r.json()["status"], "cancelled")

        # Verify job is now cancelled
        poll_r = api("GET", f"/api/jobs/{job_id}")
        self.assertEqual(poll_r.json()["status"], "cancelled")

    def test_download_file_endpoint_404_when_not_ready(self):
        r = api("GET", "/api/files/nonexistent_file_id")
        self.assertEqual(r.status_code, 404)

    def test_download_missing_ffmpeg_returns_500(self):
        with patch("app.main.is_safe_host", return_value=True), \
             patch("app.main._probe_direct_media", return_value=(False, None, True)), \
             patch("shutil.which", return_value=None):
            r = api("POST", "/api/download", {"url": "https://youtube.com/watch?v=abc", "format": "video"})
        self.assertEqual(r.status_code, 500)
        self.assertEqual(r.json()["code"], "ffmpeg_missing")

    def test_download_with_valid_output_format(self):
        with patch("app.main.is_safe_host", return_value=True), \
             patch("app.main.run_job") as mock_run:
            mock_run.return_value = None
            r = api("POST", "/api/download", {
                "url": "https://example.com/cover.webp",
                "format": "thumbnail",
                "quality": "Original",
                "output_format": "jpg",
            })
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIn("job_id", data)
        job = job_manager.get_job(data["job_id"])
        self.assertIsNotNone(job)
        self.assertEqual(job.output_format, "jpg")

    def test_download_invalid_output_format_returns_400(self):
        with patch("app.main.is_safe_host", return_value=True):
            r = api("POST", "/api/download", {
                "url": "https://example.com/image.png",
                "format": "image",
                "output_format": "invalid_format_xyz",
            })
        self.assertEqual(r.status_code, 400)
        self.assertEqual(r.json()["code"], "invalid_format")


if __name__ == "__main__":
    unittest.main()
