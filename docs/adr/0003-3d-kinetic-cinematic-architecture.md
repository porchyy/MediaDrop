# ADR 0003: 3D Kinetic & Cinematic UI Architecture

**Date**: 2026-10-01
**Status**: Accepted
**Phase**: 8.8.2.4.1

## Context

Phase 8.8.2.4 established a Persona-inspired 2D kinetic visual identity with `-4deg` skew, solid offset shadows, and snappy transitions. However, user feedback and design direction require the application to feel like an active, physical, tactile "operating system" with 2.5D depth, camera perspective, physical card extrusion, and responsive 3D tilt.

A major technical question is whether to introduce WebGL / Three.js or achieve this through pure hardware-accelerated CSS 3D transforms (`perspective`, `transform-style: preserve-3d`), requestAnimationFrame hooks, and SVG graphical masks. Another key decision is how to scope the 3D perspective container without breaking fixed viewport overlays (modals, slash wipes, headers) or causing performance/battery regressions on mobile devices.

## Decision

We adopt a **Pure CSS 3D & Scoped Camera Rig Architecture** governed by the following decisions:

1. **Pure CSS 3D over Three.js / WebGL**:
   - We avoid Three.js or heavy Canvas WebGL runtimes to keep bundle size 0MB and preserve fast first contentful paint (FCP).
   - 2.5D spatial depth is created with CSS `perspective: 1200px`, `transform-style: preserve-3d`, and hardware-accelerated transforms (`translate3d`, `rotateX`, `rotateY`).

2. **Scoped Camera Rig Isolation**:
   - The 3D perspective container is scoped exclusively to the interactive workspace (`<CameraTransition>` wrapping the main content area).
   - Fixed-position viewport elements (`<Header>`, `<Footer>`, `<SlashTransition>`, `<ImpactFlash>`, and `<LightboxModal>`) remain outside the 3D perspective context, ensuring rock-solid viewport pinning and zero visual warping of dialogs.

3. **Layered Depth Hierarchy (Z-Planes)**:
   - UI elements are mapped across discrete depth planes:
     - Background / Halftone Grid: `Z: -200px` (parallax factor 1°)
     - Giant Typography: `Z: -50px` (parallax factor 2°)
     - Active Input / Result Card: `Z: 0px` (parallax factor 4°)
     - Primary Interactive Buttons: `Z: +50px` (parallax factor 7°)

4. **Desktop-Only Parallax & Mobile Touch Safety**:
   - Continuous mouse parallax and card hover tilt are strictly activated on pointer-fine devices via `@media (hover: hover) and (pointer: fine)`.
   - On touchscreens and mobile devices, the interface falls back to static 2.5D layered offsets without continuous gyroscope or touch event listeners, ensuring 60fps scrolling and zero battery degradation.

5. **Timed 3D Impact Sequence**:
   - Primary action triggers follow a strict micro-timed sequence:
     - 0ms: Button physical compression (`translateZ(-8px)`)
     - 30ms: Tactile impact thud & micro-shake (40–80ms)
     - 70ms: High-contrast red flash
     - 100ms: 3D perspective slash wipe
     - 250ms: Camera settle & state reveal

6. **Resource-Conscious Kinetic Favicon**:
   - Dynamic tab icon alternates between `[M]` and `[M̸]` during active analysis using an in-memory SVG canvas data URI.
   - Cycle runs strictly when `phase === 'analyzing'` and `document.visibilityState === 'visible'`, reverting to the static favicon on completion, error, or tab switch.

7. **Procedural Zero-Asset Tactical Audio Hook (`useKineticSound`)**:
   - No external audio files or MP3s are downloaded.
   - Procedural Web Audio API oscillator synthesis produces subtle cybernetic clicks (1200Hz ➔ 200Hz, 30ms) on key presses, muted by default or enabled via motion/sound settings.

## Consequences

- **Positive**:
  - Dramatic, tactile 2.5D cinematic immersion without bloating the bundle.
  - Full compatibility with existing integration tests and SSR rendering.
  - Zero mobile performance regressions and respectful battery usage.
  - Screen-reader accessible: 3D typography and extrusions use clean `aria-label` and `aria-hidden` tags.
- **Negative / Risks**:
  - Stacking contexts must be monitored closely to prevent z-fighting between 3D layers and native input elements.
  - Mouse coordinates must be clamped smoothly to prevent abrupt card flipping.
