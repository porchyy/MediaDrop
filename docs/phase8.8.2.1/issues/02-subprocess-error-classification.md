# Ticket 2: Subprocess Error Classification & Extractor Error API Contract

## Parent
https://github.com/porchyy/MediaDrop/issues/7

## What to build
Introduce a typed exception `ExtractorConfigurationError(Exception)` in `backend/app/gallery_extractor.py`.
In `InstagramAdapter.extract` (and gallery-dl subprocess runner), inspect `stderr` for command-line syntax or configuration errors (`unrecognized arguments`, `usage:`, `unknown option`) with top priority and raise `ExtractorConfigurationError`.
In `backend/app/main.py:analyze`, catch `ExtractorConfigurationError` and respond with HTTP 500:
`{"code": "extractor_error", "message": "The media extractor is temporarily unavailable."}`.
Preserve HTTP 422 `login_required` for authentic private/login restrictions, and HTTP 422 `unsupported_media` for genuinely unsupported URLs.

## Acceptance criteria
- [ ] `ExtractorConfigurationError` exception defined in `gallery_extractor.py`.
- [ ] Subprocess error parsing identifies `unrecognized arguments` or `usage:` as `ExtractorConfigurationError` before login checks.
- [ ] `/api/analyze` catches `ExtractorConfigurationError` and returns HTTP 500 with `code: "extractor_error"`.
- [ ] `/api/analyze` retains HTTP 422 `login_required` for private/authentication errors.
- [ ] Backend tests assert HTTP 500 `extractor_error`, HTTP 422 `login_required`, and HTTP 422 `unsupported_media`.

## Blocked by
- Ticket 1: Minimal Gallery-DL Command Builder & Remove Incompatible CLI Flags
