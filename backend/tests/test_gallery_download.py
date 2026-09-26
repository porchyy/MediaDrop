import io
import zipfile
from pathlib import Path
from unittest.mock import AsyncMock, patch
import httpx
import pytest
from PIL import Image

from app.downloader import download_gallery_bundle, download_single_gallery_photo
from app.jobs import Job, JobManager


def _make_dummy_image_bytes(fmt="JPEG"):
    buf = io.BytesIO()
    img = Image.new("RGB", (20, 20), (255, 0, 0))
    img.save(buf, format=fmt)
    return buf.getvalue()


@pytest.fixture
def manager(tmp_path: Path):
    return JobManager(storage_dir=tmp_path / "jobs")


@pytest.mark.anyio
async def test_download_single_gallery_photo_success(manager: JobManager, tmp_path: Path):
    fake_img_bytes = _make_dummy_image_bytes("JPEG")
    fake_images = [
        {"index": 0, "url": "https://example.com/p1.jpg", "width": 800, "height": 600},
        {"index": 1, "url": "https://example.com/p2.jpg", "width": 800, "height": 600},
    ]

    job = manager.create_job(
        url="https://www.tiktok.com/@creator/photo/12345",
        format="image",
        quality="Original",
        output_format="png",
        image_index=1,
        download_all=False,
    )

    mock_resp = httpx.Response(200, content=fake_img_bytes, request=httpx.Request("GET", "https://example.com/p2.jpg"))

    with patch("app.downloader.extract_tiktok_photos", new_callable=AsyncMock) as mock_extract, \
         patch("app.downloader.is_safe_url", return_value=True), \
         patch("httpx.AsyncClient.stream") as mock_stream:
        mock_extract.return_value = ("Vacation", fake_images)
        mock_stream.return_value.__aenter__.return_value = mock_resp

        await download_single_gallery_photo(job, manager)

    updated_job = manager.get_job(job.job_id)
    assert updated_job.status == "ready"
    assert updated_job.file_path is not None
    assert Path(updated_job.file_path).exists()
    assert updated_job.filename.endswith(".png")


@pytest.mark.anyio
async def test_download_gallery_bundle_creates_clean_zip(manager: JobManager, tmp_path: Path):
    fake_img_bytes = _make_dummy_image_bytes("JPEG")
    fake_images = [
        {"index": 0, "url": "https://example.com/p1.jpg", "width": 800, "height": 600},
        {"index": 1, "url": "https://example.com/p2.jpg", "width": 800, "height": 600},
    ]

    job = manager.create_job(
        url="https://www.tiktok.com/@creator/photo/78910",
        format="image",
        quality="Original",
        output_format="jpg",
        image_index=0,
        download_all=True,
    )

    mock_resp = httpx.Response(200, content=fake_img_bytes, request=httpx.Request("GET", "https://example.com/p.jpg"))

    with patch("app.downloader.extract_tiktok_photos", new_callable=AsyncMock) as mock_extract, \
         patch("app.downloader.is_safe_url", return_value=True), \
         patch("httpx.AsyncClient.stream") as mock_stream:
        mock_extract.return_value = ("Vacation", fake_images)
        mock_stream.return_value.__aenter__.return_value = mock_resp

        await download_gallery_bundle(job, manager)

    updated_job = manager.get_job(job.job_id)
    assert updated_job.status == "ready"
    assert updated_job.filename == "78910_photos_jpg.zip"
    zip_path = Path(updated_job.file_path)
    assert zip_path.exists()

    # Verify inside zip: files should be named 01.jpg, 02.jpg
    with zipfile.ZipFile(zip_path, "r") as zf:
        namelist = sorted(zf.namelist())
        assert namelist == ["01.jpg", "02.jpg"]

    # Verify individual files were cleaned up from the job dir
    job_dir = zip_path.parent
    remaining_files = [f.name for f in job_dir.iterdir() if f.is_file() and f.name != "metadata.json"]
    assert remaining_files == ["78910_photos_jpg.zip"]


@pytest.mark.anyio
async def test_download_gallery_bundle_cancellation(manager: JobManager):
    fake_images = [
        {"index": 0, "url": "https://example.com/p1.jpg", "width": 800, "height": 600},
    ]

    job = manager.create_job(
        url="https://www.tiktok.com/@creator/photo/78910",
        format="image",
        quality="Original",
        output_format="jpg",
        image_index=0,
        download_all=True,
    )

    manager.cancel_job(job.job_id)

    with patch("app.downloader.extract_tiktok_photos", new_callable=AsyncMock) as mock_extract:
        mock_extract.return_value = ("Vacation", fake_images)
        await download_gallery_bundle(job, manager)

    updated_job = manager.get_job(job.job_id)
    assert updated_job.status == "cancelled"
