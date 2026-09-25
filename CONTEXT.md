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
ผลจำลองที่ผ่านขั้นเตรียมแล้ว แต่ยังไม่มีไฟล์จริงให้รับ

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
