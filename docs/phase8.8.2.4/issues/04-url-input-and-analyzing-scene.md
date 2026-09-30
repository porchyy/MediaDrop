# 04: Tactical URL Input, Impact Sequence & Staged Analyzing Scene

## Parent
docs/phase8.8.2.4/spec.md

## Triage
ready-for-agent

## What to build
Upgrade `UrlInput.jsx` with:
1. Skewed tactical URL input field with valid check indicator and cyan paste button.
2. Tactical micro-warning on clipboard denial (`↳ CLIPBOARD LOCKED // PASTE MANUALLY`).
3. Tactile impact sequence on ANALYZE click: button compress (0ms) ➔ red flash (50ms) ➔ diagonal slash wipe (100ms) ➔ analyzing state (250ms).
4. Staged analyzing scene replacing static spinners with a 4-step progressive scanner (`01 PARSING`, `02 SCANNING`, `03 EXTRACTING`, `04 BUILDING`), progress fill, URL fragment indicator, and tactical abort button (`[ ABORT // 00 ]`).
5. Red hazard-striped error state with error code and immediate `[ TRY AGAIN ]` action.

## Acceptance criteria
- [ ] Submitting a URL triggers the impact flash and diagonal slash transitions.
- [ ] Analyzing scene enforces a minimum display duration (~750ms) before resolving to the result card.
- [ ] Stepper steps advance with animated checkmarks.
- [ ] Clicking `[ ABORT // 00 ]` cancels the in-flight request and returns to the idle state immediately.
- [ ] Error state renders the hazard strip and error code while preserving `error-card pixel-border` selectors.
- [ ] Existing tests in `test/demo-flow.test.mjs` regarding URL validation and error mapping pass without error.

## Blocked by
docs/phase8.8.2.4/issues/02-kinetic-primitives.md
