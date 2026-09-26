import pytest
from pathlib import Path
from PIL import Image
from app.image_processor import convert_image, SUPPORTED_IMAGE_OUTPUT_FORMATS


def test_supported_formats():
    assert "original" in SUPPORTED_IMAGE_OUTPUT_FORMATS
    assert "jpg" in SUPPORTED_IMAGE_OUTPUT_FORMATS
    assert "png" in SUPPORTED_IMAGE_OUTPUT_FORMATS


def test_convert_image_original_returns_same_path_when_no_dest(tmp_path: Path):
    src = tmp_path / "sample.webp"
    src.write_bytes(b"dummy image bytes")

    result = convert_image(src, "original")
    assert result == src
    assert result.read_bytes() == b"dummy image bytes"


def test_convert_image_original_copies_to_dest(tmp_path: Path):
    src = tmp_path / "sample.webp"
    src.write_bytes(b"dummy image bytes")
    dest = tmp_path / "sub" / "output.webp"

    result = convert_image(src, "original", output_path=dest)
    assert result == dest
    assert dest.exists()
    assert dest.read_bytes() == b"dummy image bytes"


def test_convert_image_rgba_to_jpg_flattens_to_white(tmp_path: Path):
    src = tmp_path / "transparent.png"
    # Create a 20x20 image: left half red, right half transparent
    img = Image.new("RGBA", (20, 20), (0, 0, 0, 0))  # Fully transparent
    for x in range(10):
        for y in range(20):
            img.putpixel((x, y), (255, 0, 0, 255))  # Opaque red on left half
    img.save(src, "PNG")

    dest = tmp_path / "flattened.jpg"
    result = convert_image(src, "jpg", output_path=dest)

    assert result == dest
    assert dest.exists()

    with Image.open(dest) as out_img:
        assert out_img.mode == "RGB"
        # Opaque red on left half (pixel (4, 10))
        r, g, b = out_img.getpixel((4, 10))
        assert r > 240 and g < 15 and b < 15
        # Fully transparent on right half (pixel (16, 10)) should be flattened onto white (#FFFFFF)
        r_bg, g_bg, b_bg = out_img.getpixel((16, 10))
        assert r_bg > 240 and g_bg > 240 and b_bg > 240


def test_convert_image_to_png(tmp_path: Path):
    src = tmp_path / "source.jpg"
    img = Image.new("RGB", (20, 20), (50, 100, 150))
    img.save(src, "JPEG")

    dest = tmp_path / "result.png"
    result = convert_image(src, "png", output_path=dest)

    assert result == dest
    assert dest.exists()
    with Image.open(dest) as out_img:
        assert out_img.format == "PNG"
        assert out_img.size == (20, 20)


def test_convert_image_in_place_when_output_path_same(tmp_path: Path):
    src = tmp_path / "photo.png"
    img = Image.new("RGB", (15, 15), (10, 20, 30))
    img.save(src, "PNG")

    result = convert_image(src, "png", output_path=src)
    assert result == src
    assert src.exists()
    with Image.open(src) as out_img:
        assert out_img.format == "PNG"


def test_convert_image_unsupported_format_raises(tmp_path: Path):
    src = tmp_path / "photo.png"
    src.write_bytes(b"dummy")

    with pytest.raises(ValueError, match="Unsupported image output format"):
        convert_image(src, "bmp")


def test_convert_image_nonexistent_file_raises(tmp_path: Path):
    src = tmp_path / "nonexistent.png"
    with pytest.raises(FileNotFoundError):
        convert_image(src, "jpg")


def test_convert_image_decompression_bomb_guard(tmp_path: Path, monkeypatch):
    # Set MAX_IMAGE_PIXELS to a small number to verify the guard (> 2 * MAX raises Error)
    monkeypatch.setattr(Image, "MAX_IMAGE_PIXELS", 50)
    src = tmp_path / "large.png"
    img = Image.new("RGB", (20, 20))  # 400 pixels > 2 * 50
    img.save(src, "PNG")

    with pytest.raises(Image.DecompressionBombError):
        convert_image(src, "jpg")
