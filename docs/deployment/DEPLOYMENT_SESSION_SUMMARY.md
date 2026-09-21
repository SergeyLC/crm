# Deployment Session Summary - 13 Jan 2026

## Problem: Incorrect version on the site

### Initial situation
- GitHub Actions successfully deployed the application
- Production site was running at http://217.154.173.36
- Problem: the site showed version **0.1.42** instead of the current **0.1.43**

### Root cause
Next.js embeds `NEXT_PUBLIC_*` environment variables at **build time**, not at **runtime**. The `NEXT_PUBLIC_APP_VERSION` variable must be passed as a **build argument** in Docker, but that was not configured.

## Fixes

### 1. Passing the version into the Docker build

**File:** `.github/actions/docker-deploy/action.yml`

Added `NEXT_PUBLIC_APP_VERSION` to build args for frontend:

```yaml
- name: Build and push frontend Docker image
  uses: docker/build-push-action@v5
  with:
    context: .
    file: ./docker/frontend/Dockerfile
    push: true
    tags: ${{ steps.meta-frontend.outputs.tags }}
    labels: ${{ steps.meta-frontend.outputs.labels }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
    build-args: |
      BUILD_VERSION=${{ steps.version.outputs.BUILD_VERSION }}
      NEXT_PUBLIC_APP_VERSION=${{ steps.version.outputs.BUILD_VERSION }}  # ← Added
```

### 2. Handling ARG in the Dockerfile

**File:** `docker/frontend/Dockerfile`

Added ARG and ENV to pass the version into the Next.js build:

```dockerfile
# Generate Prisma client for frontend
RUN cd db && pnpm run generate

# Build args for Next.js
ARG NEXT_PUBLIC_APP_VERSION
ENV NEXT_PUBLIC_APP_VERSION=${NEXT_PUBLIC_APP_VERSION}

# Build the Next.js application
RUN cd frontend && pnpm run build
```

### 3. DATABASE_URL on Production

**Problem:** Production `.env` had an explicit `DATABASE_URL`, which made maintenance harder.

**Solution:** Removed the explicit `DATABASE_URL` from `.env`. It is now formed automatically in `docker-compose.yml`:

```yaml
backend:
  environment:
    - DATABASE_URL=postgresql://${POSTGRES_USER:-crm}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-crm}
```

Variables are taken from `.env`:
```env
POSTGRES_DB=crm
POSTGRES_USER=crm
POSTGRES_PASSWORD=crm2024secure
```

## Problem history and solutions

### GitHub Actions issues (resolved earlier)

1. **Composite actions cannot use the `secrets.*` context**
   - Solution: Pass secrets as inputs to composite actions

2. **Missing GHCR permissions**
   - Solution: Add `permissions: packages: write` to the workflow

3. **Lowercase repository names in Docker**
   - Solution: `REPO_LOWER=$(echo "${{ github.repository }}" | tr '[:upper:]' '[:lower:]')`

4. **Identical Docker images for frontend and backend**
   - Root cause: `metadata-action` generated the same tags for both images
   - Solution: Split metadata into `meta-frontend` and `meta-backend`

5. **Frontend container restarting on production**
   - Cause: Missing `DATABASE_URL` (required for Prisma in Next.js)
   - Solution: Automatic formation via docker-compose

## Current system state

### Production (http://217.154.173.36)
- ✅ All containers healthy
- ✅ DATABASE_URL is formed automatically
- ✅ Site works correctly
- ⏳ After deploying v0.1.45 it will show the correct version

### Staging (http://217.154.173.36:8080)
- ✅ All containers healthy
- ✅ DATABASE_URL is formed automatically (always worked)
- ✅ Site works correctly
- ℹ️ Sometimes `docker compose restart nginx` is needed after container IP changes

### Containers

**Production:**
```
crm-frontend     Up (healthy)
crm-backend      Up (healthy)
crm-postgres     Up (healthy)
crm-nginx        Up
```

**Staging:**
```
crm-staging-frontend   Up (healthy)
crm-staging-backend    Up (healthy)
crm-staging-postgres   Up (healthy)
crm-staging-nginx      Up
```

## Deployment Process

### Creating a release

Use the `deploy.sh` script:

```bash
# Automatic patch version increment
./deploy.sh -m "fix: description" -t

# Or specify the version explicitly
./deploy.sh -m "feat: new feature" -v 1.4.2
```

The script automatically:
1. Creates a commit with the correct message
2. Creates a git tag (e.g. `v0.1.45`)
3. Pushes to GitHub
4. GitHub Actions starts and:
   - Updates `frontend/package.json` to the new version
   - Creates a GitHub Release
   - Builds Docker images **with the correct version**
   - Deploys to production

### After the deploy completes

**Required:** sync the local repository:

```bash
git pull --rebase
```

This updates `package.json` with the version that GitHub Actions changed.

## Important configuration files

