# 03: Partial File (.part) and HTTP Range Resumption

## Parent
docs/phase8.8.2.5/spec.md

## Triage
completed

## What was built
Implemented robust partial-file persistence and resumable downloads. Files are downloaded into `filename.part` in the job directory. On reconnect, `ReliableDownloader` inspects the existing byte count and sends `Range: bytes={existing_bytes}-`. If server responds with 206, it appends to `.part`. If server responds with 200, it safely restarts from byte 0. If server responds with 416, it discards the invalid part and restarts cleanly.

## Acceptance criteria
- [x] Downloads stream exclusively to `.part` files until finalized.
- [x] Resume requests send `Range: bytes={offset}-` headers.
- [x] HTTP 206 appends to existing `.part` with content-range offset validation.
- [x] HTTP 200 safely overwrites from byte zero without corrupting data.
- [x] HTTP 416 discards invalid partial data and restarts from byte zero.

## Blocked by
docs/phase8.8.2.5/issues/02-reliable-http-transfer.md
