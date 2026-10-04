# 08: Multi-Tier Pre-Finalization File Verification

## Parent
docs/phase8.8.2.5/spec.md

## Triage
completed

## What was built
Created `backend/app/verifier.py` providing rigorous pre-finalization checks. Never marks a job `ready` based on transfer percentage alone. Verifies file existence, positive byte size (> 0), size under limit, rejection of HTML/error strings (e.g. `<!DOCTYPE html>`, `<html`), image structure validation via Pillow (`Image.open().verify()`), media container/stream validity via `ffprobe`, and ZIP archive member integrity via `zipfile.ZipFile.testzip()`. Invalid files are immediately quarantined or unlinked.

## Acceptance criteria
- [x] Basic verification: exists, size > 0, size <= MAX_DOWNLOAD_SIZE, not HTML error document.
- [x] Image verification: verified using Pillow `Image.open().verify()`.
- [x] Video/audio verification: verified using `ffprobe` stream checks when present.
- [x] ZIP archive verification: tested using `testzip()` and non-empty member check.
- [x] Verification failure deletes corrupt output and transitions job to `failed` with `verification_failed`.

## Blocked by
docs/phase8.8.2.5/issues/01-download-failure-diagnostics.md
