# Ticket 3: Media Extractor Error Frontend Presentation & E2E Verification

## Parent
https://github.com/porchyy/MediaDrop/issues/7

## What to build
Update `src/components/UrlInput.jsx` to map `error.code === 'extractor_error'` to an informative, professional error screen with:
Title: `MEDIA EXTRACTOR ERROR`
Body: `The media extractor is temporarily unavailable.`
Ensure this prevents false attribution to the user's URL.
Ensure `login_required` continues to render `INSTAGRAM LOGIN REQUIRED` / `This post cannot be accessed anonymously.`.
Run full verification suite (`pytest`, `node --test`, `vite build`).

## Acceptance criteria
- [ ] `UrlInput.jsx` handles `extractor_error` with `errorKind = 'extractor_error'`.
- [ ] UI displays `MEDIA EXTRACTOR ERROR` and `The media extractor is temporarily unavailable.`.
- [ ] `login_required` error screen remains unchanged.
- [ ] Frontend test in `test/demo-flow.test.mjs` verifies `MEDIA EXTRACTOR ERROR`.
- [ ] Full backend tests (`pytest`) pass 100%.
- [ ] Full frontend tests (`npm test`) pass 100%.
- [ ] Production build (`npm run build`) succeeds with 0 errors.

## Blocked by
- Ticket 2: Subprocess Error Classification & Extractor Error API Contract
