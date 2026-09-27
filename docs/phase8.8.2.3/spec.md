# Phase 8.8.2.3: Seamless Instagram Download — Anonymous-First with Server Session Fallback

## Problem Statement

MediaDrop currently attempts to extract Instagram posts anonymously via `gallery-dl`. When Instagram enforces a login wall, the system immediately surfaces a `INSTAGRAM LOGIN REQUIRED` error card to the user, ending the session. The user has no recourse: they must either abandon the URL or seek another tool.

A significant portion of public Instagram posts that fail anonymous extraction can succeed when attempted with a valid server-held session cookie. The user should never need to know about authentication details — they paste a link and expect the media to appear.

Additionally, the `/api/health` endpoint does not reflect the availability of the Instagram session, making it impossible to detect a stale or missing cookie before it causes user-visible failures.

## Solution

Introduce a **Hybrid Anonymous-First Extraction** strategy inside `InstagramAdapter`:

1. Attempt extraction anonymously (no cookies). If it succeeds, return the result immediately.
2. If anonymous extraction encounters a Login Wall, silently retry using a **Server Session Cookie** mounted on the server — a Netscape-format cookie file belonging to a dedicated MediaDrop Instagram account.
3. If both attempts fail, return a typed `instagram_session_error` response distinct from a generic `login_required`.
4. Expose `instagram_session` status in `/api/health` so operators can detect a missing or unconfigured session cookie before it causes failures in production.
5. Ensure no cookie, username, session ID, or secret is ever returned via any API endpoint, logged to stdout, or committed to version control.

The user experience remains unchanged: paste a link, analyze, download.

## User Stories

1. As a user pasting a public Instagram post URL that is accessible anonymously, I want MediaDrop to return the media immediately without using any session, so that my request is handled with the least privilege necessary.
2. As a user pasting an Instagram post URL that hits a login wall, I want MediaDrop to silently retry using a server session and return the media, so that I do not see an error for content that is technically accessible.
3. As a user pasting an Instagram post URL where both anonymous and authenticated extraction fail, I want to see a clear error message that Instagram is temporarily unavailable, so that I understand the issue is not with my link.
4. As a user, I want the fallback retry to happen invisibly in the background, so that I never need to think about sessions, cookies, or authentication.
5. As a user, I want the analyze flow to remain PASTE → ANALYZE → RESULT, so that seamless fallback does not change the UX in any way.
6. As a user on a slow connection, I want anonymous extraction to fail fast (within ~10 seconds) if blocked, so that I do not wait unnecessarily long before the authenticated retry begins.
7. As a user who has already analyzed a public post that succeeded anonymously, I want that analysis to not consume any server session quota, so that authenticated retries are reserved for posts that actually need them.
8. As an operator deploying MediaDrop, I want to mount a cookie file at a path specified by an environment variable, so that I can manage secrets outside of code and outside of the container image.
9. As an operator, I want `/api/health` to report `instagram_session: "ok"` or `instagram_session: "missing"`, so that I can detect a misconfigured or expired session cookie before users encounter errors.
10. As an operator, I want no cookie value, filename, or session identifier to appear in any API response, so that the server credential is never exposed to the public.
11. As an operator, I want a `docker-compose.example.yml` with the correct volume mount and environment variable to serve as a reference for deployment, so that setup is unambiguous.
12. As a developer, I want `secrets/`, `*cookies*.txt`, and `.env` listed in `.gitignore`, so that accidental credential commits are prevented at the source.
13. As a developer reading the code, I want the fallback flow to be expressed as typed exceptions (`LoginRequiredError` → retry → `InstagramSessionError`) rather than string matching on error messages, so that the control flow is explicit and traceable.
14. As a developer, I want the fallback behavior documented in `CONTEXT.md` with precise terms (`Anonymous Extract`, `Authenticated Extract`, `Server Session Cookie`), so that future contributors understand the architecture without reading implementation code.
15. As a developer, I want an ADR recording why Hybrid Anonymous→Authenticated was chosen over always-authenticated, third-party APIs (HikerAPI), and Instaloader, so that the decision is not revisited unnecessarily.
16. As a developer writing tests, I want three test cases covering anonymous success, anonymous-fail-then-authenticated-success, and both-fail, so that the fallback logic is fully specified in the test suite.
17. As a user downloading a TikTok photo post or any other platform, I want those workflows to be completely unaffected by this phase, so that existing features do not regress.

