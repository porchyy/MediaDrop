# Phase 8.6: Colorful Pixel UI Redesign

## Problem Statement

After establishing a solid functional foundation in Phase 7 and refining basic layout proportions in Phase 8.5, MediaDrop's visual identity remains visually stark and monotone:
1. **Cold & Monolithic Theme**: The application uses a generic dark/light monotone palette that lacks the playful, vibrant energy of modern retro-arcade and pixel-art web experiences (such as Pixel Bloom).
2. **Flat Feedback on Format Selection**: When switching between MP3, VIDEO, and IMAGE/THUMBNAIL, the Result Card remains predominantly static with a single neutral accent, missing an opportunity to give users instant visual confirmation of the media format they are working with.
3. **Muted Primary Actions**: The initial `ANALYZE` trigger and final `DOWNLOAD` action blend into the surrounding interface rather than standing out as confident, tactile calls-to-action.
4. **Harsh CRT Overlay Degradation**: The full-screen CRT scanline overlay dampens pastel colors, adds visual noise, and degrades the sharpness of Thai typography (`IBM Plex Sans Thai`), creating visual fatigue rather than charm.
5. **Sterile Light Mode**: The light mode defaults to plain utilitarian grays and whites, clashing with the retro-fun identity of the product.

## Solution

Transform MediaDrop into a vibrant, high-utility **Colorful Pixel** experience inspired by playful retro-modern aesthetics while strictly maintaining its zero-friction downloader workflow:

1. **Deep Space Navy & Cream-Lavender Palettes**:
   - Dark Mode adopts a deep navy backdrop (`#0c0d14` / `#151828`) that allows pastel and neon pixel hues to glow without visual clashes.
   - Light Mode adopts a warm cream/soft lavender canvas (`#fbf9f5` / `#ffffff` / `#f1eef8`) paired with deep ink-navy typography and borders (`#1e1b4b`) for strict WCAG AA contrast.
2. **Dynamic Format Theming**:
   - Selecting a **Format** dynamically re-themes the Result Card's glow, active option pills, primary action button, and progress indicators:
     - **MP3 / Audio**: Soft pastel Pink
     - **VIDEO**: Vibrant neon Purple
     - **IMAGE / THUMBNAIL**: Fresh electric Cyan
     - **ANALYZE / SPARKLES / BEST**: Golden Yellow
     - **FILE READY**: Crisp Mint Green
3. **Layered Result Card Architecture**:
   - Multi-layer retro offset shadow on the card exterior giving a physical tactile cartridge feel.
   - Segmented interior panels (inset 16:9 thumbnail frame, metadata dock, elevated option selector, prominent action slab).
4. **Ambient Pixel Accents**:
   - Subtle retro stars (✦), blocks (▪), and gentle glow strategically placed around the Hero, URL Input, and Result Card that automatically condense or hide on mobile viewports.
5. **Enhanced Typography & CRT Retirement**:
   - Retirement of the full-screen CRT scanline overlay to restore 100% color vibrancy and Thai font clarity.
   - Strict division: `Press Start 2P` for arcade headings, pills, buttons, and badges; `IBM Plex Sans Thai` for all titles, URLs, metadata, hints, and error descriptions.
6. **Backend & Workflow Preservation**:
   - Zero modifications to API endpoints, download lifecycle, polling, or backend services.

## User Stories

1. As a user, I want a rich dark-navy background instead of flat black, so that colorful pastel elements stand out with warm retro atmosphere.
2. As a user browsing in light mode, I want a warm cream and lavender background instead of plain white, so that the retro playful mood is preserved during daytime use.
3. As a user browsing in light mode, I want all buttons and text on pastel backgrounds to render in crisp dark ink-navy, so that readability remains effortless and conforms to contrast guidelines.
4. As a user switching to MP3 format, I want the Result Card highlights, borders, and download button to shift to pink, so that I have immediate visual feedback that I am processing audio.
5. As a user switching to VIDEO format, I want the Result Card highlights, borders, and download button to shift to purple, so that I immediately recognise video mode.
6. As a user switching to IMAGE or THUMBNAIL format, I want the Result Card highlights, borders, and download button to shift to cyan, so that image mode is instantly distinct.
7. As a user selecting the highest quality option (e.g. Best), I want to see a golden yellow highlight on the badge, so that the recommended choice feels premium and easy to spot.
8. As a user looking at the URL input, I want the `[ ✦ ANALYZE ✦ ]` button to feature an inviting golden yellow accent, so that my first action on the page is immediately obvious.
9. As a user viewing the Result Card, I want the card to feature an exterior offset retro layered shadow, so that it looks like a physical retro game cartridge or arcade card.
10. As a user inspecting media details, I want the 16:9 thumbnail to sit within an inset framed dock, so that video covers look intentionally displayed without visual bleeding.
11. As a user reading Thai video titles and descriptions, I want the text to display in IBM Plex Sans Thai without scanline interference, so that long titles are completely legible.
12. As a user waiting for a media download to finish, I want the pixel progress bar to adopt the selected format's color, so that the waiting experience feels cohesive.
13. As a user whose download has succeeded, I want the final `DOWNLOAD FILE` button to illuminate in a refreshing mint green, so that I get a clear, unambiguous signal that the file is ready to save.
14. As a user reviewing the file ready state, I want file size and expiry countdown to sit in an organized inset card layer, so that vital technical details are neat and readable.
15. As a user on desktop, I want to see subtle pixel stars (✦) and square dots (▪) around the Hero and Result Card, so that the page feels lively and delightful.
16. As a user looking at the decorative stars, I want them to have a subtle slow-step twinkling animation, so that the page feels alive without distracting from the main task.
17. As a mobile user on a narrow screen, I want decorative background elements to automatically scale down or hide, so that there is no horizontal page overflow or cluttered layout.
18. As a user who clicks buttons and option pills, I want instant 8-bit tactile press feedback (offset translation without mushy transitions), so that the application feels snappy and responsive.
19. As a user with motion sensitivity (`prefers-reduced-motion: reduce`), I want decorative twinkle animations to be disabled, so that the interface respects my accessibility settings.
20. As a user looking at the Header, I want the MediaDrop logo and theme toggle to reflect the colorful pixel aesthetic, so that the whole page feels unified from top to bottom.
21. As a user viewing the Footer, I want subtle retro pixel accents and clear status text, so that the footer feels integrated into the design.
22. As a user downloading media, I want the entire download workflow (Analyze -> Format -> Quality -> Download -> Save) to function without bugs or API breakage, so that visual redesign does not compromise utility.

