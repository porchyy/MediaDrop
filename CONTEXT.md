# MediaDrop

MediaDrop นำผู้ใช้จากลิงก์สื่อไปสู่การเลือกผลลัพธ์ที่ต้องการ ในช่วงเดโม ข้อมูลที่แสดงเป็นข้อมูลจำลองและไม่มีไฟล์ให้ดาวน์โหลดจริง

## Language

**Result Card**:
กล่องสรุปสื่อหลัง Analyze พร้อมตัวเลือกผลลัพธ์

**Format**:
ประเภทผลลัพธ์ที่ผู้ใช้เลือก ได้แก่ MP3, VIDEO และ IMAGE โดย IMAGE ในเดโมหมายถึงภาพปกตัวอย่าง

**Media type**:
ชนิดของสื่อต้นทางที่แสดงใน Result Card เช่น VIDEO ไม่ใช่ Format ที่ผู้ใช้เลือกสำหรับผลลัพธ์

**Quality**:
ตัวเลือกย่อยของ Format ที่เลือก เช่น bitrate ของ MP3, ความละเอียดของ VIDEO หรือชนิดไฟล์ภาพของ IMAGE

**Demo preview**:
ข้อมูลสื่อจำลองที่ไม่ได้อ่านจาก URL ที่ผู้ใช้กรอก

**Demo ready**:
(เดิม) ผลจำลองที่ผ่านขั้นเตรียมแล้ว แต่ยังไม่มีไฟล์จริงให้รับ ใน Phase 7 ถูกแทนที่ด้วย **File ready**

**File ready**:
สถานะที่ไฟล์ดาวน์โหลดหรือแปลงเสร็จสมบูรณ์แล้วในระบบ Backend พร้อมให้ผู้ใช้ดาวน์โหลดไฟล์จริงลงเครื่อง

**Media detected**:
สถานะหรือ Badge เล็ก (● DETECTED) ที่แสดงบน Result Card เพื่อระบุว่าระบบวิเคราะห์และตรวจพบสื่อต้นทางเรียบร้อยแล้ว อยู่ระหว่างให้ผู้ใช้เลือก Format และ Quality แยกความหมายชัดเจนจาก **File ready** ที่หมายถึงไฟล์ผลลัพธ์พร้อมดาวน์โหลดแล้ว

**Job**:
งานดาวน์โหลดหรือแปลงสื่อที่ทำงานเบื้องหลังบน Backend ถูกสร้างเมื่อผู้ใช้กด Download

**Job ID**:
รหัสสุ่มเฉพาะของ Job ใช้สำหรับ Frontend ยิงตรวจสอบความคืบหน้า (Polling) และขอยกเลิกงาน

**File ID**:
รหัสสุ่มเฉพาะ (UUID) ของไฟล์ที่ประมวลผลเสร็จแล้ว สำหรับส่งให้ Browser โหลดไฟล์จริงผ่าน `/api/files/{file_id}` เพื่อปิดบัง Path จริงของเซิร์ฟเวอร์

**Job Status**:
สถานะวงจรชีวิตของ Job ประกอบด้วย `queued`, `downloading`, `processing`, `ready`, `failed`, `cancelled` และ `expired`

**Storage TTL**:
ระยะเวลาหมดอายุของไฟล์ชั่วคราวใน Storage (เช่น 30 นาที) เมื่อครบกำหนด Auto-cleanup จะลบไฟล์ทิ้งทันที

**Thumbnail**:
ภาพปกของวิดีโอจาก Platform แยกความหมายชัดเจนจาก **IMAGE** ที่เป็นไฟล์ภาพต้นทางจริง

**MediaInfo**:
โครงสร้างข้อมูลกลางที่ Backend ใช้ส่งผลการ Analyze กลับ Frontend ประกอบด้วย title, media_type, thumbnail, duration, source และ available_formats ทุก analyzer ต้องแปลงผลลัพธ์เป็น MediaInfo ก่อนส่ง

**Available Formats**:
รายการ Format ผลลัพธ์ที่ผู้ใช้เลือกได้สำหรับสื่อนั้น ๆ เช่น `["video","audio"]` สำหรับ video file คนละความหมายกับ **Format** ที่ผู้ใช้เลือกจริง ๆ

**Media type**:
ชนิดของสื่อต้นทางที่ Backend ตรวจพบ เช่น `video`, `audio`, `image` ไม่ใช่ Format ที่ผู้ใช้เลือกสำหรับผลลัพธ์ (ความหมายเดิม แต่บันทึกชัดขึ้น)

