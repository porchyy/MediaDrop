# MediaDrop — Phase 4: Responsive and UX QA

## Problem Statement

MediaDrop has a complete demo flow, but its layout and interactions have not been checked across desktop, tablet, and mobile screens. A narrow viewport, long URL or media title, keyboard navigation, or a state transition could make the Result Card difficult to use, hide controls, or leave stale content visible. Users need the existing flow to work reliably before Backend/API work begins.

## Solution

Polish and verify the existing one-page demo at mobile, tablet, and desktop widths in light and dark themes. On mobile, show the full-width 16:9 thumbnail above media information and keep Format, Quality, and action controls within the viewport. Make long content fit, focus visible, state transitions understandable, and reset behavior reliable. Use the existing mock flow for manual browser QA, plus one real-phone check. Keep the product a demo: Demo preview and Demo ready must remain clearly labeled.

## User Stories

1. As a mobile user, I want the entire page to fit a 360 px viewport, so that I do not need horizontal scrolling.
2. As a mobile user, I want the Result Card to fit at 390 and 430 px, so that I can use it on common phone widths.
3. As a tablet user, I want the page to fit at 768 and 1024 px, so that controls remain usable at both widths.
4. As a desktop user, I want the page to remain balanced at 1440 and 1920 px, so that the content is easy to scan.
5. As a user, I want the layout to work in light and dark themes at each target width, so that content and selected controls stay legible.
6. As a mobile user, I want the thumbnail above the media information and across the Result Card's usable width, so that I can identify the media without a cramped two-column layout.
7. As a mobile user, I want the thumbnail to keep a 16:9 shape, so that the placeholder looks like media artwork.
8. As a user, I want the media title, duration, and type visible beneath the thumbnail on mobile, so that I can confirm the Demo preview.
9. As a user, I want a media title of two or three lines to wrap inside the Result Card, so that it cannot widen or clip the card.
10. As a user, I want a very long URL to stay inside its input, so that it cannot create page-level horizontal scrolling.
11. As a mobile user, I want the three Format choices to fit on one row at 360–430 px, so that I can compare them at once.
12. As a mobile user, I want the three Quality choices for each Format to fit on one row at 360–430 px, so that the selected option is easy to see.
13. As a touch user, I want Format, Quality, and action controls large enough to tap comfortably, so that I can use the flow without precision taps.
14. As a user, I want Analyze to keep a stable width and height while its label becomes Analyzing, so that the page does not visibly jump.
15. As a user, I want the Result Card to appear without a harsh layout jump, so that I can continue from the input to the result naturally.
16. As a user, I want a new Result Card brought into view only when its heading is outside the viewport, so that I can find the result without unnecessary scrolling.
17. As a user who prefers reduced motion, I want automatic movement and decorative animation reduced, so that the flow stays comfortable.
18. As a user, I want an empty URL and an invalid URL to show the existing error near the URL field, so that I know what to fix.
19. As a user, I want a valid URL to pass through Analyzing before the Result Card appears, so that the wait is understandable.
20. As a user, I want to switch from VIDEO to MP3 and choose 320 kbps, so that the active Format and Quality are visually clear.
21. As a user, I want Download to pass through Preparing and end at Demo ready, so that the full demo flow is understandable.
22. As a user, I want New Link to return to a fresh input, so that I can start another demo flow.
23. As a user, I want Clear during Analyzing to return to idle and prevent the canceled result from appearing later, so that a reset is dependable.
24. As a user, I want editing the URL after a Result Card appears to remove the old result, so that the page does not suggest that stale media belongs to the new URL.
25. As a keyboard user, I want Tab and Shift+Tab to reach all available controls in a sensible order, so that I can navigate without a mouse.
26. As a keyboard user, I want Enter and Space to activate Analyze, Format, Quality, Download, Clear, and New Link where applicable, so that the full demo works from the keyboard.
27. As a keyboard user, I want a clear visible focus indicator on the input and every control, so that I always know where I am.
28. As a user on a real phone, I want the same demo flow to fit and respond to touch, so that desktop responsive mode is backed by a device check.

## Implementation Decisions

- Keep the existing one-page layout, Result Card, Format and Quality controls, six UI states, pixel style, and theme behavior. Make only changes needed to meet the QA criteria.
- At mobile widths of 360–430 px, stack the Result Card thumbnail above its title and metadata. Use the card's usable width for a 16:9 thumbnail. Keep the three Format controls and each set of three Quality controls in single rows without overflow; retain readable labels and comfortable touch targets.
- Contain long URL text within the input. Allow long media titles to wrap, including long uninterrupted text, without widening the Result Card.
- Reserve `https://example.com/long-title` as a mock Analyze URL that returns a deliberately long title. It is a QA fixture, not a new visible feature. Other existing demo URLs retain their current behavior.
- Keep the Analyze button's outer size stable across idle and Analyzing. Keep errors adjacent to the URL input and avoid a strong visual jump when Result Card appears.
- When Analyze produces a Result Card, bring its heading into view only if that heading is outside the viewport. Use smooth movement where permitted; use immediate movement when reduced motion is requested. Do not force focus away from the user's current control.
- Preserve native button behavior and visible focus styles for keyboard use. Ensure the theme toggle and Paste control remain reachable and understandable as part of page QA.
- Keep Clear and New Link reset semantics from Phase 3. Clear during Analyzing must cancel the pending result; editing the URL after Result must remove that Result Card.
- Use browser responsive mode for the width matrix, then verify on at least one real phone in its primary browser. Provide a LAN-accessible local preview and concise check steps for the phone check when implementing Phase 4.

## Testing Decisions

- Judge tests by visible behavior: whether content fits, controls respond, states progress, and reset removes stale results. Avoid assertions about class names, internal timers, or React state variables.
- Use the complete browser flow as the primary seam: empty or invalid URL; valid Analyze → Result → MP3 → 320 kbps → Download → Preparing → Demo ready → New Link; Clear during Analyzing; and editing the URL after Result.
- Manually check 360, 390, 430, 768, 1024, 1440, and 1920 px in both light and dark themes. Inspect Result Card, thumbnail, Format, every Quality set, input, errors, buttons, focus, and page-level horizontal overflow in relevant states.
- Manually check Tab, Shift+Tab, Enter, and Space on all active controls. Confirm focus is visible and the order follows the visual flow. Check reduced-motion behavior in browser settings.
- Use the long-title demo URL and a very long URL input for overflow checks. Verify a two-to-three-line title and an uninterrupted long segment do not push the Result Card beyond the viewport.
- Record pass/fail for each viewport and theme. Capture a screenshot for each defect and note its state and width; fix and recheck affected cases.
- Complete a real-phone check on at least one device connected to the same local network. The implementer can prepare the preview URL and instructions; final acceptance waits for the device result or screenshots from the user.
- Reuse the existing Node test for URL validation and mock Result Card behavior as prior art. Add only a small behavior check if the long-title fixture or another nontrivial rule needs it. Run the existing test command and production build after implementation.

## Out of Scope

- Backend/API integration, real media analysis, real downloads, and real thumbnail data.
- New pages, major visual redesign, new Format or Quality choices, and new product features.
- Adding Playwright, browser automation packages, or other dependencies solely for this phase.
- Supporting legacy browsers or a broad device lab beyond the agreed browser and phone check.

## Further Notes

- Implementation and QA status are tracked separately from this specification.
- Chrome/Edge desktop and the primary browser on one real phone are the agreed browser targets.
- Keep Demo preview and Demo ready wording honest until Backend/API work replaces the mock flow.
