# 01: Persona Kinetic Design Tokens, Halftone Background & Typography Setup

## Parent
docs/phase8.8.2.4/spec.md

## Triage
ready-for-agent

## What to build
Define the master Persona 5 Kinetic color palette tokens, oblique geometry utilities, halftone background layer, and typography loading in the frontend codebase. Load `Bebas Neue` alongside `IBM Plex Sans Thai` with CSS `unicode-range` rules, configure `--ease-p5` cubic-bezier easing tokens, and update `tailwind.config.js` and `index.html`.

## Acceptance criteria
- [ ] CSS variables for Deep Black (`#080808`), Off-White (`#F4F1E8`), Crimson Red (`#E20B17`), and Dark Red (`#8E0710`) are defined in `:root` and `.dark`.
- [ ] Google Fonts link in `index.html` loads `Bebas Neue` without blocking rendering.
- [ ] Tailwind theme extends `fontFamily.display` and `colors.p5` tokens.
- [ ] CSS utility classes for `-4deg` skew, counter-skew, and clipped polygon corners are defined.
- [ ] `.bg-depth-layer` renders a subtle halftone dot grid and diagonal slash textures while satisfying existing test assertions.
- [ ] `npm test` continues to pass with no regressions.

## Blocked by
None (can start immediately)
