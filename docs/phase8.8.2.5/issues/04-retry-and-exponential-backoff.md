# 04: Exponential Backoff & Controlled Retries

## Parent
docs/phase8.8.2.5/spec.md

## Triage
completed

## What was built
Implemented configurable retry loops with exponential backoff and rate-limit parsing. Transient network failures and HTTP errors (408, 429, 500, 502, 503, 504) back off exponentially (`initial_backoff * (2 ** (attempt - 1))`) capped by `max_backoff`. HTTP 429 parses `Retry-After` seconds if provided. Non-transient errors (401, 403, 404, file_too_large) fail immediately without wasteful retries.

## Acceptance criteria
- [x] Configurable env variables: `DOWNLOAD_MAX_RETRIES`, `DOWNLOAD_INITIAL_BACKOFF`, `DOWNLOAD_MAX_BACKOFF`.
- [x] Exponential backoff applied on classified transient failures.
- [x] `Retry-After` header honored on HTTP 429 status code.
- [x] Cancellation checked during backoff delay slices for immediate termination.
- [x] Permanent failures (401, 404) fail fast without retrying.

## Blocked by
docs/phase8.8.2.5/issues/02-reliable-http-transfer.md
