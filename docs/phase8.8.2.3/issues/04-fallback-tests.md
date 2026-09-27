# 04: Fallback Tests — Three Cases for `InstagramAdapter`

## Parent
docs/phase8.8.2.3/spec.md

## What to build
Add three async test cases to `backend/tests/test_gallery_extractor.py` covering the full fallback behavior of `InstagramAdapter.extract()`. Use the existing `patch("app.gallery_extractor.run_gallery_dl_subprocess")` pattern plus `patch.dict(os.environ, ...)` to control environment state. Tests must assert observable behavior only — what is returned or raised — not internal implementation details.

### Test case 1: Anonymous succeeds — no fallback
Mock subprocess to return a valid gallery-dl JSON payload on the first call.
Assert: `GalleryResult` is returned. Subprocess called exactly once (no authenticated retry).

### Test case 2: Anonymous fails → authenticated succeeds
Mock subprocess: first call returns login error stderr + non-zero returncode; second call returns valid JSON.
Env: `INSTAGRAM_COOKIE_FILE` set to a path pointing to a temp file that exists.
Assert: `GalleryResult` is returned. `--cookies` appears in the second subprocess call arguments.

### Test case 3: Both attempts fail → `InstagramSessionError`
Mock subprocess: both calls return login error.
Env: `INSTAGRAM_COOKIE_FILE` set and file exists.
Assert: `InstagramSessionError` is raised.

## Acceptance criteria
- [ ] All three tests pass with `pytest`.
- [ ] Tests use `@pytest.mark.anyio` and `unittest.mock.patch`.
- [ ] No test inspects `print()` calls or internal state beyond exception type and return value.
- [ ] No network calls are made during any test.

## Blocked by
Issue 02 (fallback logic must exist to be tested)
