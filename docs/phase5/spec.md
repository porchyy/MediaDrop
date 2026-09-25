# MediaDrop — Phase 5: Backend Foundation

## Problem Statement

ผู้ใช้ทดลอง Analyze ได้แล้ว แต่ข้อมูล Demo preview ยังสร้างในหน้าเว็บทั้งหมด จึงยังพิสูจน์ไม่ได้ว่าหน้าเว็บรับผลจาก HTTP API, รอ request, จัดการข้อผิดพลาดจาก Server และยกเลิกผลที่ไม่ต้องการได้จริง ก่อนจะต่อบริการสื่อในอนาคต จำเป็นต้องมี Backend พื้นฐานที่ส่งข้อมูลจำลองผ่าน API โดยไม่ทำให้ flow เดิมเปลี่ยนไป

## Solution

เพิ่ม Backend ด้วย Python และ FastAPI ให้หน้าเว็บเรียก `POST /api/analyze` หลังตรวจ URL เบื้องต้น Backend ตรวจว่าเป็น HTTP(S) URL ที่มี hostname แล้วส่ง Demo preview เป็น JSON โดยไม่เปิด URL หรืออ่านข้อมูลสื่อจริง หน้าเว็บแสดงข้อมูลที่ได้รับใน Result Card และใช้สถานะ Analyzing ระหว่างรอ request จริง `GET /api/health` ใช้ตรวจว่า Server ทำงานอยู่ ส่วน Download → Preparing → Demo ready ยังคงเป็นเดโมในหน้าเว็บ

## User Stories

1. As a user, I want to enter a media URL on the existing page, so that I can start the familiar Analyze flow.
2. As a user, I want an empty URL to show INVALID LINK beside the input, so that I know what to enter.
3. As a user, I want malformed and non-HTTP(S) URLs to show INVALID LINK, so that I can correct them before retrying.
4. As a user, I want Analyze to show ANALYZING LINK while the request is pending, so that I know the page is working.
5. As a user, I want Analyze disabled while a request is pending, so that repeated clicks do not start duplicate requests.
6. As a user, I want a valid URL to produce a Result Card from the Server response, so that the page demonstrates a real Frontend–Backend connection.
7. As a user, I want the Result Card to show a media title, duration, and Media type, so that I can inspect the Demo preview.
8. As a user, I want the duration shown as minutes and seconds, so that the Server's numeric duration is easy to read.
9. As a user, I want the Result Card to keep the existing cover placeholder, so that the absence of a real thumbnail is clear.
10. As a user, I want DEMO PREVIEW visible, so that simulated data is not mistaken for real media analysis.
11. As a user, I want the selected Format to remain distinct from Media type, so that choosing MP3 or IMAGE does not mislabel the source media.
12. As a user, I want to choose MP3, VIDEO, or IMAGE and their Quality options as before, so that the existing demo flow remains usable.
13. As a user, I want Download to lead to Preparing and Demo ready as before, so that I can continue testing the full demo flow.
14. As a user, I want Download File to state that no real file exists, so that I do not expect a download in this phase.
15. As a user, I want the unsupported demo URL to show UNSUPPORTED MEDIA, so that I can inspect that error state.
16. As a user, I want the error demo URL to show SOMETHING WENT WRONG, so that I can inspect a Server failure state.
17. As a user, I want a stopped or unreachable Server to show SOMETHING WENT WRONG, so that a network failure does not leave the page loading forever.
18. As a user, I want errors near the URL input, so that I can see what happened without searching the page.
19. As a user, I want Clear during Analyzing to cancel the request and return to idle, so that a late response cannot restore an old Result Card.
20. As a user, I want Clear during Preparing to reset the demo, so that I can start again without waiting.
21. As a user, I want editing the URL after a Result Card to remove that old result, so that it cannot appear to describe a different link.
22. As a user, I want the long-title demo URL to return a long title from the Server, so that mobile wrapping remains testable.
23. As a keyboard user, I want the existing Analyze, Format, Quality, Clear, and New Link controls to remain operable, so that the API integration does not break keyboard use.
24. As a developer, I want a health response and repeatable demo responses, so that I can check the Backend and Frontend integration locally.
25. As a developer, I want clear commands to run the Frontend and Backend, so that I can reproduce the demo without guessing configuration.
26. As a user, I want a request that takes longer than 10 seconds to end with an understandable error, so that I am not left waiting indefinitely.
27. As a user, I want a pending Analyze request canceled when I leave the page, so that its response cannot update an abandoned view.

