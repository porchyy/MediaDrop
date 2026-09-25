# MediaDrop — Phase 8.5: UI/UX & Result Card Overhaul

## Problem Statement

หลังจากการพัฒนา Phase 7 ที่รองรับ Real Download Engine ระบบทำงานได้สมบูรณ์ในแง่ฟังก์ชัน แต่การนำเสนอทาง UI/UX โดยเฉพาะ **Result Card** ยังมีจุดติดขัดด้านการใช้งานและสุนทรียภาพ:
1. **Result Card แคบเกินไป**: กว้างเพียง 640px (และตัว Card มี padding เยอะ) ทำให้ชื่อคลิปเบียดและ Thumbnail มีขนาดเล็กเกินไป (เพียง 7.5rem x 5.5rem) ผู้ใช้แทบมองไม่ออกว่าเป็นคลิปอะไร
2. **Typography ไม่เอื้อต่อภาษาไทย**: ใช้ Pixel font (`Press Start 2P`) กับชื่อคลิปภาษาไทย ทำให้ตัวอักษรและสระภาษาไทยอ่านยากมาก
3. **Borders ซ้ำซ้อนและแย่งสายตา**: มีเส้นกรอบซ้อนกันเกือบทุกองค์ประกอบ ทั้ง Card, Fieldset, Option button, Badge และ Thumbnail
4. **Hierarchy แน่นเกินไป**: ข้อมูลสรุป, Badge, Title, Duration, Format กระจุกอยู่ชิดกัน ขาดลำดับสายตาที่เป็นธรรมชาติ
5. **ปุ่ม Download ขาดความโดดเด่น**: Visual weight ของปุ่ม Download ไม่เด่นพอ และข้อความระบุเพียง "DOWNLOAD" ขาดความชัดเจนว่ากำลังจะโหลดอะไร
6. **ข้อมูลซ้ำซ้อนบนหน้าจอ**: เมื่อ Analyze สำเร็จแล้ว ด้านล่างยังคงแสดงส่วน `MEDIA FORMATS` ของหน้าแรก ทำให้หน้ายาวและแสดงข้อมูลซ้ำ

## Solution

ปรับปรุง UI/UX ทั้งระบบโดยมุ่งเน้นที่ Result Card, Typography, Hierarchy, และ Layout Responsiveness แบ่งเป็น 8 ส่วนหลัก:

- **8.5A — Container & Card Expansion**: ขยายความกว้าง `main-content` และ `Result Card` บน Desktop สู่ ~680px (`42.5rem`) ให้รองรับชื่อคลิปยาวและ Thumbnail กว้างเต็มตาอย่างสมดุล
- **8.5B — 16:9 Prominent Thumbnail**: ขยาย Thumbnail ให้กว้างเต็มการ์ด (`width: 100%`, `aspect-ratio: 16 / 9`, `object-fit: cover`) สำหรับวิดีโอ, `contain` สำหรับรูปภาพ, และ Retro Audio Placeholder สำหรับไฟล์เสียง
- **8.5C — Hybrid Typography**: นำเข้า Google Font `IBM Plex Sans Thai` มาใช้กับเนื้อหา (ชื่อคลิป, URL, เวลา, ข้อความ Error, รายละเอียดไฟล์) ขณะที่ยังคงรักษาเอกลักษณ์ของ `Press Start 2P` สำหรับหัวข้อ, ปุ่ม CTA, และเลเบล
- **8.5D — Border De-cluttering**: ลดเส้นกรอบที่ซ้ำซ้อน โดยปุ่ม Inactive ใช้กรอบบางจางไม่มีเงา และปุ่ม Active ใช้พื้นหลังสีม่วงโดดเด่น (`var(--accent)`) พร้อมลบกรอบย่อยที่ไม่จำเป็น
- **8.5E — Information Hierarchy & `● DETECTED` Badge**: จัดลำดับสายตาใหม่: Thumbnail (บนสุด) $\rightarrow$ Title & Platform/Duration $\rightarrow$ `● DETECTED` Badge $\rightarrow$ FORMAT $\rightarrow$ QUALITY $\rightarrow$ DOWNLOAD
- **8.5F — URL Field Polish**: เพิ่มความสูงช่อง URL Input ให้โปร่งสบายตา (56px) พร้อมปรับปุ่ม Paste ให้แยกเป็นสัดส่วนชัดเจน และเปลี่ยน Hint ใต้ช่องเป็น `✓ Media detected` หลังการวิเคราะห์สำเร็จ
- **8.5G — Dynamic Download CTA**: ปรับปุ่ม Download ให้เป็น Primary CTA ที่โดดเด่นที่สุด พร้อมเปลี่ยนข้อความตาม Format ที่เลือก (`DOWNLOAD MP3`, `DOWNLOAD VIDEO`, `DOWNLOAD THUMBNAIL`, `DOWNLOAD IMAGE`)
- **8.5H — Viewport Cleanliness**: ซ่อนส่วน `SupportedFormats` (MEDIA FORMATS) โดยอัตโนมัติเมื่ออยู่ในสถานะที่ไม่ใช่ `idle` หรือ `error` และแสดงกลับมาเมื่อผู้ใช้กด Clear / New Link

---

## User Stories

