import asyncio
import io
import json
import time
import zipfile
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest
from PIL import Image

from app.diagnostics import (
    ERROR_AUTH_REQUIRED,
    ERROR_CANCELLED,
    ERROR_CONNECTION_ERROR,
    ERROR_FILE_TOO_LARGE,
    ERROR_HTTP_404,
    ERROR_TIMEOUT,
    ERROR_VERIFICATION_FAILED,
    FileVerificationError,
    SourceExpiredError,
    classify_error,
)
from app.downloader import (
    MAX_DOWNLOAD_SIZE,
    download_direct_file,
    download_gallery_bundle,
    get_platform_ytdlp_opts,
    run_job,
)
from app.jobs import Job, JobManager
from app.transfer import ReliableDownloader
from app.verifier import verify_file


def _create_test_image_bytes(fmt: str = "JPEG") -> bytes:
    buf = io.BytesIO()
    img = Image.new("RGB", (20, 20), (0, 255, 128))
    img.save(buf, format=fmt)
    return buf.getvalue()


@pytest.fixture
def manager(tmp_path: Path):
    return JobManager(storage_dir=tmp_path / "storage")


# 1. Normal direct download
@pytest.mark.anyio
async def test_1_normal_direct_download(manager: JobManager):
    img_bytes = _create_test_image_bytes("JPEG")
    job = manager.create_job(url="https://example.com/photo.jpg", format="image", quality="Original")

    mock_resp = httpx.Response(
        200,
        content=img_bytes,
        headers={"Content-Length": str(len(img_bytes)), "Content-Disposition": 'attachment; filename="photo.jpg"'},
        request=httpx.Request("GET", job.url),
    )

    with patch("app.security.is_safe_url", return_value=True), \
         patch("httpx.AsyncClient.stream") as mock_stream:
        mock_stream.return_value.__aenter__.return_value = mock_resp
        await download_direct_file(job, manager)

    updated = manager.get_job(job.job_id)
    assert updated.status == "ready"
    assert updated.file_size == len(img_bytes)
    assert Path(updated.file_path).exists()


# 2. Redirect
@pytest.mark.anyio
async def test_2_redirect(manager: JobManager):
    img_bytes = _create_test_image_bytes("JPEG")
    job = manager.create_job(url="https://example.com/shortlink", format="image", quality="Original")

    resp_302 = httpx.Response(302, headers={"Location": "https://example.com/photo.jpg"}, request=httpx.Request("GET", job.url))
    resp_200 = httpx.Response(
        200,
        content=img_bytes,
        headers={"Content-Length": str(len(img_bytes)), "Content-Disposition": 'attachment; filename="photo.jpg"'},
        request=httpx.Request("GET", "https://example.com/photo.jpg"),
    )

    mock_stream = AsyncMock()
    mock_stream.__aenter__.side_effect = [resp_302, resp_200]

    with patch("app.security.is_safe_url", return_value=True), \
         patch("httpx.AsyncClient.stream", return_value=mock_stream):
        await download_direct_file(job, manager)

    updated = manager.get_job(job.job_id)
    assert updated.status == "ready"
    assert updated.filename == "photo.jpg"


# 3. Transient 500 then success
@pytest.mark.anyio
async def test_3_transient_500_then_success(manager: JobManager):
    img_bytes = _create_test_image_bytes("JPEG")
    job = manager.create_job(url="https://example.com/flaky.jpg", format="image", quality="Original")

    resp_500 = httpx.Response(500, request=httpx.Request("GET", job.url))
    resp_200 = httpx.Response(
        200,
        content=img_bytes,
        headers={"Content-Length": str(len(img_bytes)), "Content-Disposition": 'attachment; filename="flaky.jpg"'},
        request=httpx.Request("GET", job.url),
    )

    mock_stream = AsyncMock()
    mock_stream.__aenter__.side_effect = [resp_500, resp_200]

    downloader = ReliableDownloader(max_retries=3, initial_backoff=0.01, max_backoff=0.05)
    with patch("app.security.is_safe_url", return_value=True), \
         patch("app.downloader.ReliableDownloader", return_value=downloader), \
         patch("httpx.AsyncClient.stream", return_value=mock_stream):
        await download_direct_file(job, manager)

    updated = manager.get_job(job.job_id)
    assert updated.status == "ready"
    assert updated.retry_count == 1


