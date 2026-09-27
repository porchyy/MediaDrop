# Phase 8.8.2: Instagram Post, Carousel & Generalized Gallery Engine

## Problem Statement

MediaDrop currently supports TikTok photo posts via a specialized gallery extractor introduced in Phase 8.8.1. However:
1. **Instagram Posts & Carousels Unsupported**: Instagram links (`instagram.com/p/...`) are either unsupported or fail when routed solely through `yt-dlp`, preventing users from downloading Instagram photos, carousels, or mixed-media posts.
2. **Hardcoded Platform Logic**: The gallery extractor was designed specifically around TikTok (`is_tiktok_photo_url`, `extract_tiktok_photos`, TikTok regex), making it impossible to add Instagram or future platforms (e.g. X/Twitter in Phase 8.8.3) without duplicating extraction and download code.
3. **Mixed Media Handling Absent**: Instagram carousels frequently interleave photos and videos (e.g. Photo ➔ Video ➔ Photo). The current engine assumes galleries contain only photos, with no contract for video carousel items, video previews, or selective ZIP bundling.
4. **Unfriendly Error on Auth/Private Posts**: Instagram enforces strict rate limits and requires login for private accounts and certain public profiles. Without tailored error handling, users receive cryptic server failures rather than an explicit `INSTAGRAM LOGIN REQUIRED` notice.

## Solution

Generalize the Gallery Engine into an extensible **Adapter Architecture**, add full **Instagram Post/Carousel support**, and support **Mixed Media Carousels**:
1. **Instagram URL Sanitization & Smart Routing**:
   - Strips tracking query parameters (`?igsh=...`, `?utm_source=...`) and normalizes to canonical paths: `https://www.instagram.com/p/<shortcode>/` and `https://www.instagram.com/reel/<shortcode>/`.
   - Routes `/reel/`, `/reels/`, and `/tv/` directly to the existing `Platform Analyzer` (`yt-dlp`).
   - Routes `/p/` through `GalleryExtractor` (`gallery-dl`).
   - **Smart Fallback**: If a `/p/` post contains no images and only a single video, it automatically falls back to `yt-dlp` to produce a standard Video Result Card without user-facing errors.
2. **Generalized Gallery Extractor (Adapter Architecture)**:
   - Introduces `BaseGalleryAdapter` with a unified contract: `can_handle(url)`, `extract(url)`, and `get_post_id(url)`.
   - Refactors TikTok logic into `TikTokAdapter`.
   - Implements `InstagramAdapter` leveraging `gallery-dl --dump-json --no-color --no-warnings --user-agent ...`.
   - Provides a registry-based `GalleryExtractor` dispatcher that standardizes all gallery platforms into a unified `MediaInfo` model.
3. **Normalized Data Model (`MediaInfo` & `Gallery Item`)**:
   - `MediaInfo` standardizes on `platform` (`"instagram"` | `"tiktok"`), `items: list[GalleryItem]`, and preserves `images` as an alias for backward compatibility.
   - Each `GalleryItem` explicitly defines: `index`, `type` (`"image"` | `"video"`), `url`, `width`, and `height`.
4. **Mixed Media Carousel & Result Card UX**:
   - Preview Box displays photos with `contain` fit; displays video items with thumbnail preview and a retro `[ VIDEO ]` badge overlay.
   - Dynamic CTA: Displays `DOWNLOAD IMAGE` on photo items (with `Original ★`, `JPG`, `PNG` choices); switches to `DOWNLOAD VIDEO` on video items to stream the direct `.mp4` file.
   - Selective ZIP Engine: In mixed carousels, `ALL IMAGES (N PHOTOS .ZIP)` downloads and packages only the photos into a cleanly indexed sequence (`01.jpg`, `02.jpg`), accompanied by an inline note (`ℹ Contains N photos (M video excluded from ZIP)`).
   - Single-photo posts hide carousel navigation and the ZIP button, presenting a single `DOWNLOAD IMAGE` action.
5. **Tailored Auth & Private Account Error Handling**:
   - Detects Instagram authentication walls, login requirements, and private account responses from `gallery-dl`.
   - Emits an HTTP 422 response with `{"code": "login_required", "message": "This post cannot be accessed anonymously."}`.
   - Renders a dedicated error card in the UI: `INSTAGRAM LOGIN REQUIRED` / `This post cannot be accessed anonymously.`

## User Stories

