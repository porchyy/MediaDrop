# Phase 5 — Backend Foundation

## Delivery stages

The work is tracked in this document as three stages. No tickets will be created for this solo implementation.

1. **Phase 5A — Backend Skeleton:** start FastAPI independently with `GET /api/health` and `POST /api/analyze`. Analyze validates HTTP(S) URL syntax, does not open the URL, and returns Mock Media JSON. Include the existing `/unsupported`, `/error`, and `/long-title` fixtures so API behavior can be checked directly before connecting the UI.
2. **Phase 5B — Frontend ↔ Backend:** replace the browser-side mock Analyze result with a request to `/api/analyze`. Show the returned title, duration, and Media type in the existing Result Card, and map API errors to the existing error panel. Preserve the Idle → Analyzing → Result flow and the Download demo.
3. **Phase 5C — Error + Cancellation:** handle an offline Server, a 10-second timeout, and canceling in-flight Analyze when the user presses Clear or leaves the page. Keep URL editing locked while Analyzing. Run API checks, frontend tests, build, and manual QA again.

## Agreed scope

- Move the demo Analyze result behind `GET /api/health` and `POST /api/analyze`, using Python and FastAPI.
- Validate HTTP(S) URL syntax on the server. The server does not visit the URL or inspect real media.
- Return simulated media information from the server and keep `DEMO PREVIEW` visible in the UI.
- Preserve the `/unsupported`, `/error`, and `/long-title` demo URLs and their current visible outcomes.
- Include a minimal Dockerfile. Add `schemas/` or `services/` only if implementation needs them.
- Keep Download → Preparing → Demo ready on the frontend; Phase 5 does not provide a file or a download API.
- `POST /api/analyze` returns `title`, `duration` in seconds, and `type`. Generic demo values are `Example Media`, `204`, and `video`; the existing cover placeholder remains in the UI.
- `type` describes the source media. The selected MP3, VIDEO, or IMAGE Format remains a separate choice.
- Invalid URL, unsupported media, and server failure have distinct API error codes and keep their existing UI messages. The reserved `/error` URL simulates a server failure.
- In local development, Vite forwards `/api` requests to a separate FastAPI server on port 8000.
- `ANALYZING` lasts for the actual request. Clear aborts the request so a late response cannot restore an old result. The 1.2-second Download demo remains as it is.
- If the server is unavailable or the request fails, show the existing `SOMETHING WENT WRONG` state. No stale Result Card may appear after Clear or URL changes.
- An Analyze request that has not completed after 10 seconds fails with `SOMETHING WENT WRONG`. Clear and leaving the page abort any pending request. The URL input remains locked while Analyzing.

## Verification before completion

- Check `/api/health`, generic Analyze, each reserved demo URL, and invalid URL handling directly against the server.
- Check the browser flow through Analyze → Result → Format/Quality → Demo ready → New Link, plus Clear during an API request, leaving the page, a stopped server, and a request lasting beyond 10 seconds.
- Run the existing frontend test and build, and one small backend API test.

## Later work

- Deployment routing waits for a deployment target. The spec can choose exact HTTP status codes and JSON error fields without changing the agreed UI behavior.
- Real media inspection, image data, download preparation, and downloadable files remain outside Phase 5.

## Implementation status

Phases 5A–5C were implemented on 2026-09-25. The Frontend and Backend tests, production build, API proxy, and browser demo flow passed. Dockerfile execution remains unchecked because Docker is unavailable on this machine; Phase 4's real-device check is separate and still pending.
