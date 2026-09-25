import asyncio
import json
import unittest

from app.main import app


async def request(method, path, payload=None, raw_body=None):
    body = raw_body if raw_body is not None else json.dumps(payload).encode() if payload is not None else b""
    messages = []

    async def receive():
        return {"type": "http.request", "body": body, "more_body": False}

    async def send(message):
        messages.append(message)

    await app(
        {
            "type": "http",
            "asgi": {"version": "3.0"},
            "http_version": "1.1",
            "method": method,
            "scheme": "http",
            "path": path,
            "raw_path": path.encode(),
            "query_string": b"",
            "root_path": "",
            "headers": [(b"content-type", b"application/json")],
            "client": ("test", 1),
            "server": ("test", 80),
        },
        receive,
        send,
    )
    status = next(item["status"] for item in messages if item["type"] == "http.response.start")
    content = b"".join(item.get("body", b"") for item in messages if item["type"] == "http.response.body")
    return status, json.loads(content)


class ApiTest(unittest.TestCase):
    def test_health_and_demo_preview(self):
        self.assertEqual(asyncio.run(request("GET", "/api/health")), (200, {"status": "ok"}))
        self.assertEqual(
            asyncio.run(request("POST", "/api/analyze", {"url": "https://example.com/video"})),
            (200, {"title": "Example Media", "duration": 204, "type": "video"}),
        )

    def test_invalid_url_and_demo_fixtures(self):
        for value in ("", "ftp://example.com/file", "https://", "https://exa mple.com", 123):
            with self.subTest(value=value):
                status, result = asyncio.run(request("POST", "/api/analyze", {"url": value}))
                self.assertEqual((status, result["code"]), (400, "invalid_url"))

        status, result = asyncio.run(request("POST", "/api/analyze", {}))
        self.assertEqual((status, result["code"]), (400, "invalid_url"))
        status, result = asyncio.run(request("POST", "/api/analyze", raw_body=b'{"url":'))
        self.assertEqual((status, result["code"]), (400, "invalid_url"))

        status, result = asyncio.run(request("POST", "/api/analyze", {"url": "https://example.com/unsupported"}))
        self.assertEqual((status, result["code"]), (422, "unsupported_media"))

        status, result = asyncio.run(request("POST", "/api/analyze", {"url": "https://example.com/error"}))
        self.assertEqual((status, result["code"]), (500, "internal_error"))

        status, result = asyncio.run(request("POST", "/api/analyze", {"url": "https://example.com/long-title"}))
        self.assertEqual(status, 200)
        self.assertIn("VeryLongUnbrokenSectionForTesting", result["title"])
