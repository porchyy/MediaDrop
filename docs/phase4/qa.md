# Phase 4 QA — 2026-09-25

**Overall status: PASS — pending real-device check.** Browser QA, automated checks, and the production build passed. Real-device verification has not been reported yet.

## Browser result

Chrome 154 was checked with emulated CSS viewports. No browser-testing package was added to the project.

| Width | Dark | Light | Checked |
| --- | --- | --- | --- |
| 360 px | Pass | Pass | Idle and Result fit; Format and Quality stay on one row; thumbnail is 16:9 |
| 390 px | Pass | Pass | Same checks |
| 430 px | Pass | Pass | Same checks |
| 768 px | Pass | Pass | Idle and Result fit; selectors stay on one row |
| 1024 px | Pass | Pass | Same checks |
| 1440 px | Pass | Pass | Same checks |
| 1920 px | Pass | Pass | Same checks |

Across all 14 width/theme combinations, the document did not scroll horizontally and the Result Card remained inside the viewport. Screenshots were visually inspected at 360 px dark and 390 px light.

## Flow and interaction

- Pass: empty and invalid URLs show INVALID LINK near the input; the reserved demo URLs show UNSUPPORTED MEDIA and SOMETHING WENT WRONG.
- Pass: Analyze → Result → MP3 → 320 kbps → Preparing → Demo ready → New Link.
- Pass: Clear during Analyzing prevents a canceled Result Card from appearing; editing the URL removes an existing Result Card.
- Pass: Analyze button dimensions are the same before and during Analyzing.
- Pass: the long-title demo URL wraps to three lines at 360 px; a very long URL and all three Format/Quality sets stay within the viewport.
- Pass: Tab, Shift+Tab, Enter and Space reach and activate the tested controls; a focused Format control has a visible outline.
- Pass: Result scrolls into view when its heading is outside a 500 px viewport. Reduced-motion mode hides the activity animation and uses immediate scrolling.
- Pass: `npm test` and `npm run build`. The local and Wi-Fi preview URLs both returned HTTP 200.

## Device check

Open `http://192.168.0.81:5173/` on a phone connected to the same Wi-Fi. Report the device model and browser. Record screenshots only if a problem appears.

| Check | Result |
| --- | --- |
| Device / browser | Pending |
| Dark and Light contrast on the phone display | Pending |
| Portrait and Landscape, including one rotation | Pending |
| Touch targets: MP3, VIDEO, IMAGE, and every Quality choice | Pending |
| URL input with the mobile keyboard open; no obstructed controls or harsh layout jump | Pending |
| Analyze and auto-scroll to Result | Pending |
| Full flow through Demo ready and New Link | Pending |
| Clear during Analyzing and Preparing | Pending |
| Long title from `https://example.com/long-title` | Pending |
| Header/Footer against the screen edge, notch, and browser bar | Pending |
| Refresh without layout distortion | Pending |
| Horizontal overflow | Pending; target: none |
| Paste button and Clipboard permission | Needs a secure origin; cannot be verified through the LAN HTTP URL |

Clipboard limitation: the Paste button uses `navigator.clipboard.readText()`. In Chrome, `http://127.0.0.1:5173/` reported a secure context with `navigator.clipboard` available, while `http://192.168.0.81:5173/` reported an insecure context with `navigator.clipboard` undefined. The [Clipboard API specification](https://www.w3.org/TR/clipboard-apis/) requires a secure context. Test Paste from an HTTPS origin or a trustworthy localhost origin on the phone; a permission result from the LAN HTTP preview cannot count as a pass.

**Real-device verification: PENDING.** Mark it PASS only after the device checks are reported and the Clipboard test is resolved on a secure origin.