1. As a user, I want the desktop Result Card to be wider (around 680px), so that video titles don't feel squished and I have plenty of breathing room.
2. As a user, I want the thumbnail to be large and 16:9 on top of the card, so that I can immediately recognise the video before downloading.
3. As a user downloading an image, I want the preview to use `contain` rather than cropping, so that I can see the entire image artwork.
4. As a user downloading audio without a cover image, I want to see a stylish retro music placeholder box, so that the card maintains a clean, intentional structure.
5. As a user, I want Thai video titles and descriptions to render in a clean, legible Thai font (IBM Plex Sans Thai), so that I can read titles comfortably without pixelated distortion.
6. As a user, I want headers, buttons, and format labels to remain in pixel font, so that MediaDrop retains its distinctive retro/arcade identity.
7. As a user, I want inactive format/quality buttons to have subtle borders without drop shadows, so that the selected (active) button pops out clearly with accent color.
8. As a user, I want to see platform and duration clearly underneath the title (e.g. `TikTok • 02:07` or `YouTube • 10:15`), so that I know where the media came from and its length.
9. As a user, I want to see a subtle `● DETECTED` badge instead of an overwhelming `MEDIA READY` banner, so that I don't confuse detected media with a completed file download (`File ready`).
10. As a user, I want the URL input to be taller and the paste button clearly separated, so that pasting and editing URLs feels effortless.
11. As a user, I want the hint text under the URL input to display `✓ Media detected` after a successful analysis, so that I get immediate confirmation.
12. As a user, I want the main action button to say `DOWNLOAD VIDEO`, `DOWNLOAD MP3`, `DOWNLOAD THUMBNAIL`, or `DOWNLOAD IMAGE`, so that I have zero doubt about what format I am downloading.
13. As a user, I want the `MEDIA FORMATS` section at the bottom of the home screen to disappear once a result is shown, so that the screen is not cluttered with redundant information.
14. As a user, I want the `MEDIA FORMATS` section to reappear if I click Clear, New Link, or enter an invalid URL, so that I can reference supported formats when needed.

---

## Detailed Specifications

### 1. Layout & Dimensions
- `main.main-content`:
  - `max-width: 42.5rem` (~680px) on screens $\ge$ 768px.
  - Full width with `1.25rem` padding on mobile devices (< 768px).
- `.result-card`:
  - `padding: 1.5rem`
  - `gap: 1.25rem`
  - Maintains `pixel-border` (2px solid with 4px box shadow).

### 2. Media Presentation (16:9 Thumbnail)
- Container:
  - `width: 100%`
  - `aspect-ratio: 16 / 9`
  - `border: 1px solid var(--border)` (opacity 0.4)
  - `background: repeating-linear-gradient(45deg, var(--card-bg) 0 12px, var(--surface) 12px 24px)`
- Image Tag:
  - For `media_type === 'video'` or platform thumbnail: `object-fit: cover`
  - For `media_type === 'image'`: `object-fit: contain`
- Audio Placeholder:
  - Large `Music` icon (size 40) centered with retro grid pattern.

### 3. Typography & Hierarchy
- Google Fonts:
  - Add `IBM Plex Sans Thai:wght@400;500;600;700` alongside `Press Start 2P`.
- Font distribution:
  - Pixel font (`Press Start 2P`):
    - App title / Hero title
    - Section headings (`RESULT`, `FORMAT`, `QUALITY`, `DOWNLOADING`, `FILE READY`)
    - Action buttons (`ANALYZE`, `DOWNLOAD ...`, `DOWNLOAD FILE`, `CLEAR`, `NEW LINK`)
    - Option pill buttons (`MP3`, `VIDEO`, `720p`, etc.)
    - Badges (`● DETECTED`)
  - Modern Sans font (`IBM Plex Sans Thai`, -apple-system, sans-serif):
    - Media title (`.result-title`) — font size 1.05rem, line-height 1.5, weight 600
    - Meta info (`.result-meta`) — font size 0.85rem, color `var(--muted)`
    - Input URL text
    - Hints and status messages (`.url-hint`)
    - Error messages
    - File details on File Ready state

### 4. Visual De-cluttering & Button Styling
- Inactive Options (`.result-option`):
  - `border: 1px solid rgba(129, 140, 248, 0.25)` (light mode: `rgba(79, 70, 229, 0.25)`)
  - `box-shadow: none`
  - `background: var(--card-bg)`
  - `color: var(--text)`
- Active Options (`.result-option--active`):
  - `border: 2px solid var(--border)`
  - `box-shadow: 2px 2px 0 var(--shadow)`
  - `background: var(--accent)`
  - `color: var(--on-accent)`
- Result Meta Badge:
  - `● DETECTED` badge placed inline with or next to the platform/duration meta:
    - Text: `● DETECTED`
    - Font: `Press Start 2P`, 0.55rem
    - Background: subtle accent background (`rgba(129, 140, 248, 0.15)`)
    - Color: `var(--accent)`
    - Padding: `0.25rem 0.5rem`

### 5. URL Input & Action CTA
- Input Field:
  - Height: `3.5rem` (56px)
  - Clear paste button with vertical border divider on the right
  - Hint text displays `✓ Media detected` when `phase === 'result'`
- Main Action Button:
  - Text: `DOWNLOAD ${format}` (e.g. `DOWNLOAD VIDEO`, `DOWNLOAD MP3`, `DOWNLOAD THUMBNAIL`, `DOWNLOAD IMAGE`)
  - Icon: `Download` icon
  - Full width, prominent shadow, 0.75rem pixel font

### 6. Lifecycle & State Management
- `SupportedFormats` visibility:
  - Rendered only when `phase === 'idle' || phase === 'error'`.
  - Hidden when `['analyzing', 'result', 'preparing', 'downloading', 'processing', 'success'].includes(phase)`.
