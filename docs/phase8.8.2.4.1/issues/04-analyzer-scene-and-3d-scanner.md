# Issue 04: 3D Technical Analyzer Scene & Scanner Overhaul

## Objective
Transform the analyzing scene into a high-tech 3D scanner with multi-plane floating depth layers, progressive checklist stages, and tactile abort control.

## Scope of Work
1. Upgrade Analyzing Scene in `src/components/UrlInput.jsx`:
   - Enclose the analyzing container in a 3D perspective panel (`.p5-analyzing-panel`) with subtle floating motion.
   - Background 3D scanning grid with slow-moving diagonal scanlines and comic speed lines (generated via pure CSS/SVG).
   - Stepped progression (`01 PARSING`, `02 SCANNING`, `03 EXTRACTING`, `04 BUILDING`) with 3D marker badges.
   - Tactical abort control (`[ ABORT // 00 ]`) with instant impact response.
2. Maintain Testing Contract:
   - Ensure classes `.state-card`, `.pixel-border`, `.activity-bar`, and text `ANALYZING LINK...` are preserved for test assertions.

## Verification
- Test abort interaction returning cleanly to idle state.
- Test SSR output matching expected scanning markers.
