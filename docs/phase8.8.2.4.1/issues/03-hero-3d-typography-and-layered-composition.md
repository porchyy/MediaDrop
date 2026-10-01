# Issue 03: Hero 3D Typography & Layered Composition

## Objective
Elevate the Hero section into a cinematic 3D composition with extruded typography, staggered letter overshoot, and multi-plane depth accents.

## Scope of Work
1. Upgrade `src/components/Hero.jsx`:
   - Structure display title `MEDIA DROP` with layered 3D depth:
     - Front face layer (crisp off-white)
     - Extrusion depth layer (stacked solid red/black offset)
     - Highlight specular layer
   - Staggered letter reveal keyframes on mount (`M ➔ ME ➔ MED ➔ MEDIA`) with slight elastic overshoot.
   - Retain single semantic `<h1 className="hero-headline p5-hero-giant-title" aria-label="MediaDrop">`.
   - Mark decorative letter spans with `aria-hidden="true"`.
2. Depth Separation in Hero:
   - Ambient Halftone Layer: `Z: -200px`
   - Decorative tags (`SYS / 8.8`, `READY`, stars `✦`): `Z: -100px`
   - Giant Title: `Z: -50px`
   - Crimson Subtitle Ribbon (`PASTE • PICK • DOWNLOAD`): `Z: 0px`
3. Maintain test compatibility:
   - Ensure `.hero-section`, `.p5-hero-giant-title`, `.hero-subtitle`, `.hero-star--left`, and text `PASTE • PICK • DOWNLOAD` remain present in DOM.

## Verification
- SSR test suite verification for Hero elements.
- Verify typography scales properly on mobile screens (down to 320px width) without horizontal overflow.
