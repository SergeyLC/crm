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

### Production (port 80)
1. [Server setup](01-server-setup.md)
2. Push a release tag `v*` (see [CI/CD setup](../../.github/CI_CD_SETUP.md))
3. Open `http://YOUR_SERVER_IP`

### Stage-main (port 8080)
1. Complete server directories / firewall for 8080
2. Push to `main`
3. Open `http://YOUR_SERVER_IP:8080`

### Stage-develop (port 8081)
1. Firewall for 8081
2. Push to `develop`
3. Open `http://YOUR_SERVER_IP:8081`

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

CI applies **migrations only**. Seeding demo data is **manual** (not part of the deploy action).

## Architecture

```
Nginx (host port 80 / 8080 / 8081)
  ├─ Frontend (Next.js) :3000
  └─ Backend (Express)  :4000
       └─ PostgreSQL 16 :5432 (internal)
```

## Archive

Older guides live in [archive/](archive/). Prefer this README and guides `01`–`06` plus `.github/CI_CD_SETUP.md`.
