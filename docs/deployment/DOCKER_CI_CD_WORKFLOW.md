# Docker CI/CD Workflow Documentation

## Overview

Our CI/CD infrastructure supports containerized deployment using Docker and Docker Compose. This document focuses specifically on the Docker deployment mode, which provides:

- **Containerized deployment** with Docker Compose
- **Isolated environments** for each service (frontend, backend, database)
- **Easy scaling** and **portability** across different environments
- **Consistent deployment** across staging and production

The infrastructure is divided into three main workflows:

1. **Tests** - run tests on every push (same for all deployment modes)
2. **Build and Deploy Staging** - build and deploy to staging on push to main (Docker mode)
3. **Production Release** - release to production on tag (Docker mode)

## 1. Tests Workflow

**Trigger:** Push to any branch (excluding tags)

**File:** `.github/workflows/test.yml`

**Steps:**
- Install dependencies
- Generate Prisma client
- Generate i18n files
- Type checking (TypeScript)
- Lint checking
- Run unit tests

**Purpose:** Ensure code quality on all branches before merge.

---

## 2. Build and Deploy Staging (Docker Mode)

**Trigger:** Push to `main` branch (excluding tags)

**File:** `.github/workflows/deploy-staging.yml`

**Build Version Generation:**
- Reads stable version from `frontend/package.json` (e.g., `1.4.2`)
- Adds build metadata with commit hash: `1.4.2+sha.a3f09e1`
- Build version is written to `NEXT_PUBLIC_APP_VERSION` in `.env.docker`

**Deployment Mode:** Docker (Containerized deployment with Docker Compose)

**Mode Selection:**
Set the `DEPLOYMENT_TYPE` environment variable in GitHub Secrets:
- `DEPLOYMENT_TYPE=docker` - for Docker deployment
- `DEPLOYMENT_TYPE=pm2` or absence of variable - for PM2 deployment (**default**)

**Manual Run (workflow_dispatch):**
For testing Docker deployment without changing secrets:
1. Go to the "Actions" section of the repository on GitHub
2. Select the "Build and Deploy Staging" workflow
3. Click "Run workflow"
4. Select deployment type: **Docker**

**Steps (Docker mode):**
1. Run tests and checks
2. Generate build version
3. Deploy to staging server via SSH
4. Create `.env.docker` file from GitHub Secrets with build version
5. Build Docker images for frontend and backend
6. Start Docker services using Docker Compose
7. Wait for PostgreSQL container readiness
8. Apply database migrations inside the backend Docker container
9. Generate Prisma client inside the container

**Purpose:** Automatic build and deploy of every change in main to staging for testing in containerized environment.

**Important:** Staging database is populated with test data via `seed.ts` on every deploy. This creates users (`admin@loya.care`, `v1@loya.care`, etc.) with password `1` for testing.

**Docker Services (Staging):**
- **PostgreSQL:** Database container
- **Backend:** Node.js API server in container
- **Frontend:** Next.js application in container
- **Nginx:** Reverse proxy and static file serving

**Secrets (staging, Docker mode):**
- `STAGING_SERVER_HOST`
- `STAGING_SERVER_USER`
- `STAGING_SERVER_SSH_KEY`
- `STAGING_DATABASE_URL` (for container connection)
- `STAGING_JWT_SECRET`
- `STAGING_CORS_ORIGIN`
- `STAGING_NEXT_PUBLIC_API_URL`
- `STAGING_NEXT_PUBLIC_BACKEND_API_URL`
- `DEPLOYMENT_TYPE=docker`

---

## 3. Production Release (Docker Mode)

**Trigger:** Push tag with `v*` prefix (e.g., `v1.4.2`)

**File:** `.github/workflows/deploy-production.yml`

**Deployment Mode:** Docker (Containerized deployment with Docker Compose)

**Mode Selection:**
Set the `DEPLOYMENT_TYPE` environment variable in GitHub Secrets:
- `DEPLOYMENT_TYPE=docker` - for Docker deployment
- `DEPLOYMENT_TYPE=pm2` or absence of variable - for PM2 deployment (**default**)

**Manual Run (workflow_dispatch):**
For testing Docker deployment to production without changing secrets:
1. Go to the "Actions" section of the repository on GitHub
2. Select the "Production Release" workflow
3. Click "Run workflow"
4. Select deployment type: **Docker**
5. Optionally specify version for deployment

**Release Job:**
1. Check that tag is on `main` branch
2. Extract version from tag (v1.4.2 → 1.4.2)
3. Update `frontend/package.json` with new version
4. Commit changes to main
5. Create GitHub Release

**Deploy Job (Docker mode):**
1. Deploy to production server via SSH
2. Create `.env.docker` file from GitHub Secrets with release version
3. Build Docker images for frontend and backend
4. Start Docker services using Docker Compose
5. Wait for PostgreSQL container readiness
6. Apply database migrations inside the backend Docker container (WITHOUT seed - production data!)
7. Generate Prisma client inside the container