1. As a user with an Instagram single-photo link (`https://www.instagram.com/p/ABC123xyz/`), I want MediaDrop to detect it as an image, so that I can preview and download the photo.
2. As a user with an Instagram single-photo post, I want to see the card title `INSTAGRAM • PHOTO`, so that I immediately understand what media was detected.
3. As a user with an Instagram single-photo post, I want to see only `[ DOWNLOAD IMAGE ]` and no carousel navigation arrows or ZIP button, so that the interface is clean and unambiguous.
4. As a user with an Instagram photo post, I want format options for `[ Original ★ ] [ JPG ] [ PNG ]`, so that I can convert Instagram images to my preferred format.
5. As a user with an Instagram carousel link (`https://www.instagram.com/p/XYZ789/`), I want MediaDrop to detect it as a carousel, so that I can preview all items in the album.
6. As a user viewing an Instagram carousel, I want to see `INSTAGRAM • CAROUSEL (N ITEMS)` and a counter dock `1 / N`, so that I know the total item count and my current position.
7. As a user previewing an Instagram carousel, I want to navigate between items using retro buttons `[ < ]` and `[ > ]`, so that I can inspect every item in the album.
8. As a user previewing carousel items on desktop, I want to use keyboard Arrow Left and Arrow Right, so that navigation is quick and accessible.
9. As a user viewing an Instagram carousel that contains only photos, I want an `[ ALL IMAGES (.ZIP) ]` button, so that I can download the entire album in one click.
10. As a user viewing a mixed Instagram carousel (photos and videos), I want video items to display a `[ VIDEO ]` badge on the preview, so that I know the item is a video.
11. As a user viewing a video item in a mixed carousel, I want the CTA button to change to `[ DOWNLOAD VIDEO ]`, so that I can download that individual clip as an `.mp4` file.
12. As a user downloading all images from a mixed carousel, I want the ZIP button to read `ALL IMAGES (N PHOTOS .ZIP)` with a note `ℹ Contains N photos (M video excluded from ZIP)`, so that I understand exactly what the ZIP contains.
13. As a user extracting a downloaded Instagram ZIP, I want the archive named `instagram_<shortcode>_photos_<ext>.zip` and internal files numbered sequentially (`01.jpg`, `02.jpg`, etc.), so that files are clean and orderly.
14. As a user pasting an Instagram link with tracking query parameters (e.g. `?igsh=...&utm_source=...`), I want MediaDrop to strip those parameters automatically, so that extraction succeeds reliably.
15. As a user pasting an Instagram reel link (`https://www.instagram.com/reel/C_123/` or `/reels/`), I want it routed to the existing Video processor (`yt-dlp`), so that Instagram videos and audio can be downloaded seamlessly.
16. As a user pasting an Instagram post URL (`/p/...`) that contains a single video instead of photos, I want MediaDrop to automatically fall back to the Video processor, so that the video is detected without error.
17. As a user pasting a link to a private Instagram account or a post behind a login wall, I want to see an error `INSTAGRAM LOGIN REQUIRED` with `This post cannot be accessed anonymously.`, so that I know why it cannot be downloaded.
18. As a user downloading TikTok photo posts, I want TikTok photos and ZIP bundling to continue working without any regression.
19. As a user downloading YouTube, TikTok, or Twitter videos/audio, I want existing platform media workflows to remain completely unaffected.
20. As a user on a mobile device, I want the Instagram carousel stage and controls to fit comfortably within the screen without horizontal scrolling.
21. As a developer writing tests, I want backend unit tests covering URL sanitization, `BaseGalleryAdapter`, `InstagramAdapter`, `TikTokAdapter`, video fallback, and ZIP packaging.
22. As a developer running tests, I want frontend tests verifying the Instagram carousel display, `[ VIDEO ]` badge, dynamic CTA button switching, and `login_required` error handling.

## Implementation Decisions

### Architecture & Dispatcher Seam
- **Adapter Hierarchy in `backend/app/gallery_extractor.py`**:
  - `BaseGalleryAdapter`: Abstract base defining `can_handle(url: str) -> bool`, `extract(url: str, timeout: float) -> GalleryResult`, and `get_post_id(url: str) -> str`.
  - `TikTokAdapter(BaseGalleryAdapter)`: Encapsulates TikTok-specific URL detection, shortcode parsing (`/photo/(\d+)`), and `gallery-dl` extraction.
  - `InstagramAdapter(BaseGalleryAdapter)`: Encapsulates Instagram URL detection, shortcode extraction (`/p/([A-Za-z0-9_-]+)`), URL sanitization (stripping query parameters), and `gallery-dl` subprocess invocation with `--no-color`, `--no-warnings`, and desktop User-Agent.
  - `GalleryExtractor`: Registry dispatcher holding active adapters, providing `get_adapter(url) -> BaseGalleryAdapter | None` and `extract(url)`.
- **URL Routing & Fallback in `backend/app/main.py`**:
  - Instagram URLs matching `/reel/`, `/reels/`, or `/tv/` bypass `GalleryExtractor` and route directly to `_analyze_platform` (`yt-dlp`).
  - Instagram URLs matching `/p/` route to `GalleryExtractor.extract()`.
  - If `InstagramAdapter` returns a result where `image_count == 0` and all items are video, `analyze` automatically falls back to `_analyze_platform(url)` to serve standard video/audio formats.

### API Contracts & Schemas
*(Prototype schemas refined during design alignment)*

