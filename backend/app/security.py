import ipaddress
import socket
from urllib.parse import urlsplit

_BLOCKED_HOSTNAMES = frozenset({"localhost", "0.0.0.0"})


def validate_url_syntax(url: str) -> tuple[bool, str | None]:
    if not isinstance(url, str):
        return False, None
    clean = url.strip()
    if not clean:
        return False, None
    try:
        parts = urlsplit(clean)
        valid = (
            parts.scheme in ("http", "https")
            and bool(parts.hostname)
            and not any(c.isspace() for c in parts.netloc)
        )
        parts.port  # triggers ValueError if port is invalid
        return valid, parts.hostname
    except Exception:
        return False, None


def is_private_ip(ip_str: str) -> bool:
    try:
        ip = ipaddress.ip_address(ip_str)
        return ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_unspecified
    except ValueError:
        return False


def is_safe_host(hostname: str) -> bool:
    """Return True only if hostname is public and does not resolve to private/loopback IP."""
    if not hostname:
        return False
    host_lower = hostname.lower()
    if host_lower in _BLOCKED_HOSTNAMES:
        return False

    # Check if literal IP
    try:
        ip = ipaddress.ip_address(hostname)
        return not (ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_unspecified)
    except ValueError:
        pass  # Hostname is a domain name, proceed to DNS resolution

    # Resolve hostname to check actual destination IPs
    try:
        addr_info = socket.getaddrinfo(hostname, None)
        for _, _, _, _, sockaddr in addr_info:
            ip_str = sockaddr[0]
            if is_private_ip(ip_str):
                return False
        return True
    except Exception:
        return False


def is_safe_url(url: str) -> bool:
    valid, hostname = validate_url_syntax(url)
    if not valid or not hostname:
        return False
    return is_safe_host(hostname)
