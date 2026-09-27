# 02: Instagram Post Detection & Single Photo Download

## Parent
https://github.com/porchyy/MediaDrop/issues/1

## What to build
Implement `InstagramAdapter` in `backend/app/gallery_extractor.py` to detect Instagram post URLs (`/p/`), strip query tracking parameters, and extract photo metadata. Route `/reel/`, `/reels/`, and `/tv/` directly to `yt-dlp`. Update `ResultCard` to render `INSTAGRAM • PHOTO` with `[ Original ★ ] [ JPG ] [ PNG ]` and single `[ DOWNLOAD IMAGE ]` action. Support downloading single Instagram photos through `Image Processor`.

## Acceptance criteria
- [ ] Instagram URLs sanitized to canonical `https://www.instagram.com/p/<shortcode>/`.
- [ ] `/reel/` and `/reels/` URLs route directly to platform video analyzer (`yt-dlp`).
- [ ] Single photo Instagram posts return `platform: 'instagram'`, `media_type: 'image'`, and `image_count: 1`.
- [ ] ResultCard renders `INSTAGRAM • PHOTO` in Cyan theme with format selector and `[ DOWNLOAD IMAGE ]` CTA (no carousel arrows or ZIP button).
- [ ] Single photo downloads and converts properly to Original, JPG, or PNG.

## Blocked by
https://github.com/porchyy/MediaDrop/issues/2 (Ticket 1)
