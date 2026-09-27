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


@pytest.mark.anyio
async def test_download_instagram_single_photo_success(manager: JobManager, tmp_path: Path):
    from app.gallery_extractor import GalleryItem, GalleryResult

    fake_img_bytes = _make_dummy_image_bytes("JPEG")
    fake_res = GalleryResult(
        platform="instagram",
        post_id="C_123",
        title="Sun",
        items=[
            GalleryItem(index=0, type="image", url="https://example.com/p1.jpg", width=800, height=600),
            GalleryItem(index=1, type="image", url="https://example.com/p2.jpg", width=800, height=600),
        ],
    )

    job = manager.create_job(
        url="https://www.instagram.com/p/C_123/",
        format="image",
        quality="Original",
        output_format="png",
        image_index=0,
        download_all=False,
    )

    mock_resp = httpx.Response(200, content=fake_img_bytes, request=httpx.Request("GET", "https://example.com/p1.jpg"))

    with patch("app.gallery_extractor.InstagramAdapter.extract", new_callable=AsyncMock) as mock_extract, \
         patch("app.downloader.is_safe_url", return_value=True), \
         patch("httpx.AsyncClient.stream") as mock_stream:
        mock_extract.return_value = fake_res
        mock_stream.return_value.__aenter__.return_value = mock_resp

        await download_single_gallery_photo(job, manager)

    updated_job = manager.get_job(job.job_id)
    assert updated_job.status == "ready"
    assert updated_job.file_path is not None
    assert Path(updated_job.file_path).exists()
    assert updated_job.filename.endswith(".png")


@pytest.mark.anyio
async def test_download_instagram_gallery_bundle_creates_zip(manager: JobManager, tmp_path: Path):
    from app.gallery_extractor import GalleryItem, GalleryResult

    fake_img_bytes = _make_dummy_image_bytes("JPEG")
    fake_res = GalleryResult(
        platform="instagram",
        post_id="C_album",
        title="Trip",
        items=[
            GalleryItem(index=0, type="image", url="https://example.com/p1.jpg"),
            GalleryItem(index=1, type="image", url="https://example.com/p2.jpg"),
        ],
    )

    job = manager.create_job(
        url="https://www.instagram.com/p/C_album/",
        format="image",
        quality="Original",
        output_format="jpg",
        image_index=0,
        download_all=True,
    )

    mock_resp = httpx.Response(200, content=fake_img_bytes, request=httpx.Request("GET", "https://example.com/p.jpg"))

    with patch("app.gallery_extractor.InstagramAdapter.extract", new_callable=AsyncMock) as mock_extract, \
         patch("app.downloader.is_safe_url", return_value=True), \
         patch("httpx.AsyncClient.stream") as mock_stream:
        mock_extract.return_value = fake_res
        mock_stream.return_value.__aenter__.return_value = mock_resp

        await download_gallery_bundle(job, manager)

    updated_job = manager.get_job(job.job_id)
    assert updated_job.status == "ready"
    assert updated_job.filename == "instagram_C_album_photos_jpg.zip"
    zip_path = Path(updated_job.file_path)
    assert zip_path.exists()

    with zipfile.ZipFile(zip_path, "r") as zf:
        namelist = sorted(zf.namelist())
        assert namelist == ["01.jpg", "02.jpg"]


