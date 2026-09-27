# 01: `InstagramSessionError` Exception & `build_gallery_dl_command` Cookie Support

## Parent
docs/phase8.8.2.3/spec.md

## What to build
Add `InstagramSessionError` as a new typed exception in the Gallery Extractor module, alongside the existing `LoginRequiredError` and `ExtractorConfigurationError`. Extend `build_gallery_dl_command()` with an optional `cookies_file` parameter that appends `--cookies <path>` to the command when provided.

## Acceptance criteria
- [ ] `InstagramSessionError` class exists and inherits from `Exception`.
- [ ] `build_gallery_dl_command()` accepts `cookies_file: str | None = None` parameter.
- [ ] When `cookies_file` is provided, `["--cookies", cookies_file]` is appended before the URL argument.
- [ ] When `cookies_file` is `None`, command is identical to current behavior (no regression).
- [ ] Existing test `test_build_gallery_dl_command` passes without modification.

## Blocked by
None (can start immediately)
