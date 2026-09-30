# 05: Layered Result Card, Oversized Format Selector & Media Lightbox

## Parent
docs/phase8.8.2.4/spec.md

## Triage
ready-for-agent

## What to build
Overhaul `ResultCard.jsx` with:
1. Oblique layered card container (`-4deg` skew, `#000` + dark red offset shadow).
2. Media preservation: counter-skew media viewports back to `0deg` so thumbnails and gallery items display without aspect ratio distortion.
3. Oversized format selector cards (`[ MP3 AUDIO ]`, `[ VIDEO MEDIA ]`, `[ IMAGE PHOTO ]`) with glowing red borders and `SELECTED` badges.
4. Quality selector badges with `★ Best (Recommended)` highlights.
5. Interactive full-resolution Lightbox modal for clicking thumbnails and gallery items, featuring keyboard arrow navigation (`Left`/`Right`/`Esc`), touch-swipe support on mobile, and in-modal HTML5 video playback for mixed carousel video slides.

## Acceptance criteria
- [ ] Thumbnails and carousel images render with `transform: skewX(0deg)`.
- [ ] Format options render oversized titles, sublabels, and active state indicators.
- [ ] Clicking a thumbnail opens the full-screen oblique Lightbox modal.
- [ ] Lightbox supports `ArrowLeft`, `ArrowRight`, and `Escape` keyboard shortcuts.
- [ ] Mixed Instagram carousels correctly surface the `[ VIDEO ]` badge and permit direct video playback in the modal.
- [ ] All existing ResultCard tests (format themer, gallery carousel, single photo, mixed album) pass.

## Blocked by
docs/phase8.8.2.4/issues/04-url-input-and-analyzing-scene.md
