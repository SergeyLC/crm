# Deployment Configuration Guide

How to configure the unified GitHub Actions deployment for this CRM.

**Source of truth for triggers and directories:** [.github/CI_CD_SETUP.md](.github/CI_CD_SETUP.md)  
**Ops guides:** [docs/deployment/README.md](docs/deployment/README.md)

## Deployment strategy

Two dimensions:

1. **Environment** — from git trigger (branch or tag)
2. **Deployment type** — `docker` (default) or `traditional`

### Trigger → environment

| Trigger | GitHub Environment | Port | Server directory |
|---------|--------------------|------|------------------|
| Push to `main` | `stage-main` | 8080 | `/var/www/crm-stage-main` |
| Push to `develop` | `stage-develop` | 8081 | `/var/www/crm-stage-develop` |
| Tag `v*` (e.g. `v1.0.7`) | `production` | 80 | `/var/www/crm-production` |

Compose files:

- Production → `docker-compose.production.yml`
- Stage-main → `docker-compose.stage-main.yml`
- Stage-develop → `docker-compose.stage-develop.yml`

CI runs **`prisma migrate deploy`**. It does **not** seed the database.

### Deployment type

| Type | When to use |
|------|-------------|
| **Docker** (default) | Production and staging — isolated containers, GHCR images |
| **Traditional** | Legacy PM2 / source-on-server (rare) |

## GitHub configuration

### 1. Repository variable

**Settings → Secrets and variables → Actions → Variables**

```
DEPLOYMENT_TYPE=docker
```

### 2. Environments

**Settings → Environments** — create three environments:

| Name | Purpose |
|------|---------|
| `production` | Live site on port 80 |
| `stage-main` | Pre-production on port 8080 (pushes to `main`) |
| `stage-develop` | Feature staging on port 8081 (pushes to `develop`) |

Per environment, add secrets (same names, different values):

| Secret | Example (stage-main) | Example (production) |
|--------|----------------------|----------------------|
| `POSTGRES_DB` | `crm_staging` | `crm` |
| `POSTGRES_USER` | `crm` | `crm` |
| `POSTGRES_PASSWORD` | strong random | strong random |
| `JWT_SECRET` | ≥32 chars | ≥32 chars |

### 3. Repository secrets (shared)

| Secret | Description |
|--------|-------------|
| `SERVER_HOST` | Server IP or hostname |
| `SERVER_USER` | SSH user (e.g. `root`) |
| `SERVER_SSH_KEY` | Private SSH key for deploy |

Details: [docs/deployment/GITHUB_SECRETS_GUIDE.md](docs/deployment/GITHUB_SECRETS_GUIDE.md) · [.github/QUICK_SETUP.md](.github/QUICK_SETUP.md)

## Deployment type priority

1. **workflow_dispatch** input `deployment_type` (highest)
2. Environment variable `DEPLOYMENT_TYPE`
3. Repository variable `DEPLOYMENT_TYPE`
4. Default: `docker`

## Common workflows

```bash
# Stage-main (port 8080)
git push origin main

# Stage-develop (port 8081)
git push origin develop

# Production (port 80) — release tag
git tag v1.0.8
git push origin v1.0.8
# or: ./deploy.sh -m "feat: …" -t
```

## Troubleshooting

- Deploy skipped → check environments exist and names match (`stage-main`, not legacy `staging`)
- Empty login after first deploy → migrations ran, seed did not; seed manually in the backend container if needed
- See [.github/CI_CD_SETUP.md](.github/CI_CD_SETUP.md) and [TROUBLESHOOTING_DEPLOYMENT.md](TROUBLESHOOTING_DEPLOYMENT.md)
