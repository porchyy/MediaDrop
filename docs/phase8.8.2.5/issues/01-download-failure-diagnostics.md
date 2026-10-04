# 01: Standardized Download Failure Diagnostics & Error Taxonomy

## Parent
docs/phase8.8.2.5/spec.md

## Triage
completed

## What was built
Implemented a standardized error taxonomy in `backend/app/diagnostics.py` that maps raw network exceptions and HTTP error status codes into stable, classified error codes (`timeout`, `connection_reset`, `connection_error`, `dns_error`, `http_408`, `http_429`, `http_500`, `http_502`, `http_503`, `http_504`, `http_403`, `http_404`, `auth_required`, `source_expired`, `range_unsupported`, `file_too_large`, `verification_failed`, `extraction_failed`, `processing_failed`, `cancelled`, `unknown`). Included structured diagnostic logging that masks sensitive headers, auth tokens, and cookies.

## Acceptance criteria
- [x] Standard error taxonomy defined in `backend/app/diagnostics.py`.
- [x] `classify_error()` categorizes errors and returns `(error_code, is_transient)`.
- [x] `log_diagnostic()` emits structured logs masking credentials and sensitive parameters.
- [x] Tested with unit and integration tests in `test_reliability_phase8.py`.

## Blocked by
None
