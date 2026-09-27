# 04: Mixed Media Carousel & Single Video Fallback

## Parent
https://github.com/porchyy/MediaDrop/issues/1

## What to build
Handle mixed media carousels containing both photos and videos, and single-video fallback. If an Instagram `/p/` post contains only video (0 images), automatically fall back to `yt-dlp` Video Result Card. For mixed carousels: display `[ VIDEO ]` badge over video previews, dynamically switch CTA button to `[ DOWNLOAD VIDEO ]` (streaming raw .mp4 without PIL conversion), and update ZIP button to `ALL IMAGES (N PHOTOS .ZIP)` with an inline note explaining that video items are excluded.

## Acceptance criteria
- [ ] Instagram `/p/` URLs with only a single video automatically fall back to `yt-dlp` video analyzer.
- [ ] Video items in a carousel display a retro `[ VIDEO ]` badge overlay.
- [ ] When viewing a video item, single action button changes to `[ DOWNLOAD VIDEO ]` and downloads the direct .mp4 file.
- [ ] ZIP bundling skips video items and downloads only photos.
- [ ] ZIP button displays `ALL IMAGES (N PHOTOS .ZIP)` with inline note `ℹ Contains N photos (M video excluded from ZIP)`.

## Blocked by
https://github.com/porchyy/MediaDrop/issues/4 (Ticket 3)
