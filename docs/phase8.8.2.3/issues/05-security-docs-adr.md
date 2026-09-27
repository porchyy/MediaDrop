# 05: Security Hardening — `.gitignore`, `docker-compose.example.yml`, CONTEXT.md, ADR

## Parent
docs/phase8.8.2.3/spec.md

## What to build
Four security and documentation tasks bundled as one issue since they share no code dependencies and can be delivered atomically.

### 1. `.gitignore` additions
Add the following entries to prevent accidental credential commits:
```
secrets/
*cookies*.txt
.env
docker-compose.yml
```

### 2. `docker-compose.example.yml`
Create at the repository root. Must include:
- `INSTAGRAM_COOKIE_FILE=/run/secrets/instagram-cookies.txt` as an environment variable for the backend service.
- A read-only bind mount: `/srv/mediadrop/secrets/instagram-cookies.txt:/run/secrets/instagram-cookies.txt:ro`.
- A clear comment that operators must copy this file to `docker-compose.yml` (which is gitignored) and set real paths.

### 3. CONTEXT.md — three new terms
Add to the domain glossary:
- **Anonymous Extract**: การดึงข้อมูลสื่อโดยไม่ส่ง session หรือ cookie ใดๆ ไปยัง platform ต้นทาง
- **Authenticated Extract**: การดึงข้อมูลสื่อโดยใช้ Server Session Cookie ของระบบ ทำเฉพาะเมื่อ Anonymous Extract ล้มเหลวเนื่องจาก Login Wall
- **Server Session Cookie**: Cookie file format Netscape ของบัญชี Instagram เฉพาะ MediaDrop mount เข้า server แบบ read-only ไม่เปิดเผยต่อ Frontend หรือ API ใดๆ

### 4. ADR: `docs/adr/0001-instagram-hybrid-extract.md`
Record the architectural decision: Hybrid Anonymous→Authenticated chosen over:
- Always-authenticated (wastes session quota on public posts, ties all requests to the account)
- Third-party API / HikerAPI (cost, rate limits, privacy — user URLs sent to external service, single point of failure)
- Instaloader replacing gallery-dl (unnecessary full engine swap; gallery-dl is already established)

## Acceptance criteria
- [ ] `.gitignore` contains `secrets/`, `*cookies*.txt`, `.env`, and `docker-compose.yml`.
- [ ] `docker-compose.example.yml` exists at repo root with correct env var and read-only volume mount.
- [ ] `CONTEXT.md` includes all three new terms in the Language section.
- [ ] `docs/adr/0001-instagram-hybrid-extract.md` exists and records the three rejected alternatives with reasoning.
- [ ] No actual cookie file or secret is present anywhere in the repository.

## Blocked by
None (can run in parallel with Issues 01–04)
