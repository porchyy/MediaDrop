# Phase 8.8.2.4: Persona-Inspired Kinetic UI Overhaul

## Problem Statement

MediaDrop currently uses a retro-pixel aesthetic with neon purple, pink, and cyan accents, 4px square drop shadows, and `Press Start 2P` typography. While visually recognizable, the experience functions like an ordinary SaaS media downloader wrapped in a retro skin. Users interacting with the application do not experience a cohesive, tactile, or dramatic visual identity. Key actions—pasting links, triggering analysis, selecting formats, and downloading—offer minimal physical feedback (basic hover scales, static loaders, and standard text swaps). 

When users open MediaDrop, it should not feel like an ordinary downloader; it should feel unmistakable, rebellious, and kinetic—delivering high-energy visual feedback on every single click, hover, focus, and state transition.

## Solution

Overhaul the frontend interface with a Persona-inspired kinetic design system governed by the following core pillars:

1. **Persona Visual Direction (70/20/10 Rule)**:
   - 70% Deep Black (`#080808` / `#121212`) establishing a high-contrast cinematic atmosphere.
   - 20% Off-White Parchment (`#F4F1E8`) delivering crisp, graphic legibility.
   - 10% Crimson Red (`#E20B17` / `#8E0710`) serving as the unmistakable brand accent.
   - Preserved media status accents: Cyan (`#35D7FF`) for Image, Purple (`#9D63FF`) for Video, Pink (`#FF4E91`) for Audio, and Mint Green (`#34D399`) for File Ready.

2. **Oblique Geometry & Offset Layering**:
   - Skewed structural panels (`-4deg`) with solid offset drop shadows (`#000` + dark red) and clipped polygon corners.
   - Strict media preservation: media viewports (thumbnails, TikTok photo posts, Instagram carousels, video embeds) are counter-skewed back to `0deg` to prevent any aspect ratio distortion.

3. **High-Contrast Typography Hierarchy**:
   - Condensed heavy display typography (`Bebas Neue`) for oversized headlines, numbers, and tactical action labels.
   - High-legibility Thai body typography (`IBM Plex Sans Thai`) mapped via clean CSS `unicode-range` rules to prevent glyph mismatch.

4. **Tactile Kinetic Feedback System**:
   - **Magnetic Buttons**: Interactive buttons pull gently toward the cursor (4–8px) on hover and display contextual micro-labels (`↳ ACTION`, `↳ GET FILE`).
   - **Impact Flash Sequence**: Clicking primary actions triggers an instant tactile chain (compress ➔ red flash ➔ diagonal slash).
   - **Diagonal Slash Transitions**: Rapid three-bar crimson slash wipes (`////////`) slicing across the viewport during major screen transitions.
   - **Staged Analyzing Scene**: Replaces static spinners with a dramatic 4-stage technical scanner (`01 PARSING`, `02 SCANNING`, `03 EXTRACTING`, `04 BUILDING`) with progress filling, URL fragment readouts, and a tactical abort control (`[ ABORT // 00 ]`).
   - **Oversized Format Selector**: Bold option cards (`[ MP3 AUDIO ]`, `[ VIDEO MEDIA ]`, `[ IMAGE PHOTO ]`) that illuminate with red borders and active badges upon selection.
   - **Interactive Media Lightbox**: Clickable thumbnail and gallery previews opening an oblique high-resolution lightbox with keyboard navigation (`Left`/`Right`/`Esc`) and mobile touch gestures.
   - **Tactical Error Handling**: Instant glitch cut to a hazard-striped error panel with error code and immediate retry action.

5. **Accessibility & Zero Performance Regression**:
   - Dedicated skewed focus-visible rings (`-4deg`) for keyboard navigability.
   - Built-in `[ MOTION: DYNAMIC / CALM ]` switcher in the header, with automatic fallback for `prefers-reduced-motion` and low-power/save-data modes.
   - Zero heavy runtime animation libraries (no Framer Motion or GSAP); pure hardware-accelerated CSS transforms and lightweight React hooks.
   - 100% backward compatibility with all existing test selectors and data attributes.