## Implementation Decisions

### Exception Hierarchy
- A new `InstagramSessionError` exception is introduced alongside the existing `LoginRequiredError` and `ExtractorConfigurationError`.
- `LoginRequiredError` continues to mean: "the content requires authentication and no fallback was available or configured."
- `InstagramSessionError` means: "a Server Session Cookie was attempted but failed (expired, invalid, or the cookie file was missing)."
- `main.py` catches `InstagramSessionError` and returns HTTP 422 with `{"code": "instagram_session_error", "message": "Instagram is temporarily unavailable. Please try again later."}`.

### Fallback Logic in `InstagramAdapter`
- `InstagramAdapter.extract()` contains all fallback logic. The `GalleryExtractor` dispatcher and `main.py` remain unaware of session details.
- Sequence:
  1. Run anonymous gallery-dl subprocess with `timeout=10.0`.
  2. On `LoginRequiredError`, read `INSTAGRAM_COOKIE_FILE` from the environment.
  3. If the env var is set and the file exists on disk, run authenticated gallery-dl subprocess with `--cookies <path>` and `timeout=20.0`.
  4. If authentication also fails, raise `InstagramSessionError`.
  5. If the env var is unset or the file does not exist, raise `LoginRequiredError` (no session configured — surface the original error).
- A single `print()` to `sys.stderr` is emitted when the fallback is triggered, matching the existing codebase convention (no `logging` module).

### Cookie Path Resolution
- The path to the cookie file is read exclusively from the `INSTAGRAM_COOKIE_FILE` environment variable.
- No path is hardcoded anywhere in source code.
- The cookie file must be in Netscape/Mozilla format (the format gallery-dl accepts natively via `--cookies`).
- The backend never reads the contents of the cookie file, only passes the path to the gallery-dl subprocess.

### `build_gallery_dl_command()` Extension
- The function gains an optional `cookies_file: str | None = None` parameter.
- When provided, `["--cookies", cookies_file]` is appended to the command before the URL.
- All other behavior is unchanged.

### Login Wall Detection
- `check_gallery_dl_subprocess_error()` continues to match on stderr keywords (`"login"`, `"private"`, `"checkpoint"`, `"authentication"`, `"unauthorized"`, `"401"`, `"403"`).
- Detection is widened to an OR with `returncode` check: any non-zero returncode on an Instagram URL that did not match `ExtractorConfigurationError` keywords is treated as a potential Login Wall trigger for the fallback.

### `/api/health` Update
- The health endpoint adds an `instagram_session` field.
- Value is `"ok"` if the `INSTAGRAM_COOKIE_FILE` env var is set and the path exists on disk; `"missing"` otherwise.
- The file is never opened, read, or validated beyond existence.
- No cookie content, path, or filename is included in the response.

### Security Constraints (non-negotiable)
- `secrets/`, `*cookies*.txt`, and `.env` are added to `.gitignore`.
- The cookie file must be mounted read-only into the container (shown in `docker-compose.example.yml`).
- The backend never logs cookie contents.
- The frontend never receives or sees the cookie file path.
- Cookie upload from the frontend is explicitly not supported.

### Deployment Reference
- A `docker-compose.example.yml` is created at the repository root.
- It demonstrates: `INSTAGRAM_COOKIE_FILE=/run/secrets/instagram-cookies.txt` as an environment variable, and a read-only bind mount from `/srv/mediadrop/secrets/instagram-cookies.txt` to `/run/secrets/instagram-cookies.txt:ro`.
- Operators copy and edit this file; the actual `docker-compose.yml` (with real paths) must not be committed.