# 4. Timeout then success
@pytest.mark.anyio
async def test_4_timeout_then_success(manager: JobManager):
    img_bytes = _create_test_image_bytes("JPEG")
    job = manager.create_job(url="https://example.com/slow.jpg", format="image", quality="Original")

    resp_200 = httpx.Response(
        200,
        content=img_bytes,
        headers={"Content-Length": str(len(img_bytes)), "Content-Disposition": 'attachment; filename="slow.jpg"'},
        request=httpx.Request("GET", job.url),
    )

    mock_stream = AsyncMock()
    mock_stream.__aenter__.side_effect = [httpx.ReadTimeout("Timeout reading stream"), resp_200]

    downloader = ReliableDownloader(max_retries=3, initial_backoff=0.01, max_backoff=0.05)
    with patch("app.security.is_safe_url", return_value=True), \
         patch("app.downloader.ReliableDownloader", return_value=downloader), \
         patch("httpx.AsyncClient.stream", return_value=mock_stream):
        await download_direct_file(job, manager)

    updated = manager.get_job(job.job_id)
    assert updated.status == "ready"


# 5. Connection failure then success
@pytest.mark.anyio
async def test_5_connection_failure_then_success(manager: JobManager):
    img_bytes = _create_test_image_bytes("JPEG")
    job = manager.create_job(url="https://example.com/conn.jpg", format="image", quality="Original")

    resp_200 = httpx.Response(
        200,
        content=img_bytes,
        headers={"Content-Length": str(len(img_bytes)), "Content-Disposition": 'attachment; filename="conn.jpg"'},
        request=httpx.Request("GET", job.url),
    )

    mock_stream = AsyncMock()
    mock_stream.__aenter__.side_effect = [httpx.ConnectError("Failed to connect"), resp_200]

    downloader = ReliableDownloader(max_retries=3, initial_backoff=0.01, max_backoff=0.05)
    with patch("app.security.is_safe_url", return_value=True), \
         patch("app.downloader.ReliableDownloader", return_value=downloader), \
         patch("httpx.AsyncClient.stream", return_value=mock_stream):
        await download_direct_file(job, manager)

    updated = manager.get_job(job.job_id)
    assert updated.status == "ready"


# 6. 429 with Retry-After
@pytest.mark.anyio
async def test_6_429_with_retry_after(manager: JobManager):
    img_bytes = _create_test_image_bytes("JPEG")
    job = manager.create_job(url="https://example.com/rate.jpg", format="image", quality="Original")

    resp_429 = httpx.Response(429, headers={"Retry-After": "0.02"}, request=httpx.Request("GET", job.url))
    resp_200 = httpx.Response(
        200,
        content=img_bytes,
        headers={"Content-Length": str(len(img_bytes)), "Content-Disposition": 'attachment; filename="rate.jpg"'},
        request=httpx.Request("GET", job.url),
    )

    mock_stream = AsyncMock()
    mock_stream.__aenter__.side_effect = [resp_429, resp_200]

    downloader = ReliableDownloader(max_retries=3, initial_backoff=0.01, max_backoff=0.1)
    with patch("app.security.is_safe_url", return_value=True), \
         patch("app.downloader.ReliableDownloader", return_value=downloader), \
         patch("httpx.AsyncClient.stream", return_value=mock_stream):
        await download_direct_file(job, manager)

    updated = manager.get_job(job.job_id)
    assert updated.status == "ready"