**Purpose:** Official release to production with version update in package.json and GitHub Release creation using containerized deployment.

**Important:** Production deploy does NOT run seed - works only with real data through migrations.

**Docker Services (Production):**
- **PostgreSQL:** Database container with persistent volumes
- **Backend:** Node.js API server in container
- **Frontend:** Next.js application in container
- **Nginx:** Reverse proxy and static file serving

**Secrets (production, Docker mode):**
- `SERVER_HOST`
- `SERVER_USER`
- `SERVER_SSH_KEY`
- `DATABASE_URL` (for container connection)
- `JWT_SECRET`
- `CORS_ORIGIN`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_BACKEND_API_URL`
- `DEPLOYMENT_TYPE=docker`

---

## Versioning

### Stable Version in package.json

`frontend/package.json` contains **only stable release version**.

- Format: `X.Y.Z` (e.g., `1.4.2`)
- Updated **only** when creating production release through GitHub Actions
- Not changed manually on every commit

### Build Metadata (Staging)

On every push to `main`:
- Format: `X.Y.Z+sha.HASH` (e.g., `1.4.2+sha.a3f09e1`)
- Used only in CI/CD and staging
- Written to `NEXT_PUBLIC_APP_VERSION` in `.env.docker` files

### Release Version (Production)

When creating tag:
- Format: `vX.Y.Z` (e.g., `v1.4.2`)
- GitHub Actions will update `package.json` to version `X.Y.Z`
- Create GitHub Release
- Deploy to production with this version in `NEXT_PUBLIC_APP_VERSION`

---

## Using deploy.sh

The `deploy.sh` script helps automate the deployment process for Docker deployments:

### Simple push to main (staging)

```bash
./deploy.sh -m "fix: add new feature"
```

**Result:**
- Commit with message "fix: add new feature" + list of unpushed commits
- Push to main
- GitHub Actions will run Docker staging deploy
- Staging will get version like `0.1.33+sha.a3f09e1`

### Multiple commits (auto staging deploy)

If you have several unpushed commits and you run:

```bash
./deploy.sh -m "deploy multiple changes"
```

**Result:**
- Creates summary commit: `chore(staging): v0.1.33 - deploy multiple changes`
- Commit body contains list of all unpushed commits
- Push to main → Docker staging deployment

### Creating release (production)

```bash
./deploy.sh -t -m "performance improvements and bug fixes"
```

**Result:**
- Auto-increment version: `0.1.33` → `0.1.34`
- Commit: `chore(release): v0.1.34 - performance improvements and bug fixes`
- Push to main (staging will skip release commit)
- Create tag `v0.1.34`
- Push tag
- GitHub Actions:
  - Will run Docker production deploy
  - Update `package.json` to version `0.1.34`
  - Create GitHub Release
  - Create commit `chore: bump version to 0.1.34`

### deploy.sh Parameters

- `-m "message"` - **Required**: message for commit/release
- `-t` - Create release tag (auto-increment patch version)
- `-v VERSION` - Specify specific version (e.g., `-v 1.5.0`)

**Important:** Unpushed commits are always included in commit message for complete change history.

---

## Workflow Diagram

```
┌─────────────────┐
│  Push to any    │
│     branch      │──────► Tests (test.yml)
└─────────────────┘

┌─────────────────┐
│  Push to main   │
│  (no tag)       │──────► Tests + Build Staging (Docker)
└─────────────────┘        (deploy-staging.yml)
                           Version: 1.4.2+sha.abc123
                           Services: PostgreSQL, Backend, Frontend, Nginx

┌─────────────────┐
│  Push tag v*    │
│  (on main)      │──────► Release + Deploy Production (Docker)
└─────────────────┘        (deploy-production.yml)
                           1. Update package.json → 1.4.2
                           2. Create GitHub Release
                           3. Deploy Docker containers to production
