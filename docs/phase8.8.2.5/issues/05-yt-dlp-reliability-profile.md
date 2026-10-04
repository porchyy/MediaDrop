# 05: yt-dlp Reliability Profile Optimization

## Parent
docs/phase8.8.2.5/spec.md

## Triage
completed

## What was built
Configured yt-dlp with an explicit production reliability profile in `backend/app/downloader.py` (`get_platform_ytdlp_opts`). Replaced bare library defaults with balanced retry parameters (`retries=5`, `fragment_retries=5`, `file_access_retries=3`, `extractor_retries=3`, `retry_sleep='exp'`). Retained media post-processing and container integrity workflows.

## Acceptance criteria
- [x] Explicit yt-dlp retry profile configured (`retries`, `fragment_retries`, `file_access_retries`, `extractor_retries`).
- [x] Exponential retry sleeping enabled for fragments and network requests.
- [x] Maintained size limit hooks and cooperative cancellation.

## Blocked by
docs/phase8.8.2.5/issues/01-download-failure-diagnostics.md
