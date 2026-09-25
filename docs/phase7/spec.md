# MediaDrop — Phase 7: Real Download Engine

## Problem Statement

ผู้ใช้สามารถวิเคราะห์ (Analyze) และดูข้อมูลจริงของสื่อผ่าน Phase 6 ได้แล้ว แต่ขั้นตอนการดาวน์โหลด (Download $\rightarrow$ Preparing $\rightarrow$ Ready) ยังเป็นเพียง Demo จำลอง (ไม่มีไฟล์จริงให้รับ) ผู้ใช้ไม่สามารถบันทึกหรือนำไฟล์สื่อจริง (วิดีโอ MP4, เสียง MP3, หรือภาพ) ไปใช้งานได้

## Solution

พัฒนาระบบ **Real Download Engine** เต็มรูปแบบที่ Backend สามารถดาวน์โหลด, ดึงสตรีม, แปลงไฟล์ด้วย FFmpeg และส่งไฟล์จริงให้ผู้ใช้ดาวน์โหลดผ่าน Browser ได้อย่างปลอดภัย โดยแบ่งเป็น 6 ส่วนหลัก:

- **7A — Download Foundation**: ระบบ Job คิวเบื้องหลัง (`POST /api/download` $\rightarrow$ `job_id` $\rightarrow$ Polling `GET /api/jobs/{job_id}` $\rightarrow$ `GET /api/files/{file_id}`) โดยไม่เปิดเผย path ไฟล์จริงของเซิร์ฟเวอร์
- **7B — Direct File Download**: สตรีมดาวน์โหลดไฟล์ตรง (Image, Video, Audio) ลงพื้นที่จัดเก็บชั่วคราวโดยไม่แปลงไฟล์ พร้อมตรวจสอบขนาดจริงระหว่างสตรีม
- **7C — Platform Video**: ใช้ `yt-dlp` ดึง Video + Audio streams จากแพลตฟอร์มที่รองรับ และรวมเป็น MP4 ด้วย FFmpeg ตามความละเอียดที่ผู้ใช้ต้องการ (`720p`, `1080p`, `Best`)
- **7D — Platform MP3**: ดึง Audio stream คุณภาพสูงสุดและแปลงเป็น MP3 ด้วย FFmpeg พร้อมตัวเลือก Bitrate (`Best`, `320 kbps`, `192 kbps`, `128 kbps`)
- **7E — Temporary Storage & Lifecycle**: จัดเก็บไฟล์แยกโฟลเดอร์ตาม Job (`storage/jobs/{job_id}/`) พร้อม Background Loop ลบไฟล์ที่หมดอายุ (TTL 30 นาที) อัตโนมัติ
- **7F — Frontend Real Flow**: เปลี่ยน UI จาก Demo จำลองเป็นสถานะจริง (`DOWNLOADING`, `PROCESSING`, `FILE READY`) แสดงความคืบหน้า (Progress bar / MB), ขนาดไฟล์จริง, เวลาหมดอายุ และปุ่มดาวน์โหลดไฟล์จริง

---

## User Stories

1. As a user, I want clicking Download on a direct image URL to download the original image file directly, so that I can save the image to my device.
2. As a user, I want clicking Download on a direct video URL to download the original video file directly without re-encoding, so that download is fast and retains quality.
3. As a user, I want clicking Download on a direct audio URL to download the original audio file directly, so that I get the raw audio file.
4. As a user, I want selecting VIDEO and a quality option (720p, 1080p, Best) on a platform link to produce an MP4 file containing both video and audio, so that I can watch it offline.
5. As a user, I want selecting MP3 and a quality option (Best, 320 kbps, 192 kbps, 128 kbps) on a platform link to convert the audio into an MP3 file, so that I can listen to it on any player.
6. As a user, I want the MP3 options to include "Best", so that I get the highest native quality available without inflating file size artificially.
7. As a user, I want selecting THUMBNAIL on a platform video to download the original cover image, so that I can get the artwork without ambiguity.
8. As a user, I want to see a live status transition (PREPARING $\rightarrow$ DOWNLOADING $\rightarrow$ PROCESSING $\rightarrow$ FILE READY), so that I know what the server is currently doing.
9. As a user, I want to see real-time download progress (percentage or downloaded megabytes), so that I know how much is left.
10. As a user, I want to see the final file size in megabytes on the FILE READY card, so that I know how much disk space it will consume.
11. As a user, I want to be informed of the file expiration time (e.g. "Expires in 30 minutes"), so that I know to download it before it is deleted.
12. As a user, I want clicking "Download File" to trigger a native browser file download with the proper filename, so that the file is saved cleanly.
13. As a user, I want to be able to re-download the file within its expiration window, so that a transient network drop doesn't force me to restart the whole conversion.
14. As a user, I want clicking Clear or New Link during downloading to immediately cancel the job on the server, so that I don't waste server resources on an aborted request.
15. As a user, I want an attempt to download a file larger than 500 MB to fail clearly with "FILE TOO LARGE", so that I understand why the download stopped.
16. As a user, I want network timeouts or platform extraction failures to display "SOMETHING WENT WRONG" with actionable retry, so that I am never left hanging indefinitely.
17. As a user, I want downloads of dangerous or private network IPs (including via DNS or redirects) to be rejected, so that the service cannot be exploited as a proxy.
18. As a developer, I want `GET /api/health` to report whether FFmpeg is available on the system PATH, so that environment configuration issues are immediately visible.
19. As a developer, I want all temporary files cleaned up automatically after their TTL, so that the server disk never fills up with orphaned downloads.
20. As a developer, I want the backend to limit concurrent active downloads to a safe number, so that simultaneous heavy video encodings do not exhaust server memory or CPU.

