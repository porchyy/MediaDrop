# Phase 8.8.2.1: Instagram Extractor Compatibility & Error Classification Hotfix

## Problem Statement

When users attempt to analyze public Instagram post or carousel URLs (`https://www.instagram.com/p/<shortcode>/`), the backend invocation of the `gallery-dl` subprocess fails immediately with `python -m gallery_dl: error: unrecognized arguments: --no-warnings`. Because the system catches this subprocess exit as a generic `RuntimeError`, the API maps the failure to HTTP 422 `UNSUPPORTED MEDIA`. This misleads users into believing their valid public Instagram post cannot be analyzed, prevents successful extraction, and obscures real server/tool configuration faults during operational debugging.

## Solution

1. **Remove Incompatible CLI Flags**: Eliminate `--no-warnings` and `--no-color` from the gallery-dl command builder, retaining only minimal CLI arguments (`--dump-json` and standard browser `--user-agent`) to ensure compatibility across installed versions of gallery-dl.
2. **Classify Subprocess Errors Accurately**: Introduce a typed `ExtractorConfigurationError` exception. If stderr indicates command line argument or usage faults (e.g. `unrecognized arguments`, `unknown option`, `usage:`), return HTTP 500 with `code: "extractor_error"`.
3. **Preserve Authentic Domain States**: Maintain HTTP 422 `login_required` for authentic Instagram authentication/private account walls, HTTP 422 `unsupported_media` for truly unhandled links, and HTTP 200 `MediaInfo` for successful extractions.
4. **Clarify Frontend Error Messaging**: Update the web client to map `extractor_error` to a dedicated `MEDIA EXTRACTOR ERROR` banner informing the user that the media extractor is temporarily unavailable, rather than falsely blaming the user's URL.

## User Stories

1. As a user pasting a valid public Instagram post URL, I want the server to execute a compatible `gallery-dl` command without unsupported flags, so that my post can be analyzed successfully.
2. As a user whose Instagram post or carousel is analyzed, I want to see the photos and preview without arbitrary subprocess failures, so that I can download images in my chosen format.
3. As a developer or operator inspecting logs, I want CLI argument syntax errors to be isolated as `ExtractorConfigurationError`, so that misconfigurations are immediately distinguishable from network blocks or unhandled media.
4. As an API client receiving an extractor crash due to server CLI flags, I want an HTTP 500 response with `code: "extractor_error"`, so that I do not confuse system outages with unsupported URLs.
5. As a web user encountering an unexpected extractor failure, I want to see `MEDIA EXTRACTOR ERROR` with explanatory text ("The media extractor is temporarily unavailable"), so that I understand the service is experiencing temporary technical difficulties.
6. As a user attempting to view a private Instagram post without credentials, I want to receive `login_required` (HTTP 422) and see `INSTAGRAM LOGIN REQUIRED`, so that authentic access restrictions remain clear.
7. As a user downloading TikTok photo posts, I want existing TikTok extraction to continue functioning without regression, so that prior functionality remains completely intact.
8. As a user downloading Instagram Reels or standard platform videos, I want `/reel/` and other video URLs to bypass `gallery-dl` and route smoothly to `yt-dlp`, so that video downloading remains fast and reliable.

## Implementation Decisions

### 1. Minimal Gallery-DL Command Builder (`backend/app/gallery_extractor.py`)
- Extract command construction into a helper function `build_gallery_dl_command(url: str, user_agent: str | None = None) -> list[str]`.
- Explicitly omit `--no-warnings` and `--no-color`.
- Default flags are strictly: `[sys.executable, "-m", "gallery_dl", "--dump-json"]`.
- When `user_agent` is supplied (as in `InstagramAdapter`), append `--user-agent <UA>`.
- `TikTokAdapter` remains untouched or shares the minimal command builder without unnecessary arguments.

