# 03: `main.py` — `InstagramSessionError` Handling & Health Endpoint Update

## Parent
docs/phase8.8.2.3/spec.md

## What to build
Update the API layer to handle the new `InstagramSessionError` exception and extend `/api/health` with an `instagram_session` field.

Two changes:
1. In `POST /api/analyze`, add `except InstagramSessionError` returning HTTP 422 with `{"code": "instagram_session_error", "message": "Instagram is temporarily unavailable. Please try again later."}`.
2. In `GET /api/health`, add `instagram_session` field: `"ok"` if `INSTAGRAM_COOKIE_FILE` env var is set and the path exists on disk, `"missing"` otherwise. No cookie content, filename, or path is included in the response body.

## Acceptance criteria
- [ ] `InstagramSessionError` is imported from `gallery_extractor`.
- [ ] `POST /api/analyze` with an Instagram URL that raises `InstagramSessionError` returns HTTP 422 with `code: "instagram_session_error"`.
- [ ] `GET /api/health` returns `instagram_session: "ok"` when `INSTAGRAM_COOKIE_FILE` points to an existing file.
- [ ] `GET /api/health` returns `instagram_session: "missing"` when env var is unset or file does not exist.
- [ ] Health response never contains the cookie file path, contents, or env var value.
- [ ] All existing health fields (`status`, `ffmpeg`) remain unchanged.

## Blocked by
Issue 01 (`InstagramSessionError` exception class)
