# Phase 8.8.1: TikTok Photo Posts & Image Export Formats

## Problem Statement

MediaDrop currently excels at video and audio extraction via `yt-dlp` and direct file downloads. However:
1. **TikTok Photo Posts Unsupported**: TikTok slideshows and photo posts (`/photo/`) are either rejected or fail because slideshow extraction in `yt-dlp` remains unstable and unmerged upstream.
2. **Missing Image Export Controls**: Direct images and video thumbnails can only be downloaded in their original raw format. Users cannot choose standard formats like JPG or PNG when dealing with WebP or transparent assets.
3. **No Batch or Carousel Experience**: When media contains multiple images (e.g. 7 photos in a TikTok post), users cannot preview the carousel or download all photos as a clean ZIP archive in a single click.

## Solution

Introduce a dedicated **Image Processing Engine** and **TikTok Gallery Extractor**:
1. **Dual Extraction Architecture**:
   - `yt-dlp` handles Video and Audio across all supported platforms.
   - `gallery-dl` handles TikTok Photo Posts (`tiktok.com/@user/photo/...`) via isolated subprocess extraction.
2. **Unified Image Processor**:
   - Centralized backend processing via Pillow (`PIL.Image`) for Direct Images, Video Thumbnails, and TikTok Photos.
   - Standard export choices: `Original ★`, `JPG`, and `PNG`.
   - Automatic alpha flattening: converts transparent RGBA/P images to white background (`#FFFFFF`) when exporting to JPG.
   - Safety guard: enforces a 100 Megapixel decompression bomb limit.
3. **TikTok Photo Carousel UI**:
   - Detects gallery media type and presents a bounded preview container with `contain` fit.
   - Dock navigation with previous/next controls, photo counter, and keyboard arrow support.
   - Dynamic action buttons: single image download for 1-photo posts; `CURRENT IMAGE` and `ALL IMAGES (.ZIP)` for multi-photo albums.
4. **ZIP Bundling Engine**:
   - Packs all converted images into a single ZIP archive with clean sequential naming (`01.jpg`, `02.jpg`).
   - Granular progress reporting (80% download and conversion, 20% ZIP compression).
   - Fail-fast cancellation and automated cleanup of raw temporary files.
   - Enforces a 500 MB cumulative size threshold.

## User Stories

1. As a user with a TikTok photo link (`https://www.tiktok.com/@user/photo/12345`), I want MediaDrop to detect it as a gallery, so that I can see the photos instead of an unsupported media error.
2. As a user viewing a TikTok photo post, I want to see the total number of images (e.g. `7 IMAGES`) and flip through them with previous and next controls, so that I can preview the entire album.
3. As a user previewing photos, I want to use keyboard left and right arrow keys, so that navigating large albums is fast and accessible.
4. As a user downloading a photo, I want choices for `Original ★`, `JPG`, and `PNG`, so that I can get the exact format I need.
5. As a user switching between `Original`, `JPG`, and `PNG`, I want the carousel to stay on the current image, so that my viewing position is not lost.
6. As a user with a multi-image album, I want a `[ CURRENT IMAGE ]` button, so that I can save just the photo I am currently looking at.
7. As a user with a multi-image album, I want an `[ ALL IMAGES (.ZIP) ]` button, so that I can download all photos in one archive.
8. As a user extracting a downloaded ZIP, I want files inside to be cleanly ordered (`01.jpg`, `02.jpg`, etc.), so that the photos remain in their original sequence.
9. As a user with a single-image TikTok photo post, I want the carousel arrows and the ZIP button hidden, so that I see a clean `DOWNLOAD IMAGE` button.
10. As a user selecting the `THUMBNAIL` format for a video, I want to choose `[ Original ★ ] [ JPG ] [ PNG ]` instead of video quality options, so that I can convert WebP covers into JPG or PNG.
11. As a user downloading a transparent image as JPG, I want the transparent background flattened to solid white, so that the JPG does not produce black artifacts.
12. As a user downloading a direct image URL (e.g. `.webp`), I want the same `[ Original ★ ] [ JPG ] [ PNG ]` selector, so that I can convert direct images on the fly.
13. As a user downloading all images in a gallery, I want the progress bar to report real progress as photos are downloaded and compressed into the ZIP.
14. As a user cancelling a gallery download mid-way, I want the background job to stop immediately and purge temporary files, so that server resources are freed.
15. As a user with a gallery exceeding 500 MB, I want the job to stop with a `FILE TOO LARGE` error, so that storage limits are respected.
16. As a user downloading regular MP4 videos or MP3 audio, I want the existing `yt-dlp` workflow to remain 100% intact with zero regressions.
17. As a user on a mobile device (360px–390px), I want the carousel preview and controls to fit without horizontal overflow.
18. As a user with motion sensitivity (`prefers-reduced-motion: reduce`), I want instant image transitions in the carousel without motion discomfort.
19. As a developer running tests, I want backend unit tests covering `gallery-dl` extraction, Pillow conversions, and ZIP packaging.
20. As a developer running frontend tests, I want SSR tests asserting gallery metadata display, carousel controls, and `output_format` payload dispatch.

## Implementation Decisions

