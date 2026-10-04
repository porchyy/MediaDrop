# 06: Source Refresh & Expired Media URL Recovery

## Parent
docs/phase8.8.2.5/spec.md

## Triage
completed

## What was built
Implemented dynamic recovery for expired signed URLs. When downloads receive HTTP 403 or URL expiration errors during direct media streaming or gallery downloads, the engine catches the condition, enters the `resolving` stage, triggers the `on_source_refresh` callback to obtain a fresh media URL, re-validates SSRF security, and safely resumes or restarts the transfer without failing the user job.

## Acceptance criteria
- [x] Detect expired media links (HTTP 403 / signed URL expiration).
- [x] Transition stage to `resolving` while obtaining fresh media URL.
- [x] Re-validate resolved media URL against SSRF rules.
- [x] Seamlessly continue downloading to the existing `.part` target.

## Blocked by
docs/phase8.8.2.5/issues/03-partial-file-and-resume.md