@pytest.mark.anyio
async def test_download_instagram_mixed_carousel_bundle_skips_video(manager: JobManager, tmp_path: Path):
    from app.gallery_extractor import GalleryItem, GalleryResult

    fake_img_bytes = _make_dummy_image_bytes("JPEG")
    # Mixed carousel: Photo 0, Video 1, Photo 2
    fake_res = GalleryResult(
        platform="instagram",
        post_id="C_mixed",
        title="Mixed Trip",
        items=[
            GalleryItem(index=0, type="image", url="https://example.com/p1.jpg"),
            GalleryItem(index=1, type="video", url="https://example.com/vid2.mp4"),
            GalleryItem(index=2, type="image", url="https://example.com/p3.jpg"),
        ],
    )

    job = manager.create_job(
        url="https://www.instagram.com/p/C_mixed/",
        format="image",
        quality="Original",
        output_format="jpg",
        image_index=0,
        download_all=True,
    )

    mock_resp = httpx.Response(200, content=fake_img_bytes, request=httpx.Request("GET", "https://example.com/p.jpg"))

    with patch("app.gallery_extractor.InstagramAdapter.extract", new_callable=AsyncMock) as mock_extract, \
         patch("app.downloader.is_safe_url", return_value=True), \
         patch("httpx.AsyncClient.stream") as mock_stream:
        mock_extract.return_value = fake_res
        mock_stream.return_value.__aenter__.return_value = mock_resp

        await download_gallery_bundle(job, manager)

    updated_job = manager.get_job(job.job_id)
    assert updated_job.status == "ready"
    assert updated_job.filename == "instagram_C_mixed_photos_jpg.zip"
    zip_path = Path(updated_job.file_path)

    # In mixed carousel, only the 2 photos are packed and re-indexed sequentially 01, 02
    with zipfile.ZipFile(zip_path, "r") as zf:
        namelist = sorted(zf.namelist())
        assert namelist == ["01.jpg", "02.jpg"]


@pytest.mark.anyio
async def test_download_instagram_carousel_video_item_renames_cleanly(manager: JobManager, tmp_path: Path):
    from app.gallery_extractor import GalleryItem, GalleryResult

    fake_video_bytes = b"\x00\x00\x00\x18ftypmp42" + b"\x00" * 200
    fake_res = GalleryResult(
        platform="instagram",
        post_id="C_mixed",
        title="Mixed Trip",
        items=[
            GalleryItem(index=0, type="image", url="https://example.com/p1.jpg"),
            GalleryItem(index=1, type="video", url="https://example.com/vid2.mp4"),
            GalleryItem(index=2, type="image", url="https://example.com/p3.jpg"),
        ],
    )

    job = manager.create_job(
        url="https://www.instagram.com/p/C_mixed/",
        format="video",
        quality="Best",
        output_format="original",
        image_index=1,
        download_all=False,
    )

    mock_resp = httpx.Response(200, content=fake_video_bytes, request=httpx.Request("GET", "https://example.com/vid2.mp4"))

    with patch("app.gallery_extractor.InstagramAdapter.extract", new_callable=AsyncMock) as mock_extract, \
         patch("app.downloader.is_safe_url", return_value=True), \
         patch("httpx.AsyncClient.stream") as mock_stream:
        mock_extract.return_value = fake_res
        mock_stream.return_value.__aenter__.return_value = mock_resp

        await download_single_gallery_photo(job, manager)

    updated_job = manager.get_job(job.job_id)
    assert updated_job.status == "ready"
    assert updated_job.filename == "instagram_C_mixed_video_2.mp4"
    assert Path(updated_job.file_path).exists()


@pytest.mark.anyio
async def test_download_instagram_pure_video_fallback(manager: JobManager):
    from app.gallery_extractor import GalleryItem, GalleryResult

    fake_res = GalleryResult(
        platform="instagram",
        post_id="C_pure_video",
        title="Single Video Post",
        items=[
            GalleryItem(index=0, type="video", url="https://example.com/video.mp4"),
        ],
    )

    job = manager.create_job(
        url="https://www.instagram.com/p/C_pure_video/",
        format="video",
        quality="Best",
        output_format="original",
        image_index=0,
        download_all=False,
    )

    with patch("app.gallery_extractor.InstagramAdapter.extract", new_callable=AsyncMock) as mock_extract, \
         patch("app.downloader._run_platform_download_sync") as mock_platform_sync:
        mock_extract.return_value = fake_res

        await download_single_gallery_photo(job, manager)

        mock_platform_sync.assert_called_once_with(job, manager)


