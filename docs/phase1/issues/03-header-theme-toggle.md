# 03: Header + Theme Toggle

**What to build:** Header แสดง logo "MediaDrop" ใน pixel font และปุ่ม toggle ☀️/🌙 ที่สลับ dark/light mode, บันทึกใน localStorage, default ตาม system preference

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Logo "MediaDrop" ใช้ Press Start 2P
- [ ] Toggle button เปลี่ยน icon ตาม theme ปัจจุบัน
- [ ] คลิก toggle → เปลี่ยน `dark` class บน `<html>` ทันที
- [ ] preference บันทึกใน localStorage key `mediadrop-theme`
- [ ] โหลดหน้าใหม่ → theme ตาม localStorage ก่อน, fallback prefers-color-scheme