## User Stories

1. As a user visiting MediaDrop, I want to see a bold, cinematic black, off-white, and crimson red interface, so that I immediately recognize MediaDrop as a distinct and powerful tool.
2. As a user, I want giant, stylized typography for primary titles and clean typography for informational Thai text, so that the page feels dramatic yet remains effortless to read.
3. As a desktop user moving my mouse over interactive buttons, I want the button to subtly track my cursor (4–8px) and display a contextual action tag (`↳ STRIKE // 01`), so that the controls feel magnetic and responsive.
4. As a user clicking the PASTE button, I want my clipboard URL to be populated instantly, and if clipboard permission is blocked, I want a clear tactical micro-warning (`↳ CLIPBOARD LOCKED`), so that I know exactly what happened.
5. As a user submitting a valid URL for analysis, I want an instant tactile impact sequence (button compression, red screen flash, and a diagonal slash wipe), so that the application feels immediately reactive to my input.
6. As a user waiting for media analysis, I want to see an animated 4-step technical checklist (`01 PARSING`, `02 SCANNING`, `03 EXTRACTING`, `04 BUILDING`) rather than a generic spinner, so that I understand what the system is doing behind the scenes.
7. As a user waiting during analysis, I want a prominent `[ ABORT // 00 ]` button, so that I can cancel the extraction at any point and return cleanly to the home view.
8. As a user analyzing an invalid URL or encountering a platform error, I want the analyzing scene to glitch-cut into a red hazard-striped error panel, so that the failure feels clear, tactical, and informative.
9. As a user whose analysis succeeds, I want the result card to enter with a dramatic reveal and layered offset shadows, so that the detected media feels significant.
10. As a user viewing a detected video or image, I want the thumbnail or cover art to display with its true aspect ratio without skewed distortion, so that the media preview looks correct and authentic.
11. As a user inspecting a multi-image gallery post (TikTok or Instagram), I want to navigate between photos using carousel controls, with total count indicators (`01 / 05`), so that I can preview every image before downloading.
12. As a user viewing an Instagram mixed post with both videos and photos, I want the video slide to display a clear `[ VIDEO ]` badge and provide a video download button, so that I can grab the specific video stream without confusion.
13. As a user interested in high-resolution image details, I want to click on any thumbnail or gallery slide to open an expanded oblique lightbox preview with keyboard arrow controls and touch-swipe navigation, so that I can inspect the full-resolution artwork.
14. As a user selecting a desired output format, I want large, oversized option cards (`[ MP3 AUDIO ]`, `[ VIDEO MEDIA ]`, `[ IMAGE PHOTO ]`) that highlight with a glowing border and `SELECTED` badge, so that my selection is visually obvious.
15. As a user configuring quality, I want clear beveled option badges with a `★ Best (Recommended)` star highlight, so that choosing the recommended bitrate or resolution is intuitive.
16. As a user clicking the DOWNLOAD button, I want a tactile impact transition that smoothly transforms the card into a live transfer state, so that the beginning of the file generation feels deliberate.
17. As a user downloading a gallery bundle as a `.ZIP` archive, I want the progress screen to state `PACKAGING XX PHOTOS INTO .ZIP`, so that I know the server is packaging the archive.
18. As a user whose download finishes, I want a high-impact `FILE READY` completion scene with file size and expiration time, and a prominent `[ DOWNLOAD FILE ]` button, so that getting my file feels rewarding.
19. As a user who has completed a download, I want a clear `[ EXTRACT ANOTHER LINK // ESC ]` button that sweeps the screen clean and resets the application back to the hero, so that I can start my next task smoothly.
20. As a user with motion sensitivities or reduced-motion OS preferences, I want the application to automatically suppress aggressive slashes, camera shakes, and magnetic pulls while preserving all colors and functional states, so that I can use the tool comfortably.
21. As a user who wants to control animations manually, I want a `[ MOTION: DYNAMIC / CALM ]` toggle in the header, so that I can switch between cinematic motion and quiet browsing at will.
22. As a keyboard-only user navigating with the `Tab` key, I want skewed high-contrast focus rings that match the `-4deg` geometry, so that I can navigate with visual clarity.
23. As a mobile phone user, I want oversized format selectors to fit neatly within a 3-column beveled grid without horizontal overflow, so that I can see all options without scrolling horizontally.
24. As a mobile phone user on a touch screen without hover, I want tactile active-press feedback and embedded micro-labels, so that the interface feels responsive to touch.
25. As a user on a low-battery or data-saver connection, I want the background textures and continuous animations to scale down automatically, so that my battery and data are preserved.
26. As an operator or developer, I want all existing 33 integration and unit tests in `test/demo-flow.test.mjs` to continue passing without regressions, so that the application remains reliable.
27. As a developer, I want all kinetic UI primitives organized into a dedicated reusable module directory, so that the motion components can be maintained cleanly without cluttering core page logic.

