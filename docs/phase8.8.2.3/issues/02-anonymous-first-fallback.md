# 02: `InstagramAdapter` Anonymous-First Fallback Logic

## Parent
docs/phase8.8.2.3/spec.md

## What to build
Refactor `InstagramAdapter.extract()` to implement the Hybrid Anonymous-First extraction strategy. On a `LoginRequiredError`, read `INSTAGRAM_COOKIE_FILE` from the environment and, if the file exists, retry with authenticated gallery-dl. Emit a single `print()` to `sys.stderr` when the fallback is triggered. Raise `InstagramSessionError` when both attempts fail. Raise `LoginRequiredError` when no session is configured at all.

Timeouts: anonymous attempt uses `10.0s`, authenticated attempt uses `20.0s`.

## Acceptance criteria
- [ ] Anonymous extraction success: subprocess called once, returns `GalleryResult`, no fallback triggered.
- [ ] Anonymous fails (Login Wall) + `INSTAGRAM_COOKIE_FILE` set + file exists: subprocess called twice; second call includes `--cookies`; returns `GalleryResult`.
- [ ] Anonymous fails + authenticated also fails: `InstagramSessionError` is raised.
- [ ] Anonymous fails + `INSTAGRAM_COOKIE_FILE` not set: `LoginRequiredError` is raised (no change from current behavior for undeployed instances).
- [ ] A `print()` to `sys.stderr` is emitted exactly when authenticated fallback is triggered.
- [ ] Anonymous timeout is `10.0s`; authenticated timeout is `20.0s`.

## Blocked by
Issue 01 (`InstagramSessionError`, `cookies_file` parameter)
