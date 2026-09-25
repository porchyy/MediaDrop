# MediaDrop

หน้าเว็บตัวอย่างสำหรับวางลิงก์สื่อ สร้างด้วย React, Vite และ Tailwind CSS ปุ่ม Analyze เรียก FastAPI แล้วรับข้อมูลสื่อจำลองจาก Server; Backend ไม่เปิดลิงก์จริง ส่วน Download ยังเป็นเดโมและไม่มีไฟล์ให้ดาวน์โหลด

## เริ่มใช้งาน

เปิดสอง terminal จากโฟลเดอร์โปรเจกต์ โดยเริ่ม Backend ก่อน:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

เปิด Frontend ในอีก terminal:

```powershell
npm install
npm run dev
```

เปิด `http://127.0.0.1:5173/` และตรวจ Backend ที่ `http://127.0.0.1:8000/api/health` ระหว่างพัฒนา Vite ส่ง `/api` ไปยัง Backend บนพอร์ต 8000; `npm run preview` ใช้ proxy เดียวกัน

ตรวจการทำงานด้วย `npm test` และ `cd backend; .\.venv\Scripts\python.exe -m unittest discover -s tests` สร้างไฟล์เผยแพร่ด้วย `npm run build`

## ทดลองสถานะเดโม

- URL HTTP(S) ทั่วไป → Backend ส่ง Demo preview แล้วแสดง Result Card
- `https://example.com/unsupported` → UNSUPPORTED MEDIA
- `https://example.com/error` → SOMETHING WENT WRONG

- `https://example.com/long-title` → ชื่อสื่อจำลองแบบยาวสำหรับตรวจหน้าเว็บบนมือถือ
- กด Download จาก Result Card → PREPARING FILE → DEMO READY; ปุ่ม Download File จะแจ้งว่ายังไม่มีไฟล์จริง
- กด Clear ระหว่างรอเพื่อยกเลิกและเริ่มใหม่; ถ้า Backend ไม่ตอบภายใน 10 วินาที จะแสดงข้อผิดพลาด

## โครงสร้าง

- `src/` — หน้าเว็บ, คอมโพเนนต์ และ CSS
- `backend/` — FastAPI, การทดสอบ API และ Dockerfile
- `CONTEXT.md` — คำศัพท์ที่ใช้ในโปรเจกต์
- `docs/phase1/spec.md` — ข้อกำหนด Phase 1
- `docs/phase1/issues/` — รายการงานย่อยของ Phase 1 (เอกสารแผนเดิม)
- `docs/phase2/spec.md` — ข้อกำหนด flow จำลองของ Phase 2
- `docs/phase3/spec.md` — ข้อกำหนด UI States ของ Phase 3
- `docs/phase4/spec.md` — ข้อกำหนด Responsive/UX QA ของ Phase 4
- `docs/phase4/qa.md` — ผลตรวจ Phase 4 และขั้นตรวจบนมือถือจริง
- `docs/phase5/plan.md` และ `docs/phase5/spec.md` — แผนและข้อกำหนด Backend Foundation
- `dist/` — ไฟล์ที่สร้างจาก `npm run build`
- `node_modules/` — dependencies ที่ติดตั้งในเครื่อง

ไฟล์ `dist/`, `node_modules/`, `backend/.venv/` และ Python cache สร้างใหม่ได้ จึงไม่ควรเก็บใน version control