## Implementation Decisions

- Keep the one-page layout, Result Card, Format and Quality selectors, existing six UI states, pixel styling, themes, and accessibility behavior.
- Use Python with FastAPI for the Backend. Provide a minimal Dockerfile. Create separate schema or service modules only where they make the implemented behavior clearer.
- `GET /api/health` returns HTTP 200 with `{ "status": "ok" }`.
- `POST /api/analyze` accepts JSON containing a `url` string. A normal valid URL returns HTTP 200 with `title`, `duration` in whole seconds, and `type`. The generic Demo preview is `Example Media`, `204`, and `video`.
- Media type describes the source media and is independent of the user's selected output Format. The generic preview remains VIDEO even when MP3 or IMAGE is selected.
- The Server trims and validates the URL as HTTP(S) with a hostname. It does not fetch the URL, resolve its host, download data, or inspect media. The Frontend keeps its immediate validation; the Server validates its own trust boundary.
- Preserve the exact demo URLs `https://example.com/unsupported`, `https://example.com/error`, and `https://example.com/long-title`. The first returns an unsupported-media error, the second simulates a Server error, and the third returns a deliberately long title. All other valid URLs use the generic response.
- Use a small, consistent JSON error contract with a machine-readable code. Use HTTP 400 for invalid URL, HTTP 422 for the unsupported demo case, and HTTP 500 for the error demo case. Missing or malformed request data also produces an error response; the Frontend maps it to the existing error panel.
- The Frontend calls the API through a small Analyze function. Vite forwards `/api` requests to the separate FastAPI Server on port 8000 during local development. Deployment routing is deferred until a deployment target is selected.
- Replace only the mock Analyze timer with the real request. Analyzing lasts while the request is pending, with no artificial minimum delay. Disable duplicate Analyze requests.
- Clear or leaving the page aborts an in-flight Analyze request and prevents a late response from changing the new state. Keep URL editing locked while Analyzing. A network failure, unexpected Server failure, or request that exceeds 10 seconds maps to SOMETHING WENT WRONG. The user may retry after correcting or re-entering the URL.
- Result Card renders `title`, formatted `duration`, and Media type from the response. Keep the existing cover placeholder and DEMO PREVIEW label; the response does not contain a real thumbnail.
- Keep Download preparation and Demo ready entirely on the Frontend with the current simulated wait. Do not add a download API or claim that a file exists.
- Document separate local start commands for Backend and Frontend. Keep virtual environments and generated Python files out of version control.

## Testing Decisions

- Test externally visible HTTP responses and page behavior rather than internal helper names, timeout values, component state variables, or file layout.
- The primary Backend seam is HTTP-level testing of health, a generic valid Analyze response, invalid URL, and the three reserved demo URLs. Check status codes and JSON fields.
- The primary Frontend seam is the existing page flow: valid URL → Analyzing → Result Card → Format and Quality → Preparing → Demo ready → New Link. Check that title, duration, and Media type come from the API response.
- Check Clear during a pending Analyze request, leaving the page, a late response after Clear, editing a URL after Result, a stopped Backend, and a request lasting beyond 10 seconds. Ensure no stale Result Card appears and errors remain actionable.
- Reuse the existing Node test for URL validation and Result Card rendering as prior art; adapt it to Server-provided metadata. Add one small Backend API behavior test. Do not add browser automation dependencies solely for this phase.
- Run the Frontend test and production build. Manually check the integrated browser flow, keyboard controls, and a narrow viewport after the API integration.

## Out of Scope

- Fetching or inspecting real media URLs, scraping sites, resolving arbitrary hosts, or extracting metadata from external services.
- Real thumbnails, real conversion, file preparation, downloadable files, and a download endpoint.
- New Format or Quality options, major layout changes, and new pages.
- Deployment configuration, production hosting, authentication, persistence, rate limiting, or a database.
- Completing the separate Phase 4 real-device QA checklist as part of Phase 5.

## Further Notes

- Track the work in this document rather than creating tickets: Phase 5A builds and directly checks the Backend API, including URL validation and the existing demo fixtures; Phase 5B connects the Frontend and preserves the current visible success and error flow; Phase 5C hardens offline, timeout, and cancellation behavior, then repeats QA.
- Phase 4 browser QA passed, but its real-device verification remains pending independently.
- Demo URLs are test fixtures and should not be presented as real support for those links.
