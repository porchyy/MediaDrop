# MediaDrop — Phase 2: Mock Analyze Flow

## Problem Statement

หน้าเว็บปัจจุบันให้วางลิงก์และกด Analyze ได้ แต่ยังไม่มีผลลัพธ์ให้ดูหรือทางเลือกก่อนดาวน์โหลด ผู้ใช้จึงทดลองขั้นตอนทั้งหมดและตรวจหน้าตาของผลลัพธ์ไม่ได้ โดยยังไม่ต้องเชื่อม API หรือดาวน์โหลดไฟล์จริง

## Solution

เมื่อผู้ใช้กด Analyze ด้วย URL แบบ HTTP(S) ให้แสดง Result Card ใต้ช่อง URL ในหน้าเดิม การ์ดแสดงข้อมูลจำลองและภาพปกตัวอย่าง พร้อมตัวเลือก Format, Quality และปุ่ม Download ที่ตอบสนองด้วยข้อความว่าเป็นเดโม ผู้ใช้เปลี่ยนตัวเลือกและล้างผลเพื่อเริ่มใหม่ได้ ทุกส่วนใช้สไตล์ pixel, สี และไอคอนของเว็บเดิม

## User Stories

1. As a user, I want to paste a media URL, so that I can start the preview flow.
2. As a user, I want to analyze a valid HTTP(S) URL, so that I can see a result without leaving the page.
3. As a user, I want an empty URL to show a clear error, so that I know what to enter.
4. As a user, I want a malformed or non-HTTP(S) URL to show a clear error, so that I know why no result appeared.
5. As a user, I want the result below the URL input, so that I can follow the flow in one place.
6. As a user, I want to see a “Demo preview” label, so that I know the data was not read from my URL.
7. As a user, I want to see a thumbnail placeholder, so that I can judge the intended preview layout.
8. As a user, I want to see the media title, duration and type, so that I can judge the intended identification step.
9. As a user, I want to choose MP3, VIDEO or IMAGE, so that I can try each output path.
10. As a user, I want the selected Format to look distinct, so that I know which path is active.
11. As a user, I want MP3 to offer 128, 192 and 320 kbps, so that I can try audio quality selection.
12. As a user, I want VIDEO to offer 720p, 1080p and Best, so that I can try video quality selection.
13. As a user, I want IMAGE to offer JPG, PNG and Original, so that I can try cover image selection.
14. As a user, I want the Quality heading and choices to change with Format, so that the controls match my selection.
15. As a user, I want the selected Quality to look distinct, so that I know what I chose.
16. As a user, I want an initial VIDEO and Best selection, so that the result is immediately usable as a demo.
17. As a user, I want a sensible quality selected when I switch Format, so that I never have a stale option from another Format.
18. As a user, I want a prominent Download button, so that I can complete the visual flow.
19. As a user, I want Download to say that downloads are unavailable in the demo, so that I do not mistake a mock interaction for a saved file.
20. As a user, I want changing the URL to hide the old result, so that it cannot appear to describe a different link.
21. As a user, I want Clear to remove the URL and result, so that I can start again.
22. As a keyboard user, I want to reach and operate the input, selectors and buttons, so that I can try the full flow without a pointer.
23. As a user, I want the result to stay readable in light, dark and narrow layouts, so that it fits the existing site.

## Implementation Decisions

- Keep one page and place Result Card directly after the Analyze control, before the existing Media Formats section.
- Analyze accepts only a nonempty, syntactically valid HTTP(S) URL. Invalid input shows an inline error and does not create a result.
- Every valid URL produces the same fixed mock metadata: “Example Media”, duration “03:24”, type “Video”. The URL is not fetched or inspected.
- Use a CSS-drawn thumbnail placeholder with an existing icon; do not depend on an external image. Show a visible “Demo preview” label.
- Format means the selected output path. IMAGE means the mock cover image, not a video frame or a standalone image found at the URL. Keep the IMAGE label and explain “cover image” near that choice.
- Initial selection is VIDEO + Best. MP3 offers 128 / 192 / 320 kbps with 192 selected on entry; VIDEO offers 720p / 1080p / Best with Best selected; IMAGE offers JPG / PNG / Original with Original selected. Switching Format selects that Format's default Quality.
- Selected Format and Quality use visible border/background treatment and accessible selected state. Keep controls operable by keyboard and preserve visible focus.
- Download does not produce a file. Clicking it shows “Demo only — downloads are not available yet” within the result area.
- Editing the URL hides the old result and its download message. Clear empties the URL and removes the result. A new Analyze starts from the initial VIDEO + Best selection.
- Reuse the existing React page, components, CSS variables, Lucide icons and pixel styling. No server, API contract, download engine or new state library is needed.

## Testing Decisions

- Test the user-visible flow rather than component names, CSS class strings or internal state.
- Prefer one page-level interaction seam covering valid/invalid Analyze, result placement and mock label, Format/Quality changes, Download feedback, URL editing and Clear.
- Check light/dark appearance, narrow layout and keyboard operation in a browser. Run the existing production build as a basic compilation check.
- The project currently has no test runner or similar automated tests. Add the smallest practical user-flow check during implementation; avoid separate tests for each selector or styling detail.

## Out of Scope

- Fetching metadata, checking whether a URL is actually supported, or displaying URL-specific media.
- Backend/API integration, yt-dlp, conversion, file downloads and saved files.
- Real thumbnails, video frame extraction and separate image-source handling.
- Progress tracking, download history, authentication and new pages.
- Additional homepage sections or major visual redesign.

## Further Notes

- This Phase 2 plan supersedes the older Phase 1 note that Phase 2 would immediately connect Analyze to a backend.
- “Result Card” means the visible mock media summary and its selection controls. “Format” is the output path; “Quality” is the option list for the active Format. “Demo preview” identifies data that did not come from the entered URL.
- The specification is ready for implementation, subject to the chosen page-level test seam.
