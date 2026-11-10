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

### Slim list DTOs + pagination for deal/lead SSR

**Status:** open (SSR of lists restored after incident; payloads still full-graph)  
**Context:** List SSR via `ssrFetch` + `initialData` is back. The Nov 2026 frontend OOM loop was dominated by React2Shell malware, not solely by SSR. Full deal/lead graphs (notes/appointments, no pagination) can still pressure the Node heap under `mem_limit`.

**Acceptance criteria:**

- Backend (or BFF) exposes **slim list DTOs** — no nested notes/appointments (and other heavy relations) on list endpoints.
- **Pagination** (or equivalent bounded page size) on all list SSR paths; never `findMany` of the full graph for HTML.
- Keep per-request QueryClient and `initialData` (no render-time `setQueryData`, no process-wide singleton).
- Memory under production `mem_limit` stays stable under normal traffic + Docker healthchecks.

**Related:** [Frontend rendering notes](frontend/README.md#list-pages-rendering-ssr-data--csr-refresh), [Troubleshooting – frontend OOM](deployment/06-troubleshooting.md#frontend-container-oom-crm-production-frontend).