---

## Implementation Decisions

### 1. Security & Network Boundary
- **DNS Re-resolution & SSRF**:
  - ปิด auto-redirect (`follow_redirects=False`) สำหรับ Direct Download
  - ตรวจสอบ URL syntax และทำการ Resolve DNS ด้วย `socket.getaddrinfo` ก่อนส่ง request ในทุก hop (สูงสุด 5 hops)
  - ตรวจสอบ IP ทุกตัวที่ resolve ได้ผ่าน `_is_private_host()` หากพบ private/loopback IP ให้ปฏิเสธด้วย HTTP 400 ทันที
- **File Size Guard**:
  - กำหนด `MAX_DOWNLOAD_SIZE = 500 * 1024 * 1024` (500 MB)
  - ตรวจสอบ Header `Content-Length` ล่วงหน้าหากมี
  - ตรวจนับจำนวน byte จริงระหว่างการสตรีม (chunk-by-chunk stream reading) หาก byte รวมเกิน 500 MB ให้ตัดการเชื่อมต่อทันที, ลบ partial file ทิ้ง และปรับสถานะ Job เป็น `failed` (`file_too_large`)
- **Timeout Separation**:
  - Connect Timeout: 10 วินาที
  - Read Timeout: 30 วินาที
  - Total Job Timeout: 10 นาที (ป้องกันกระบวนการ FFmpeg/yt-dlp ค้าง)

### 2. Architecture & Job Engine (7A)
- **Job Lifecycle**:
  - `queued` $\rightarrow$ `downloading` $\rightarrow$ `processing` $\rightarrow$ `ready` (หรือ `failed`, `cancelled`, `expired`)
- **Job Endpoints**:
  - `POST /api/download`: รับ `{ "url": str, "format": str, "quality": str }` ตอบกลับ `{ "job_id": str, "status": "queued" }`
  - `GET /api/jobs/{job_id}`: คืนค่าสถานะปัจจุบัน `{ "status": str, "progress": float | null, "downloaded_bytes": int, "total_bytes": int | null, "file_id": str | null, "file_size": int | null, "error": str | null }`
  - `POST /api/jobs/{job_id}/cancel`: ยกเลิกงานที่กำลังรัน, ยกเลิก Task/Subprocess, และลบไฟล์ temp ของ job นั้นทันที
  - `GET /api/files/{file_id}`: สตรีมไฟล์จริงกลับไปให้ Browser ด้วย `FileResponse` พร้อม Header `Content-Disposition: attachment; filename="<filename>"`
- **Concurrency & Storage**:
  - ใช้ `asyncio.Semaphore(MAX_CONCURRENT_JOBS)` (default: 3) เพื่อจำกัดจำนวนงานหนักที่รันพร้อมกัน
  - เก็บสถานะงานเป็นไฟล์ `storage/jobs/{job_id}/metadata.json` เพื่อความทนทานต่อการ restart และลบง่าย

### 3. Direct Download Pipeline (7B)
- สตรีมไฟล์ผ่าน `httpx.stream("GET", ...)` บันทึกลง `storage/jobs/{job_id}/output.<ext>`
- ไม่ทำการ Re-encode หรือแปลงไฟล์ คงไฟล์ต้นฉบับไว้

### 4. Platform Video & MP3 Pipeline (7C, 7D)
- **Video**:
  - ใช้ `yt-dlp` โหมด download พร้อม Format selector:
    - 720p: `bestvideo[height<=720]+bestaudio/best[height<=720]/best`
    - 1080p: `bestvideo[height<=1080]+bestaudio/best[height<=1080]/best`
    - Best: `bestvideo+bestaudio/best`
  - รวม Video และ Audio stream เข้าเป็น MP4 ด้วย FFmpeg (`--merge-output-format mp4`)
- **MP3**:
  - ใช้ `yt-dlp` ดึง Best audio stream และใช้ FFmpeg postprocessor แปลงเป็น MP3 ตาม bitrate ที่เลือก (`320k`, `192k`, `128k`)
  - หากเลือก `Best` ให้แปลงตาม bitrate สูงสุดของ audio stream ต้นทาง
