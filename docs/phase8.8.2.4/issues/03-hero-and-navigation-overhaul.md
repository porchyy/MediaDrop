# 03: Hero Editorial Composition & Navigation Overhaul

## Parent
docs/phase8.8.2.4/spec.md

## Triage
ready-for-agent

## What to build
Overhaul `Hero.jsx`, `Header.jsx`, `Footer.jsx`, and `SupportedFormats.jsx` into Persona-inspired editorial compositions:
1. `Hero`: Giant `MEDIA DROP` display typography, slanted crimson ribbon preserving `PASTE • PICK • DOWNLOAD` and `✦` decorative stars, and technical stamps (`//01 MEDIA ENGINE`).
2. `Header`: Crimson-bordered HUD with `ONLINE` status badge and interactive `[ MOTION: DYNAMIC / CALM ]` toggle button.
3. `Footer`: Slanted brand badge preserving `FAST & COLORFUL` and `✦`.
4. `SupportedFormats`: Skewed format identity cards (`MP3`, `Video`, `Image`) and semantic step guide strip (`01 PASTE ➔ 02 PICK ➔ 03 DOWNLOAD`).

## Acceptance criteria
- [ ] Hero renders giant `MEDIA DROP` typography alongside the required subtitle and star glyphs.
- [ ] Header renders the `ONLINE` status badge and accessible motion mode switcher.
- [ ] Footer renders editorial styling while retaining existing copyright and brand strings.
- [ ] SupportedFormats maintains semantic `nav.step-guide-strip` and `ol.step-guide-list`.
- [ ] All existing test assertions for Hero, Header, Footer, and SupportedFormats in `test/demo-flow.test.mjs` pass.

## Blocked by
docs/phase8.8.2.4/issues/02-kinetic-primitives.md
