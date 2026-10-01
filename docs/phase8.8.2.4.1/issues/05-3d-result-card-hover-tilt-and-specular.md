# Issue 05: 3D Result Card Overhaul with Hover Tilt & Specular Reflection

## Objective
Rebuild the Result Card into an extruded 3D object with cursor-following tilt, dynamic specular sheen, lateral entry animation, and 3D format selector cards.

## Scope of Work
1. Create `src/components/kinetic/PerspectiveCard.jsx`:
   - Wraps Result Card with 3D perspective and mouse tracking hook (`useTilt`).
   - Dynamically calculates `transform: rotateX(rx) rotateY(ry) translateZ(tz)`.
   - Projects dynamic radial gradient specular reflection based on cursor coordinate percentages `(x%, y%)`.
   - Hover lift effect (`translateZ(20px)`).
2. Integrate `PerspectiveCard` into `src/components/ResultCard.jsx`:
   - Preserve all existing attributes: `data-format-theme`, `.result-card`, `.pixel-border-layered`, `.p5-format-grid`.
   - Ensure media viewport (thumbnail, photo carousel, video preview) is counter-skewed to 0° to protect aspect ratios.
   - Smooth 3D entrance slam when transitioning from `analyzing ➔ result`.
3. 3D Format Selector & Option Cards:
   - Extruded format cards with press depth and glowing crimson highlight on selection.
   - Quality chips with beveled 3D borders.

## Verification
- Test all format selections (MP3, VIDEO, IMAGE, THUMBNAIL) and gallery carousel navigation.
- Ensure test suite verifies all format themes and options correctly.