```

---

## Setting up GitHub Secrets for Docker

### For Staging (Docker)

In repository settings add:

```
STAGING_SERVER_HOST=staging.example.com
STAGING_SERVER_USER=deploy
STAGING_SERVER_SSH_KEY=<private-key>
STAGING_DATABASE_URL=postgresql://user:password@postgres:5432/loya_care_staging
STAGING_JWT_SECRET=<generated-jwt-secret>
STAGING_CORS_ORIGIN=https://staging.example.com
STAGING_NEXT_PUBLIC_API_URL=https://staging.example.com/api
STAGING_NEXT_PUBLIC_BACKEND_API_URL=https://staging.example.com:3001
DEPLOYMENT_TYPE=docker
```

### For Production (Docker)

```
SERVER_HOST=example.com
SERVER_USER=deploy
SERVER_SSH_KEY=<private-key>
DATABASE_URL=postgresql://user:password@postgres:5432/loya_care_prod
JWT_SECRET=<generated-jwt-secret>
CORS_ORIGIN=https://example.com
NEXT_PUBLIC_API_URL=https://example.com/api
NEXT_PUBLIC_BACKEND_API_URL=https://example.com:3001
DEPLOYMENT_TYPE=docker
```

**Note:** For Docker deployments, database URLs should point to the PostgreSQL container (`postgres:5432`) rather than localhost.

---

## Docker Compose Configuration

The deployment uses `docker-compose.yml` and `docker-compose.prod.yml` for service definitions:

### Services:
- **postgres:** PostgreSQL database with persistent volumes
- **backend:** Node.js/Express API server
- **frontend:** Next.js web application
- **nginx:** Reverse proxy and static file server

### Key Features:
- **Health checks** for database readiness
- **Volume mounts** for persistent data
- **Environment variables** from `.env.docker`
- **Port mapping** for external access
- **Depends_on** for service startup order

---

## Best Practices for Docker Deployment

1. **Do not change version in package.json manually** - GitHub Actions does this during release
2. **Use semantic versioning** (semver): MAJOR.MINOR.PATCH
3. **Test on staging before release** - every push to main is automatically deployed to staging
4. **Create tags only for production releases**
5. **Use clear messages in tags** - they will be visible in GitHub Releases
6. **Monitor Docker containers** - use `docker ps` and `docker logs` for troubleshooting
7. **Backup database volumes** - ensure persistent data is backed up regularly
8. **Update Docker images** - keep base images updated for security

---

## Example Scenarios

### Scenario 1: Developing new feature (Docker)

```bash
# Working in feature branch
git checkout -b feature/new-dashboard

# Make changes
git add .
git commit -m "Add new dashboard"
git push origin feature/new-dashboard

# ✅ Tests workflow will run automatically

# Create PR to main
# After merge to main:
# ✅ Tests workflow
# ✅ Build and Deploy Staging (Docker containers: 1.4.2+sha.xyz)
```

### Scenario 2: Hotfix on production (Docker)

```bash
# Fix bug in main
git checkout main
git pull

# Make changes
./deploy.sh -v 1.4.3 -m "Hotfix: critical bug"

# ✅ Tests workflow
# ✅ Build and Deploy Staging (Docker)
# ✅ Production Release (Docker containers: version 1.4.3)
```

### Scenario 3: Regular release (Docker)

```bash
# Several features accumulated in main
# All tested on staging

# Create release
./deploy.sh -v 1.5.0 -m "Release: new features and improvements"

# ✅ Production Release workflow (Docker)
# ✅ package.json updated to 1.5.0
# ✅ GitHub Release created
# ✅ Docker containers deployed to production
```

---

## Troubleshooting Docker Deployments

### Problem: Deploy didn't start

**Check:**
- Tag created on main branch?
- Tag format correct (v1.2.3)?
- GitHub Secrets configured?
- `DEPLOYMENT_TYPE=docker` set in secrets?

### Problem: Docker containers not starting

**Check:**
- Docker and Docker Compose installed on server?
- Sufficient disk space and memory?
- Environment variables in `.env.docker` correct?
- Port conflicts (check `docker ps` and `netstat`)?

### Problem: Database connection failed

**Check:**
- PostgreSQL container running? (`docker ps`)
- Database URL points to `postgres:5432` (not localhost)?
- Database credentials correct in secrets?

### Problem: Version in package.json didn't update

**Cause:** Most likely, you updated package.json manually before creating tag.

**Solution:** Revert changes, let GitHub Actions update version automatically.

### Problem: Staging shows old version

**Check:**
- Deploy completed successfully?
- Environment variable `NEXT_PUBLIC_APP_VERSION` set in `.env.docker`?
- Docker containers restarted? (`docker-compose restart`)

### Problem: Cannot access application

**Check:**
- Nginx container running?
- Port mapping correct in docker-compose.yml?
- Firewall allows traffic to container ports?

---

## Docker-Specific Commands

### On the server:

```bash
# Check running containers
docker ps

# View container logs
docker logs <container-name>

# Restart services
docker-compose restart

# Update and redeploy
docker-compose pull && docker-compose up -d

# Check disk usage
docker system df

# Clean up unused images
docker image prune -f
```

### Database operations in container:

```bash
# Access database container
docker exec -it loya-care-postgres bash

# Run migrations manually
docker exec loya-care-backend npx prisma migrate deploy

# Access database directly
docker exec -it loya-care-postgres psql -U postgres -d loya_care_prod
```

---

## Conclusion

The Docker CI/CD workflow provides:
- ✅ Automatic testing on all branches
- ✅ Automatic containerized deploy to staging on every change in main
- ✅ Controlled releases to production through tags
- ✅ Proper versioning without manual intervention
- ✅ Build metadata for tracking versions in staging
- ✅ Isolated, portable, and scalable containerized deployments
- ✅ Consistent environments across development, staging, and production</content>
<parameter name="filePath">/Users/sergeydaub/work/BZH/LoyaCareCRM/docs/deployment/DOCKER_CI_CD_WORKFLOW.md