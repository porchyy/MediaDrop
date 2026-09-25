# MediaDrop — Phase 6: Real Media Analyzer

## Problem Statement

ผู้ใช้สามารถ Analyze URL ได้แล้ว แต่ข้อมูลที่แสดงใน Result Card ยังเป็น Demo preview ที่ Backend สร้างขึ้นเอง ไม่ได้อ่านจาก URL ที่ผู้ใช้ส่งมาจริง ผู้ใช้จึงไม่สามารถรู้ได้ว่าสื่อที่ลิงก์ไปคืออะไร และ Result Card ไม่สะท้อนความเป็นจริงของ URL นั้นเลย

## Solution

เปลี่ยน `POST /api/analyze` จากที่ส่งข้อมูลจำลองให้อ่าน metadata จาก URL จริง โดยแบ่งเป็น 3 ขั้น:

- **6A — Direct Media Analyzer**: อ่าน `Content-Type` จาก HTTP HEAD request สำหรับ URL ที่ชี้ตรงไปที่ไฟล์สื่อ (`.jpg`, `.mp4`, `.mp3` ฯลฯ)
- **6B — Platform Analyzer**: ใช้ yt-dlp อ่าน metadata จากแพลตฟอร์มสื่อที่รองรับโดยไม่ดาวน์โหลดไฟล์
- **6C — Normalize Result**: บังคับให้ทุก analyzer แปลงผลลัพธ์เป็น `MediaInfo` format กลางก่อนส่งกลับ Frontend

Frontend แสดงข้อมูลจริงใน Result Card แทน Demo preview โดยยังไม่มีการดาวน์โหลดไฟล์จริงใน Phase นี้

## User Stories

1. As a user, I want to paste a direct image URL (e.g. ending in `.jpg`) and see its real Media type in the Result Card, so that I know the link points to an image.
2. As a user, I want to paste a direct video URL (e.g. ending in `.mp4`) and see its real Media type, so that I know the link points to a video.
3. As a user, I want to paste a direct audio URL (e.g. ending in `.mp3`) and see its real Media type, so that I know the link points to audio.
4. As a user, I want a direct image URL to show the image itself as a thumbnail in the Result Card, so that I can visually confirm the link target.
5. As a user, I want a direct video or audio URL to show no thumbnail (displayed as `--`), so that the absence of a preview is clear rather than broken.
6. As a user, I want the Result Card to show `--:--` when duration is unavailable, so that the layout does not break and I understand no duration was found.
7. As a user, I want to paste a supported platform URL (e.g. YouTube) and see a real title from that page, so that I can confirm the analyzer found the right media.
8. As a user, I want to paste a supported platform URL and see a real thumbnail from the platform, so that I can visually identify the media.
9. As a user, I want to paste a supported platform URL and see the duration in minutes and seconds, so that I know how long the media is.
10. As a user, I want the Available Formats shown in the Result Card to reflect what the analyzer found, so that I only see Format options that make sense for that media.
11. As a user, I want an unsupported URL (a webpage yt-dlp does not know) to show UNSUPPORTED MEDIA, so that I understand the link cannot be analyzed.
12. As a user, I want a private IP or localhost URL to be rejected with INVALID LINK, so that the service does not make internal network requests on my behalf.
13. As a user, I want a URL that times out to show SOMETHING WENT WRONG, so that I am not left waiting indefinitely.
14. As a user, I want a URL whose server is unreachable to show SOMETHING WENT WRONG, so that network failures are clearly surfaced.
15. As a user, I want the Analyze button disabled while analysis is running, so that I cannot start duplicate requests.
16. As a user, I want Clear during Analyzing to cancel the request and return to idle, so that a slow response from the analyzer cannot restore a stale Result Card.
17. As a user, I want editing the URL after a Result Card to remove that old result, so that stale metadata cannot appear to describe a new link.
18. As a user, I want the Media type in the Result Card to remain independent of the Format I select, so that choosing MP3 does not change what the source media says.
19. As a user, I want Download to still lead to Preparing and Demo ready as before, so that the demo flow continues to work end-to-end.
20. As a user, I want errors displayed near the URL input, so that I can see what went wrong without searching the page.
21. As a keyboard user, I want all existing Analyze, Format, Quality, Clear, and New Link controls to remain operable, so that the real analyzer does not break keyboard navigation.
22. As a developer, I want `GET /api/health` to still respond with `{"status": "ok"}`, so that I can verify the Backend is running before testing.
23. As a developer, I want HEAD and yt-dlp timeouts configurable via environment variables, so that I can tune them for different environments without changing code.
24. As a developer, I want the analyzer selection logic (6A vs 6B) to be transparent in the Backend logs, so that I can debug which path was taken for a given URL.

