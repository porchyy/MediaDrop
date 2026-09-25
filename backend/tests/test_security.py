import socket
import unittest
from unittest.mock import patch

from app.security import is_safe_host, is_safe_url, validate_url_syntax


class SecurityTest(unittest.TestCase):
    def test_validate_url_syntax(self):
        valid, _ = validate_url_syntax("https://example.com/video.mp4")
        self.assertTrue(valid)

        for invalid in ("", "ftp://test.com", "http://", "http://exa mple.com"):
            valid, _ = validate_url_syntax(invalid)
            self.assertFalse(valid)

    def test_is_safe_host_literal_ips(self):
        self.assertFalse(is_safe_host("127.0.0.1"))
        self.assertFalse(is_safe_host("10.0.0.1"))
        self.assertFalse(is_safe_host("192.168.1.1"))
        self.assertFalse(is_safe_host("172.16.0.1"))
        self.assertFalse(is_safe_host("localhost"))
        self.assertFalse(is_safe_host("0.0.0.0"))
        self.assertFalse(is_safe_host("::1"))

    def test_is_safe_host_dns_resolution_private(self):
        # When a hostname resolves to a private IP (DNS rebinding / evil host)
        with patch("socket.getaddrinfo") as mock_dns:
            mock_dns.return_value = [
                (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("192.168.1.5", 80))
            ]
            self.assertFalse(is_safe_host("evil.example.com"))

    def test_is_safe_host_dns_resolution_public(self):
        with patch("socket.getaddrinfo") as mock_dns:
            mock_dns.return_value = [
                (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34", 80))
            ]
            self.assertTrue(is_safe_host("example.com"))

    def test_is_safe_url(self):
        with patch("app.security.is_safe_host", return_value=True):
            self.assertTrue(is_safe_url("https://example.com/test.mp4"))

        with patch("app.security.is_safe_host", return_value=False):
            self.assertFalse(is_safe_url("http://127.0.0.1/test.mp4"))


if __name__ == "__main__":
    unittest.main()
