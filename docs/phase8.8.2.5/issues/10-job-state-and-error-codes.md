# 10: Extended Job State, Diagnostics & Error Reporting

## Parent
docs/phase8.8.2.5/spec.md

## Triage
completed

## What was built
Enhanced `Job` model in `backend/app/jobs.py` and API responses in `backend/app/main.py`. Added pipeline stages (`current_stage`: `queued`, `extracting`, `resolving`, `downloading`, `retrying`, `resuming`, `verifying`, `processing`, `ready`, `failed`), retry indicators (`retry_count`, `current_attempt`), transfer mode (`direct`, `resuming`, `restart`), `resumed_from_bytes`, and `warnings` array. Updated serialization in `Job.from_dict` to filter extra/unknown fields for complete backward compatibility.

## Acceptance criteria
- [x] Job schema includes `error_code`, `retry_count`, `current_attempt`, `current_stage`, `transfer_mode`, `resumed_from_bytes`, and `warnings`.
- [x] API endpoint `GET /api/jobs/{job_id}` returns extended fields.
- [x] Full backward compatibility when deserializing legacy metadata files.

## Blocked by
docs/phase8.8.2.5/issues/01-download-failure-diagnostics.md
