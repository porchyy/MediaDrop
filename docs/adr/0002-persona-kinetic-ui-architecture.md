# ADR 0002: Persona-Inspired Kinetic UI Architecture

**Date**: 2026-09-30
**Status**: Accepted
**Phase**: 8.8.2.4

## Context

Prior to Phase 8.8.2.4, MediaDrop employed a "Retro Pixel" visual design language featuring `Press Start 2P`, 4px solid box shadows, neon purple/pink/cyan accents, and a standard light/dark mode toggle. While functional and nostalgic, the presentation resembled standard SaaS downloaders with pixel skins and lacked an unmistakable, bold brand signature.

Phase 8.8.2.4 aims to transform MediaDrop into an unmistakable, tactile, and dramatic web application inspired by the kinetic UI design of *Persona 5*, featuring aggressive diagonal cuts, high-contrast comic halftone textures, dramatic transition sequences, and instant tactile feedback on every user action.

## Decision

We adopt a **Persona-Inspired Kinetic UI Architecture** with the following system boundaries:

1. **Color Palette & Visual Balance (70/20/10 Rule)**:
   - 70% Deep Black (`#080808` / `#121212`)
   - 20% Off-White Parchment (`#F4F1E8`)
   - 10% Crimson Red (`#E20B17` / `#8E0710`)
   - Targeted functional accents for media formats: Cyan (`#35D7FF`) for Image, Purple (`#9D63FF`) for Video, Pink (`#FF4E91`) for Audio.

2. **Typography Hierarchy**:
   - **Display / Giant Headlines**: `Bebas Neue` (Condensed Heavy Sans) for dramatic punch and oblique styling.
   - **Body / Thai Localization**: `IBM Plex Sans Thai` for high-legibility interface text and metadata.

3. **Motion Engine & Performance Budget**:
   - Zero additional heavyweight runtime libraries (no Framer Motion or GSAP).
   - Motion is achieved via hardware-accelerated pure CSS (`transform`, `opacity`, `clip-path`) and lightweight React hooks (`requestAnimationFrame` for subtle 4–8px magnetic pull).
   - Full support for `prefers-reduced-motion` and an in-app `[ MOTION: DYNAMIC / CALM ]` toggle in the header.

4. **Staged Dramatic Sequences**:
   - Analyze action triggers an immediate tactile sequence: button compress (0ms) ➔ red flash (50ms) ➔ diagonal slash (100ms) ➔ analyzing scene (250ms).
   - The Analyzing Scene provides a minimum presentation window (~750ms) with phased progress steps (`01 PARSING`, `02 FINDING`, `03 EXTRACTING`, `04 BUILDING`) and an abort button (`[ ABORT // 00 ]`).

5. **Layered Skew Geometry & Media Preservation**:
   - Outer card frames and accent badges are oblique (-4deg skew, clipped polygon corners, solid offset drop-shadows).
   - Media viewports (thumbnails, TikTok/Instagram gallery carousels, video player elements) counter-skew back to 0deg to preserve authentic aspect ratios and prevent media distortion.

6. **Evolutionary Test Compatibility**:
   - Retain all existing semantic and data attributes (`data-format-theme`, `analyze-btn`, `pixel-border-layered`, `step-guide-strip`) ensuring the existing 33-test suite continues passing without regressions.

## Consequences

- **Positive**:
  - Unmistakable, dramatic brand identity that sets MediaDrop apart from generic downloaders.
  - Consistent motion language across hover, click, transition, loading, result slam, and error states.
  - Zero performance regression: clean CSS transforms and zero heavy library bloat.
  - Accessible: respects user motion preferences seamlessly.
- **Negative / Risks**:
  - Skewed and angled elements require careful counter-skewing and overflow management to prevent mobile layout shifts.
  - High contrast requires careful color tuning for secondary labels to maintain WCAG contrast standards.
