import os
import shutil
import subprocess
import zipfile
from pathlib import Path
from PIL import Image

from app.diagnostics import ERROR_VERIFICATION_FAILED, FileVerificationError

MAX_DOWNLOAD_SIZE = int(os.environ.get("MAX_DOWNLOAD_SIZE", 500 * 1024 * 1024))

HTML_SIGNATURES = [
    b"<!doctype html",
    b"<html",
    b"<head",
    b"<body",
    b"<?xml",
]


def verify_file(
    path: Path,
    expected_type: str | None = None,
    min_size: int = 1,
    max_size: int = MAX_DOWNLOAD_SIZE,
) -> None:
    """
    Verify the integrity and validity of a downloaded media file before marking it ready.
    Raises FileVerificationError if verification fails.
    """
    if not path.exists():
        raise FileVerificationError(f"File does not exist: {path.name}")

    if not path.is_file():
        raise FileVerificationError(f"Target path is not a file: {path.name}")

    file_size = path.stat().st_size
    if file_size < min_size:
        raise FileVerificationError(f"File size {file_size} is less than minimum {min_size} bytes (zero-byte result)")

    if file_size > max_size:
        raise FileVerificationError(f"File size {file_size} exceeds maximum {max_size} bytes")

    # Inspect header bytes to reject obvious HTML / error responses disguised as media
    try:
        with open(path, "rb") as f:
            header = f.read(1024).strip().lower()
            for sig in HTML_SIGNATURES:
                if header.startswith(sig) or (b"<html" in header and b"</html>" in header):
                    raise FileVerificationError(f"Downloaded file contains HTML/error payload rather than media: {path.name}")
    except OSError as e:
        raise FileVerificationError(f"Unable to read file headers: {e}")

    # Determine type to verify
    type_lower = (expected_type or "").lower()
    suffix = path.suffix.lower()

    # Image verification
    is_image = (
        type_lower in ("image", "thumbnail", "jpg", "jpeg", "png", "webp", "gif")
        or suffix in (".jpg", ".jpeg", ".png", ".webp", ".gif")
    )
    if is_image:
        try:
            with Image.open(path) as img:
                img.verify()
        except Exception as exc:
            raise FileVerificationError(f"Image verification failed: {exc}")

    # Video / Audio verification
    is_video_or_audio = (
        type_lower in ("video", "audio", "mp4", "mp3", "m4a", "webm", "mkv", "mov", "wav", "flac")
        or suffix in (".mp4", ".mkv", ".webm", ".mov", ".mp3", ".m4a", ".aac", ".ogg", ".flac", ".wav")
    )
    if is_video_or_audio:
        ffprobe_bin = shutil.which("ffprobe")
        if ffprobe_bin:
            try:
                proc = subprocess.run(
                    [
                        ffprobe_bin,
                        "-v",
                        "error",
                        "-show_entries",
                        "format=duration",
                        "-of",
                        "default=noprint_wrappers=1:nokey=1",
                        str(path),
                    ],
                    capture_output=True,
                    text=True,
                    timeout=10,
                )
                if proc.returncode != 0:
                    err_detail = proc.stderr.strip() or "ffprobe reported non-zero return code"
                    raise FileVerificationError(f"Video/audio verification failed: {err_detail}")
            except subprocess.TimeoutExpired:
                raise FileVerificationError("Media probe timed out")
            except Exception as exc:
                if isinstance(exc, FileVerificationError):
                    raise
                raise FileVerificationError(f"ffprobe verification failed: {exc}")

    # ZIP verification
    if suffix == ".zip" or type_lower == "zip":
        try:
            with zipfile.ZipFile(path, "r") as zf:
                corrupted_member = zf.testzip()
                if corrupted_member is not None:
                    raise FileVerificationError(f"Corrupted file inside ZIP: {corrupted_member}")
                if len(zf.namelist()) == 0:
                    raise FileVerificationError("ZIP archive contains no files")
        except zipfile.BadZipFile as bzf:
            raise FileVerificationError(f"Invalid ZIP archive: {bzf}")
