from urllib.parse import urlsplit

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


app = FastAPI(title="MediaDrop API")


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/analyze")
async def analyze(request: Request):
    try:
        payload = await request.json()
    except ValueError:
        payload = None

    url = payload.get("url") if isinstance(payload, dict) else None
    url = url.strip() if isinstance(url, str) else ""
    try:
        address = urlsplit(url)
        valid = address.scheme in ("http", "https") and bool(address.hostname) and not any(char.isspace() for char in address.netloc)
        address.port  # Reject malformed ports, even though the server never visits the URL.
    except ValueError:
        valid = False
    if not valid:
        return JSONResponse({"code": "invalid_url", "message": "Please enter a valid HTTP or HTTPS URL."}, status_code=400)

    if url == "https://example.com/unsupported":
        return JSONResponse({"code": "unsupported_media", "message": "This link is currently not supported."}, status_code=422)
    if url == "https://example.com/error":
        return JSONResponse({"code": "internal_error", "message": "Please try again."}, status_code=500)

    title = "Example Media With A VeryLongUnbrokenSectionForTesting" if url == "https://example.com/long-title" else "Example Media"
    return {"title": title, "duration": 204, "type": "video"}