# 7. Resume from partial file
@pytest.mark.anyio
async def test_7_resume_from_partial_file(manager: JobManager):
    img_bytes = _create_test_image_bytes("JPEG")
    job = manager.create_job(url="https://example.com/resume.jpg", format="image", quality="Original")
    job_dir = manager.storage_dir / job.job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    # Pre-write half the bytes to .part file
    half_len = len(img_bytes) // 2
    part_file = job_dir / "resume.jpg.part"
    part_file.write_bytes(img_bytes[:half_len])

    # Server returns 206 Partial Content for the remainder
    remaining_bytes = img_bytes[half_len:]
    resp_206 = httpx.Response(
        206,
        content=remaining_bytes,
        headers={
            "Content-Range": f"bytes {half_len}-{len(img_bytes)-1}/{len(img_bytes)}",
            "Content-Length": str(len(remaining_bytes)),
            "Content-Disposition": 'attachment; filename="resume.jpg"',
        },
        request=httpx.Request("GET", job.url),
    )

    with patch("app.security.is_safe_url", return_value=True), \
         patch("httpx.AsyncClient.stream") as mock_stream:
        mock_stream.return_value.__aenter__.return_value = resp_206
        await download_direct_file(job, manager)

    updated = manager.get_job(job.job_id)
    assert updated.status == "ready"
    assert updated.transfer_mode == "resuming"
    assert Path(updated.file_path).read_bytes() == img_bytes


# 8. Server rejects Range and forces safe restart
@pytest.mark.anyio
async def test_8_server_rejects_range_and_forces_safe_restart(manager: JobManager):
    img_bytes = _create_test_image_bytes("JPEG")
    job = manager.create_job(url="https://example.com/restart.jpg", format="image", quality="Original")
    job_dir = manager.storage_dir / job.job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    # Pre-populate corrupt or stale bytes in .part
    part_file = job_dir / "restart.jpg.part"
    part_file.write_bytes(b"STALE_OLD_BYTES_DO_NOT_APPEND")

    # Server responds with 200 OK (ignores Range, sending full payload)
    resp_200 = httpx.Response(
        200,
        content=img_bytes,
        headers={
            "Content-Length": str(len(img_bytes)),
            "Content-Disposition": 'attachment; filename="restart.jpg"',
        },
        request=httpx.Request("GET", job.url),
    )

    with patch("app.security.is_safe_url", return_value=True), \
         patch("httpx.AsyncClient.stream") as mock_stream:
        mock_stream.return_value.__aenter__.return_value = resp_200
        await download_direct_file(job, manager)

    updated = manager.get_job(job.job_id)
    assert updated.status == "ready"
    assert updated.transfer_mode == "restart"
    assert Path(updated.file_path).read_bytes() == img_bytes


# 9. Corrupted partial file (416 Range Not Satisfiable)
@pytest.mark.anyio
async def test_9_corrupted_partial_file_forces_restart(manager: JobManager):
    img_bytes = _create_test_image_bytes("JPEG")
    job = manager.create_job(url="https://example.com/corrupt.jpg", format="image", quality="Original")
    job_dir = manager.storage_dir / job.job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    part_file = job_dir / "corrupt.jpg.part"
    part_file.write_bytes(b"BOGUS_BYTES_BEYOND_FILE_SIZE")

    resp_416 = httpx.Response(416, request=httpx.Request("GET", job.url))
    resp_200 = httpx.Response(
        200,
        content=img_bytes,
        headers={"Content-Length": str(len(img_bytes)), "Content-Disposition": 'attachment; filename="corrupt.jpg"'},
        request=httpx.Request("GET", job.url),
    )

    mock_stream = AsyncMock()
    mock_stream.__aenter__.side_effect = [resp_416, resp_200]

    with patch("app.security.is_safe_url", return_value=True), \
         patch("httpx.AsyncClient.stream", return_value=mock_stream):
        await download_direct_file(job, manager)

    updated = manager.get_job(job.job_id)
    assert updated.status == "ready"
    assert Path(updated.file_path).read_bytes() == img_bytes


