# Phase 8.8.2.4.1: 3D Kinetic & Cinematic UI Overhaul

## Problem Statement

MediaDrop currently operates with a Persona-inspired kinetic visual identity featuring flat oblique skew angles (`-4deg`), solid offset drop shadows, and high-contrast red, off-white, and black styling. While the interface is visually striking, the user experience functions on a single flat 2D plane: clicking Analyze triggers a basic overlay wipe, state changes feel like abrupt component replacements, and the application does not convey the palpable physical presence, camera motion, and spatial depth of an active, tactical command operating system.

When users access MediaDrop, it should not feel like an ordinary web utility; it should feel like powering on a cybernetic terminal. Navigating between idle, analyzing, and result states should feel like a cinematic camera movement through three-dimensional space, where elements occupy discrete depth layers, buttons exhibit physical press depth, and the Result Card lands with genuine perspective, mouse tilt, and specular surface reflection.

## Solution

Transform MediaDrop into a **2.5D Kinetic & Cinematic UI** utilizing hardware-accelerated CSS 3D transforms (`perspective`, `transform-style: preserve-3d`), requestAnimationFrame-driven cursor parallax, and tactical micro-interactions without adding heavyweight external 3D or animation libraries:

1. **3D Perspective & Depth Layering System**:
   - Establish a 1200px perspective viewport across the workspace.
   - Separate interface elements into distinct physical depth layers: Background (`Z: -200px`), Giant Typography (`Z: -50px`), Active Surface (`Z: 0px`), and Action CTA Buttons (`Z: +50px`).
   - Implement desktop mouse parallax tracking with proportional angular tilt (Background 1°, Typography 2°, Surface 4°, Action Buttons 7°).
   - Automatically fall back to static 2.5D layered offsets on touchscreens and mobile devices to preserve 60fps performance and zero battery drain.

2. **Cinematic Transitions & Camera Rig**:
   - Transition smoothly between application states using a scoped Camera Rig.
   - From Idle to Analyzing: Execute a subtle tactical camera zoom (1.00x to 1.04x with -1.5° rotation around the active panel), followed by an elastic spring settle back to 1.0x over 250ms.
   - From Analyzing to Result: Zoom out smoothly as the Result Card sweeps in laterally with a 3D slam and red edge impact.
   - Render a 3D Slash Transition with motion blur, red highlights, and angular speed lines during major state wipes.
   - Trigger a momentary micro screen-shake (40–80ms) upon primary action triggers.

3. **3D Typography & Staggered Entrance**:
   - Construct the primary `MEDIA DROP` display headline using a 4-layer stack: Front face, Extrusion depth layer, Drop shadow, and Highlight specular layer.
   - Animate the initial headline appearance with a staggered letter-by-letter overshoot (`M` ➔ `E` ➔ `D` ➔ `I` ➔ `A` followed by `D` ➔ `R` ➔ `O` ➔ `P`).
   - Maintain 100% screen-reader accessibility by housing all decorative letter spans inside a single semantic heading with an accessible label.

4. **3D Technical Analyzer Scene**:
   - Replace static progress indicators with a floating 3D scanner panel featuring floating perspective depth and slow-moving diagnostic scanlines.
   - Display a progressive 4-stage technical checklist (`01 PARSING`, `02 SCANNING`, `03 EXTRACTING`, `04 BUILDING`) with 3D status markers.
   - Provide an integrated tactical abort button allowing users to cancel long-running analyses immediately.

5. **3D Result Card with Mouse Tilt & Specular Sheen**:
   - Mount the Result Card with beveled edges, deep extrusion shadows, and hover lift.
   - Enable interactive 3D tilt tracking the cursor across the card surface, clamped to maintain full text legibility.
   - Cast a dynamic specular highlight reflection that follows the cursor across the card surface.
   - Preserve media authentic aspect ratios by counter-skewing media viewports back to 0°.
   - Present oversized 3D format selector cards that illuminate with active badges and crimson borders.

6. **Tactile Micro-Interactions & Kinetic Favicon**:
   - Provide tactile physical press depth (`translateZ(-8px)`) on all primary buttons.
   - Execute a strict micro-timed impact sequence: 0ms click ➔ 30ms compression ➔ 70ms red flash ➔ 100ms slash wipe ➔ 250ms settle.
   - Animate the browser tab favicon during active analysis, alternating between `[M]` and `[M̸]` every 280ms when the tab is visible.
   - Synthesize subtle cybernetic micro-clicks and low impact thuds using procedural Web Audio oscillators without downloading external audio files.

7. **Zero-Regression Performance & Accessibility**:
   - Suppress all 3D tilt, camera shake, and perspective wipes when Calm Motion or system reduced-motion is active.
   - Preserve all existing integration testing contracts, semantic tags, and data attributes.

## User Stories

