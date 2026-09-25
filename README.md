# MediaDrop

MediaDrop — เว็บแอปพลิเคชันสำหรับวิเคราะห์ลิงก์สื่อและดาวน์โหลดไฟล์จริง (วิดีโอ MP4, เสียง MP3, ภาพต้นฉบับ และภาพปก Thumbnail) สร้างด้วย **React + Vite + Tailwind CSS** ทางฝั่งหน้าบ้าน และ **FastAPI + yt-dlp + FFmpeg** ทางฝั่งหลังบ้าน

## ฟีเจอร์หลัก (Phase 6 & Phase 7)

- **Real Media Analyzer**: วิเคราะห์ข้อมูลสื่อจริงจากลิงก์ (ชื่อสื่อ, ปก Thumbnail, ความยาว และตัวเลือก Format ที่รองรับ)
  - **Direct Media (6A)**: อ่าน Header Content-Type จากไฟล์ตรง (`.jpg`, `.mp4`, `.mp3` ฯลฯ)
  - **Platform Media (6B)**: อ่าน Metadata ของวิดีโอบนแพลตฟอร์มผ่าน `yt-dlp`
  - **Normalized Result (6C)**: แปลงข้อมูลเข้าสู่ `MediaInfo` รูปแบบกลาง
- **Real Download Engine**: ระบบประมวลผลและดาวน์โหลดไฟล์จริง
  - **Job Queue & Polling**: สร้าง Job เบื้องหลัง พร้อมรายงานความคืบหน้า (Progress %, MB)
  - **Direct File Streaming**: สตรีมไฟล์ตรงลงเครื่องผู้ใช้ทันที
  - **Platform Video**: ดึง Video + Audio stream และผสานเป็น MP4 ด้วย FFmpeg ตามความละเอียดที่เลือก (`720p`, `1080p`, `Best`)
  - **Platform MP3**: ดึงเสียงคุณภาพสูงแปลงเป็น MP3 ด้วย FFmpeg (`Best`, `320 kbps`, `192 kbps`, `128 kbps`)
  - **Thumbnail Download**: ดาวน์โหลดภาพปกของวิดีโอต้นฉบับ
- **ความปลอดภัยระดับสูง**:
  - ตรวจสอบ URL Syntax และป้องกัน SSRF โดยการ Resolve DNS ในทุก Redirect hop (บล็อก Private IP, localhost, ::1)
  - ป้องกันดิสก์เต็มด้วยการนับไบต์สตรีมจริง จำกัดขนาดไฟล์สูงสุด 500 MB (`MAX_DOWNLOAD_SIZE`)
  - ระบบ Auto-cleanup ลบไฟล์ชั่วคราวที่หมดอายุ (TTL 30 นาที) อัตโนมัติ

---

## ข้อกำหนดของระบบ (Prerequisites)

- **Node.js** (v18+)
- **Python** (3.11+)
- **FFmpeg** ติดตั้งใน System PATH (สำหรับแปลงไฟล์ MP3 และรวมวิดีโอ MP4)

---

## วิธีเริ่มใช้งาน (Local Development)

### 1. รัน Backend (FastAPI)
เปิด Terminal ที่ 1:
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
ตรวจสอบสถานะ API ได้ที่ `http://127.0.0.1:8000/api/health`

### 2. รัน Frontend (React + Vite)
เปิด Terminal ที่ 2:
```powershell
npm install
npm run dev
```
เปิดบราวเซอร์ที่ `http://127.0.0.1:5173/` (Vite จะ Proxy `/api` ไปยัง Backend พอร์ต 8000 อัตโนมัติ)

---

## การทดสอบระบบ (Automated Tests)

- **ทดสอบ Frontend**:
  ```powershell
  npm test
  ```
- **ทดสอบ Backend**:
  ```powershell
  cd backend
  .\.venv\Scripts\python -m pytest tests -v
  ```
- **สร้าง Production Build**:
  ```powershell
  npm run build
  ```

---

## โครงสร้างโปรเจกต์

```
MediaDrop/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI routes & entry point
│   │   ├── downloader.py    # Direct stream & yt-dlp/ffmpeg pipeline
│   │   ├── jobs.py          # JobManager & local metadata store
│   │   └── security.py      # SSRF & DNS resolution security guards
│   ├── tests/               # Backend test suites (33 unit tests)
│   ├── Dockerfile
│   └── requirements.txt
├── src/
│   ├── api/                 # Frontend fetch clients (analyze & download)
│   ├── components/          # UI Components (UrlInput, ResultCard, etc.)
│   └── App.jsx
├── docs/                    # Specs & Architecture decisions (Phase 1 - 7)
├── CONTEXT.md               # คำศัพท์เฉพาะใน Domain Model
└── package.json
```