# 10. File exceeds size limit
@pytest.mark.anyio
async def test_10_file_exceeds_size_limit(manager: JobManager):
    job = manager.create_job(url="https://example.com/huge.mp4", format="video", quality="Best")
    resp_huge = httpx.Response(
        200,
        headers={"Content-Length": str(MAX_DOWNLOAD_SIZE + 1000)},
        request=httpx.Request("GET", job.url),
    )

    with patch("app.security.is_safe_url", return_value=True), \
         patch("httpx.AsyncClient.stream") as mock_stream:
        mock_stream.return_value.__aenter__.return_value = resp_huge
        await download_direct_file(job, manager)

    updated = manager.get_job(job.job_id)
    assert updated.status == "failed"
    assert updated.error_code == "file_too_large"


# 11. Zero-byte result
@pytest.mark.anyio
async def test_11_zero_byte_result_fails_verification(manager: JobManager):
    job = manager.create_job(url="https://example.com/empty.jpg", format="image", quality="Original")
    resp_empty = httpx.Response(
        200,
        content=b"",
        headers={"Content-Length": "0", "Content-Disposition": 'attachment; filename="empty.jpg"'},
        request=httpx.Request("GET", job.url),
    )

    with patch("app.security.is_safe_url", return_value=True), \
         patch("httpx.AsyncClient.stream") as mock_stream:
        mock_stream.return_value.__aenter__.return_value = resp_empty
        await download_direct_file(job, manager)

    updated = manager.get_job(job.job_id)
    assert updated.status == "failed"
    assert updated.error_code == ERROR_VERIFICATION_FAILED


# 12. Invalid HTML returned as media
@pytest.mark.anyio
async def test_12_invalid_html_returned_as_media(manager: JobManager):
    job = manager.create_job(url="https://example.com/spoofed.jpg", format="image", quality="Original")
    html_payload = b"<!DOCTYPE html><html><body>Error 404 Media Gone</body></html>"
    resp_html = httpx.Response(
        200,
        content=html_payload,
        headers={"Content-Length": str(len(html_payload)), "Content-Disposition": 'attachment; filename="spoofed.jpg"'},
        request=httpx.Request("GET", job.url),
    )

    with patch("app.security.is_safe_url", return_value=True), \
         patch("httpx.AsyncClient.stream") as mock_stream:
        mock_stream.return_value.__aenter__.return_value = resp_html
        await download_direct_file(job, manager)

    updated = manager.get_job(job.job_id)
    assert updated.status == "failed"
    assert updated.error_code == ERROR_VERIFICATION_FAILED


# 13. Image verification failure
def test_13_image_verification_failure(tmp_path: Path):
    corrupt_image = tmp_path / "bad.jpg"
    corrupt_image.write_bytes(b"NOT_A_VALID_IMAGE_HEADER_1234567890")

    with pytest.raises(FileVerificationError) as exc_info:
        verify_file(corrupt_image, expected_type="image")
    assert exc_info.value.code == ERROR_VERIFICATION_FAILED


# 14. Video verification failure
def test_14_video_verification_failure(tmp_path: Path):
    corrupt_video = tmp_path / "bad.mp4"
    corrupt_video.write_bytes(b"CORRUPT_VIDEO_STREAM_DATA_ABCDEF")

    # If ffprobe is present, verify_file will raise FileVerificationError
    import shutil
    if shutil.which("ffprobe"):
        with pytest.raises(FileVerificationError):
            verify_file(corrupt_video, expected_type="video")


# 15. ZIP integrity
def test_15_zip_integrity(tmp_path: Path):
    corrupt_zip = tmp_path / "archive.zip"
    corrupt_zip.write_bytes(b"PK\x03\x04CORRUPTED_ZIP_BODY_TRUNCATED")

    with pytest.raises(FileVerificationError):
        verify_file(corrupt_zip, expected_type="zip")