1. As a user opening MediaDrop, I want the web application to feel like powering up an active cybernetic system, so that my download workflow feels distinct and immersive.
2. As a desktop user moving my mouse cursor across the page, I want subtle multi-plane parallax depth (Background 1°, Typography 2°, Surface 4°, Buttons 7°), so that the interface exhibits tangible spatial hierarchy.
3. As a mobile phone user navigating by touch, I want the interface to render clean static 2.5D layered offsets without continuous tilt lag, so that my browsing experience remains smooth at 60fps without battery drain.
4. As a user clicking the ANALYZE button, I want the button to physically press down into the screen (`translateZ(-8px)`), so that my action feels tactile and deliberate.
5. As a user initiating media analysis, I want an instant high-impact sequence (physical press, cybernetic audio click, 40-80ms micro screen-shake, and red impact flash), so that the application provides instantaneous physical feedback.
6. As a user transitioning from Idle to Analyzing, I want the camera to subtly zoom in and tilt toward the active panel before settling, so that the transition feels cinematic rather than abrupt.
7. As a user transitioning from Idle to Analyzing, I want a 3D diagonal red slash wipe with motion blur and speed lines to sweep across the screen, so that the state change is masked dynamically.
8. As a user waiting during analysis, I want to see a floating 3D scanner panel with progressive technical steps (`01 PARSING`, `02 SCANNING`, `03 EXTRACTING`, `04 BUILDING`), so that I understand what the system is doing behind the scenes.
9. As a user waiting during analysis, I want an active scanning beam sweeping across the panel with comic speed lines, so that the waiting experience feels alive and technical.
10. As a user waiting during analysis, I want a prominent `[ ABORT // 00 ]` button, so that I can cancel the extraction at any point and return cleanly to the home view.
11. As a user multitasking across browser tabs, I want the browser tab favicon to alternate between `[M]` and `[M̸]` during active analysis, so that I can see progress at a glance without switching tabs.
12. As a user who switches away to another tab, I want the dynamic favicon loop to pause and restore the static icon, so that browser background CPU and battery are conserved.
13. As a user whose analysis succeeds, I want the camera to zoom out as the Result Card sweeps in laterally with a 3D slam, so that discovering the extracted media feels dramatic and rewarding.
14. As a user viewing the Result Card on desktop, I want the card to gently tilt in 3D according to my cursor position, so that the card feels like a physical object in my hands.
15. As a user viewing the Result Card, I want a specular highlight reflection to follow my cursor across the card surface, so that the material feels tactile and glossy.
16. As a user reading media details (title, duration, platform), I want the 3D card tilt to be strictly clamped, so that typography remains effortless to read at all times.
17. As a user inspecting a detected video or image, I want the thumbnail viewport to remain un-skewed at 0°, so that image aspect ratios and cover artwork are never distorted.
18. As a user browsing a multi-photo gallery post, I want carousel navigation controls with total count indicators, so that I can inspect all photos before downloading.
19. As a user inspecting an Instagram mixed post, I want video slides to display a `[ VIDEO ]` badge and separate video download button, so that I can download video files independently of photo bundles.
20. As a user inspecting high-resolution image details, I want to click any thumbnail or gallery slide to open an expanded lightbox preview with keyboard arrow controls, so that I can inspect the full-resolution artwork.
21. As a user selecting an output format, I want large oversized 3D option cards (`[ MP3 AUDIO ]`, `[ VIDEO MEDIA ]`, `[ IMAGE PHOTO ]`) that highlight with an illuminated red border and active badge upon selection, so that my choice is visually obvious.
22. As a user selecting quality, I want clear beveled option badges with a `★ Best` highlight, so that choosing the optimal bitrate or resolution is intuitive.
23. As a user clicking the DOWNLOAD button, I want physical tactile press depth (`translateZ(-8px)`) followed by a live progress bar, so that starting the file generation feels deliberate.
24. As a user downloading a gallery bundle as a `.ZIP` archive, I want the progress screen to state `PACKAGING XX PHOTOS INTO .ZIP // ARCHIVING`, so that I know the server is packaging the archive.
25. As a user whose download finishes, I want a high-impact `FILE READY` completion scene with file size and expiration time, and a prominent `[ DOWNLOAD FILE ]` button, so that downloading my file feels conclusive.
26. As a user who has completed a download, I want a clear `[ EXTRACT ANOTHER LINK ]` button that sweeps the screen clean and resets the application back to the hero, so that I can start my next task smoothly.
27. As a user with motion sensitivities, I want an accessible `[ MOTION: DYNAMIC / CALM ]` toggle in the header, so that I can switch off all 3D tilt, camera shake, and perspective slashes at any time.
28. As a user whose operating system is set to `prefers-reduced-motion: reduce`, I want the application to automatically disable 3D tilts, camera motions, and screen shakes without requiring manual intervention, so that my accessibility preferences are respected.
29. As a user who relies on a screen reader, I want the 3D extruded title `MEDIA DROP` to be announced cleanly as a single "MediaDrop" heading without duplicate text, so that my assistive technology provides a seamless experience.
30. As a keyboard-only user navigating with the Tab key, I want high-contrast focus rings that match the oblique geometry, so that I can navigate with visual clarity.
31. As an operator or developer, I want all existing 38 integration and unit tests in the test suite to continue passing without regressions, so that application reliability is guaranteed.
32. As a developer, I want all 3D kinetic primitives organized into dedicated modules, so that motion logic can be maintained cleanly without cluttering core page logic.

