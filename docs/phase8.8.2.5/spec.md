---
title: "Phase 8.8.2.5 - Reliable Download Engine"
labels: ["ready-for-agent", "phase-8.8.2.5"]
status: "Spec Created"
---

## Problem Statement

Users of MediaDrop frequently encounter download failures when extracting and downloading media from various platforms. These failures occur due to transient network issues (connection resets, timeouts, 5xx errors), rate limiting (429), or media URL expiration (especially for signed URLs). Currently, the system lacks resilience: a single failure aborts the entire job, temporary files are not preserved for resumption, gallery items fail completely if one image errors out, and "100% transfer" does not guarantee a valid, uncorrupted file. This leads to a poor user experience as users have to manually restart jobs and lose their progress.

## Solution

The Reliable Download Engine (Phase 8.8.2.5) introduces a fault-tolerant architecture that shifts the download pipeline from a rigid `EXTRACT -> DOWNLOAD -> READY/FAIL` flow to a robust `EXTRACT -> RESOLVING -> DOWNLOADING -> RETRYING / RESUMING -> VERIFYING -> PROCESSING -> READY` flow. The system will aggressively recover from transient errors using exponential backoff, preserve partial downloads (`.part` files) to resume via HTTP Range requests, automatically refresh expired source URLs, gracefully handle partial successes in gallery downloads, and strictly verify file integrity before serving the file to the user.

## User Stories

1. As a user, I want the system to automatically retry a download if a temporary network connection drops, so that I don't have to restart the job manually.
2. As a user, I want my large video download to resume from where it left off after a connection reset, so that I don't waste time and bandwidth re-downloading the first half.
3. As a user downloading a gallery of 50 images, I want to receive a ZIP file containing 49 images if only 1 image permanently fails, so that I don't lose the entire batch due to a single missing item.
4. As a user, I want the system to handle rate limits (HTTP 429) smoothly by pausing and retrying, so that my downloads eventually succeed without manual intervention.
5. As a user, I want the system to get a fresh media link if the temporary link expires mid-download, so that long downloads (like large videos) do not fail unexpectedly.
6. As a user, I want to be guaranteed that a "Ready" file is not corrupted, so that I can open my downloaded image or video without encountering format errors.
7. As a frontend developer, I want to receive stable error codes (e.g., `http_429`, `source_expired`) from the API, so that I can display helpful, localized error messages to the user.
8. As a system administrator, I want the system to enforce a strict overall job timeout (10 minutes), so that retrying jobs do not consume server resources indefinitely.
9. As a user, I want the system to completely restart the download if the remote server changes the file (Content-Length mismatch), so that my final file is not a corrupted mix of two different files.
10. As a user, I want to be able to cancel a job even if it is currently waiting in a retry backoff state, so that I can stop unwanted downloads immediately.
11. As a developer inspecting logs, I want to see structured diagnostics including the attempt number, offset, and retry reason, so that I can effectively debug failure patterns.
12. As a frontend user, I want my partially downloaded files to be hidden from the UI, so that I don't accidentally download incomplete data.

## Implementation Decisions

- **Domain Glossary Additions**: Introduced `Extracting`, `Resolving`, `ReliableDownloader`, `SourceExpiredError`, and `Partial Gallery Result` to standardize communication and state management.
- **Job States**: The Job model validator will be extended to support new states: `extracting`, `resolving`, `retrying`, `resuming`, and `verifying`.
- **ReliableDownloader Abstraction**: A dedicated network transfer layer will be implemented to handle all HTTP requests, retry loops (exponential backoff), and `.part` file management. It remains completely agnostic to domain logic (it does not know how to extract URLs or verify images).
- **Source Refresh Flow**: If the transfer layer encounters an authentication/expiry error (e.g., HTTP 403), it will throw a `SourceExpiredError`. The higher-level Job Worker will catch this, re-invoke the extraction/resolution logic to obtain a fresh URL, and then re-invoke the transfer layer.
- **Partial File Resume**: The transfer layer will write to a `.part` file. Upon retry, it will check the `Content-Length`. If it matches the expected remaining bytes, it will resume using HTTP `Range: bytes=...`. If the size mismatches or the server rejects the Range request, it will safely restart from byte 0.
- **File Verification**: Content verification (Pillow for images, `ffprobe` for videos, `zipfile` for ZIPs) will occur in the `verifying` state by the Job Worker, *after* the transfer layer successfully returns, but *before* renaming the `.part` file to the final target filename.
- **yt-dlp Resilience**: A hardcoded "MediaDrop Resilient Profile" (e.g., 5 retries, 5 fragment retries, exponential sleep) will be injected into all yt-dlp instantiations to ensure robustness without bloating the `.env` configuration.
- **Gallery Partial Success**: Sequential iteration over gallery items will catch individual failures. Successful items are zipped and marked `ready`. The job metadata will be appended with a `warnings` field containing details of the failed items.
- **API Compatibility**: The existing Job API schema remains intact. The `error_code` string field and `warnings` array will be gracefully added as optional fields.
- **Hard Timeout Ceiling**: The `TOTAL_JOB_TIMEOUT` configuration remains an absolute maximum ceiling. Retries and backoffs will not pause or extend this timer, preventing zombie processes.

## Testing Decisions

- **Definition of a Good Test**: Tests will focus on system behavior and state transitions from the outside, rather than asserting against specific internal line executions. Tests must prove that transient errors eventually result in a `ready` state, and permanent errors correctly yield a `failed` state with the appropriate `error_code`.
- **Primary Seam (Job Worker)**: The highest level `run_job` function will be tested using mocked endpoints. We will assert that the `JobManager` transitions through the correct states (`downloading` -> `retrying` -> `verifying` -> `ready`) and that the final output file is generated and validated.
- **Secondary Seam (Transfer Layer)**: The `ReliableDownloader` will be tested in isolation using an HTTP mock server programmed to forcibly drop connections, return 500s, or reject Range requests, to verify exponential backoff and safe file resume/restart logic.
- **Prior Art**: Existing job and API tests in the codebase will serve as the template for state assertions and file cleanup mechanisms.

## Out of Scope

- Introducing new third-party heavy message queues (e.g., Celery, RabbitMQ).
- Adding a SQL database for job persistence (sticking with existing disk-based JSON).
- Completely rewriting the frontend UI; the frontend will continue using existing API structures.
- Bypassing legitimate authentication walls or private account restrictions (security model remains intact).
- Providing 100% literal success guarantees (the goal is maximum recovery, not impossible guarantees).

## Further Notes

- **Phase Breakdown Checklist:**
  - [ ] 8.8.2.5A — Diagnostics & Error Taxonomy
  - [ ] 8.8.2.5B — Reliable HTTP Transfer (`ReliableDownloader`)
  - [ ] 8.8.2.5C — Partial File + Resume
  - [ ] 8.8.2.5D — Retry + Exponential Backoff
  - [ ] 8.8.2.5E — yt-dlp Reliability Profile
  - [ ] 8.8.2.5F — Source Refresh / Expired URL Recovery
  - [ ] 8.8.2.5G — Gallery Reliability (Partial Success)
  - [ ] 8.8.2.5H — File Verification (`ffprobe`, Pillow)
  - [ ] 8.8.2.5I — Safe Finalization (Atomic rename)
  - [ ] 8.8.2.5J — Job State Improvement
  - [ ] 8.8.2.5K — Structured Logging
  - [ ] 8.8.2.5L — API/UI Compatibility Check
