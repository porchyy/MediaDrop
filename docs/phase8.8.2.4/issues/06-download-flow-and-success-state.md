# 06: Download Transfer Impact, Packaging ZIP Scene & File Ready Completion

## Parent
docs/phase8.8.2.4/spec.md

## Triage
ready-for-agent

## What to build
Enhance the download flow in `ResultCard.jsx`:
1. Magnetic CTA buttons on all download actions (`DOWNLOAD VIDEO`, `CURRENT IMAGE`, `ALL IMAGES (.ZIP)`).
2. Live transfer scene with activity bar and percentage ticker.
3. Dedicated `PACKAGING XX PHOTOS INTO .ZIP` state representation for gallery archive generation.
4. Tactical in-progress abort button `[ CANCEL DOWNLOAD // 00 ]`.
5. High-impact `FILE READY` success state with file size, 30-minute expiration notice, prominent mint-accented `[ DOWNLOAD FILE ]` CTA, and a clear `[ EXTRACT ANOTHER LINK // ESC ]` button that sweeps the view clean.

## Acceptance criteria
- [ ] Clicking download triggers magnetic active compression and initiates the transfer scene.
- [ ] ZIP bundling jobs display dedicated packaging progress.
- [ ] In-progress download jobs can be cancelled via the abort button, calling `/api/jobs/{id}/cancel`.
- [ ] File ready state displays filename, formatted file size, and expiration time.
- [ ] Re-entry button resets the application back to the idle state.
- [ ] All download state tests in `test/demo-flow.test.mjs` pass without error.

## Blocked by
docs/phase8.8.2.4/issues/05-result-card-and-media-lightbox.md
