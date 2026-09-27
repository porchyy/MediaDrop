# 03: Instagram Carousel Navigation & Photo ZIP Bundling

## Parent
https://github.com/porchyy/MediaDrop/issues/1

## What to build
Support multi-photo Instagram albums (carousels). Enable carousel navigation dock `< 1 / N >` with keyboard arrow controls on `ResultCard`. Support downloading current photo and batch downloading all photos as a clean sequential ZIP named `instagram_<shortcode>_photos_<ext>.zip` containing `01.jpg`, `02.jpg`, etc.

## Acceptance criteria
- [ ] Multi-photo Instagram posts return `media_type: 'gallery'` with `image_count > 1`.
- [ ] ResultCard renders `INSTAGRAM • CAROUSEL (N PHOTOS)` with carousel dock `< 1 / N >` and keyboard ArrowLeft/ArrowRight support.
- [ ] User can download currently displayed photo with `[ CURRENT IMAGE ]`.
- [ ] User can download all photos as a ZIP with `[ ALL IMAGES (.ZIP) ]`.
- [ ] Files inside ZIP are re-indexed cleanly as `01.{ext}`, `02.{ext}` and archive named `instagram_<shortcode>_photos_<ext>.zip`.

## Blocked by
https://github.com/porchyy/MediaDrop/issues/3 (Ticket 2)
