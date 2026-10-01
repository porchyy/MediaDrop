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
สื่อต้นทางที่เป็นชุดรูปภาพหรือสื่อผสมจากแพลตฟอร์ม (เช่น TikTok Photo Posts, Instagram Carousel) ที่มีลำดับชัดเจน (Index 0..N) รองรับการดูตัวอย่างแบบ Carousel และตัวเลือกดาวน์โหลดทั้งชิ้นเดี่ยวหรือรวมทุกรูป

**Gallery Item**:
สื่อแต่ละชิ้นใน Gallery กำหนดโครงสร้างด้วย `index`, `type` (`image` หรือ `video`), `url`, `width`, และ `height`

**Mixed Carousel**:
Carousel ที่ประกอบด้วยสื่อหลากหลายประเภทในโพสต์เดียว (เช่น มีทั้งรูปภาพและคลิปวิดีโอ) โดยการดาวน์โหลดแบบรวม (.ZIP) จะเลือกเฉพาะไฟล์ภาพและระบุจำนวนสื่อวิดีโอที่ยกเว้นไว้อย่างชัดเจน

**Image Export Format**:
รูปแบบไฟล์ภาพปลายทางที่เลือกสำหรับส่งออก ได้แก่ `Original` (คงไฟล์เดิมไม่แปลงซ้ำ), `JPG` (ไฟล์มาตรฐานสำหรับภาพถ่าย) และ `PNG` (ไฟล์แบบ Lossless)

**Image Processor**:
ระบบประมวลผลและแปลงไฟล์ภาพส่วนกลางฝั่ง Backend ใช้สำหรับ Direct Image, Thumbnail และ Gallery รวมทั้งจัดการปรับพื้นหลังขาว (Flatten Alpha) เมื่อแปลงภาพโปร่งใสเป็น JPG

**Image Bundle (ZIP)**:
ไฟล์บีบอัดรวมรูปภาพทั้งหมดใน Gallery มีระบบตั้งชื่อเรียงลำดับ `01.jpg`, `02.jpg` พร้อมการรายงานความคืบหน้าและการลบอัตโนมัติตาม Storage TTL

**Login Required**:
สถานะความผิดพลาดเมื่อสื่อต้นทาง (เช่น Instagram Private Post หรือหน้าติด Login Wall) ไม่สามารถเข้าถึงได้แบบสาธารณะโดยไม่ต้องยืนยันตัวตน

**Extractor Error**:
สถานะข้อผิดพลาดที่แจ้งเตือนผู้ใช้ใน UI (`MEDIA EXTRACTOR ERROR`) เมื่อเครื่องมือสกัดข้อมูลสื่อ (Subprocess) ภายในเซิร์ฟเวอร์ขัดข้องด้านการตั้งค่าหรือรันคำสั่งไม่สำเร็จ โดยไม่ใช่ความผิดของ URL และไม่ได้แปลว่าสื่อนั้นไม่รองรับ

**Extractor Configuration Error**:
ข้อยกเว้นภายในระบบ Backend (`ExtractorConfigurationError`) ที่เกิดจากการส่ง CLI arguments หรือค่าคอนฟิกที่ไม่เข้ากันกับโปรแกรมดึงข้อมูลในสภาพแวดล้อมนั้น ๆ ส่งผลให้เซิร์ฟเวอร์ตอบกลับด้วยรหัส HTTP 500 (`extractor_error`)

**Anonymous Extract**:
การดึงข้อมูลสื่อโดยไม่ส่ง session หรือ cookie ใดๆ ไปยัง platform ต้นทาง เป็นวิธีที่ระบบเลือกใช้เป็นลำดับแรกเสมอ เพื่อลด exposure ของ Server Session Cookie และลดความเสี่ยงต่อบัญชี MediaDrop

**Authenticated Extract**:
การดึงข้อมูลสื่อโดยใช้ Server Session Cookie ของระบบ ทำเฉพาะเมื่อ Anonymous Extract ล้มเหลวเนื่องจาก Login Wall เท่านั้น ผู้ใช้ไม่รับรู้ว่ามีการ retry เกิดขึ้น

**Server Session Cookie**:
Cookie file format Netscape ของบัญชี Instagram เฉพาะ MediaDrop ที่ mount เข้า server แบบ read-only path อ่านจาก environment variable `INSTAGRAM_COOKIE_FILE` เท่านั้น ห้ามส่งผ่าน API ห้าม log และห้าม commit ลง version control

**Kinetic UI**:
ระบบการเคลื่อนไหวและการตอบสนองของส่วนติดต่อผู้ใช้ที่ได้รับแรงบันดาลใจจากสไตล์ Persona 5 เน้นความเร็ว (snappy), ความเหลี่ยมเฉียง (diagonal geometry), ลวดลาย halftone แบบคอมมิค และการตอบสนองเชิงภาพ (visual feedback) ในทุกจังหวะการโต้ตอบของผู้ใช้

