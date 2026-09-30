# 07: Accessibility, Reduced Motion & Test Suite Verification

## Parent
docs/phase8.8.2.4/spec.md

## Triage
ready-for-agent

## What to build
Implement comprehensive accessibility rules, motion guards, and run the test harness:
1. Skewed focus-visible rings (`outline: 2px solid var(--p5-white)`) matching the `-4deg` element angle.
2. Auto-Calm mode activation when `saveData` connection is detected.
3. Verify full support for `prefers-reduced-motion: reduce` and manual `[ MOTION: DYNAMIC / CALM ]` toggle.
4. Execute `npm test` across all 33 tests in `test/demo-flow.test.mjs` to ensure 100% pass rate.
5. Execute `npm run build` to confirm clean production bundling under budget (<10 kB gzipped CSS).

## Acceptance criteria
- [ ] Tabbing through all interactive elements displays skewed focus-visible rings.
- [ ] Activating calm mode suppresses all slashes, camera shakes, and magnetic transforms.
- [ ] All 33 unit and integration tests pass with 0 failures.
- [ ] `npm run build` completes successfully.

## Blocked by
docs/phase8.8.2.4/issues/01-visual-tokens-and-typography.md, docs/phase8.8.2.4/issues/02-kinetic-primitives.md, docs/phase8.8.2.4/issues/03-hero-and-navigation-overhaul.md, docs/phase8.8.2.4/issues/04-url-input-and-analyzing-scene.md, docs/phase8.8.2.4/issues/05-result-card-and-media-lightbox.md, docs/phase8.8.2.4/issues/06-download-flow-and-success-state.md