- **MediaInfo Model (`/api/analyze`)**:
  ```json
  {
    "title": "Instagram post caption",
    "media_type": "gallery",
    "platform": "instagram",
    "thumbnail": "first_item_preview_url",
    "duration": null,
    "source": "platform",
    "available_formats": ["image"],
    "image_count": 3,
    "items": [
      {
        "index": 0,
        "type": "image",
        "url": "https://scontent...jpg",
        "width": 1080,
        "height": 1350
      },
      {
        "index": 1,
        "type": "video",
        "url": "https://scontent...mp4",
        "width": 1080,
        "height": 1350
      }
    ],
    "images": [ /* aliased to items for 8.8.1 backward compatibility */ ]
  }
  ```

- **DownloadRequest Payload (`/api/download`)**:
  - Photo Item: `{ "url": "...", "format": "image", "quality": "Original", "output_format": "jpg", "image_index": 0, "download_all": false }`
  - Video Item: `{ "url": "...", "format": "video", "quality": "Best", "output_format": "original", "image_index": 1, "download_all": false }`
  - ZIP Bundle: `{ "url": "...", "format": "image", "quality": "Original", "output_format": "jpg", "image_index": 0, "download_all": true }`

### Downloader & Sequential ZIP Packaging (`backend/app/downloader.py`)
- Replaces direct `extract_tiktok_photos` calls with `gallery_extractor.extract(job.url)`.
- For single video items in a carousel, streams the direct `.mp4` URL to disk via `download_direct_file` without PIL processing, saving as `instagram_<shortcode>_video_<index+1>.mp4`.
- For ZIP bundles, filters out non-image items (`item['type'] == 'image'`), re-indexes them sequentially as `01.{ext}`, `02.{ext}`, packages into `instagram_<shortcode>_photos_<ext>.zip` (or `tiktok_<post_id>_photos_<ext>.zip`), and enforces the 500 MB ceiling.

### Error Handling & Frontend Presentation
- If `gallery-dl` fails due to login barriers (e.g. exit code / stderr with `login required`, `401`, or `403`), backend returns HTTP 422 with `{"code": "login_required", "message": "This post cannot be accessed anonymously."}`.
- `UrlInput.jsx` maps `login_required` to Title: `INSTAGRAM LOGIN REQUIRED`, Body: `This post cannot be accessed anonymously.`.

## Testing Decisions

### What Makes a Good Test
Tests in this phase must test **external behavior and contracts only**, never internal implementation details:
- Assert that an Instagram post URL passes through the analyzer endpoint and produces a valid `MediaInfo` response with `platform: "instagram"` and classified `items`.
- Assert that single video `/p/` posts fall back to `yt-dlp` video info without raising errors.
- Assert that requesting a ZIP bundle for an Instagram post downloads, converts, and sequentially names internal image files (`01.jpg`, `02.jpg`) inside an appropriately named ZIP archive.
- Assert that private/login-gated Instagram URLs return HTTP 422 with `code: "login_required"`.
- Assert that TikTok photo posts and standard video URLs continue to function identically with zero regression.

### Seams Tested
- **Primary Backend Seam**: The FastAPI application HTTP boundary (`TestClient(app)` calling `POST /api/analyze` and `POST /api/download` ➔ `GET /api/jobs/{id}`). This is the highest seam in the backend and tests routing, adapters, downloader workers, image conversions, and error reporting together.
- **Unit Seam for Gallery Extractor**: Subprocess output parsing tests in `backend/tests/test_gallery_extractor.py` feeding simulated `gallery-dl` NDJSON/JSON data into `TikTokAdapter` and `InstagramAdapter`.
- **Frontend Component Seam**: React component tests in `test/` verifying `ResultCard` carousel controls, `[ VIDEO ]` badge rendering, button CTA switching, and `UrlInput` error screen rendering.

### Prior Art
- `backend/tests/test_gallery_extractor.py`: Mock JSON parser tests for `gallery-dl` output.
- `backend/tests/test_gallery_download.py`: Asynchronous ZIP packaging and single photo download tests.
- `backend/tests/test_api.py`: FastAPI endpoint tests for URL validation, analysis, and job polling.
- `test/demo-flow.test.mjs`: Node.js frontend tests asserting UI flows.

## Out of Scope

- Instagram Stories or Highlights (require active user session cookies).
- Downloading private Instagram accounts or user credential entry.
- Packaging video items together with photo items into a mixed ZIP archive (deferred to a future release).
- X/Twitter multi-image support (scheduled for Phase 8.8.3, utilizing this generalized gallery engine).

## Further Notes

- Canonical domain glossary terms in `CONTEXT.md` (**Gallery / Photo Post**, **Gallery Item**, **Mixed Carousel**, **Image Export Format**, **Image Processor**, **Image Bundle (ZIP)**, **Login Required**) must be respected in all code symbols and docstrings.
- All temporary files during gallery download and ZIP bundling must be strictly cleaned up upon completion or cancellation.
