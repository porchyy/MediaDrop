# 01: Prefactor: Generalized Gallery Extractor (Adapter Architecture)

## Parent
https://github.com/porchyy/MediaDrop/issues/1

## What to build
Refactor `backend/app/gallery_extractor.py` to use an extensible Adapter pattern with `BaseGalleryAdapter`, `TikTokAdapter`, and `GalleryExtractor` registry. Standardize `MediaInfo` to include `platform`, `items: list[GalleryItem]`, and alias `images` for backward compatibility. Keep all existing TikTok photo post behaviors (single photo, carousel, ZIP bundling) green.

## Acceptance criteria
- [ ] `BaseGalleryAdapter` defines interface: `can_handle(url: str) -> bool`, `extract(url: str, timeout: float) -> GalleryResult`, `get_post_id(url: str) -> str`.
- [ ] `TikTokAdapter` encapsulates TikTok URL detection and parsing.
- [ ] `GalleryExtractor` registry dispatches URLs to matching adapter.
- [ ] `MediaInfo` includes `platform: str`, `items: list[dict]`, and aliased `images`.
- [ ] Existing TikTok tests pass without regression.

## Blocked by
None (can start immediately)
