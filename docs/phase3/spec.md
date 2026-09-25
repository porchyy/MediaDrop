# MediaDrop — Phase 3: UI States

## Problem Statement

หน้าเว็บเดโมปัจจุบันแสดง Result Card ทันทีหลัง Analyze และปุ่ม Download ตอบกลับทันที ผู้ใช้จึงยังไม่เห็นช่วงรอ ความผิดพลาด หรือสถานะเตรียมผลลัพธ์ที่เว็บจริงจะต้องมี การกดซ้ำและการยกเลิกงานระหว่างรอยังไม่มีพฤติกรรมที่กำหนดชัดเจน

## Solution

ขยาย flow เดโมในหน้าเดิมให้มีสถานะหลักหกตัว: `idle`, `analyzing`, `result`, `preparing`, `success` และ `error` ช่วงรอใช้เวลาและแถบ pixel แบบจำลอง ข้อผิดพลาดใช้กล่องรูปแบบเดียวกัน Clear ยกเลิกและล้างสถานะทั้งหมดได้ทุกช่วง ส่วน `success` แสดง “DEMO READY” โดยไม่อ้างว่ามีไฟล์จริง

## User Stories

1. As a user, I want to start from an idle page, so that I can enter a new media URL.
2. As a user, I want an empty URL to show an invalid-link error on Analyze, so that I know what is missing.
3. As a user, I want a malformed or non-HTTP(S) URL to show an invalid-link error, so that I know what to correct.
4. As a user, I want a valid URL to enter an analyzing state, so that I can tell the site is working.
5. As a user, I want to see “ANALYZING LINK…” and a pixel activity bar, so that the wait is visible.
6. As a user, I want the Analyze button disabled during analysis, so that I cannot start the same request repeatedly.
7. As a user, I want the URL field locked during analysis, so that the pending result cannot appear to describe a different URL.
8. As a user, I want analysis to end in the existing Result Card, so that I can continue choosing an output.
9. As a user, I want an unsupported demo URL to show “UNSUPPORTED MEDIA”, so that I can inspect that error state.
10. As a user, I want an error demo URL to show “SOMETHING WENT WRONG”, so that I can inspect a general failure state.
11. As a user, I want every error to have a short explanation beneath its title, so that I know whether to correct the link or retry.
12. As a user, I want errors beneath the URL field instead of alongside a Result Card, so that the page gives one clear outcome at a time.
13. As a user, I want editing the URL after an error to clear it, so that I can try again.
14. As a user, I want to choose Format and Quality in the result state, so that I can preview the download path before preparation.
15. As a user, I want Download to enter a preparing state, so that I can see the selected result being prepared.
16. As a user, I want to see “PREPARING FILE…” and a pixel activity bar, so that the preparation wait is visible.
17. As a user, I want to see the chosen Format and Quality during preparation, so that I know what is being prepared.
18. As a user, I want Format, Quality and Download locked during preparation, so that the pending result cannot change underneath the wait.
19. As a user, I want preparation to end with “DEMO READY”, so that I can inspect the completed flow without mistaking it for a real file.
20. As a user, I want the success view to summarize the media title, Format and Quality, so that I can confirm my choices.
21. As a user, I want DOWNLOAD FILE in the success view to explain that no real file exists yet, so that a demo click is honest.
22. As a user, I want NEW LINK to reset the flow, so that I can start another preview.
23. As a user, I want a small Clear control available while a URL or result exists, so that I can reset or cancel at any time.
24. As a user, I want Clear during analysis or preparation to stop the pending transition, so that an old result cannot appear after I reset.
25. As a user, I want Clear to reset the URL, result, Format, Quality, error and download status, so that idle is truly a fresh start.
26. As a keyboard user, I want loading, error and success status announced and controls focusable appropriately, so that I can follow the flow without a pointer.
27. As a user, I want the new states to remain legible in light and dark themes and on narrow screens, so that the flow fits the current page.

## Implementation Decisions

- Use exactly six top-level UI states: `idle`, `analyzing`, `result`, `preparing`, `success`, `error`. Error kind is separate from the top-level state: invalid link, unsupported media or general error.
- Validate on Analyze. Empty, malformed and non-HTTP(S) input enters `error` immediately with “INVALID LINK” and guidance to enter an HTTP or HTTPS URL.
- A valid URL first enters `analyzing`. Show “ANALYZING LINK…” for about 0.8 seconds, then show the existing mock Result Card or a simulated error.
- Reserve documented demo URLs such as `https://example.com/unsupported` and `https://example.com/error` for unsupported and general error outcomes. Other valid URLs retain the fixed Phase 2 mock result. These triggers do not appear as extra controls on the page.
- Download from `result` enters `preparing` for about 1.2 seconds, then enters `success`. The chosen Format and Quality remain visible during the wait and in success.
- Loading bars are indeterminate pixel animations without percentages; simulated time is not presented as real progress. Respect reduced-motion preferences.
- Disable repeat actions while analyzing or preparing. Lock URL editing during both waits; lock Format and Quality during preparation. Keep a small Clear control available throughout.
- Clear cancels pending transitions and resets URL, result, selection, error and download status to `idle`. Editing the URL from `result` or `error` also removes the old outcome.
- `error` uses one compact panel beneath the URL input. Do not show it together with Result Card. A corrected URL may be analyzed again.
- In `success`, show “DEMO READY” and the selected summary. DOWNLOAD FILE only shows a message that the demo has no file; NEW LINK resets to `idle`. Selection controls remain closed in success.
- Preserve the separation between the URL/Analyze controls and Result Card. Keep one owner for the overall flow and let the result view handle its own presentation and choices.
- Keep the existing pixel style, theme behavior and one-page layout. No backend, API call or new state-management dependency is required.

## Testing Decisions

- Test visible transitions and cancellation outcomes rather than internal state variable names, timers or CSS class strings.
- Prefer one user-flow seam covering valid Analyze → Result → select MP3/320 kbps → Preparing → Demo Ready → Clear, plus invalid and mock error outcomes.
- Extend the existing Node test where practical for transition rules and canceled waits; manually check keyboard operation, themes, narrow layout and reduced motion in a browser.
- The current test checks URL validation and the initial mock preview. Browser/E2E test tooling may be considered after Phase 3; do not add a dependency solely for this phase.
- Run the existing test command and production build after implementation.

## Out of Scope

- Backend/API integration, real URL inspection, real preparation, conversion or file downloads.
- Real progress percentages or estimated completion time.
- Simulating download failure; the Phase 3 general error is an Analyze outcome.
- A new page, new homepage sections or a visual redesign.
- Adding browser/E2E test dependencies in this phase.

## Further Notes

- This phase extends the existing Phase 2 mock flow; “DEMO READY” is not a claim that a downloadable file exists.
- The next planned work is Responsive/UX QA, then Backend/API integration. Those phases have separate scopes.