# 16. Cancellation during retry
@pytest.mark.anyio
async def test_16_cancellation_during_retry(manager: JobManager):
    job = manager.create_job(url="https://example.com/retry_cancel.jpg", format="image", quality="Original")
    resp_500 = httpx.Response(500, request=httpx.Request("GET", job.url))

    mock_stream = AsyncMock()
    mock_stream.__aenter__.return_value = resp_500

    downloader = ReliableDownloader(max_retries=3, initial_backoff=2.0, max_backoff=5.0)

    async def cancel_later():
        await asyncio.sleep(0.05)
        manager.cancel_job(job.job_id)

    with patch("app.security.is_safe_url", return_value=True), \
         patch("app.downloader.ReliableDownloader", return_value=downloader), \
         patch("httpx.AsyncClient.stream", return_value=mock_stream):
        t1 = asyncio.create_task(download_direct_file(job, manager))
        t2 = asyncio.create_task(cancel_later())
        await asyncio.gather(t1, t2)

    updated = manager.get_job(job.job_id)
    assert updated.status == "cancelled"


# 17. Cancellation during resume
@pytest.mark.anyio
async def test_17_cancellation_during_resume(manager: JobManager):
    job = manager.create_job(url="https://example.com/resume_cancel.jpg", format="image", quality="Original")

    async def slow_stream(*args, **kwargs):
        yield b"chunk1"
        manager.cancel_job(job.job_id)
        yield b"chunk2"

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.headers = {"Content-Length": "1000", "Content-Disposition": 'attachment; filename="cancel.jpg"'}
    mock_resp.aiter_bytes = slow_stream

    mock_stream = AsyncMock()
    mock_stream.__aenter__.return_value = mock_resp

    with patch("app.security.is_safe_url", return_value=True), \
         patch("httpx.AsyncClient.stream", return_value=mock_stream):
        await download_direct_file(job, manager)

    updated = manager.get_job(job.job_id)
    assert updated.status == "cancelled"


# 18. Source refresh after expired media URL
@pytest.mark.anyio
async def test_18_source_refresh_after_expired_media_url(manager: JobManager):
    img_bytes = _create_test_image_bytes("JPEG")
    job = manager.create_job(url="https://example.com/expired.jpg", format="image", quality="Original")
    job_dir = manager.storage_dir / job.job_id

    resp_403 = httpx.Response(403, request=httpx.Request("GET", "https://example.com/expired.jpg"))
    resp_200 = httpx.Response(
        200,
        content=img_bytes,
        headers={"Content-Length": str(len(img_bytes)), "Content-Disposition": 'attachment; filename="fresh.jpg"'},
        request=httpx.Request("GET", "https://example.com/fresh.jpg"),
    )

    mock_stream = AsyncMock()
    mock_stream.__aenter__.side_effect = [resp_403, resp_200]

    refresh_called = False

    async def mock_refresh():
        nonlocal refresh_called
        refresh_called = True
        return "https://example.com/fresh.jpg"

    downloader = ReliableDownloader(max_retries=3, initial_backoff=0.01)
    with patch("app.security.is_safe_url", return_value=True), \
         patch("httpx.AsyncClient.stream", return_value=mock_stream):
        part_path, fname = await downloader.download_file(
            url=job.url,
            output_dir=job_dir,
            job=job,
            manager=manager,
            on_source_refresh=mock_refresh,
        )

    assert refresh_called is True
    assert part_path.exists()
    assert fname == "fresh.jpg"