**Persona Palette**:
ระบบสีหลักของเว็บตามสูตร 70/20/10 ได้แก่ สีดำสนิท Black (#080808) 70%, สีขาวครีม Off-White (#F4F1E8) 20%, และสีแดงเพลิง Crimson Red (#E20B17 / #8E0710) 10% พร้อมสี accent เฉพาะสถานะประเภทสื่อ (Cyan สำหรับ Image, Purple สำหรับ Video, Pink สำหรับ Audio)

**Diagonal Slash Transition**:
ทรานซิชันเปลี่ยนฉากแบบเฉียงที่ใช้แถบสีแดงวิ่งตัดผ่านหน้าจออย่างรวดเร็ว (300–500ms) ระหว่างการสลับสถานะหน้าจอ เช่น จากการกด Analyze ไปยัง Analyzing Scene

**Impact Feedback**:
ลำดับการตอบสนองเชิงสายตาแบบทันที (micro-animation sequence) บนปุ่มกดหลัก เช่น จังหวะปุ่มยุบตัว (0ms) ➔ ประกายสีแดงวาบ (50ms) ➔ เส้นเฉียงฟาด (100ms) เพื่อให้รู้สึกถึงความหนักแน่นและ tactile impact

**Analyzing Scene**:
หน้าจอแสดงสถานะการวิเคราะห์ข้อมูลสื่อที่เปลี่ยนจากสปินเนอร์ธรรมดาเป็นฉากเทคนิคัลแบบเป็นขั้นเป็นตอน (01 PARSING, 02 FINDING, 03 EXTRACTING, 04 BUILDING) พร้อมแบ็คกราวด์เส้นเฉียงและ halftone

**Magnetic Button**:
ปุ่มกดสำคัญที่มีแรงดึงดูดเล็กน้อยเข้าหาเคอร์เซอร์เมาส์ (ระยะเคลื่อนที่สูงสุด 4–8px) โดยใช้ CSS variables หรือ requestAnimationFrame เพื่อสร้างมิติสัมผัสที่มีชีวิตชีวา

**Camera Rig**:
ส่วนจัดระเบียบมุมมองสามมิติ (Perspective Viewport) ที่ควบคุมระดับความลึก การซูม และการเอียงกล้องระหว่างเปลี่ยนสถานะของระบบ โดยแยกอิสระจากส่วนควบคุมหลักระดับวิวพอร์ต

**Depth Layer (Z-Planes)**:
ลำดับชั้นความลึกตามแนวแกน Z ในปริภูมิสามมิติ (ได้แก่ Background Z:-200, Typography Z:-50, Card Z:0, Button Z:+50) ที่ตอบสนองต่อพารัลแลกซ์ของเมาส์ในอัตราส่วนที่ลดหลั่นกัน

**Specular Highlight**:
แสงสะท้อนประกายพื้นผิวบน 3D Result Card ที่เคลื่อนที่ล้อตามตำแหน่งเคอร์เซอร์เมาส์เพื่อสร้างมิติความนูนเสมือนวัตถุจริง

**3D Impact Sequence**:
ลำดับการตอบสนองเชิงฟิสิกส์ฉับพลันเมื่อกดปุ่ม ได้แก่ จังหวะปุ่มยุบตัว (0ms) ➔ แรงปะทะและแสงวาบสีแดง (30–70ms) ➔ ทรานซิชันดาบเฉียง 3D พร้อมการสั่นหน้าจอ (100ms) ➔ จังหวะคืนตัว (250ms)

**Kinetic Favicon**:
ไอคอนแท็บเบราว์เซอร์แบบไดนามิกที่สลับสัญลักษณ์สไตล์ Tactical ระหว่างการวิเคราะห์ข้อมูลสื่อ และคืนค่าอัตโนมัติเมื่อเสร็จสิ้นหรือสลับแท็บ

**3D Typography**:
การจัดเรียงตัวอักษรหัวเรื่องแบบหลายเลเยอร์ประกอบด้วย Front layer, Shadow layer, Extrusion layer และ Highlight layer พร้อมการแสดงผลแบบค่อยๆ ปรากฏทีละตัวอักษร

**Persona 5 Dialogue Box (Tactical Speech Balloon)**:
กล่องข้อความสไตล์คอมมิคทรงโพลีกอนเฉียง มีขอบขาวหนา เงาสีแดงเข้ม ป้ายชื่อผู้พูดสีแดงที่มุมบนซ้าย และหางชี้หาเป้าหมาย ทำหน้าที่รายงานสถานะ คำแนะนำ และแจ้งเตือนของระบบแบบไดนามิก

**Tactical Persona Copy**:
ระบบภาษาและโทนเสียงของอินเทอร์เฟซที่ผสมผสานความเท่แบบ Phantom Thieves เข้ากับฟังก์ชันการใช้งานของเครื่องมือดาวน์โหลดสื่อ (เช่น `TARGET URL`, `ALL-OUT STRIKE`, `TREASURE SECURED`, `TAKE OVER`)

**Pulsing Prompt Indicator**:
สัญลักษณ์เคอร์เซอร์กระพริบที่มุมล่างขวาของกล่องข้อความสไตล์ Persona 5 (เช่น รูปสามเหลี่ยมเฉียงหรือดาวสีแดงกระพริบ) เพื่อส่งสัญญาณว่าระบบพร้อมรับคำสั่งถัดไป

**Phantom Console**:
ส่วนควบคุมการกรอก URL ที่ได้รับการออกแบบในสไตล์แผงควบคุมแทคติคอล พร้อมป้ายระบุเป้าหมาย `[ TARGET URL ]` และปุ่มคำสั่งการแทรกซึม

**Tactical Heist Phrasing**:
ชุดคำศัพท์ที่ใช้ในวงจรการทำงานของ Result Card ที่สะท้อนความสำเร็จของภารกิจ (`TARGET SECURED`, `TAKE OVER`, `MISSION COMPLETE`)
