# Spec: MediaDrop — Phase 1 (หน้าเว็บหลัก)

## Problem Statement

ต้องการหน้าเว็บดาวน์โหลดมีเดียที่ดูเป็น "เว็บจริง" — มี header, ช่องวาง URL,
ปุ่ม Analyze, ส่วนแสดง format ที่รองรับ, และ footer — โดยยังไม่ต้องทำงานจริงใน Phase นี้
สไตล์ภาพต้องเป็น **pixel art / retro** พร้อม dark/light theme

---

## Solution

สร้าง React + Vite SPA สไตล์ pixel art ที่มีครบทุก UI element ตาม wireframe
ที่วางไว้ ใช้ Tailwind CSS สำหรับ styling, Lucide React สำหรับ icon,
และ `Press Start 2P` + `Courier New` เป็น font stack

---

## User Stories

1. As a user, I want to see a pixel-art styled logo "MediaDrop" in the header, so that I know what app I'm using
2. As a user, I want a dark mode enabled by default, so that the retro vibe matches my preference
3. As a user, I want a theme toggle button (☀️/🌙) in the header, so that I can switch between dark and light mode
4. As a user, I want the theme to default to my system preference, so that I don't have to toggle manually when loading the page
5. As a user, I want my theme choice to be remembered on next visit, so that I don't have to toggle every time
6. As a user, I want to see the main headline "Media Downloader" in pixel font, so that I immediately understand what the site does
7. As a user, I want to see a subtitle "Download audio, video and images" below the headline, so that I have more context
8. As a user, I want to see a blinking cursor effect on the input area, so that the retro terminal aesthetic is complete
9. As a user, I want a large URL input field with placeholder "Paste your link here...", so that I know where to enter a link
10. As a user, I want the input field to be styled in pixel art (chunky border, hard drop shadow), so that it matches the overall design
11. As a user, I want a clearly visible "Analyze" button below the input, so that I know what to do next
12. As a user, I want the Analyze button to have a pixel art style with hard shadow that shifts on click, so that it feels interactive
13. As a user, I want to see a "Supported Formats" section with MP3, Video, and Image cards, so that I know what types are supported
14. As a user, I want each format card to show a Lucide icon + label, so that it's visually clear and consistent
15. As a user, I want the format cards to have pixel borders and hover effects, so that the interactivity is obvious
16. As a user, I want a scanline overlay effect on the entire page, so that the CRT/retro aesthetic is reinforced
17. As a user, I want a footer with the tagline "Simple • Fast • Private" and "© 2025 MediaDrop", so that the page feels complete
18. As a user, I want the light mode to use a pale (`#f0f0f0`) background with dark indigo text, so that it's readable and still on-brand
19. As a user, I want the indigo/purple neon accent color used consistently on borders, buttons, and highlights, so that there's a clear visual identity
20. As a user, I want the entire UI to be in English, so that it's accessible to a wider audience

---

## Implementation Decisions

- **Stack**: React 18 + Vite 5 (SPA, no SSR needed in Phase 1)
- **CSS**: Tailwind CSS v3 with `darkMode: 'class'`
- **Icons**: Lucide React (`Music`, `Video`, `Image` icons for format cards)
- **Fonts**:
  - `Press Start 2P` (Google Fonts) — Logo, H1, H2
  - `Courier New` — body, input, labels
- **Theme logic**: `localStorage` stores user preference; on mount, check localStorage → fallback to `prefers-color-scheme`; toggle applies `dark` class to `<html>`
- **Pixel aesthetic**:
  - `border: 2px solid` + `box-shadow: 4px 4px 0 #000` on cards/buttons/inputs
  - Scanline overlay: pseudo-element with repeating-linear-gradient + low opacity + `pointer-events: none` covering full viewport
  - Blinking cursor: CSS `@keyframes blink` on a `span` appended to headline
- **Color palette**:
  - Dark: bg `#0d0d0d`, surface `#1a1a2e`, accent `#818cf8`, text `#e2e8f0`
  - Light: bg `#f0f0f0`, surface `#ffffff`, accent `#4f46e5`, text `#1e1b4b`
- **Component breakdown**:
  - `Header` — logo + theme toggle
  - `Hero` — headline + subtitle + blinking cursor
  - `UrlInput` — input field (controlled, no submit logic yet)
  - `SupportedFormats` — 3 format cards
  - `Footer` — tagline + copyright

---

## Testing Decisions

> Phase 1 is purely presentational — no business logic to unit test.
> Visual/integration testing is the right seam.

- **What makes a good test**: Test external behavior (what the user sees/interacts with), not implementation details (className strings, internal state)
- **Modules to test** (when tests are added in a later phase):
  - Theme toggle: toggling adds/removes `dark` class on `<html>`, preference persists to `localStorage`
  - UrlInput: value updates as user types; Analyze button is present and clickable (no submit side-effect in Phase 1)
- **Prior art**: none yet (greenfield project)

---

## Out of Scope

- Actual URL analysis / fetch logic
- Backend / API integration
- yt-dlp or any download engine
- Authentication
- Progress indicator
- Download history
- Error handling for bad URLs
- Mobile-specific breakpoints (Phase 1 targets desktop-first)
- i18n / Thai language UI

---

## Further Notes

- **Target directory**: `A:\ไฟล์ ส่วนเสริมชีวิต\เว็ปดาวโหลดจากลิง๕ื`
- Phase 2 will wire up the Analyze button to a backend that calls yt-dlp and returns media metadata
- The pixel art style should remain consistent through all future phases
- `Press Start 2P` เป็น Google Font โหลดผ่าน `<link>` ใน `index.html` โดยตรง