### CONTEXT.md Additions
Three new terms are added to the domain glossary:
- **Anonymous Extract**: การดึงข้อมูลสื่อโดยไม่ส่ง session หรือ cookie ใดๆ ไปยัง platform ต้นทาง
- **Authenticated Extract**: การดึงข้อมูลสื่อโดยใช้ Server Session Cookie ของระบบ ทำเฉพาะเมื่อ Anonymous Extract ล้มเหลวเนื่องจาก Login Wall
- **Server Session Cookie**: Cookie file format Netscape ของบัญชี Instagram เฉพาะ MediaDrop mount เข้า server แบบ read-only ไม่เปิดเผยต่อ Frontend หรือ API ใดๆ

### ADR
- `docs/adr/0001-instagram-hybrid-extract.md` records the decision to use Hybrid Anonymous→Authenticated over: (a) always-authenticated, (b) third-party API (HikerAPI), (c) replacing gallery-dl with Instaloader.

### Phase Scope: `/p/` Only
- The fallback applies only to Instagram photo posts and carousels (`/p/` path).
- Instagram Reels (`/reel/`, `/reels/`, `/tv/`) continue to route directly to `yt-dlp` via `_analyze_platform` and are not affected.

## Testing Decisions

### What Makes a Good Test
Tests must assert **observable behavior at the adapter boundary**, not internal implementation details. Specifically:
- Assert what exception is raised given a specific combination of subprocess outputs.
- Assert that when anonymous fails and authenticated succeeds, the correct `GalleryResult` is returned.
- Assert that no authenticated call is made when anonymous succeeds (subprocess called once, not twice).
- Do NOT assert which internal methods were called, which fields were set on intermediate objects, or the exact stderr string passed to `print()`.

### Seam
- **Primary test seam**: `InstagramAdapter.extract()` with `run_gallery_dl_subprocess` mocked.
- This is the existing seam already used in `test_gallery_extractor.py` — no new seam is introduced.
- Three new async test cases are added using `patch("app.gallery_extractor.run_gallery_dl_subprocess")` and `patch.dict(os.environ, ...)` to simulate cookie file presence.

### Three Required Test Cases
1. **Anonymous succeeds → no fallback**: subprocess called once, returns `GalleryResult`. Authenticated path is never reached.
2. **Anonymous fails with Login Wall, authenticated succeeds**: subprocess called twice; second call includes `--cookies`; returns `GalleryResult`.
3. **Anonymous fails, authenticated also fails → `InstagramSessionError` raised**: subprocess called twice; both return login error; `InstagramSessionError` is raised.

### Prior Art
- `backend/tests/test_gallery_extractor.py`: `test_instagram_adapter_login_required_raises_login_required_error` — exact mock pattern to follow.
- `@pytest.mark.anyio` + `patch("app.gallery_extractor.run_gallery_dl_subprocess")` is the established async mock pattern in this codebase.

## Out of Scope

- Instagram Reels session fallback (Reels route through yt-dlp, not gallery-dl).
- Instagram Stories and Highlights (require user-interactive session, outside server-side cookie scope).
- Session refresh or auto-renewal when the cookie expires (operator must replace the cookie file manually).
- Frontend UI changes: the error message for `instagram_session_error` may display as a generic "temporarily unavailable" without a dedicated new error card design.
- Instaloader as a third extraction layer (deferred; only considered if gallery-dl proves insufficient for Instagram specifically).
- Third-party Instagram API services (HikerAPI or equivalent) — rejected due to third-party dependency, cost, rate limits, and privacy concerns.
- Allowing users to supply their own cookies.

## Further Notes

- The dedicated MediaDrop Instagram account should be a separate account created solely for this purpose, not a personal account. Its session must not be used for any other purpose.
- Cookie files expire and may be revoked by Instagram. The `instagram_session: "missing"` health signal only detects a missing file — an expired but present cookie will still report `"ok"`. Operators should monitor for `instagram_session_error` responses in production logs to detect expiry.
- When this phase ships, the `login_required` error code in `main.py` for Instagram URLs will only surface if no `INSTAGRAM_COOKIE_FILE` is configured. Deployments without a cookie file retain the current behavior exactly.
- Domain glossary terms from `CONTEXT.md` — **Login Required**, **Extractor Error**, **Extractor Configuration Error**, **Gallery Item**, **Server Session Cookie**, **Anonymous Extract**, **Authenticated Extract** — must be used consistently in all new code symbols and docstrings.
