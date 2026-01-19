# Session Summary - Docker Deployment Fixes (19 Jan 2026)

## 🎯 Objective Completed
Successfully fixed and deployed LoyaCare CRM with Docker on production server. All three environments (production, stage-main, stage-develop) are now fully operational.

## 🖥️ Server Information
- **Host**: 217.154.173.36
- **SSH**: root@217.154.173.36
- **OS**: Ubuntu with Docker Compose V2

### Deployed Environments
| Environment | Port | Database | Status |
|------------|------|----------|--------|
| Production | 80 | loyacrm_production | ✅ Working |
| Stage-Main | 8080 | loyacrm_staging | ✅ Working |
| Stage-Develop | 8081 | loyacrm_stage_develop | ✅ Working |

## 🔧 Critical Fixes Applied

### 1. GitHub Actions Workflow
**Problem**: Tag-based deployments weren't triggering workflows
- **Root Cause**: `[skip ci]` in deploy.sh commit messages blocked ALL workflows
- **Fix**: Removed `[skip ci]` from line 234 in `deploy.sh`
- **Files**: `deploy.sh`

### 2. Docker Registry Authentication
**Problem**: Server couldn't pull images from GHCR
- **Root Cause**: No authentication configured on server
- **Fix**: Added Docker login step before pulling images
- **Files**: `.github/actions/docker-deploy/action.yml` (lines 317-320)
```yaml
echo "🔐 Logging in to GitHub Container Registry..."
echo "${{ inputs.github_token }}" | docker login ghcr.io -u ${{ github.actor }} --password-stdin
```

### 3. Next.js Standalone Build
**Problem**: Frontend Docker images were 2.93GB (too large)
- **Root Cause**: Full node_modules and pnpm store copied to production image
- **Fix**: Implemented Next.js standalone output with multi-stage build
- **Result**: Reduced to ~350MB (8.4x smaller)
- **Files**: 
  - `frontend/next.config.js` (lines 8-13)
  - `docker/frontend/Dockerfile` (complete rewrite)

### 4. Network Binding Issue
**Problem**: Next.js wasn't accessible from nginx
- **Root Cause**: Next.js standalone binds to container hostname, not 0.0.0.0
- **Fix**: Added `HOSTNAME=0.0.0.0` environment variable
- **Files**: All `docker-compose.*.yml` frontend services

### 5. Healthcheck IPv6 Issue
**Problem**: Frontend containers kept restarting (healthcheck failing)
- **Root Cause**: Alpine Linux resolves `localhost` to IPv6 `[::1]`, but Next.js listens IPv4 only
- **Fix**: Changed healthcheck to use `127.0.0.1` instead of `localhost`
- **Command**: `wget --quiet --tries=1 --spider http://127.0.0.1:3000 || exit 1`
- **Files**: All `docker-compose.*.yml` (frontend AND backend healthchecks)

### 6. Nginx Routing After Container Restart
**Problem**: Nginx returned 502 after container recreation
- **Root Cause**: Container IP addresses changed (172.22.0.3 → 172.22.0.5), nginx cached old IPs
- **Fix**: Restart nginx after recreating containers
- **Command**: `docker compose restart nginx`

### 7. Database Name Mismatch
**Problem**: Backend couldn't connect to database (authentication failed)
- **Root Cause**: 
  - `.env` specified `POSTGRES_DB=loyacrm`
  - Actual database was `loyacrm_production`
  - docker-compose.yml had wrong default
- **Fix**: 
  - Updated `docker-compose.production.yml` default to `loyacrm_production`
  - Updated `.env` on server
- **Files**: `docker-compose.production.yml` (lines 64, 86)

### 8. PostgreSQL Password After Recreation
**Problem**: Database authentication failed after container recreation
- **Root Cause**: PostgreSQL container recreated but volume persisted with old password
- **Fix**: Manually updated password in PostgreSQL
- **Command**: 
```bash
docker exec loyacrm-production-postgres psql -U loyacrm -d postgres \
  -c "ALTER USER loyacrm WITH PASSWORD 'loyacrm2024secure';"
```

## 📁 File Structure on Server

```
/var/www/
├── loyacrm-production/
│   ├── docker-compose.yml
│   ├── .env
│   ├── nginx.prod.conf
│   └── backups/
├── loyacrm-stage-main/
│   ├── docker-compose.yml
│   ├── .env.stage-main
│   └── nginx.stage-main.conf
└── loyacrm-stage-develop/
    ├── docker-compose.yml
    ├── .env.stage-develop
    └── nginx.stage-develop.conf
```

