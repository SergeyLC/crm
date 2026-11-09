# CRM — Docker Deployment Documentation

Deploy CRM on Ubuntu with Docker. **Canonical ops docs** are the numbered guides below.  
**Canonical CI/CD matrix:** [../../.github/CI_CD_SETUP.md](../../.github/CI_CD_SETUP.md)

## Documentation structure

### Getting started
- **[Server Setup](01-server-setup.md)** — Docker install, directories, firewall

### Production
- **[GitHub Actions](02-production-github-actions.md)** — recommended automated deploy (tag `v*`)
- **[Manual build](03-production-manual-build.md)** — local build / transfer images

### Staging environments
- **[Staging (stage-main / stage-develop)](04-staging-deployment.md)** — ports 8080 and 8081

> **Current VPS (~4 GB RAM):** Only **production (port 80)** runs continuously.  
> Push to `main`/`develop` runs tests but does **not** auto-deploy staging.  
> Staging: GitHub Actions → workflow_dispatch (or temporarily start compose on the server).  
> Production: push tag `v*`.

### Operations
- **[Container management](05-management.md)**
- **[Troubleshooting](06-troubleshooting.md)**

### Supplementary
- **[GitHub Secrets](GITHUB_SECRETS_GUIDE.md)**
- **[Nginx optimization](NGINX_OPTIMIZATION.md)**
- **[Server performance](SERVER_PERFORMANCE.md)**
- **[Deployment optimization](DEPLOYMENT_OPTIMIZATION.md)**
- **[Release strategy](RELEASE_DEPLOYMENT_STRATEGY.md)** — `[skip ci]` on release commits

## Quick start

### Local helper scripts (`deploy.sh` / `deploy.ps1`)

From the repo root, use these scripts to **commit, push, and optionally create a `v*` release tag**. They do **not** deploy on the server themselves — GitHub Actions builds images and runs Docker Compose.

| Platform | Script |
|----------|--------|
| Linux / macOS / Git Bash | `./deploy.sh` |
| Windows PowerShell | `.\deploy.ps1` |

Both share the same options and branch rules:

| Branch / action | Command | What happens next |
|-----------------|---------|-------------------|
| `develop` | `./deploy.sh -m "…" -s` (or `.\deploy.ps1 … -s`) | Push only (`-s` required; no release tags). Start stage-develop via Actions → **Run workflow**. |
| `main` (no tag) | `./deploy.sh -m "…"` | Commit + push (tests). Stage-main via **Run workflow** when needed. |
| `main` + release | `./deploy.sh -m "…" -t` or `-v X.Y.Z` | Creates tag `v*` → **production** deploy (port 80). |
| Docs / no CI | add `-s` | Commit message gets `[skip ci]`. |

```bash
./deploy.sh -h          # full help (branch-aware)
.\deploy.ps1 -h         # same on Windows
```

Prefer the repo-root scripts over `scripts/deploy.js` / `scripts/deploy.ps1` (legacy wrappers).

### Production (port 80)
1. [Server setup](01-server-setup.md)
2. Push a release tag `v*` (see [CI/CD setup](../../.github/CI_CD_SETUP.md)) — e.g. `./deploy.sh -m "…" -t` on `main`
3. Open `http://YOUR_SERVER_IP`

### Stage-main (port 8080)
1. Firewall: allow TCP **8080** on the VPS (`ufw allow 8080/tcp`)
2. Actions → **Deploy Application** → **Run workflow** → branch `main`
3. Optional: enable **run_seed** for demo users
4. Open `http://YOUR_SERVER_IP:8080`

### Stage-develop (port 8081)
1. Firewall: allow TCP **8081** (`ufw allow 8081/tcp`)
2. Actions → **Deploy Application** → **Run workflow** → branch `develop`
3. Optional: enable **run_seed** for demo users
4. Open `http://YOUR_SERVER_IP:8081`

## Environment matrix

| Parameter | Production | Stage-main | Stage-develop |
|-----------|------------|------------|---------------|
| Trigger | Tag `v*` | workflow_dispatch | workflow_dispatch |
| GitHub env | `production` | `stage-main` | `stage-develop` |
| HTTP port | 80 | 8080 | 8081 |
| Directory | `/var/www/crm-production` | `/var/www/crm-stage-main` | `/var/www/crm-stage-develop` |
| Compose | `docker-compose.production.yml` | `docker-compose.stage-main.yml` | `docker-compose.stage-develop.yml` |
| Containers | `crm-production-*` | `crm-stage-main-*` | `crm-stage-develop-*` |
| Typical DB name | `crm` | `crm_staging` | `crm_stage_develop` |

CI applies **migrations** on every deploy. **Seed is optional** (not automatic on push/tag):

- **Run workflow**: check **run_seed**. For production also set **confirm_seed_production** to `CONFIRM`.
- **Local script**: `node scripts/seed-remote.js --env stage-develop` (production: add `--confirm CONFIRM`).

Demo login after seed: `admin@example.com` / `1` (also `v1@example.com` / `1`).

## Architecture

```
Nginx (host port 80 / 8080 / 8081)
  ├─ Frontend (Next.js) :3000
  └─ Backend (Express)  :4000
       └─ PostgreSQL 16 :5432 (internal)
```