## Implementation Decisions

### Component & Styling Architecture
- **Design Tokens**: Extend CSS custom variables with semantic format palettes (`--accent-pink`, `--accent-purple`, `--accent-cyan`, `--accent-yellow`, `--accent-green`, `--ink-navy`, `--bg-cream`, `--card-layered-shadow`).
- **Dynamic Format Context**: Add a reactive data attribute (e.g. `data-format-theme="audio|video|image"`) on the Result Card container so that nested borders, badges, CTA buttons, and progress indicators react uniformly through CSS selectors without prop drilling.
- **CRT Removal**: Eliminate the scanline overlay markup and associated CSS rules from the application root to maximize render sharpness and color fidelity.
- **Layered Card Construction**: Implement a two-tier card layout:
  - Outer container with solid double-offset hard box-shadows.
  - Inner segmented panels using subtle inset borders and elevated background surfaces.
- **Responsive Ambient Decorations**: Introduce isolated, non-interactive decoration spans styled with responsive breakpoints (`display: none` below 640px viewport width) and bounded absolute positioning to prevent document reflow or scrollbar triggers.
- **Header & Footer Alignment**: Style the logo with a retro pixel badge and style the theme toggle button with tactile pixel press states.

### Interface Contracts
- Existing component props for `ResultCard`, `UrlInput`, `Header`, `Hero`, and `Footer` remain backwards-compatible.
- `onFormatChange`, `onQualityChange`, `onDownload`, and `onClear` interfaces remain identical to preserve existing data flow.
- API service signatures (`analyzeMedia`, `startDownloadJob`, `pollJobStatus`, `cancelDownloadJob`, `getFileDownloadUrl`) remain untouched.

## Testing Decisions

### Seam
- **Primary Seam**: Component integration tests via Vite SSR module loader (`server.ssrLoadModule`) rendering to static markup using `node:test` and `react-dom/server` (extending `test/demo-flow.test.mjs`).

### Testing Focus
- A good test verifies visible external behaviors and DOM contracts, not CSS internal values:
  - Verify that the Result Card renders with appropriate format theming classes/data attributes when switching formats (`MP3`, `VIDEO`, `IMAGE`, `THUMBNAIL`).
  - Verify that the primary CTA button text and structure dynamically update based on selected format (`DOWNLOAD MP3`, `DOWNLOAD VIDEO`, `DOWNLOAD IMAGE`).
  - Verify that the File Ready state renders the mint-themed completion CTA with the correct download link and attributes.
  - Verify that the `● DETECTED` badge and `★ BEST` quality badge render correctly with appropriate semantic roles and labels.
  - Verify that accessibility labels (`aria-pressed`, `aria-label`, `role`) are properly maintained across all interactive pills.

### Prior Art
- Existing test suite in `test/demo-flow.test.mjs` which validates module loading, URL parsing, metadata formatting, and ResultCard markup.

## Out of Scope
- Backend crawler or yt-dlp parameter alterations.
- New download formats or quality resolutions beyond existing definitions.
- Third-party sound effects or audio playback upon button clicks.
- Re-architecting state management or replacing React/Tailwind/Vite scaffolding.

## Further Notes
- All terms used in this specification align strictly with the canonical glossary in `CONTEXT.md`.
- No new external font dependencies are required beyond Google Fonts `Press Start 2P` and `IBM Plex Sans Thai`.
