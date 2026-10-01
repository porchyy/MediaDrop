# Issue 02: Cinematic Transitions, Camera Rig & Screen Shake

## Objective
Implement dynamic camera state changes, the 3D slash wipe overlay, and high-impact micro-shakes.

## Scope of Work
1. Create `src/components/kinetic/CameraTransition.jsx`:
   - Scoped 3D perspective viewport wrapper around `<main className="main-content">`.
   - Transitions camera smoothly according to phase:
     - `idle ➔ analyzing`: focal zoom (1.00 ➔ 1.04x, -1.5° rotation), spring back in 250ms.
     - `analyzing ➔ result`: lateral card slam and settle.
   - Disabled cleanly when `motion-calm` is active.
2. Upgrade `src/components/kinetic/SlashTransition.jsx`:
   - Add 3D perspective mask with motion shadow, red edge, and angular speed lines.
   - Retain backward-compatible `.slash-transition-overlay` and `.slash-bar` selectors.
3. Create `src/components/kinetic/ScreenShake.jsx`:
   - Triggers a momentary micro-shake (40–80ms) upon impact events.
   - Enforces zero layout reflow by transforming `translate3d(dx, dy, 0)` only.
4. Upgrade `src/components/kinetic/ImpactFlash.jsx`:
   - Calibrate impact timing sequence: 0ms click ➔ 30ms impact ➔ 70ms flash ➔ 100ms slash ➔ 250ms settle.

## Verification
- Test state transitions in `UrlInput.jsx`.
- Verify full-screen modals (`LightboxModal`, `Header`) remain untransformed and crisp.