## 🔐 Credentials & Configuration

### Database Credentials
**Production**:
- User: `loyacrm`
- Password: `loyacrm2024secure`
- Database: `loyacrm_production`
- Host: `postgres` (Docker network)

**Stage-Main**:
- User: `loyacrm`
- Password: From `.env.stage-main`
- Database: `loyacrm_staging`

**Stage-Develop**:
- User: `loyacrm`
- Password: From `.env.stage-develop`
- Database: `loyacrm_stage_develop`

### Test User
- Email: `admin@example.com`
- Password: `1`

### JWT Secret
Set via `JWT_SECRET` in `.env` files

## 🐳 Docker Configuration

### Images in Use
```
Production:
- Frontend: ghcr.io/sergeylc/crm/frontend:production-967cdd1-20260119-215658 (350MB)
- Backend: ghcr.io/sergeylc/crm/backend:production-967cdd1-20260119-215658 (1.37GB)

Stage-Main:
- Frontend: ghcr.io/sergeylc/crm/frontend:staging-967cdd1-20260119-215650 (350MB)
- Backend: ghcr.io/sergeylc/crm/backend:staging-967cdd1-20260119-215650 (1.37GB)
```

### Volumes
```
- pg_data_production: PostgreSQL data (production)
- pg_data_stage_main: PostgreSQL data (stage-main)
- pg_data_stage_develop: PostgreSQL data (stage-develop)
```

### Networks
```
- loyacrm-production-network
- loyacrm-stage-main-network
- loyacrm-stage-develop-network
```

## 📊 Disk Space Management

### Before Cleanup
- Total: 116GB
- Used: 48GB (42%)
- Docker Images: 47.47GB

### After Cleanup
- Total: 116GB
- Used: 14GB (13%)
- Docker Images: 10.96GB (11 active images)
- Free: 102GB

### Cleanup Commands Used
```bash
# Remove images older than 24h
docker image prune -a -f --filter 'until=24h'

# Remove all unused images
docker image prune -a -f
```

## 🚀 Deployment Process

### Current Workflow
1. Developer runs: `./deploy.sh -t -m "Release message"`
2. Script auto-increments version (e.g., 1.0.0 → 1.0.1)
3. Creates git tag and pushes to GitHub
4. GitHub Actions triggers on tag push
5. Workflow runs:
   - Test job
   - Setup job
   - Docker Deploy job (builds, pushes, deploys)
   - Create Release job (after successful deploy)

### Deploy Script Details
- Location: `./deploy.sh`
- Auto-increment flag: `-t`
- Message flag: `-m "message"`
- Reads version from: `frontend/package.json`
- Creates annotated git tags

### GitHub Actions
- Workflow: `.github/workflows/deploy.yml`
- Deploy Action: `.github/actions/docker-deploy/action.yml`
- Release Action: `.github/actions/create-release/action.yml`

## 🔍 Monitoring & Verification

### Check Site Status
```bash
# Quick check
curl http://217.154.173.36/         # Production
curl http://217.154.173.36:8080/    # Stage-main
curl http://217.154.173.36:8081/    # Stage-develop

# Expected: 307 redirect or 200 OK
```

### Check Container Health
```bash
ssh root@217.154.173.36 "docker ps --format 'table {{.Names}}\t{{.Status}}'"

# Should show: (healthy) for all services
```

### Test Login API
```bash
curl -X POST http://217.154.173.36/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"1"}' | jq

# Expected: {"success": true, "user": {...}, "token": "..."}
```

### Check Logs
```bash
# Frontend logs
docker logs loyacrm-production-frontend

# Backend logs
docker logs loyacrm-production-backend

# Follow logs
docker logs -f loyacrm-production-frontend
```

## ⚠️ Known Issues & Solutions

### Issue: Nginx 502 After Container Restart
**Symptom**: Nginx returns 502 Bad Gateway after restarting frontend/backend
**Cause**: Container IP changed, nginx cached old IP
**Solution**: `docker compose restart nginx`

### Issue: Healthcheck Failing
**Symptom**: Container status shows "(health: starting)" and keeps restarting
**Possible Causes**:
1. Using `localhost` instead of `127.0.0.1` (IPv6 issue)
2. Missing wget in container
3. Wrong port in healthcheck command

**Solution**: Check logs and verify healthcheck command

