import json
import pytest
from app.gallery_extractor import is_tiktok_photo_url, parse_gallery_dl_json


def test_is_tiktok_photo_url():
    assert is_tiktok_photo_url("https://www.tiktok.com/@username/photo/7123456789012345678") is True
    assert is_tiktok_photo_url("https://tiktok.com/@user/photo/12345") is True
    assert is_tiktok_photo_url("http://m.tiktok.com/@user/photo/99999") is True
    # Non-photo TikTok URLs
    assert is_tiktok_photo_url("https://www.tiktok.com/@username/video/7123456789012345678") is False
    assert is_tiktok_photo_url("https://www.tiktok.com/@username") is False
    # Non-TikTok URLs with /photo/
    assert is_tiktok_photo_url("https://example.com/user/photo/12345") is False
    # Invalid URLs
    assert is_tiktok_photo_url("") is False
    assert is_tiktok_photo_url("not a url") is False


def test_parse_gallery_dl_json_array_format():
    # Simulates gallery-dl --dump-json array output:
    sample_data = [
        [2, {"desc": "My Vacation Photos", "user": "traveler"}],
        [3, "https://p16.tiktokcdn.com/img1.jpg", {
            "type": "image",
            "title": "My Vacation Photos",
            "width": 1080,
            "height": 1920,
            "num": 1,
        }],
        [3, "https://p16.tiktokcdn.com/img2.jpg", {
            "type": "image",
            "title": "My Vacation Photos",
            "width": 1080,
            "height": 1920,
            "num": 2,
        }],
        # Audio track entry (should be ignored by gallery parser)
        [3, "https://p16.tiktokcdn.com/music.mp3", {
            "type": "audio",
            "title": "My Vacation Photos",
        }],
    ]

    title, images = parse_gallery_dl_json(json.dumps(sample_data))
    assert title == "My Vacation Photos"
    assert len(images) == 2
    assert images[0] == {
        "index": 0,
        "url": "https://p16.tiktokcdn.com/img1.jpg",
        "width": 1080,
        "height": 1920,
    }
    assert images[1] == {
        "index": 1,
        "url": "https://p16.tiktokcdn.com/img2.jpg",
        "width": 1080,
        "height": 1920,
    }


def test_parse_gallery_dl_json_ndjson_format():
    # Simulates line-by-line NDJSON output:
    lines = [
        json.dumps([2, {"desc": "Cat Album"}]),
        json.dumps([3, "https://example.com/cat1.jpg", {"type": "image", "width": 800, "height": 600}]),
        json.dumps([3, "https://example.com/cat2.jpg", {"type": "image", "width": 800, "height": 600}]),
    ]
    raw = "\n".join(lines)

    title, images = parse_gallery_dl_json(raw)
    assert title == "Cat Album"
    assert len(images) == 2
    assert images[0]["url"] == "https://example.com/cat1.jpg"
    assert images[1]["url"] == "https://example.com/cat2.jpg"


def test_parse_gallery_dl_json_empty():
    title, images = parse_gallery_dl_json("")
    assert title == ""
    assert images == []


def test_gallery_item_and_result():
    from app.gallery_extractor import GalleryItem, GalleryResult

    items = [
        GalleryItem(index=0, type="image", url="https://example.com/1.jpg", width=1080, height=1920),
        GalleryItem(index=1, type="video", url="https://example.com/2.mp4", width=720, height=1280),
        GalleryItem(index=2, type="image", url="https://example.com/3.jpg", width=1080, height=1920),
    ]
    res = GalleryResult(platform="test", post_id="123", title="Test Gallery", items=items)
    assert res.image_count == 2
    assert res.video_count == 1
    assert len(res.images) == 2
    assert res.images[0]["url"] == "https://example.com/1.jpg"
    assert res.images[1]["url"] == "https://example.com/3.jpg"
    assert len(res.items_dict) == 3


def test_tiktok_adapter_post_id():
    from app.gallery_extractor import TikTokAdapter

    adapter = TikTokAdapter()
    assert adapter.can_handle("https://www.tiktok.com/@user/photo/789101112") is True
    assert adapter.can_handle("https://example.com/p/123") is False
    assert adapter.get_post_id("https://www.tiktok.com/@user/photo/789101112") == "789101112"


def test_gallery_extractor_registry():
    from app.gallery_extractor import GalleryExtractor, TikTokAdapter

    extractor = GalleryExtractor()
    adapter = TikTokAdapter()
    extractor.register(adapter)

    assert extractor.can_handle("https://www.tiktok.com/@user/photo/12345") is True
    assert extractor.can_handle("https://youtube.com/watch?v=123") is False
    assert extractor.get_adapter("https://www.tiktok.com/@user/photo/12345") is adapter


def test_instagram_adapter_url_handling():
    from app.gallery_extractor import InstagramAdapter

    adapter = InstagramAdapter()
    # /p/ links supported
    assert adapter.can_handle("https://www.instagram.com/p/C_abc123/") is True
    assert adapter.can_handle("https://instagram.com/p/C_abc123") is True
    assert adapter.can_handle("http://www.instagram.com/p/C_abc123/?utm_source=ig_web_copy_link&igsh=XYZ123") is True

    # /reel/, /reels/, /tv/, and other platforms excluded
    assert adapter.can_handle("https://www.instagram.com/reel/C_abc123/") is False
    assert adapter.can_handle("https://www.instagram.com/reels/C_abc123/") is False
    assert adapter.can_handle("https://www.instagram.com/tv/C_abc123/") is False
    assert adapter.can_handle("https://tiktok.com/@user/photo/123") is False

    # Shortcode and sanitization
    assert adapter.get_post_id("https://www.instagram.com/p/C_abc123/?igsh=XYZ") == "C_abc123"
    assert adapter.sanitize_url("https://www.instagram.com/p/C_abc123/?igsh=XYZ") == "https://www.instagram.com/p/C_abc123/"