### 2. Typed Exception Hierarchy & Subprocess Error Classification
- Define `class ExtractorConfigurationError(Exception): pass`.
- In `InstagramAdapter.extract` (and any other gallery adapters), parse `stderr` and `returncode` with strict precedence:
  - **Precedence 1 (Configuration / CLI failure)**: If `stderr` contains `unrecognized arguments`, `unknown option`, `error: unrecognized`, or `usage:`, raise `ExtractorConfigurationError(f"extractor_error: {err_msg}")`.
  - **Precedence 2 (Authentication / Privacy Wall)**: If `stderr` contains `login`, `private`, `checkpoint`, `authentication`, `unauthorized`, `401`, or `403`, raise `LoginRequiredError(f"login_required: {err_msg}")`.
  - **Precedence 3 (Generic Failure)**: Raise standard `RuntimeError(f"gallery-dl failed with code {returncode}: {err_msg}")`.

### 3. API Contract & Endpoint Mapping (`backend/app/main.py`)
- In `POST /api/analyze`:
  - Catch `ExtractorConfigurationError` specifically and respond with HTTP 500:
    ```json
    {
      "code": "extractor_error",
      "message": "The media extractor is temporarily unavailable."
    }
    ```
  - Catch `LoginRequiredError` specifically and respond with HTTP 422:
    ```json
    {
      "code": "login_required",
      "message": "This post cannot be accessed anonymously."
    }
    ```
  - Catch generic `RuntimeError` and respond with HTTP 422 `unsupported_media` or HTTP 500 `internal_error` appropriately.

### 4. Client Presentation Mapping (`src/components/UrlInput.jsx`)
- Map `error.code === 'extractor_error'` to `errorKind = 'extractor_error'`.
- Render error state:
  - Title: `MEDIA EXTRACTOR ERROR`
  - Body: `The media extractor is temporarily unavailable.`
- Maintain existing `login_required` error screen:
  - Title: `INSTAGRAM LOGIN REQUIRED`
  - Body: `This post cannot be accessed anonymously.`

## Testing Decisions

### What Makes a Good Test
- Tests must inspect observable behavior at API and adapter boundaries, rather than internal subprocess mechanics.
- Tests must be completely deterministic and offline: **no live network calls to Instagram**; mock standard outputs, errors, and subprocess exit codes.
- Tests must assert that CLI flag regressions (like re-introducing `--no-warnings`) fail immediately.

### Tested Seams
1. **Command Builder Unit Seam (`backend/tests/test_gallery_extractor.py`)**:
   - Assert `build_gallery_dl_command` produces minimal flags.
   - Assert `--no-warnings` is NOT present in generated commands.
   - Assert `--dump-json` and the sanitized URL are present.
2. **Adapter Error Classification Seam (`backend/tests/test_gallery_extractor.py`)**:
   - Assert exit code with "unrecognized arguments" raises `ExtractorConfigurationError`.
   - Assert exit code with "login required" / 403 raises `LoginRequiredError`.
3. **HTTP API Contract Seam (`backend/tests/test_api.py`)**:
   - Mock adapter raising `ExtractorConfigurationError` -> assert HTTP 500 with `code: "extractor_error"`.
   - Mock adapter raising `LoginRequiredError` -> assert HTTP 422 with `code: "login_required"`.
   - Mock valid Instagram response -> assert HTTP 200 `MediaInfo`.
4. **Frontend UI Seam (`test/demo-flow.test.mjs`)**:
   - Assert `UrlInput` renders `MEDIA EXTRACTOR ERROR` upon receiving `extractor_error`.
   - Assert `login_required` continues to render `INSTAGRAM LOGIN REQUIRED`.

### Prior Art
- `backend/tests/test_api.py`: FastAPI endpoint tests for `login_required` and `unsupported_media`.
- `backend/tests/test_gallery_extractor.py`: Subprocess mock output and parsing tests.
- `test/demo-flow.test.mjs`: Component render assertions for error conditions.

## Out of Scope
- Adding cookie files, session persistence, or Instagram user authentication.
- Modifying yt-dlp options or Reel/Video extraction flow.
- Modifying TikTok photo extraction logic or image processor formats.
- External network requests to Instagram in automated test suites.

## Further Notes
- Respect canonical domain terms in `CONTEXT.md`: **`Extractor Error`**, **`Extractor Configuration Error`**, **`Login Required`**, **`Gallery Item`**, **`Mixed Carousel`**.
- Keep changes minimal and surgically targeted.
