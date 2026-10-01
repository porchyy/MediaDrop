# Issue 01: 3D Foundation & Depth Layering System

## Objective
Establish the foundational CSS 3D perspective, hardware-accelerated tokens, depth planes (`Z: -200` to `Z: +50`), and mouse parallax hooks.

## Scope of Work
1. Create `src/styles/perspective.css`:
   - Define CSS variables: `--p5-perspective: 1200px`, `--p5-transform-style: preserve-3d`.
   - Define depth plane utility classes: `.depth-bg` (`translateZ(-200px)`), `.depth-typography` (`translateZ(-50px)`), `.depth-surface` (`translateZ(0px)`), `.depth-action` (`translateZ(50px)`).
   - Integrate `perspective.css` into `src/index.css`.
2. Create `src/hooks/useParallax.js`:
   - Tracks cursor movement on desktop using `requestAnimationFrame`.
   - Computes clamped rotation angles based on layer depth (Background: 1°, Typography: 2°, Card: 4°, Button: 7°).
   - Returns neutral (0, 0) during calm motion or on touch devices (`@media (hover: hover) and (pointer: fine)`).
3. Create `src/hooks/useTilt.js`:
   - Computes 3D tilt angles (`rotateX`, `rotateY`) and normalized specular highlight coordinates `(x%, y%)`.
   - Includes smooth spring-back on pointer leave.
4. Create `src/hooks/useMotionMode.js`:
   - Centralizes `DYNAMIC` vs `CALM` detection from `localStorage` and `prefers-reduced-motion`.
5. Create `src/components/kinetic/DepthLayer.jsx`:
   - React wrapper component applying depth transform and mouse parallax offsets to child elements.
6. Create `src/components/kinetic/ParallaxLayer.jsx`:
   - Viewport-aware parallax coordinate distributor.

## Verification
- SSR rendering check in Node environment (`typeof window === 'undefined'` guard).
- All 38 existing tests pass without regressions.