## Implementation Decisions

### 1. Unified Kinetic Design Tokens & Palette
- The application root defines CSS variables for the Persona palette:
  - Deep Black: `#080808` (base background), `#121212` (surface), `#181818` (card container)
  - Off-White: `#F4F1E8` (primary typography, parchment accents)
  - Crimson Red: `#E20B17` (primary brand accent, borders, highlights), `#8E0710` (dark red offset shadow)
  - Media format accents: Cyan `#35D7FF`, Purple `#9D63FF`, Pink `#FF4E91`, Mint `#34D399`
- Canonical easing curve token: `--ease-p5: cubic-bezier(0.16, 1, 0.3, 1)` applied across hover states, card slams, and modal popups.
- Standard snap duration: `--speed-snap: 0.18s` and sweep duration: `--speed-slash: 0.38s`.

### 2. Geometry & Layered Depth Architecture
- Oblique containers use a standardized skew of `-4deg`.
- Solid offset shadow layer tokens use zero-blur offsets: `6px 6px 0 #000000, 10px 10px 0 var(--p5-dark-red)`.
- Media protection rule: All `img`, `video`, and visual assets within media viewports are counter-skewed with `transform: skewX(0deg)` to prevent any image distortion.
- Clipped polygon borders use SVG or `clip-path: polygon(...)` to create beveled corners.

### 3. Typography & Language Separation
- Display font: `Bebas Neue` loaded from Google Fonts for all oversized headings, numeric badges, and button labels.
- Body/Thai font: `IBM Plex Sans Thai` for all descriptive text, error messages, and Thai translations.
- CSS `unicode-range` rules decouple Latin display numbers from Thai script glyphs, preventing visual layout jumping in mixed-language strings.

### 4. Kinetic Primitives Architecture
- Reusable motion components are housed in a dedicated kinetic module:
  - **Magnetic Button Wrapper**: Hooks into pointer move events, calculating a clamped delta vector (maximum 4–8px offset), applying hardware-accelerated `translate3d(x, y, 0)`, and displaying a floating contextual badge on hover. Disabled automatically on touch screens (`@media (hover: none)`) and under calm motion mode.
  - **Diagonal Slash Transition Overlay**: Renders three skewed crimson bands that sweep horizontally across the viewport over 380ms with staggered delays, masking state transitions.
  - **Impact Flash Overlay**: Renders a momentary high-opacity red screen flash (120ms) upon primary action triggers.
  - **Glitch Text**: Splices text into top/bottom horizontal slices with momentary RGB offsets (cyan/red) during state reveals.
  - **Status Tag**: Tactical editorial coordinate badge supporting slanted and outline variants.
  - **Halftone Layer**: Crisp high-DPI comic dot matrix texture generated via pure SVG patterns.

### 5. Analyzing Scene State Machine
- When an analysis starts, the component initiates an animated sequence:
  - 0ms: Button active compress
  - 50ms: Impact red flash
  - 100ms: Diagonal slash transition starts
  - 250ms: Enter analyzing scene
