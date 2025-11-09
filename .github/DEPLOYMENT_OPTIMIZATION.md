# Deployment Optimization Notes

## Recent Improvements

### 1. Increased Command Timeout
- **Before:** 10 minutes (default)
- **After:** 30 minutes
- **Reason:** `npm ci` для frontend занимает много времени из-за большого количества зависимостей

### 2. Parallel Dependencies Installation
- **Before:** Последовательная установка (frontend → backend)
- **After:** Параллельная установка обоих одновременно
- **Time saved:** ~40-50% времени установки зависимостей

### 3. Use Offline Cache and Omit Dev Dependencies
- Added `--prefer-offline` flag to npm ci
- Uses local npm cache when possible
- Added `--omit=dev` to skip devDependencies installation
- Reduces network requests and installation time

### 4. Skip Playwright E2E Tests During Deployment
- **Before:** Full checks including Playwright E2E tests (~5-8 min)
- **After:** Only unit tests, type checks, and lints (~2-3 min)
- **Time saved:** ~5 minutes
- **Reason:** 
  - E2E tests already run in pre-push hooks
  - E2E tests run on PR only (removed from push to main/develop)
  - Production deployment should be fast
  - E2E tests require browser installation (~2 min) + test execution (~3-5 min)

### 5. npm Performance Flags and Production Install
- Added `--no-audit` - skip vulnerability checks
- Added `--no-fund` - skip funding messages  
- Added `--omit=dev` - install only production dependencies
- **Time saved:** ~3-5 minutes total (no devDependencies + no prune step)

### 6. Removed npm prune Step
- **Before:** `npm ci` (all deps) → build → `npm prune --production` (remove devDeps)
- **After:** `npm ci --omit=dev` (production deps only)
- **Time saved:** ~2-3 minutes (no need to remove devDependencies after install)

## Current Deployment Flow

```
GitHub Actions (runner):
1. Type checks (frontend, backend, db)     ~2min
2. Lint checks (frontend, backend, db)     ~1min
3. Unit tests (frontend, backend)          ~30s
   (Playwright E2E tests SKIPPED)          saved ~5-8min

Server Deployment:
4. Update code (git fetch/reset)           ~10s
5. Create .env files                       ~1s
6. Install db deps + generate Prisma       ~3min (was ~6min with --omit=dev)
7. Install frontend + backend (parallel)   ~5-8min (was ~18-20min)
8. Build frontend                          ~3-5min
9. Build backend                           ~1-2min
10. Run migrations                         ~10-30s
11. Restart PM2                            ~5s
---------------------------------------------------
Total: ~12-18 minutes (was ~30-40 minutes)
```

## Where E2E Tests Run

Playwright E2E tests are executed in:

1. **Pre-push hook** (`test-pre-push.sh`)
   - Runs locally before pushing code
   - Catches issues before they reach CI/CD

2. **Pull Request checks** (`.github/workflows/checks.yml`)
   - Full checks including E2E tests
   - Validates changes before merge

**NOT in:**
- Push to main/develop - for speed (already tested in pre-push)
- Deployment - for speed and efficiency

## Further Optimization Ideas

### Option 1: Use npm cache on server

```bash
# On server, create npm cache directory
mkdir -p /var/www/loyacrm/.npm-cache

# In deploy.yml, add:
export npm_config_cache=/var/www/loyacrm/.npm-cache
```

This will persist npm cache between deployments.

### Option 2: Skip dependencies if package.json unchanged

```bash
# Check if package.json changed
if git diff HEAD@{1} HEAD -- frontend/package.json | grep -q .; then
  echo "Frontend dependencies changed, reinstalling..."
  cd frontend && npm ci && cd ..
else
  echo "Frontend dependencies unchanged, skipping..."
fi
```

### Option 3: Use pnpm instead of npm

pnpm is faster and uses less disk space:

```bash
# Install pnpm
npm install -g pnpm

# Replace npm ci with pnpm install --frozen-lockfile
pnpm install --frozen-lockfile
```

### Option 4: Build on GitHub Runner, deploy built files

Instead of building on server:
1. Build on GitHub Actions runner
2. Upload dist/ folders as artifacts
3. Download and deploy on server

**Pros:** Faster deployment, server doesn't need build tools
**Cons:** More complex workflow, larger artifacts

### Option 5: Use Docker

Build Docker image with all dependencies:
- Faster deployments
- Consistent environment
- Easy rollbacks

## Monitoring Deployment Time

Add timestamps to each step:

```bash
echo "[$(date '+%H:%M:%S')] Starting step..."
```

This helps identify which steps take longest.

## Troubleshooting Timeouts

If deployment still times out:

1. **Check server resources:**
   ```bash
   # On server
   htop
   df -h
   free -m
   ```

2. **Clear npm cache:**
   ```bash
   npm cache clean --force
   ```

3. **Remove node_modules before deploy:**
   ```bash
   rm -rf frontend/node_modules backend/node_modules db/node_modules
   ```

4. **Check network speed:**
   ```bash
   curl -s https://raw.githubusercontent.com/sivel/speedtest-cli/master/speedtest.py | python3 -
   ```

## Current Timeout Settings

```yaml
timeout: 30s           # SSH connection timeout
command_timeout: 30m   # Command execution timeout
```

Increase `command_timeout` if needed:
- 30m - normal (current)
- 45m - for slow connections
- 60m - for very slow servers

## npm ci Performance Tips

1. **Use --prefer-offline:**
   ```bash
   npm ci --prefer-offline
   ```

2. **Disable audit:**
   ```bash
   npm ci --no-audit
   ```

3. **Disable fund messages:**
   ```bash
   npm ci --no-fund
   ```

4. **Combined (fastest):**
   ```bash
   npm ci --prefer-offline --no-audit --no-fund
   ```

## Recommended for Production

Current optimizations are good for most cases. If deployments are still slow:

1. Consider Option 1 (npm cache on server) - easy to implement
2. Consider Option 2 (skip unchanged deps) - saves time on small updates
3. Consider Option 4 (build on GitHub) - for very slow servers

## Verification

After deployment completes, verify:

```bash
pm2 status
pm2 logs --lines 50
curl http://localhost:4000/health
curl http://localhost:3000
```