# 19. Permanent 404 does not retry forever
@pytest.mark.anyio
async def test_19_permanent_404_does_not_retry_forever(manager: JobManager):
    job = manager.create_job(url="https://example.com/notfound.jpg", format="image", quality="Original")
    resp_404 = httpx.Response(404, request=httpx.Request("GET", job.url))

    call_count = 0
    async def fake_stream(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        return resp_404

    mock_stream = AsyncMock()
    mock_stream.__aenter__.side_effect = fake_stream

    with patch("app.security.is_safe_url", return_value=True), \
         patch("httpx.AsyncClient.stream", return_value=mock_stream):
        await download_direct_file(job, manager)

    updated = manager.get_job(job.job_id)
    assert updated.status == "failed"
    assert updated.error_code == "http_404"
    assert call_count == 1  # 404 should fail immediately on attempt 1 without retries


# 20. Authentication / login requirement remains a clean failure
@pytest.mark.anyio
async def test_20_auth_required_clean_failure(manager: JobManager):
    job = manager.create_job(url="https://example.com/private.jpg", format="image", quality="Original")
    resp_401 = httpx.Response(401, request=httpx.Request("GET", job.url))

    with patch("app.security.is_safe_url", return_value=True), \
         patch("httpx.AsyncClient.stream") as mock_stream:
        mock_stream.return_value.__aenter__.return_value = resp_401
        await download_direct_file(job, manager)

    updated = manager.get_job(job.job_id)
    assert updated.status == "failed"
    assert updated.error_code == ERROR_AUTH_REQUIRED


# 21. Gallery item retry
@pytest.mark.anyio
async def test_21_gallery_item_retry(manager: JobManager):
    from app.gallery_extractor import GalleryItem, GalleryResult
    img_bytes = _create_test_image_bytes("JPEG")

    fake_res = GalleryResult(
        platform="tiktok",
        post_id="7890",
        title="Flaky Item",
        items=[GalleryItem(index=0, type="image", url="https://example.com/item1.jpg")],
    )

    job = manager.create_job(
        url="https://www.tiktok.com/@user/photo/7890",
        format="image",
        quality="Original",
        download_all=True,
    )

    resp_503 = httpx.Response(503, request=httpx.Request("GET", "https://example.com/item1.jpg"))
    resp_200 = httpx.Response(
        200,
        content=img_bytes,
        headers={"Content-Length": str(len(img_bytes)), "Content-Disposition": 'attachment; filename="item1.jpg"'},
        request=httpx.Request("GET", "https://example.com/item1.jpg"),
    )

    mock_stream = AsyncMock()
    mock_stream.__aenter__.side_effect = [resp_503, resp_200]

    downloader = ReliableDownloader(max_retries=3, initial_backoff=0.01, max_backoff=0.05)
    with patch("app.downloader.is_tiktok_photo_url", return_value=False), \
         patch("app.gallery_extractor.gallery_extractor.get_adapter") as mock_adapter, \
         patch("app.security.is_safe_url", return_value=True), \
         patch("app.downloader.ReliableDownloader", return_value=downloader), \
         patch("httpx.AsyncClient.stream", return_value=mock_stream):
        adapter_instance = AsyncMock()
        adapter_instance.extract.return_value = fake_res
        mock_adapter.return_value = adapter_instance

        await download_gallery_bundle(job, manager)

    updated = manager.get_job(job.job_id)
    assert updated.status == "ready"
    assert updated.filename.endswith(".zip")


# 22. Gallery item permanent failure creates partial ZIP with warnings
@pytest.mark.anyio
async def test_22_gallery_item_permanent_failure(manager: JobManager):
    from app.gallery_extractor import GalleryItem, GalleryResult
    img_bytes = _create_test_image_bytes("JPEG")

    fake_res = GalleryResult(
        platform="tiktok",
        post_id="7891",
        title="Partial Gallery",
        items=[
            GalleryItem(index=0, type="image", url="https://example.com/dead.jpg"),
            GalleryItem(index=1, type="image", url="https://example.com/good.jpg"),
        ],
    )

    job = manager.create_job(
        url="https://www.tiktok.com/@user/photo/7891",
        format="image",
        quality="Original",
        download_all=True,
    )

    resp_404 = httpx.Response(404, request=httpx.Request("GET", "https://example.com/dead.jpg"))
    resp_200 = httpx.Response(
        200,
        content=img_bytes,
        headers={"Content-Length": str(len(img_bytes)), "Content-Disposition": 'attachment; filename="good.jpg"'},
        request=httpx.Request("GET", "https://example.com/good.jpg"),
    )

    mock_stream = AsyncMock()
    mock_stream.__aenter__.side_effect = [resp_404, resp_200]

    with patch("app.downloader.is_tiktok_photo_url", return_value=False), \
         patch("app.gallery_extractor.gallery_extractor.get_adapter") as mock_adapter, \
         patch("app.security.is_safe_url", return_value=True), \
         patch("httpx.AsyncClient.stream", return_value=mock_stream):
        adapter_instance = AsyncMock()
        adapter_instance.extract.return_value = fake_res
        mock_adapter.return_value = adapter_instance

        await download_gallery_bundle(job, manager)

    updated = manager.get_job(job.job_id)
    assert updated.status == "ready"
    assert len(updated.warnings) >= 1
    assert "Image 1 could not be downloaded" in updated.warnings[0]
    # Check that zip was created with 1 valid photo
    with zipfile.ZipFile(updated.file_path, "r") as zf:
        assert len(zf.namelist()) == 1


# 23. Backwards-compatible job metadata loading
def test_23_backwards_compatible_job_metadata_loading(tmp_path: Path):
    legacy_json = {
        "job_id": "legacy123",
        "file_id": "file999",
        "url": "https://example.com/vid.mp4",
        "format": "video",
        "quality": "Best",
        "status": "ready",
        "downloaded_bytes": 1024,
        "total_bytes": 1024,
        "file_size": 1024,
        "filename": "vid.mp4",
        "file_path": "/tmp/vid.mp4",
        "created_at": 1700000000.0,
    }

    job = Job.from_dict(legacy_json)
    assert job.job_id == "legacy123"
    assert job.retry_count == 0
    assert job.warnings == []
    assert job.transfer_mode is None

    # Load via JobManager from disk
    mgr = JobManager(storage_dir=tmp_path / "legacy_storage")
    job_dir = mgr.storage_dir / "legacy123"
    job_dir.mkdir(parents=True, exist_ok=True)
    (job_dir / "metadata.json").write_text(json.dumps(legacy_json), encoding="utf-8")

    loaded = mgr.get_job("legacy123")
    assert loaded is not None
    assert loaded.status == "ready"
    assert loaded.file_id == "file999"


# 24. Final file is not visible before verification
@pytest.mark.anyio
async def test_24_final_file_is_not_visible_before_verification(manager: JobManager):
    img_bytes = _create_test_image_bytes("JPEG")
    job = manager.create_job(url="https://example.com/invisible.jpg", format="image", quality="Original")
    job_dir = manager.storage_dir / job.job_id
    final_target = job_dir / "invisible.jpg"

    checked_during_stream = False

    async def inspecting_stream(*args, **kwargs):
        nonlocal checked_during_stream
        # During stream, only .part file may exist; final target file MUST NOT exist!
        assert not final_target.exists()
        current_job = manager.get_job(job.job_id)
        assert current_job.status != "ready"
        checked_during_stream = True
        yield img_bytes

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.headers = {"Content-Length": str(len(img_bytes)), "Content-Disposition": 'attachment; filename="invisible.jpg"'}
    mock_resp.aiter_bytes = inspecting_stream

    mock_stream = AsyncMock()
    mock_stream.__aenter__.return_value = mock_resp

    with patch("app.security.is_safe_url", return_value=True), \
         patch("httpx.AsyncClient.stream", return_value=mock_stream):
        await download_direct_file(job, manager)

    assert checked_during_stream is True
    updated = manager.get_job(job.job_id)
    assert updated.status == "ready"
    assert final_target.exists()
