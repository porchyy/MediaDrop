# 09: Safe Finalization and Atomic Output Exposure

## Parent
docs/phase8.8.2.5/spec.md

## Triage
completed

## What was built
Guaranteed that partial and unverified files are never served or exposed to clients. HTTP downloads, gallery downloads, and post-processed files remain as `.part` or isolated files until they pass full verification. Once verified, files are atomically renamed to their final filenames. Unfinished or corrupt files are cleaned up immediately if cancelled or failed.

## Acceptance criteria
- [x] Files stay named `*.part` throughout the download and verification pipeline.
- [x] Atomic rename from `.part` to final file path only occurs after verification passes.
- [x] Cancellation cleans up `.part` files immediately.
- [x] API endpoint `/api/files/{file_id}` only serves validated final files.

## Blocked by
docs/phase8.8.2.5/issues/08-file-verification-engine.md
