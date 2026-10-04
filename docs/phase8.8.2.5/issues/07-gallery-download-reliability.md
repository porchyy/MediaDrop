# 07: Gallery Download Item-by-Item Reliability

## Parent
docs/phase8.8.2.5/spec.md

## Triage
completed

## What was built
Upgraded gallery carousel downloading (`download_single_gallery_photo` and `download_gallery_bundle`). Each item downloads to its own isolated temporary `.part` file using `ReliableDownloader` with retries and verification before bundling. If an item permanently fails in a multi-item bundle, the system packages successfully downloaded items, sets the job status to `ready`, and attaches a structured warning describing the missing items, avoiding total job failure.

## Acceptance criteria
- [x] Each gallery item streams to its own temporary `.part` file.
- [x] Transient failures on individual items retry independently without aborting the batch.
- [x] Pillow / format verification performed per item before inclusion into ZIP.
- [x] Partial gallery bundles succeed with non-fatal `warnings` when at least one item succeeds.
- [x] If all items fail, job fails cleanly with explicit error code.

## Blocked by
docs/phase8.8.2.5/issues/02-reliable-http-transfer.md
