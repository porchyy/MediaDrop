import asyncio
import os
import re
import time
from pathlib import Path
from typing import Any, Callable, Coroutine
from urllib.parse import unquote, urljoin, urlsplit

import httpx

from app.diagnostics import (
    ERROR_CANCELLED,
    ERROR_FILE_TOO_LARGE,
    ERROR_RANGE_UNSUPPORTED,
    ERROR_SOURCE_EXPIRED,
    ERROR_UNKNOWN,
    SourceExpiredError,
    classify_error,
    log_diagnostic,
)
from app.jobs import Job, JobManager
from app.security import is_safe_url

MAX_DOWNLOAD_SIZE = int(os.environ.get("MAX_DOWNLOAD_SIZE", 500 * 1024 * 1024))  # 500 MB
DOWNLOAD_MAX_RETRIES = int(os.environ.get("DOWNLOAD_MAX_RETRIES", 5))
DOWNLOAD_INITIAL_BACKOFF = float(os.environ.get("DOWNLOAD_INITIAL_BACKOFF", 1.0))
DOWNLOAD_MAX_BACKOFF = float(os.environ.get("DOWNLOAD_MAX_BACKOFF", 16.0))
DOWNLOAD_CONNECT_TIMEOUT = float(os.environ.get("DOWNLOAD_CONNECT_TIMEOUT", 10.0))
DOWNLOAD_READ_TIMEOUT = float(os.environ.get("DOWNLOAD_READ_TIMEOUT", 30.0))


def clean_filename(name: str) -> str:
    cleaned = "".join(c for c in name if c not in '<>:"/\\|?*').strip()
    return cleaned or "downloaded_file"


def extract_filename_from_headers_or_url(headers: dict[str, str], url: str) -> str:
    content_disp = headers.get("content-disposition", "")
    match = re.search(r'filename\*?=(?:UTF-8\'\')?"?([^";]+)"?', content_disp, re.IGNORECASE)
    if match:
        name = match.group(1).strip()
        if name:
            return clean_filename(unquote(name))

    path = urlsplit(url).path
    name = Path(path).name
    if name:
        return clean_filename(unquote(name))
    return "downloaded_file"


