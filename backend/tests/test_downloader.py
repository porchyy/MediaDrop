import asyncio
import tempfile
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

from app.downloader import (
    MAX_DOWNLOAD_SIZE,
    download_direct_file,
    get_platform_ytdlp_opts,
)
from app.jobs import JobManager


class DownloaderTest(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.storage_path = Path(self.temp_dir.name)
        self.manager = JobManager(storage_dir=self.storage_path)

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_ytdlp_video_opts(self):
        opts_720 = get_platform_ytdlp_opts("video", "720p", "/tmp/out")
        self.assertIn("bestvideo[height<=720]", opts_720["format"])
        self.assertEqual(opts_720["merge_output_format"], "mp4")

        opts_best = get_platform_ytdlp_opts("video", "Best", "/tmp/out")
        self.assertIn("bestvideo+bestaudio/best", opts_best["format"])

    def test_ytdlp_mp3_opts(self):
        opts_320 = get_platform_ytdlp_opts("audio", "320 kbps", "/tmp/out")
        postprocessors = opts_320["postprocessors"]
        self.assertEqual(postprocessors[0]["preferredcodec"], "mp3")
        self.assertEqual(postprocessors[0]["preferredquality"], "320")

        opts_best = get_platform_ytdlp_opts("audio", "Best", "/tmp/out")
        self.assertEqual(opts_best["postprocessors"][0]["preferredquality"], "0")

    def test_direct_file_download_success(self):
        job = self.manager.create_job(url="https://example.com/test.jpg", format="image", quality="Original")

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.headers = {
            "Content-Length": "100",
            "Content-Disposition": 'attachment; filename="my_photo.jpg"',
        }

        async def fake_aiter_bytes(*args, **kwargs):
            yield b"x" * 50
            yield b"y" * 50

        mock_response.aiter_bytes = fake_aiter_bytes

        mock_client = MagicMock()
        mock_stream_ctx = MagicMock()
        mock_stream_ctx.__aenter__ = AsyncMock(return_value=mock_response)
        mock_stream_ctx.__aexit__ = AsyncMock(return_value=False)
        mock_client.stream.return_value = mock_stream_ctx
        mock_client_ctx = MagicMock()
        mock_client_ctx.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client_ctx.__aexit__ = AsyncMock(return_value=False)

        with patch("app.security.is_safe_url", return_value=True), \
             patch("httpx.AsyncClient", return_value=mock_client_ctx):
            asyncio.run(download_direct_file(job, self.manager))

        updated = self.manager.get_job(job.job_id)
        self.assertEqual(updated.status, "ready")
        self.assertEqual(updated.filename, "my_photo.jpg")
        self.assertEqual(updated.file_size, 100)
        self.assertTrue(Path(updated.file_path).exists())

    def test_direct_file_download_exceeds_max_size(self):
        job = self.manager.create_job(url="https://example.com/huge.bin", format="video", quality="Best")

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.headers = {"Content-Length": str(MAX_DOWNLOAD_SIZE + 10)}

        mock_client = MagicMock()
        mock_stream_ctx = MagicMock()
        mock_stream_ctx.__aenter__ = AsyncMock(return_value=mock_response)
        mock_stream_ctx.__aexit__ = AsyncMock(return_value=False)
        mock_client.stream.return_value = mock_stream_ctx
        mock_client_ctx = MagicMock()
        mock_client_ctx.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client_ctx.__aexit__ = AsyncMock(return_value=False)

        with patch("app.security.is_safe_url", return_value=True), \
             patch("httpx.AsyncClient", return_value=mock_client_ctx):
            asyncio.run(download_direct_file(job, self.manager))

        updated = self.manager.get_job(job.job_id)
        self.assertEqual(updated.status, "failed")
        self.assertEqual(updated.error_code, "file_too_large")


if __name__ == "__main__":
    unittest.main()
