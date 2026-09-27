# Ticket 1: Minimal Gallery-DL Command Builder & Remove Incompatible CLI Flags

## Parent
https://github.com/porchyy/MediaDrop/issues/7

## What to build
Build a dedicated command builder helper `build_gallery_dl_command(url: str, user_agent: str | None = None) -> list[str]` in `backend/app/gallery_extractor.py`.
Remove `--no-warnings` and `--no-color` flags that cause subprocess exit code failures on server environments with standard gallery-dl versions.
Configure `InstagramAdapter` to use this minimal builder with a standard browser User-Agent, ensuring maximal compatibility and zero CLI syntax errors.

## Acceptance criteria
- [ ] `build_gallery_dl_command` produces `[sys.executable, "-m", "gallery_dl", "--dump-json", url]` by default.
- [ ] When `user_agent` is provided, `--user-agent` and the value are included.
- [ ] `--no-warnings` is strictly absent from all gallery-dl commands.
- [ ] `--no-color` is strictly absent from all gallery-dl commands.
- [ ] `InstagramAdapter.extract` uses `build_gallery_dl_command`.
- [ ] Unit tests in `backend/tests/test_gallery_extractor.py` assert `--no-warnings` is omitted.

## Blocked by
- None (can start immediately).
