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