### Core Architecture & Engine Dispatch
- **Dispatcher Seam**: When the URL hostname matches TikTok and the path contains `/photo/`, dispatch to the Gallery Extractor instead of `yt-dlp`. Non-photo TikTok links continue through `yt-dlp`.
- **Subprocess Isolation**: Execute `gallery-dl --dump-json` with a 15-second timeout via non-blocking asynchronous process creation to guarantee memory safety and process isolation.
- **Unified Image Processor**: Direct image downloads, video thumbnail downloads, and gallery downloads all route through a shared image conversion module powered by Pillow.
  - `Original`: Bypasses re-encoding entirely for maximum fidelity and download speed.
  - `JPG`: Converts transparency (`RGBA`, `LA`, `P`) onto a solid white background (`#FFFFFF`) with 92% quality.
  - `PNG`: Lossless compression with optimization enabled.
  - Enforces `Image.MAX_IMAGE_PIXELS = 100_000_000` to prevent decompression bomb denial-of-service.

### API Contracts & Schemas
*(Prototype schemas refined during design alignment)*

- **MediaInfo Output (Analyzer)**:
  ```json
  {
    "title": "TikTok photo post title",
    "media_type": "gallery",
    "source": "tiktok",
    "thumbnail": "first_image_url",
    "duration": null,
    "image_count": 7,
    "images": [
      { "index": 0, "url": "https://...", "width": 1080, "height": 1920 }
    ],
    "available_formats": ["image"]
  }
  ```

- **DownloadRequest Payload (Job Dispatch)**:
  ```json
  {
    "url": "https://www.tiktok.com/@user/photo/12345",
    "format": "image",
    "quality": "Original",
    "output_format": "jpg",
    "image_index": 0,
    "download_all": false
  }
  ```

### Batch Bundling & Lifecycle
- **ZIP Packaging Workflow**: When `download_all` is true, the job worker downloads each asset into a job-isolated directory, converts it via the Image Processor, stages files as `01.{ext}`, `02.{ext}`, compiles them into a ZIP archive, and purges intermediate raw image files.
- **Progress Distribution**: 0% to 80% represents proportional per-image download and conversion progress; 80% to 100% represents ZIP compression and file finalization.
- **Fail-Fast**: Any unrecoverable network or conversion failure on an individual image immediately halts the batch and fails the job with an informative code (`download_failed`).
- **Cumulative Quota Check**: Enforces the system 500 MB `MAX_DOWNLOAD_SIZE` ceiling across the sum of all downloaded bytes in the album.

### Presentation & Interaction Design
- **Carousel Hero Dock**: For galleries, the Result Card replaces the static 16:9 thumbnail frame with a bounded photo stage (`max-height: 400px` on desktop, `320px` on mobile, `object-fit: contain`).
- **Navigation Controls**: Dock placed directly below the preview housing retro pixel buttons `[ < ]` and `[ > ]` with an active counter (`1 / 7`). Supports Keyboard Arrow Left/Right.
- **Adaptive Single vs Multi Layout**:
  - `image_count === 1`: Hides carousel navigation arrows and ZIP button; renders a single `DOWNLOAD IMAGE` action.
  - `image_count > 1`: Renders carousel navigation, `DOWNLOAD CURRENT IMAGE`, and `ALL IMAGES (.ZIP)`.
- **Thumbnail Selector Seam**: When `format === "THUMBNAIL"`, the Result Card replaces bitrate/resolution pills with `[ Original ★ ] [ JPG ] [ PNG ]`.

## Testing Decisions

### What Makes a Good Test
Tests in this phase must test **external behavior and contracts only**, never internal implementation details:
- Assert that given a TikTok `/photo/` URL, the API returns `media_type: "gallery"` with an `images` list.
- Assert that transparent images converted to JPG produce an opaque RGB image with white backing.
- Assert that ZIP archives contain sequentially ordered files matching the requested output format.
- Assert that the frontend Result Card renders carousel controls and dispatches `output_format` and `download_all` flags.
- Do NOT test private helper functions or internal Pillow object state.

### Modules Tested
1. **Gallery Extractor & Platform Dispatcher**: Validates subprocess output parsing and mapping into `MediaInfo`.
2. **Image Processor Module**: Validates format conversions (Original, JPG, PNG) and transparency flattening.
3. **Download Job Worker**: Validates sequential gallery download, ZIP generation, cancellation handling, and size limits.
4. **Result Card Component**: Validates carousel navigation, format selector switching, and download button states.

### Prior Art
- `backend/tests/`: Existing pytest test suite asserting asynchronous job lifecycle, TTL cleanup, and download errors.
- `test/demo-flow.test.mjs`: Existing Node.js test runner verifying static markup, accessibility attributes, and API payload contracts.

## Out of Scope

- Private, follower-only, or cookie-authenticated TikTok photo posts.
- Audio / background music extraction from TikTok photo posts (deferred to subsequent release).
- Custom JPG quality percentage sliders (80/90/100).
- Instagram or Twitter carousel extraction (will leverage this identical engine in Phase 9).

## Further Notes

- Canonical domain glossary terms in `CONTEXT.md` (**Gallery / Photo Post**, **Image Export Format**, **Image Processor**, **Image Bundle (ZIP)**) must be preserved and used consistently in code identifiers and documentation.
- The 500 MB total file size limit applies equally to video, audio, and multi-image ZIP archives.