## Implementation Decisions

### URL Safety Check (ก่อน analyzer ทุกตัว)

- Backend ตรวจ URL ด้วย 2 ชั้น: (1) syntax — HTTP/HTTPS + hostname เหมือน Phase 5 → HTTP 400 ถ้าผ่านไม่ได้; (2) SSRF blocklist — บล็อค private IP ranges (`127.x`, `10.x`, `172.16–31.x`, `192.168.x`) และ `localhost`, `::1` → HTTP 400 ถ้าตรงกัน ทำ blocklist ด้วย CIDR check หรือ regex ไม่ต้อง resolve DNS
- Frontend validation (client-side) ยังคงอยู่ตามเดิม; Server validation เป็น trust boundary ของตัวเอง

### Analyzer Selection (6A vs 6B)

- Backend ส่ง HTTP `HEAD` request ไปยัง URL ก่อนเสมอ
  - ถ้า `Content-Type` เป็น `image/*`, `video/*`, `audio/*` → ใช้ Direct Media Analyzer (6A)
  - ถ้า `Content-Type` เป็น `text/html` หรือ HEAD ล้มเหลว/ไม่ตอบ → ใช้ Platform Analyzer (6B)
- ไม่มี allowlist ของ hostname; ใช้ Content-Type เป็นตัวตัดสิน

### 6A — Direct Media Analyzer

- ส่ง `HEAD` request ไปยัง URL; อ่าน `Content-Type` และ `Content-Length`
- Fallback: ถ้า server ไม่รับ HEAD หรือ redirect ให้ดู file extension ใน URL แทน
- `title`: ใช้ path สุดท้ายของ URL (เช่น `photo.jpg`)
- `duration`: ส่ง `null` เสมอ; 6A ไม่ดาวน์โหลดไฟล์เพื่ออ่าน media header
- `thumbnail`: ถ้า Media type เป็น `image` ให้ใช้ URL ต้นทางเป็น thumbnail; ถ้าเป็น `video` หรือ `audio` ส่ง `null`
- `available_formats`: hardcode ตาม Media type — `image` → `["image"]`; `video` → `["video", "audio"]`; `audio` → `["audio"]`

### 6B — Platform Analyzer

- ใช้ yt-dlp Python API (`from yt_dlp import YoutubeDL`) ด้วย option `extract_flat=True` หรือเทียบเท่า เพื่ออ่านเฉพาะ metadata โดยไม่ดาวน์โหลดไฟล์
- รองรับเฉพาะ public URL ที่ yt-dlp ดึงได้โดยไม่ต้อง authentication
- ถ้า yt-dlp ไม่รองรับ URL → HTTP 422 `UNSUPPORTED MEDIA`
- `available_formats`: hardcode ตาม Media type ที่ yt-dlp ให้มา (เช่น video → `["video","audio"]`)
- Route handler ประกาศเป็น `def` (ไม่ใช่ `async def`) เพื่อให้ FastAPI รัน yt-dlp ใน thread pool อัตโนมัติ
- ติดตั้ง yt-dlp ผ่าน `requirements.txt` เป็น Python package

### 6C — MediaInfo (Normalized Result)

- ทุก analyzer (6A, 6B) ต้อง return `MediaInfo` Pydantic model ก่อนที่ route handler จะส่งกลับ Frontend
- `MediaInfo` มี fields ดังนี้:

  ```
  MediaInfo
  ├── title: str
  ├── media_type: str          # "video" | "audio" | "image"
  ├── thumbnail: str | None
  ├── duration: int | None     # วินาที; null ถ้าไม่ทราบ
  ├── source: str              # "direct" | "platform"
  └── available_formats: list[str]  # subset of ["video","audio","image"]
  ```

- Fields ที่หาไม่ได้ส่งเป็น `null` (ไม่ omit ออก) เพื่อให้ Frontend แยกแยะ "รู้ว่าไม่รู้" จาก "ไม่มี field"
- `ResultCard` ไม่รู้และไม่ควรรู้ว่า `source` มาจาก analyzer ไหน