### Issue: Database Connection Failed
**Symptom**: Backend logs show "Authentication failed"
**Possible Causes**:
1. Wrong database name in DATABASE_URL
2. Wrong password
3. PostgreSQL container not ready

**Solutions**:
1. Verify DATABASE_URL format: `postgresql://user:password@host:5432/dbname`
2. Check password with: `docker exec postgres psql -U user -d dbname -c 'SELECT 1;'`
3. Wait for postgres to be healthy

### Issue: PostgreSQL Password Not Updated After Recreation
**Symptom**: "password authentication failed" after recreating postgres container
**Cause**: Volume persists with old user/password, new environment variables don't update existing users
**Solution**: Manually update password:
```bash
docker exec loyacrm-production-postgres psql -U loyacrm -d postgres \
  -c "ALTER USER loyacrm WITH PASSWORD 'new_password';"
```

## 📝 Important Notes

### Docker Compose V2
Server uses Docker Compose V2. Use `docker compose` (not `docker-compose`)

### Volume Persistence
PostgreSQL volumes persist across container recreations. Data is NOT lost when containers are recreated.

### Image Naming Convention
Images use format: `{environment}-{git-hash}-{timestamp}`
Example: `production-967cdd1-20260119-215658`

### Healthcheck Timing
- Frontend: 40s start period, 30s interval
- Backend: 20s start period, 30s interval
- During start period, failed healthchecks don't trigger restart

## 🔄 Recent Commits (Last Session)

```
225df0e fix: use 127.0.0.1 in backend healthcheck to avoid IPv6 issues
5f5a8f6 docs: add deployment notes with database config and troubleshooting
f1ab457 fix: use loyacrm_production as default database name in production
14a7bfc fix: correct YAML formatting in stage-main docker-compose
0534b12 fix: use 127.0.0.1 instead of localhost in healthcheck (IPv6 issue)
fe227ac fix: add HOSTNAME=0.0.0.0 to frontend services for Next.js standalone
967cdd1 (tag: v1.0.1) fix: use wget instead of curl for healthcheck
bcbb11c fix: add curl to frontend image and fix healthcheck
ab8ad44 fix: use Next.js standalone build for Docker
06227fe fix: optimize frontend Dockerfile with multi-stage build
ca98e1d fix: add Docker login to GHCR before pulling images
```

## 📚 Documentation Files

### Created/Updated
- `DEPLOYMENT_NOTES.md` - Detailed deployment guide with troubleshooting
- `SESSION_SUMMARY.md` - This file
- All `docker-compose.*.yml` - Updated with correct configurations

## 🎯 Current Status

### ✅ Working
- All three environments deployed and accessible
- Frontend serving pages correctly
- Backend API responding
- Database connections working
- Login functionality working
- Docker healthchecks passing
- Nginx routing correctly
- GitHub Actions deploying successfully

### 🟢 Stable Configurations
- Database names and credentials correct
- Network bindings correct (0.0.0.0)
- Healthchecks using 127.0.0.1
- Docker images optimized
- Disk space healthy (102GB free)

## 📋 Next Steps (If Needed)

### Potential Improvements
1. Add automated database backups
2. Set up monitoring (Prometheus/Grafana)
3. Configure SSL/TLS certificates
4. Add rate limiting to API
5. Set up log aggregation
6. Configure automated cleanup of old Docker images

### Maintenance Tasks
1. Regular disk space monitoring
2. Periodic Docker image cleanup
3. Database backup verification
4. Security updates for base images

## 🔗 Quick Reference Commands

```bash
# Connect to server
ssh root@217.154.173.36

# Check all containers
docker ps

# Restart a service
cd /var/www/loyacrm-production
docker compose restart frontend

# View logs
docker logs --tail 50 loyacrm-production-frontend

# Check disk space
df -h /
docker system df

# Test API
curl http://217.154.173.36/api/health

# Manual deployment (from local machine)
./deploy.sh -t -m "Release message"
```

## 🏁 Session End State

- **Working Directory**: Clean, all changes committed
- **Git Branch**: main (up to date with origin/main)
- **Latest Tag**: v1.0.1
- **Server Status**: All services healthy and operational
- **Disk Usage**: 13% (102GB free)

---

**Last Updated**: 2026-01-19 22:30 UTC
**Session Duration**: ~3 hours
**Issues Resolved**: 8 critical deployment issues
**Files Modified**: 12
**Commits Made**: 11
**Status**: ✅ Production Ready
