import shutil
import tempfile
from pathlib import Path
from PIL import Image

# Enforce 100 Megapixel limit to prevent decompression bomb denial-of-service
Image.MAX_IMAGE_PIXELS = 100_000_000

SUPPORTED_IMAGE_OUTPUT_FORMATS = {"original", "jpg", "jpeg", "png"}


def convert_image(input_path: Path, output_format: str, output_path: Path | None = None) -> Path:
    """Convert an image to the requested format (original, jpg, png).

    - 'original': bypasses re-encoding entirely.
    - 'jpg' / 'jpeg': flattens transparency (RGBA/P) onto a solid white (#FFFFFF) background with 92% quality.
    - 'png': lossless compression with optimization enabled.
    """
    input_path = Path(input_path)
    if not input_path.exists():
        raise FileNotFoundError(f"Input image not found: {input_path}")

    fmt = output_format.strip().lower()
    if fmt not in SUPPORTED_IMAGE_OUTPUT_FORMATS:
        raise ValueError(
            f"Unsupported image output format '{output_format}'. Expected one of: {', '.join(sorted(SUPPORTED_IMAGE_OUTPUT_FORMATS))}"
        )

    if fmt == "original":
        if output_path is not None and output_path.resolve() != input_path.resolve():
            output_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(input_path, output_path)
            return output_path
        return input_path

    ext = ".jpg" if fmt in ("jpg", "jpeg") else ".png"
    target_path = Path(output_path) if output_path is not None else input_path.with_suffix(ext)
    target_path.parent.mkdir(parents=True, exist_ok=True)

    # Use a temporary file if target is the same as source to prevent file corruption during read
    is_in_place = target_path.resolve() == input_path.resolve()
    temp_target = None
    save_dest = target_path
    if is_in_place:
        temp_fd, temp_dest_str = tempfile.mkstemp(suffix=ext, dir=target_path.parent)
        import os
        os.close(temp_fd)
        temp_target = Path(temp_dest_str)
        save_dest = temp_target

    try:
        with Image.open(input_path) as img:
            if fmt in ("jpg", "jpeg"):
                # Handle alpha transparency: flatten onto solid white background (#FFFFFF)
                has_alpha = img.mode in ("RGBA", "LA") or (
                    img.mode == "P" and "transparency" in img.info
                )
                if has_alpha:
                    rgba_img = img.convert("RGBA")
                    white_bg = Image.new("RGBA", rgba_img.size, (255, 255, 255, 255))
                    composite = Image.alpha_composite(white_bg, rgba_img).convert("RGB")
                    composite.save(save_dest, "JPEG", quality=92, optimize=True)
                else:
                    rgb_img = img.convert("RGB")
                    rgb_img.save(save_dest, "JPEG", quality=92, optimize=True)
            elif fmt == "png":
                img.save(save_dest, "PNG", optimize=True)

        if temp_target is not None:
            shutil.move(str(temp_target), str(target_path))

        return target_path
    except Exception:
        if temp_target is not None and temp_target.exists():
            temp_target.unlink(missing_ok=True)
        raise