### API Contract

- `POST /api/analyze` response HTTP 200:
  ```json
  {
    "title": "...",
    "media_type": "video",
    "thumbnail": "https://..." ,
    "duration": 204,
    "source": "platform",
    "available_formats": ["video", "audio"]
  }
  ```
- Error responses ยังใช้ scheme เดิม: HTTP 400 invalid URL, HTTP 422 unsupported, HTTP 500 server/timeout error
- Timeout: HEAD request = 5 วินาที, yt-dlp = 15 วินาที; override ได้ผ่าน env variable (`REQUEST_TIMEOUT`, `YTDLP_TIMEOUT`)
- Timeout และ network failure → HTTP 500 → Frontend แสดง SOMETHING WENT WRONG

### Frontend Changes

- `ResultCard` รับ prop `mediaType` (จาก `media_type`) และ `thumbnail` เพิ่มเติม
- `duration` ที่เป็น `null` → แสดง `--:--`; ถ้ามีค่า → format เป็น `mm:ss` ตามเดิม
- `thumbnail` ที่ไม่เป็น `null` → แสดงเป็น `<img>` แทน cover placeholder
- ลบ `mockErrorForUrl` และ `mockTitleForUrl` ออกจาก `UrlInput.jsx`; ย้าย URL validation helpers ไปไฟล์แยก
- DEMO PREVIEW badge ยังคงแสดงอยู่ (ยังไม่มีการดาวน์โหลดจริง)

## Testing Decisions

- ทดสอบเฉพาะ external behavior ผ่าน HTTP (Backend) และ page flow (Frontend) ไม่ทดสอบชื่อ function ภายใน, class hierarchy, หรือ implementation detail ของ yt-dlp
- **Backend seam**: HTTP-level test ด้วย FastAPI TestClient ครอบคลุม:
  - 6A: direct image, video, audio URL → ตรวจ `media_type`, `available_formats`, `thumbnail`, `duration`
  - 6B: platform URL → ตรวจ `title`, `thumbnail`, `duration` ที่ได้จริง (อาจใช้ mock yt-dlp ใน test)
  - Safety: private IP → HTTP 400; localhost → HTTP 400
  - Unsupported URL → HTTP 422; timeout → HTTP 500; health → HTTP 200
- **Frontend seam**: `test/demo-flow.test.mjs` ที่มีอยู่ ปรับให้ `ResultCard` รับ `mediaType`, `thumbnail`, `duration` จาก props แทน hardcode; ตรวจว่า `--:--` แสดงเมื่อ `duration=null`
- ลบ assertions ที่ยืนยัน `03:24 · VIDEO` hardcode ออก แทนด้วย assertion จาก server-provided data
- Prior art: `backend/tests/test_analyze.py` (HTTP-level), `test/demo-flow.test.mjs` (SSR component test)

## Out of Scope

- การดาวน์โหลดไฟล์จริง, file conversion, download endpoint
- รองรับ URL ที่ต้องการ authentication หรือ cookies
- Arbitrary webpage scraping (เช่น อ่าน `<og:title>` จากเว็บทั่วไป)
- Rate limiting, caching, persistence, หรือ database
- Deployment configuration หรือ production hosting
- Format หรือ Quality options ใหม่นอกจาก MP3/VIDEO/IMAGE ที่มีอยู่แล้ว
- การ resolve DNS เพื่อตรวจ SSRF (ใช้ CIDR/regex check เท่านั้น)
- Phase 4 real-device QA checklist

## Further Notes

- ชื่อ field `available_formats` แทนที่คำว่า `formats` ในการออกแบบเบื้องต้น เพื่อไม่ให้ขัดกับคำว่า **Format** ใน `CONTEXT.md` ที่หมายถึง output format ที่ผู้ใช้เลือก
- `source` field ใน `MediaInfo` ใช้สำหรับ debugging ภายใน developer ไม่แสดงใน UI
- yt-dlp version ควร pin ใน `requirements.txt` เพื่อหลีกเลี่ยงการเปลี่ยนแปลงที่ไม่คาดคิด
- Phase 6 ยังไม่เปลี่ยน flow ของ Download → Preparing → Demo ready; phase ถัดไปค่อยพิจารณา
