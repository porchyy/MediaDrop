# ADR 0001: Instagram Hybrid Anonymous-First Extraction

**Date**: 2026-09-27
**Status**: Accepted
**Phase**: 8.8.2.3

## Context

MediaDrop uses `gallery-dl` as its primary extraction engine for Instagram posts (`/p/` paths). As of Phase 8.8.2.2, all Instagram extractions were attempted anonymously. When Instagram returned a Login Wall, the system surfaced `login_required` directly to the user with no fallback.

A significant portion of public Instagram posts that fail anonymous extraction succeed when a valid session cookie is provided. The question was: how should MediaDrop handle this gap — and which strategy to adopt as the primary approach?

Four options were evaluated:

### Option A: Always-Authenticated (rejected)
Send the server session cookie on every Instagram request, regardless of whether it is needed.

**Rejected because:**
- Wastes session quota on requests that could succeed anonymously.
- Every request is tied to the MediaDrop Instagram account — any rate-limit or ban affects all users simultaneously.
- Violates least-privilege: using credentials when they are not required is unnecessary risk.

### Option B: Third-party Instagram API — e.g. HikerAPI (rejected)
Replace the gallery-dl extraction path with calls to an external API service that handles authentication internally.

**Rejected because:**
- Introduces a hard dependency on a third-party service; if the service goes down, MediaDrop goes down.
- User-submitted Instagram URLs are sent to an external server, creating a privacy concern.
- Subject to third-party rate limits and cost tiers outside our control.
- Requires replacing a significant portion of the established Gallery Engine, adding migration risk.

### Option C: Replace gallery-dl with Instaloader (rejected for this phase)
Use Instaloader as the primary extraction library since it has native session-file support.

**Rejected because:**
- The existing Gallery Engine is built on gallery-dl and covers TikTok, Instagram, and future platforms in a unified adapter model. A full engine swap is high risk for one platform's auth improvement.
- gallery-dl already supports `--cookies` natively.
- Instaloader remains viable as a tertiary fallback in a future phase if gallery-dl proves insufficient specifically for Instagram.

### Option D: Hybrid Anonymous-First (accepted)
Attempt extraction without credentials first. Only if a Login Wall is detected does the system retry using the Server Session Cookie. The fallback is invisible to the user.

**Accepted because:**
- Least-privilege by design: credentials are only used when necessary.
- The server session cookie is used only for content the MediaDrop account has legitimate access to.
- No change to the existing Gallery Engine architecture — a single method change in `InstagramAdapter`.
- User experience is preserved: paste link → result, with no visible difference between anonymous and authenticated extraction.
- Operators who do not configure a cookie file see no change in behavior (the existing `login_required` error surfaces as before).

## Decision

Implement **Hybrid Anonymous-First** extraction in `InstagramAdapter`:

1. Attempt **Anonymous Extract** (no cookies, 10s timeout).
2. On `LoginRequiredError`, check `INSTAGRAM_COOKIE_FILE` environment variable.
3. If the file exists, perform **Authenticated Extract** (with `--cookies`, 20s timeout).
4. If authentication also fails, raise `InstagramSessionError`.
5. If no cookie file is configured, re-raise `LoginRequiredError` (existing behavior preserved).

The cookie path is read exclusively from the `INSTAGRAM_COOKIE_FILE` environment variable — no hardcoded paths, no frontend exposure, no logging of cookie contents.

## Consequences

- **Positive**: Public posts that hit Instagram's login wall silently succeed when a server session is available.
- **Positive**: Deployments without a cookie file behave identically to the pre-8.8.2.3 system.
- **Positive**: Session health is visible via `/api/health` (`instagram_session: "ok" | "missing"`) without exposing the cookie.
- **Negative**: Cookies expire and Instagram may revoke them. Operators must monitor logs for `instagram_session_error` responses and refresh the cookie file manually.
- **Negative**: Worst-case analyze latency increases by up to 20s (10s anonymous timeout + 20s authenticated timeout) when both attempts fail.
- **Deferred**: If gallery-dl ever proves insufficient for Instagram specifically, Instaloader can be added as a tertiary fallback in a future phase without changing this architecture.