- **FFmpeg Detection**:
  - ตรวจสอบ `shutil.which("ffmpeg")` ในระบบ หากไม่พบ ให้แจ้งเตือนใน `/api/health` และตอบ HTTP 500 พร้อมรหัสข้อผิดพลาด `ffmpeg_missing` เมื่อผู้ใช้เลือก Video/MP3 conversion

### 5. Temporary Storage & Cleanup (7E)
- โครงสร้างโฟลเดอร์:
  ```
  storage/
  └── jobs/
      └── {job_id}/
          ├── metadata.json
          └── {filename}
  ```
- **Storage TTL**: ค่าเริ่มต้น 30 นาที (ปรับได้ผ่าน `STORAGE_TTL_MINUTES`)
- **Auto-cleanup Loop**: `asyncio.create_task` ทำงานทุกๆ 5 นาที ตรวจสอบ `created_at` ในโฟลเดอร์ หากเกิน TTL จะสั่งลบ Directory ของ Job นั้นทิ้งทั้งหมด

### 6. Frontend Flow & UI (7F)
- ResultCard รับตัวเลือก Format:
  - Direct Image: `IMAGE`
  - Platform Video: `VIDEO`, `MP3`, `THUMBNAIL`
  - Audio: `MP3`
- คุณภาพ MP3: เพิ่มตัวเลือก `Best` เป็นค่าเริ่มต้น (`['Best', '320 kbps', '192 kbps', '128 kbps']`)
- การเปลี่ยนสถานะ:
  - กด Download $\rightarrow$ ยิง `POST /api/download` $\rightarrow$ ได้ `job_id`
  - Polling `GET /api/jobs/{job_id}` ทุกๆ 1 วินาที
  - แสดงสถานะตามจริง: `PREPARING` $\rightarrow$ `DOWNLOADING` (มี progress %) $\rightarrow$ `PROCESSING` (กำลัง encode/merge) $\rightarrow$ `FILE READY`
  - เมื่อ `FILE READY`: แสดงชื่อไฟล์, ขนาดไฟล์ (MB), ข้อความ "Expires in 30 minutes", และปุ่ม "Download File" ที่ลิงก์ตรงไปยัง `/api/files/{file_id}`
  - กด "Clear" หรือ "New Link" $\rightarrow$ ยิง `POST /api/jobs/{job_id}/cancel` ทันที

---

## Testing Decisions

- **Backend Seam**:
  - ทดสอบผ่าน HTTP API (`TestClient` / `httpx.AsyncClient`)
  - Test 7A: สร้าง Job, Polling status, ยกเลิก Job, ดาวน์โหลดผ่าน `file_id`
  - Test 7B: Direct file stream download, ทดสอบตัดการทำงานเมื่อเกิน `MAX_DOWNLOAD_SIZE` (mock streaming)
  - Test 7C & 7D: Mock `yt-dlp` download hook และ subprocess calls เพื่อตรวจสอบ parameters ที่ส่งให้ yt-dlp/ffmpeg
  - Test Security: ทดสอบ DNS resolver ป้องกัน private IP และ Redirect hop ที่ชี้เข้า 127.0.0.1
  - Test Cleanup: ทดสอบฟังก์ชัน Auto-cleanup ว่าลบโฟลเดอร์ที่อายุเกิน TTL จริง
- **Frontend Seam**:
  - ทดสอบ Component integration ของ ResultCard และ UrlInput
  - ทดสอบสถานะ Polling จาก `queued` $\rightarrow$ `downloading` $\rightarrow$ `ready`
  - ทดสอบการแสดงผลปุ่ม `THUMBNAIL` เมื่อ media type เป็น platform video
  - ทดสอบปุ่ม Clear ส่งสัญญาณ abort/cancel

---

## Out of Scope

- ระบบสมาชิกหรือประวัติการดาวน์โหลดส่วนบุคคล (Persistence user history)
- การดาวน์โหลดสื่อที่มี DRM หรือต้องใช้ Login/Cookies
- การทำ Distributed Queue ข้ามเซิร์ฟเวอร์ด้วย Redis/Celery (เก็บไว้สำหรับ Public Production Phase)
- การ Resume download ที่ขาดตอนระดับ Byte-range สำหรับ Browser (ใช้ standard file response ก่อน)
- UI Audio/Video Player ในหน้าเว็บสำหรับเปิดฟัง/ดูก่อนโหลด

---

## Further Notes

- การติดตั้ง FFmpeg บน Windows ผู้พัฒนาต้องติดตั้งผ่าน `winget install Gyan.FFmpeg` หรือวาง `ffmpeg.exe` ไว้ใน PATH
- Phase 7 จะทำให้ MediaDrop กลายเป็น Web Application ที่ดาวน์โหลดไฟล์ได้จริงสมบูรณ์ 100% ครบวงจร