class ReliableDownloader:
    """
    Centralized, resilient HTTP transfer layer supporting retries,
    exponential backoff, partial file (.part) resume via HTTP Range,
    SSRF validation on every hop, and source refresh.
    """

    def __init__(
        self,
        max_retries: int = DOWNLOAD_MAX_RETRIES,
        initial_backoff: float = DOWNLOAD_INITIAL_BACKOFF,
        max_backoff: float = DOWNLOAD_MAX_BACKOFF,
        connect_timeout: float = DOWNLOAD_CONNECT_TIMEOUT,
        read_timeout: float = DOWNLOAD_READ_TIMEOUT,
        max_size: int = MAX_DOWNLOAD_SIZE,
        client: httpx.AsyncClient | None = None,
    ):
        self.max_retries = max_retries
        self.initial_backoff = initial_backoff
        self.max_backoff = max_backoff
        self.connect_timeout = connect_timeout
        self.read_timeout = read_timeout
        self.max_size = max_size
        self._custom_client = client

    async def download_file(
        self,
        url: str,
        output_dir: Path,
        job: Job,
        manager: JobManager,
        suggested_filename: str | None = None,
        on_source_refresh: Callable[[], Coroutine[Any, Any, str | None]] | None = None,
        custom_headers: dict[str, str] | None = None,
    ) -> tuple[Path, str]:
        """
        Downloads URL to `output_dir / {filename}.part`.
        Returns `(part_file_path, final_filename)`.
        Does not perform final rename or media verification (handled by upper layer).
        """
        output_dir.mkdir(parents=True, exist_ok=True)
        current_url = url
        has_explicit_filename = bool(suggested_filename)
        final_filename = clean_filename(suggested_filename) if suggested_filename else None
        part_path: Path | None = None

        if not part_path:
            existing_parts = [p for p in output_dir.glob("*.part") if p.is_file()]
            if existing_parts:
                part_path = existing_parts[0]
                final_filename = part_path.name[:-5]
            elif final_filename:
                part_path = output_dir / f"{final_filename}.part"

        timeout = httpx.Timeout(self.read_timeout, connect=self.connect_timeout)
        client_ctx = (
            self._custom_client
            if self._custom_client is not None
            else httpx.AsyncClient(timeout=timeout, follow_redirects=False)
        )

        async with client_ctx as client:
            attempt = 0
            while attempt < self.max_retries:
                attempt += 1
                manager.update_job(
                    job.job_id,
                    current_attempt=attempt,
                    retry_count=attempt - 1,
                )

                if manager.is_cancelled(job.job_id):
                    if part_path and part_path.exists():
                        part_path.unlink(missing_ok=True)
                    raise asyncio.CancelledError("Job cancelled by user")

                # SSRF check on current URL
                if not is_safe_url(current_url):
                    log_diagnostic(job.job_id, stage="downloading", attempt=attempt, action="ssrf_blocked", url=current_url)
                    raise ValueError("Invalid or unsafe destination URL")

                # Check existing .part file for resume
                existing_bytes = 0
                if part_path and part_path.exists():
                    existing_bytes = part_path.stat().st_size

                req_headers = {"User-Agent": "MediaDrop/1.0"}
                if custom_headers:
                    req_headers.update(custom_headers)

                is_resuming = False
                if existing_bytes > 0:
                    req_headers["Range"] = f"bytes={existing_bytes}-"
                    is_resuming = True
                    manager.update_job(
                        job.job_id,
                        status="resuming",
                        current_stage="resuming",
                        transfer_mode="resuming",
                        resumed_from_bytes=existing_bytes,
                    )
                    log_diagnostic(job.job_id, stage="resuming", attempt=attempt, action="request_range", offset=existing_bytes)
                else:
                    manager.update_job(
                        job.job_id,
                        status="downloading",
                        current_stage="downloading",
                        transfer_mode="direct",
                        resumed_from_bytes=0,
                    )

                try:
                    # Handle redirects manually to enforce SSRF validation at every hop
                    redirect_count = 0
                    max_redirects = 5
                    req_url = current_url
                    should_retry_outer = False

                    while True:
                        if not is_safe_url(req_url):
                            raise ValueError("Invalid or unsafe destination URL during redirect")

                        async with client.stream("GET", req_url, headers=req_headers) as response:
                            if response.status_code in (301, 302, 303, 307, 308):
                                redirect_count += 1
                                if redirect_count > max_redirects:
                                    raise ValueError("Too many redirects")
                                redirect_location = response.headers.get("location")
                                if not redirect_location:
                                    raise ValueError("Missing redirect location")
                                req_url = urljoin(req_url, redirect_location)
                                log_diagnostic(job.job_id, stage="downloading", attempt=attempt, action="redirect", to=req_url)
                                continue

                            # Check for 401 Unauthorized (Authentication Required)
                            if response.status_code == 401:
                                log_diagnostic(job.job_id, stage="downloading", attempt=attempt, action="auth_required", status=401)
                                response.raise_for_status()

                            # Check for 403 Forbidden (potentially expired signed URL)
                            if response.status_code == 403:
                                log_diagnostic(job.job_id, stage="downloading", attempt=attempt, action="source_expired_status", status=403)
                                if on_source_refresh:
                                    manager.update_job(job.job_id, status="resolving", current_stage="resolving")
                                    log_diagnostic(job.job_id, stage="resolving", attempt=attempt, action="refreshing_source")
                                    try:
                                        fresh_url = await on_source_refresh()
                                        if fresh_url and is_safe_url(fresh_url):
                                            current_url = fresh_url
                                            log_diagnostic(job.job_id, stage="resolving", attempt=attempt, action="source_refreshed", new_url=current_url)
                                            should_retry_outer = True
                                            break
                                    except Exception as ref_exc:
                                        log_diagnostic(job.job_id, stage="resolving", attempt=attempt, action="source_refresh_failed", error=str(ref_exc))
                                raise SourceExpiredError("HTTP 403: Source media URL expired or rejected", status_code=403)

                            # Check for 416 Range Not Satisfiable
                            if response.status_code == 416:
                                log_diagnostic(job.job_id, stage="resuming", attempt=attempt, action="range_rejected_416", offset=existing_bytes)
                                if part_path and part_path.exists():
                                    part_path.unlink(missing_ok=True)
                                existing_bytes = 0
                                should_retry_outer = True
                                break

                            # Check for other error status codes
                            if response.status_code not in (200, 206):
                                response.raise_for_status()

                            # Response is 200 or 206
                            resp_headers = {k.lower(): v for k, v in response.headers.items()}

                            if not has_explicit_filename:
                                authoritative_filename = extract_filename_from_headers_or_url(resp_headers, req_url)
                                if authoritative_filename:
                                    if part_path and part_path.exists() and final_filename and final_filename != authoritative_filename:
                                        new_part_path = output_dir / f"{authoritative_filename}.part"
                                        part_path.replace(new_part_path)
                                        part_path = new_part_path
                                    final_filename = authoritative_filename

                            if not part_path:
                                part_path = output_dir / f"{final_filename or 'downloaded_file'}.part"

                            # Determine content length & file opening mode
                            open_mode = "wb"
                            total_bytes: int | None = None

                            if response.status_code == 206:
                                # Resuming with 206 Partial Content
                                open_mode = "ab"
                                content_range = resp_headers.get("content-range", "")
                                range_match = re.search(r"bytes\s+(\d+)-\d+/(\d+|\*)", content_range, re.IGNORECASE)
                                if range_match:
                                    range_start = int(range_match.group(1))
                                    range_total = range_match.group(2)
                                    if range_start != existing_bytes:
                                        # Range mismatch: discard and restart safely
                                        log_diagnostic(job.job_id, stage="resuming", attempt=attempt, action="range_mismatch_restart", expected=existing_bytes, got=range_start)
                                        if part_path.exists():
                                            part_path.unlink(missing_ok=True)
                                        existing_bytes = 0
                                        should_retry_outer = True
                                        break
                                    if range_total != "*":
                                        total_bytes = int(range_total)
                                if total_bytes is None:
                                    content_length_header = resp_headers.get("content-length")
                                    if content_length_header and content_length_header.isdigit():
                                        total_bytes = existing_bytes + int(content_length_header)
                            elif response.status_code == 200:
                                # Full content returned
                                if is_resuming:
                                    # Server ignored Range; discard partial file and safely restart from byte 0
                                    log_diagnostic(job.job_id, stage="resuming", attempt=attempt, action="range_ignored_restart_full")
                                    existing_bytes = 0
                                    manager.update_job(job.job_id, transfer_mode="restart", resumed_from_bytes=0)
                                open_mode = "wb"
                                content_length_header = resp_headers.get("content-length")
                                if content_length_header and content_length_header.isdigit():
                                    total_bytes = int(content_length_header)

                            if total_bytes and total_bytes > self.max_size:
                                if part_path and part_path.exists():
                                    part_path.unlink(missing_ok=True)
                                raise ValueError("file_too_large")

                            # Download streaming loop
                            downloaded = existing_bytes
                            manager.update_job(
                                job.job_id,
                                status="downloading",
                                current_stage="downloading",
                                downloaded_bytes=downloaded,
                                total_bytes=total_bytes,
                            )

                            with open(part_path, open_mode) as f:
                                async for chunk in response.aiter_bytes(chunk_size=65536):
                                    if manager.is_cancelled(job.job_id):
                                        if part_path.exists():
                                            part_path.unlink(missing_ok=True)
                                        raise asyncio.CancelledError("Job cancelled by user")

                                    f.write(chunk)
                                    downloaded += len(chunk)

                                    if downloaded > self.max_size:
                                        if part_path.exists():
                                            part_path.unlink(missing_ok=True)
                                        raise ValueError("file_too_large")

                                    prog = (downloaded / total_bytes * 100) if total_bytes else None
                                    manager.update_job(
                                        job.job_id,
                                        downloaded_bytes=downloaded,
                                        total_bytes=total_bytes,
                                        progress=round(prog, 1) if prog is not None else None,
                                    )

                            # Stream finished successfully without exception
                            log_diagnostic(job.job_id, stage="downloading", attempt=attempt, action="stream_finished", offset=downloaded, total=total_bytes)
                            return part_path, final_filename

                    if should_retry_outer:
                        continue

                except Exception as exc:
                    err_code, is_transient = classify_error(exc)
                    log_diagnostic(
                        job.job_id,
                        stage="downloading",
                        attempt=attempt,
                        action="attempt_error",
                        error=err_code,
                        detail=str(exc),
                    )

                    if not is_transient or attempt >= self.max_retries:
                        raise

                    # Calculate backoff delay with exponential backoff & respect Retry-After
                    backoff = min(self.initial_backoff * (2 ** (attempt - 1)), self.max_backoff)
                    if isinstance(exc, httpx.HTTPStatusError) and exc.response.status_code == 429:
                        retry_after_header = exc.response.headers.get("retry-after")
                        if retry_after_header:
                            try:
                                backoff = min(float(retry_after_header), self.max_backoff)
                            except ValueError:
                                pass

                    manager.update_job(
                        job.job_id,
                        status="retrying",
                        current_stage="retrying",
                        error_code=err_code,
                    )
                    log_diagnostic(
                        job.job_id,
                        stage="retrying",
                        attempt=attempt,
                        action="wait_backoff",
                        delay=backoff,
                    )

                    # Sleep in small slices to remain responsive to cancellation
                    deadline = time.time() + backoff
                    while time.time() < deadline:
                        if manager.is_cancelled(job.job_id):
                            if part_path and part_path.exists():
                                part_path.unlink(missing_ok=True)
                            raise asyncio.CancelledError("Job cancelled by user")
                        await asyncio.sleep(min(0.2, max(0.01, deadline - time.time())))

            raise RuntimeError("Exceeded maximum download retry attempts")
