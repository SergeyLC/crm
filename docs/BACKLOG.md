# Backlog

Engineering follow-ups that are intentionally deferred.

## Security / ops (post-incident)

### Keep Next.js on a patched React2Shell line

**Context (2026-11-09):** Production frontend on `217.154.173.36` showed foreign processes (`x86_64.dusk`, `logic.sh`, fake `systemd`/`pm2`/`npm`) consistent with RCE via **CVE-2025-55182 / CVE-2025-66478** (React2Shell) on Next.js **16.0.1**. App Router + RSC was affected; fixed in Next **≥16.0.7** (repo bumped to **16.4.5** + React **19.2.9**).

**Ongoing:**

- Never deploy Next 15.x/16.x below the patched floor for that line.
- Rebuild images only from clean CI/source — never commit/export from a live compromised container.
- After any suspected RCE: rotate JWT, DB passwords, and all frontend/backend env secrets; audit Postgres; drop egress to known C2 (e.g. `62.60.226.31`).
- Do **not** raise frontend `mem_limit` to “fix” unexplained RSS growth during incident triage.

## Frontend / Next.js

### Restore true SSR for deal/lead list pages (only with slim DTO + pagination)

**Status:** deferred  
**Why deferred:** Full-graph SSR (`ssrFetch` of deals/leads including notes/appointments, no pagination) pushed the production frontend container (`crm-production-frontend`, ~768–1024 MB limit) to OOM every 15–20 minutes. Lists are client-fetched for now (SSR shell only).

**Acceptance criteria when picked up:**

- Server-rendered list HTML again for deals / leads / kanban (and archived/won/lost variants as needed).
- Backend (or BFF) exposes **slim list DTOs** — no nested notes/appointments (and other heavy relations) on list endpoints.
- **Pagination** (or equivalent bounded page size) on all list SSR paths; never `findMany` of the full graph for HTML.
- Frontend SSR must not write unbounded payloads into a process-wide React Query cache; prefer per-request client or pass `initialData` without cross-request retention.
- Memory under production `mem_limit` stays stable (no OOM loop) under normal traffic + Docker healthchecks.

**Related:** [Frontend rendering notes](frontend/README.md#list-pages-rendering-ssr-shell--csr-data), [Troubleshooting – frontend OOM](deployment/06-troubleshooting.md#frontend-container-oom-crm-production-frontend).
