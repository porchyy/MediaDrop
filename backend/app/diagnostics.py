import logging
from typing import Any
import httpx

logger = logging.getLogger("mediadrop.diagnostics")

# Standardized Error Taxonomy
ERROR_TIMEOUT = "timeout"
ERROR_CONNECTION_RESET = "connection_reset"
ERROR_CONNECTION_ERROR = "connection_error"
ERROR_DNS_ERROR = "dns_error"
ERROR_HTTP_408 = "http_408"
ERROR_HTTP_429 = "http_429"
ERROR_HTTP_500 = "http_500"
ERROR_HTTP_502 = "http_502"
ERROR_HTTP_503 = "http_503"
ERROR_HTTP_504 = "http_504"
ERROR_HTTP_403 = "http_403"
ERROR_HTTP_404 = "http_404"
ERROR_AUTH_REQUIRED = "auth_required"
ERROR_SOURCE_EXPIRED = "source_expired"
ERROR_RANGE_UNSUPPORTED = "range_unsupported"
ERROR_FILE_TOO_LARGE = "file_too_large"
ERROR_VERIFICATION_FAILED = "verification_failed"
ERROR_EXTRACTION_FAILED = "extraction_failed"
ERROR_PROCESSING_FAILED = "processing_failed"
ERROR_CANCELLED = "cancelled"
ERROR_UNKNOWN = "unknown"

TRANSIENT_STATUS_CODES = {408, 429, 500, 502, 503, 504}


class SourceExpiredError(Exception):
    """Raised when a resolved media URL has expired or been rejected with 401/403."""
    def __init__(self, message: str = "Source media URL expired or rejected", status_code: int = 403):
        super().__init__(message)
        self.status_code = status_code


class FileVerificationError(Exception):
    """Raised when downloaded file fails verification checks."""
    def __init__(self, message: str, code: str = ERROR_VERIFICATION_FAILED):
        super().__init__(message)
        self.code = code


def classify_error(exc: Exception) -> tuple[str, bool]:
    """
    Classify an exception into (error_code, is_transient).
    is_transient indicates if the error may succeed on immediate/backoff retry.
    """
    if isinstance(exc, SourceExpiredError):
        return ERROR_SOURCE_EXPIRED, False

    if isinstance(exc, FileVerificationError):
        return exc.code, False

    if isinstance(exc, httpx.TimeoutException):
        return ERROR_TIMEOUT, True

    if isinstance(exc, (httpx.RemoteProtocolError, ConnectionResetError)):
        return ERROR_CONNECTION_RESET, True

    if isinstance(exc, httpx.ConnectError):
        msg = str(exc).lower()
        if "name resolution" in msg or "dns" in msg or "getaddrinfo" in msg:
            return ERROR_DNS_ERROR, True
        return ERROR_CONNECTION_ERROR, True

    if isinstance(exc, httpx.HTTPStatusError):
        status_map = {
            408: (ERROR_HTTP_408, True),
            429: (ERROR_HTTP_429, True),
            500: (ERROR_HTTP_500, True),
            502: (ERROR_HTTP_502, True),
            503: (ERROR_HTTP_503, True),
            504: (ERROR_HTTP_504, True),
            401: (ERROR_AUTH_REQUIRED, False),
            403: (ERROR_HTTP_403, False),
            404: (ERROR_HTTP_404, False),
            416: (ERROR_RANGE_UNSUPPORTED, False),
        }
        status = exc.response.status_code
        if status in status_map:
            return status_map[status]

    msg = str(exc).lower()
    if "file exceeds" in msg or "file_too_large" in msg:
        return ERROR_FILE_TOO_LARGE, False
    if "cancelled" in msg:
        return ERROR_CANCELLED, False

    return ERROR_UNKNOWN, False


def log_diagnostic(
    job_id: str,
    stage: str,
    attempt: int,
    action: str,
    offset: int = 0,
    error: str | None = None,
    **kwargs: Any,
) -> None:
    """
    Structured server-side diagnostics without leaking credentials, cookies, or secrets.
    """
    # Filter any sensitive keys
    safe_kwargs = {
        k: v
        for k, v in kwargs.items()
        if k.lower() not in ("cookie", "cookies", "token", "auth", "authorization", "password", "secret")
    }
    extra_str = " ".join(f"{k}={v}" for k, v in safe_kwargs.items())
    log_msg = f"job={job_id} stage={stage} attempt={attempt} action={action} offset={offset}"
    if error:
        log_msg += f" error={error}"
    if extra_str:
        log_msg += f" {extra_str}"
    logger.info(log_msg)