**Direct Media Analyzer**:
analyzer สำหรับ URL ที่ชี้ตรงไปที่ไฟล์สื่อ อ่าน Content-Type จาก HTTP HEAD request

**Platform Analyzer**:
analyzer สำหรับ URL ของแพลตฟอร์มสื่อที่รองรับ ใช้ yt-dlp อ่าน metadata โดยไม่ดาวน์โหลดไฟล์

**Source**:
ค่าบอกว่า MediaInfo มาจาก analyzer ตัวใด ได้แก่ `direct` (Direct Media Analyzer) หรือ `platform` (Platform Analyzer) ใช้สำหรับ debugging ไม่แสดงใน UI

**Format Theme**:
ชุดสีและโทนบรรยากาศเฉพาะของแต่ละ Format (MP3 = Pink, VIDEO = Purple, IMAGE/THUMBNAIL = Cyan) ควบคุมสีไฮไลต์ของกรอบการ์ด ปุ่ม Action CTA และแถบความคืบหน้า เพื่อสื่อสารประเภทผลลัพธ์ผ่านสีอย่างชัดเจน

**Layered Result Card**:
โครงสร้างของ Result Card แบบมีมิติซ้อนชั้น (Retro Offset Shadow ภายนอก และ Segmented Inset/Surface Panels ภายใน) ให้ความรู้สึกจับต้องได้แบบแผ่นการ์ดเรโทร โดยคงความกระชับและไม่ลดทอนความเร็วในการอ่านข้อมูล

**Ambient Pixel Accents**:
ของตกแต่งสไตล์พิกเซลเรโทร (ดาว ✦, บล็อก ▪, ประกายแสง) ที่จัดวางเป็นฉากหลังอย่างมีชั้นเชิงรอบ Hero และ Card ไม่บดบังเนื้อหา และลดทอนอัตโนมัติบนหน้าจอมือถือเพื่อป้องกันการเลื่อนล้นขอบจอ

**Background Depth Layer**:
เลเยอร์มิติด้านหลังแบบผสมผสาน (Ambient Multi-Radial Glow + Micro Dot Grid) เพื่อสร้างมิติของบรรยากาศ ไม่ใช้ DOM เพิ่มเติม และคงประสิทธิภาพสูงสุด

**Step Guide Strip**:
แถบสรุป 3 ขั้นตอนการใช้งาน (`[ 01 PASTE ] ➔ [ 02 PICK ] ➔ [ 03 DOWNLOAD ]`) แสดงเฉพาะโหมด Idle เพื่ออธิบายฟังก์ชันแอปและลดพื้นที่ว่างระหว่าง Formats กับ Footer

**Format Identity Palette**:
การกำหนดชุดสีเฉพาะตัวให้แก่สื่อแต่ละประเภทตั้งแต่หน้า Home (MP3=Pink, Video=Purple, Image=Cyan) พร้อมการตอบสนองเฉพาะตัวเมื่อ Hover/Active

**Gallery / Photo Post**:
สื่อต้นทางที่เป็นชุดรูปภาพหลายรูปจากแพลตฟอร์ม (เช่น TikTok Photo Posts) ที่มีลำดับชัดเจน (Index 0..N) รองรับการดูตัวอย่างแบบ Carousel และตัวเลือกดาวน์โหลดทั้งรูปปัจจุบันหรือรวมทุกรูป

**Image Export Format**:
รูปแบบไฟล์ภาพปลายทางที่เลือกสำหรับส่งออก ได้แก่ `Original` (คงไฟล์เดิมไม่แปลงซ้ำ), `JPG` (ไฟล์มาตรฐานสำหรับภาพถ่าย) และ `PNG` (ไฟล์แบบ Lossless)

**Image Processor**:
ระบบประมวลผลและแปลงไฟล์ภาพส่วนกลางฝั่ง Backend ใช้สำหรับ Direct Image, Thumbnail และ Gallery รวมทั้งจัดการปรับพื้นหลังขาว (Flatten Alpha) เมื่อแปลงภาพโปร่งใสเป็น JPG

**Image Bundle (ZIP)**:
ไฟล์บีบอัดรวมรูปภาพทั้งหมดใน Gallery มีระบบตั้งชื่อเรียงลำดับ `01.jpg`, `02.jpg` พร้อมการรายงานความคืบหน้าและการลบอัตโนมัติตาม Storage TTL