- The analyzing scene enforces a minimum display duration (~750ms) to ensure the dramatic kinetic feedback is legible before resolving.
- The 4-step progressive checklist transitions through:
  - `01 PARSING URL PROTOCOL`
  - `02 SCANNING TARGET PLATFORM`
  - `03 EXTRACTING MEDIA STREAMS`
  - `04 BUILDING KINETIC RESULT`
- An integrated `[ ABORT // 00 ]` button immediately aborts the active fetch controller and returns the view to the clean idle state.

### 6. Interactive Media Lightbox Modal
- Clicking the thumbnail hero or gallery item opens a full-screen oblique modal overlay.
- Features keyboard navigation (`ArrowLeft` / `ArrowRight` to switch images, `Escape` to close).
- Supports touch swipe gestures on mobile devices.
- Embedded video items in mixed carousels provide direct HTML5 video playback with mute toggling inside the preview modal.

### 7. Dual Motion Mode & Accessibility Controls
- Header contains an accessible toggle button switching between `DYNAMIC` and `CALM` modes.
- `CALM` mode suppresses all diagonal slashes, camera shakes, glitch slices, and magnetic cursor tracking, replacing them with subtle opacity fades.
- The system automatically activates calm mode if `prefers-reduced-motion: reduce` is detected or if `navigator.connection?.saveData` is enabled.
- Focusable interactive elements feature a custom skewed `:focus-visible` outline matching the `-4deg` container angle.

### 8. Preservation of Testing Contracts
- All existing data attributes (`data-format-theme`), semantic tags (`nav.step-guide-strip`, `ol.step-guide-list`), and functional classes (`analyze-btn`, `pixel-border-layered`, `download-cta--video`, `download-file-btn`, `theme-toggle`, `status-badge`, `bg-depth-layer`) remain present on the DOM.
- Text assertions matching `PASTE • PICK • DOWNLOAD`, `✦`, `★`, and error strings are preserved, ensuring zero test regressions.

## Testing Decisions

### What Makes a Good Test
- Tests must verify observable user behavior and accessibility contracts rather than internal component implementation details.
- Tests verify rendered HTML output across state phases, ensuring that required data attributes, role attributes, accessible labels, and semantic elements are present.
- Tests verify that user interactions (clicking analyze, selecting formats, polling jobs, aborting) produce the correct DOM updates and API calls.

### Testing Seams
- **Primary Testing Seam**: Server-Side Rendering (SSR) component integration via `vite.ssrLoadModule` and `react-dom/server.renderToStaticMarkup`. This is the highest existing frontend seam in the repository.
- **API Client Seam**: Global `fetch` mock intercepting requests to `/api/analyze`, `/api/download`, and `/api/jobs/*`.

### Prior Art
- All tests in `test/demo-flow.test.mjs` serve as the direct precedent and execution harness.
- Existing tests cover URL validation, platform detection, ResultCard states, API error codes, gallery carousels, and visual depth layers.

## Out of Scope

- **Backend API Alterations**: No changes to `/api/analyze`, `/api/download`, `/api/jobs`, or backend extraction pipelines.
- **Audio Assets & Sound Effects**: No audio files or Web Audio API sound synthesizers are introduced; the kinetic system is 100% visual.
- **User Authentication & Accounts**: No login forms or session storage beyond theme/motion preferences.
- **New Platform Extractors**: No additions or modifications to the underlying `yt-dlp` or `gallery-dl` extractor adapters.

## Further Notes

- Documented in architecture decision record: [docs/adr/0002-persona-kinetic-ui-architecture.md](file:///A:/ส่วนเสริมเขียนเอง/MediaDrop/docs/adr/0002-persona-kinetic-ui-architecture.md).
- Domain glossary terms updated in [CONTEXT.md](file:///A:/ส่วนเสริมเขียนเอง/MediaDrop/CONTEXT.md).
