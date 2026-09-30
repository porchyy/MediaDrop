# 02: Reusable Kinetic Primitives Module

## Parent
docs/phase8.8.2.4/spec.md

## Triage
ready-for-agent

## What to build
Construct a suite of reusable motion and interaction primitives in a dedicated kinetic module directory (`src/components/kinetic/`):
1. `MagneticButton`: Pointer tracking button wrapper with clamped 4–8px offset and hover badge tag (`↳ ACTION`).
2. `SlashTransition`: Three-bar skewed crimson slash wipe overlay (`////////`).
3. `ImpactFlash`: High-energy 120ms red screen flash for action impact.
4. `GlitchText`: Text reveal component with momentary horizontal slice displacement and RGB offsets.
5. `StatusTag`: Slanted tactical micro-labels.
6. `HalftoneLayer`: Crisp SVG-based comic dot matrix background overlay.

## Acceptance criteria
- [ ] `MagneticButton` tracks pointer offset smoothly and resets on pointer leave.
- [ ] `MagneticButton` bypasses transform calculations under calm mode or touch devices (`hover: none`).
- [ ] `SlashTransition` executes a 380ms diagonal wipe sequence when triggered.
- [ ] `ImpactFlash` renders a brief red flash without blocking click events.
- [ ] `GlitchText` renders base text with transient slice animations upon prop/text changes.
- [ ] `HalftoneLayer` renders crisp scalable dot pattern via SVG with zero asset downloads.

## Blocked by
docs/phase8.8.2.4/issues/01-visual-tokens-and-typography.md
