# 05: Instagram Login Required & Private Post Error UX

## Parent
https://github.com/porchyy/MediaDrop/issues/1

## What to build
Handle Instagram authentication walls and private account errors. When `gallery-dl` reports login requirements, HTTP 401/403, or private account restrictions, the backend returns HTTP 422 with `code: 'login_required'` and `message: 'This post cannot be accessed anonymously.'`. `UrlInput` maps this to a dedicated error banner: `INSTAGRAM LOGIN REQUIRED` / `This post cannot be accessed anonymously.`.

## Acceptance criteria
- [ ] Backend detects login requirement / private account errors from gallery-dl.
- [ ] Backend returns HTTP 422 with `{"code": "login_required", "message": "This post cannot be accessed anonymously."}`.
- [ ] Frontend `UrlInput.jsx` displays `INSTAGRAM LOGIN REQUIRED` / `This post cannot be accessed anonymously.`.
- [ ] No generic unhandled 500 error is presented to the user.

## Blocked by
https://github.com/porchyy/MediaDrop/issues/3 (Ticket 2)
