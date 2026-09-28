# Quick CI/CD Setup

## Problem: Deploy with Docker skipped?

Follow these steps in order.

### 1. Create Environments (2 minutes)

```
GitHub Repo → Settings → Environments → New environment
```

Create **three** environments:

- `production`
- `stage-main`
- `stage-develop`

### 2. Configure Environment Secrets (5 minutes)

For **each** environment:

```
Settings → Environments → [select stage-main] → Add Secret
```

| Secret Name | Example (stage-main) | Example (production) |
|-------------|----------------------|----------------------|
| `POSTGRES_DB` | `crm_staging` | `crm` |
| `POSTGRES_USER` | `crm` | `crm` |
| `POSTGRES_PASSWORD` | `openssl rand -base64 32` | different value |
| `JWT_SECRET` | `openssl rand -base64 64` | different value |

Repeat for `production` and `stage-develop` with different passwords/DB names (`crm_stage_develop` for develop).

### 3. Configure Repository Secrets (3 minutes)

```
Settings → Secrets and variables → Actions → Secrets → New repository secret
```

| Secret Name | Example | Description |
|-------------|---------|-------------|
| `SERVER_HOST` | `217.154.173.36` | Server IP or domain |
| `SERVER_USER` | `root` | SSH user |
| `SERVER_SSH_KEY` | `-----BEGIN...` | Full SSH **private** key |

Details: [GitHub Secrets Guide — SERVER_SSH_KEY](../docs/deployment/GITHUB_SECRETS_GUIDE.md#server_ssh_key)

### 4. (Optional) Repository Variable

- **Name**: `DEPLOYMENT_TYPE`
- **Value**: `docker`

## Done

| Push / tag | Environment | URL port |
|------------|-------------|----------|
| `main` | `stage-main` | **8080** |
| `develop` | `stage-develop` | **8081** |
| tag `v*` | `production` | **80** |

CI runs **migrations only** (no seed).

### How to verify (stage-main)

```bash
git push origin main
```

In Actions → Deploy Application → Setup Deployment Configuration you should see:

```
environment: stage-main
deployment_type: docker
should_deploy: true
```

## Still not working?

See [TROUBLESHOOTING_DEPLOYMENT.md](../TROUBLESHOOTING_DEPLOYMENT.md) and [.github/CI_CD_SETUP.md](CI_CD_SETUP.md).
