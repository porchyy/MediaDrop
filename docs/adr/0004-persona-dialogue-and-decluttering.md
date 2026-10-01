# ADR 0004: Persona 5 Authentic Dialogue System & Interface Decluttering

**Date**: 2026-10-01
**Status**: Accepted
**Phase**: 8.8.2.4.2

## Context

Phase 8.8.2.4.1 established a 2.5D kinetic depth and camera perspective system. However, the interface still carries residual artifacts from the previous Retro Pixel era (8-bit square stars `✦`, square dots `▪`, outdated footer slogans `FAST & COLORFUL`, and duplicate guide steps). Furthermore, the application lacks an authentic Persona 5 signature interaction: the iconic **Asymmetrical Comic Dialogue Box** with tactical status commentary, speaker nameplate, and animated prompt indicator.

## Decision

We adopt the **Persona 5 Authentic Dialogue & Interface Decluttering Architecture**:

1. **Authentic Persona 5 Dialogue Box (`P5DialogueBox`)**:
   - Replaces the flat informational `url-hint` and standard `error-panel`.
   - Built as an asymmetrical polygon container with a thick white border, crimson offset shadow, speaker nameplate (`[ NAVI // SYSTEM ]`), sharp directional tail pointing to the console, and a pulsing prompt indicator in the bottom-right corner.
   - Snappy punch-in text reveal (~150ms micro-stagger) to ensure zero reading delay for power users.
   - Original, copyright-safe SVG Phantom Mask and Radar Wave icon beside the speaker nameplate.

2. **Interface Decluttering & Pruning**:
   - Remove duplicate Step Guide Strip visual rendering, consolidating procedural guidance into the dynamic P5 Dialogue Box while preserving semantic `nav.step-guide-strip` DOM tags for test suite compatibility.
   - Replace 8-bit square stars (`✦`) and square dots (`▪`) with sharp geometric angular cuts, speed lines, and halftone patterns.
   - Modernize footer branding to `PHANTOM MEDIA ENGINE // TAKE YOUR MEDIA`.

3. **Tactical Console & Heist Copywriting**:
   - The URL input becomes a tactical command console with a `[ TARGET URL ]` corner badge, `[ INFILTRATE // PASTE ]` action, and an angular `[ RESET // 00 ]` control.
   - Result Card actions use cohesive Heist terminology (`TARGET SECURED // FILE DETECTED`, `TAKE OVER // DOWNLOAD`, `MISSION COMPLETE // GET FILE`, `[ NEW INFILTRATION // ESC ]`).
   - High-quality Thai localization rendered in `IBM Plex Sans Thai` with sharp, game-grade phrasing.

## Consequences

- **Positive**:
  - Dramatic increase in Persona 5 aesthetic immersion and brand distinctiveness.
  - Reduced visual clutter and eliminated redundant text repetition.
  - Fully accessible: Screen readers receive clean contextual narration.
  - Zero test regressions: Semantic contracts and assertion substrings are strictly preserved.
- **Negative / Risks**:
  - Asymmetrical polygon clip-paths must be carefully tuned to prevent clipping long translated Thai strings.