## Implementation Decisions

### 1. Pure CSS 3D Viewport vs External 3D Runtimes
- All 3D transformations are implemented using native CSS3 3D transforms (`perspective`, `transform-style: preserve-3d`, `translate3d`, `rotate3d`).
- No Three.js or WebGL canvas contexts are loaded, guaranteeing 0MB added bundle weight and zero impact on initial load speed.

### 2. Scoped Camera Rig Container
- Perspective is applied to a dedicated Camera Rig wrapper enclosing only the main interactive workspace.
- Global navigation, site footer, modal dialogs, and full-screen wipes remain outside the perspective container to prevent z-index clipping and maintain viewport-fixed alignment.

### 3. Layered Depth Hierarchy (Z-Planes)
- Elements are mapped across discrete depth planes:
  - Background & Halftone Grid: `translateZ(-200px)` (1° parallax tilt)
  - Giant Typography: `translateZ(-50px)` (2° parallax tilt)
  - Active Surface & Cards: `translateZ(0px)` (4° parallax tilt)
  - Action Buttons: `translateZ(+50px)` (7° parallax tilt)

### 4. Desktop Parallax & Mobile Touch Safety
- Continuous mouse parallax and card hover tilt are strictly activated on pointer-fine devices via `@media (hover: hover) and (pointer: fine)`.
- Touch devices receive static 2.5D layered offsets with zero device orientation listeners, ensuring 60fps scrolling and zero battery degradation.

### 5. 3D Typography Layer Stacking
- The display headline is rendered with a 4-layer stack: Front face, Extrusion underlayer, Drop shadow, and Highlight specular layer.
- An animated staggered letter-by-letter overshoot (`M ➔ ME ➔ MED ➔ MEDIA`) executes on mount.
- A single semantic heading with an accessible label and `aria-hidden` attributes on decorative spans ensures 100% screen reader compliance.

### 6. Timed 3D Impact Sequence
- Primary action triggers follow a strict micro-timed sequence:
  - 0ms: Button physical compression (`translateZ(-8px)`)
  - 30ms: Tactile impact thud & micro-shake (40–80ms)
  - 70ms: High-contrast red flash
  - 100ms: 3D perspective slash wipe
  - 250ms: Camera settle & state reveal

### 7. Resource-Conscious Kinetic Favicon
- Dynamic tab icon alternates between `[M]` and `[M̸]` during active analysis using an in-memory SVG canvas data URI.
- Cycle runs strictly when analysis is active and the document is visible, reverting to the static favicon on completion, error, or tab switch.

### 8. Procedural Zero-Asset Tactical Audio Hook
- No external audio files or MP3s are downloaded.
- Procedural Web Audio API oscillator synthesis produces subtle cybernetic clicks (1200Hz ➔ 200Hz, 30ms) on key presses, muted by default or enabled via motion/sound settings.

## Testing Decisions

### What Makes a Good Test
- Tests must verify observable user behavior and accessibility contracts rather than internal component implementation details.
- Tests verify rendered HTML output across state phases, ensuring that required data attributes, role attributes, accessible labels, and semantic elements are present.
- Tests verify that 3D structural classes, depth containers, and accessibility labels are correctly populated without regressions.

### Testing Seams
- **Primary Testing Seam**: Server-Side Rendering (SSR) component integration via `vite.ssrLoadModule` and `react-dom/server.renderToStaticMarkup`. This is the highest existing frontend seam in the repository.
- **API Client Seam**: Global `fetch` mock intercepting requests to `/api/analyze`, `/api/download`, and `/api/jobs/*`.

### Prior Art
- All tests in `test/demo-flow.test.mjs` serve as the direct precedent and execution harness.
- Existing tests cover URL validation, platform detection, ResultCard states, API error codes, gallery carousels, and visual depth layers.

## Out of Scope

- External WebGL / Three.js 3D model loaders (.gltf / .obj).
- External downloaded audio files or MP3 sound packs.
- Backend API or extractor modifications.
- User accounts or authentication systems.

## Further Notes

- Architecture decision record documented in [docs/adr/0003-3d-kinetic-cinematic-architecture.md](file:///A:/ส่วนเสริมเขียนเอง/MediaDrop/docs/adr/0003-3d-kinetic-cinematic-architecture.md).
- Domain glossary terms updated in [CONTEXT.md](file:///A:/ส่วนเสริมเขียนเอง/MediaDrop/CONTEXT.md).
- Implementation tracking issues maintained in `docs/phase8.8.2.4.1/issues/`.