### GitHub Actions
- `.github/workflows/deploy.yml` - main workflow
- `.github/actions/docker-deploy/action.yml` - Docker build and deploy
- `.github/actions/create-release/action.yml` - release creation
- `.github/actions/setup-deployment/action.yml` - environment detection

### Docker
- `docker-compose.yml` - production
- `docker-compose.stage.yml` - staging
- `docker/frontend/Dockerfile` - frontend image (dev)
- `docker/frontend/Dockerfile.prod` - frontend image (production, unused)
- `docker/backend/Dockerfile` - backend image

### Environment
- `/var/www/crm-production/.env` - production on the server
- `/var/www/crm-staging/.env.stage` - staging on the server

## Lessons Learned

### Next.js Environment Variables

**Build-time vs Runtime:**
- `NEXT_PUBLIC_*` variables are embedded into the code during `next build`
- Changing `.env` after the build **does not affect** these variables
- They must be passed as `ARG` in the Dockerfile and the image rebuilt

### Docker Compose Environment Variables

**Auto-formation vs Explicit value:**
- ✅ **Better:** Form `DATABASE_URL` from `POSTGRES_*` variables in compose
- ❌ **Worse:** Duplicate the value explicitly in the `.env` file

Advantages of auto-formation:
- Single source of truth (POSTGRES_* variables)
- Less duplication
- Easier maintenance

### Docker Metadata Action

**Problem with multiple images:**
```yaml
# ❌ Incorrect - generates identical tags
- name: Extract metadata
  uses: docker/metadata-action@v5
  with:
    images: |
      ghcr.io/owner/frontend
      ghcr.io/owner/backend
```

```yaml
# ✅ Correct - separate steps
- name: Extract metadata for frontend
  id: meta-frontend
  uses: docker/metadata-action@v5
  with:
    images: ghcr.io/owner/frontend

- name: Extract metadata for backend
  id: meta-backend
  uses: docker/metadata-action@v5
  with:
    images: ghcr.io/owner/backend
```

### Nginx in Docker

**DNS caching:**
- Nginx can cache IP addresses of upstream services
- When containers restart, IPs may change
- Solution: `docker compose restart nginx` or use a resolver in nginx.conf

## Next steps (optional)

### Optimizations

1. **Use a resolver in nginx.conf**
   ```nginx
   resolver 127.0.0.11 valid=10s;
   set $backend_upstream http://backend:4000;
   proxy_pass $backend_upstream;
   ```

2. **Add a healthcheck for nginx**
   ```yaml
   nginx:
     healthcheck:
       test: ["CMD", "curl", "-f", "http://localhost/api/health"]
   ```

3. **Automate NEXT_PUBLIC_APP_VERSION updates**
   - Current situation: `package.json` must be updated manually or via GitHub Actions
   - Possible improvement: Extract the version from the git tag automatically

### Monitoring

1. **Version logging**
   - Add an `/api/version` endpoint that returns the backend version
   - Compare with `NEXT_PUBLIC_APP_VERSION` on the frontend

2. **Alerting**
   - Notifications when containers go down
   - Resource usage monitoring

## Useful commands

### Status checks

```bash
# Status of all containers
ssh root@217.154.173.36 "docker ps --format 'table {{.Names}}\t{{.Status}}'"

# Version in production
ssh root@217.154.173.36 "docker exec crm-frontend env | grep NEXT_PUBLIC_APP_VERSION"

# Image version
ssh root@217.154.173.36 "docker images | grep ghcr.io/sergeylc/crm/frontend"

# Container logs
ssh root@217.154.173.36 "docker logs crm-frontend --tail 50"
```

### Deployment

```bash
# Create a release (auto-increment)
./deploy.sh -m "fix: description" -t

# Push without deploy (for documentation)
./deploy.sh -m "docs: update" -s

# After deploy - sync
git pull --rebase
```

### Troubleshooting

```bash
# Restart containers
ssh root@217.154.173.36 "cd /var/www/crm-production && docker compose restart"

# Recreate container with new .env
ssh root@217.154.173.36 "cd /var/www/crm-production && docker compose up -d --force-recreate frontend"

# Check environment variables
ssh root@217.154.173.36 "cd /var/www/crm-production && cat .env"
```

## Contacts and links

- **Production:** http://217.154.173.36
- **Staging:** http://217.154.173.36:8080
- **GitHub Repo:** https://github.com/SergeyLC/crm
- **GHCR:** ghcr.io/sergeylc/crm/frontend, ghcr.io/sergeylc/crm/backend

## Conclusion

All major deploy and version-display issues are resolved:
1. ✅ GitHub Actions correctly builds images with the version
2. ✅ Production and Staging run stably
3. ✅ DATABASE_URL is formed automatically
4. ✅ Version is passed into the Docker build and embedded in Next.js

After deploying v0.1.45, the site will show the correct application version.
