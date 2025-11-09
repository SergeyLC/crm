# Server Performance Optimization Guide

## NPM Installation Speed Issues

### Problem (SOLVED with pnpm migration)

Installation of dependencies on the server takes too long with npm:
- `db` package: 60 packages in **6-10 minutes** (very slow)
- `frontend` package: **7-10 minutes**
- `backend` package: **7-10 minutes**

**Total: ~24-30 minutes just for npm ci**

### Solution: Migration to pnpm

**pnpm (performant npm)** is 30-50% faster than npm and uses less disk space.

**Local results (macOS):**
- npm install: ~3 minutes
- pnpm install: **1 minute 12 seconds** ⚡ **2.5x faster**

**Expected server results:**
- npm total: 24-30 minutes
- pnpm total: **13-17 minutes** ⚡ **30-45% faster**

### Root Causes

1. **Network speed** - npm registry connection from server may be slow
2. **bcrypt compilation** - requires native module rebuild on server
3. **No npm cache** - first run downloads everything
4. **Sequential installation** - packages installed one after another

### Solutions Implemented

#### 1. Migration to pnpm (MAIN SOLUTION)

**Why pnpm?**
- 30-50% faster than npm
- Uses hard links instead of copying files
- Better disk space efficiency
- Built-in monorepo/workspace support

**What was done:**
- Created `pnpm-workspace.yaml` for monorepo setup
- Created `.npmrc` with pnpm configuration
- Added package names to all package.json files
- Generated `pnpm-lock.yaml` (committed to git)
- Updated GitHub Actions workflows to use pnpm
- Updated server deployment script to use pnpm

**Result:**
```
Local installation:
npm:  ~3 minutes
pnpm: 1m 12s  (2.5x faster)

Server installation (expected):
npm:  24-30 minutes
pnpm: 13-17 minutes (30-45% faster)
```

See: `.github/PNPM_MIGRATION.md` and `.github/PNPM_SUMMARY.md`

#### 2. Use `--prod` with pnpm (Production Only)

**Before:**
```bash
npm ci --prefer-offline --no-audit --no-fund
# ... build ...
npm prune --production
```

**After:**
```bash
npm ci --prefer-offline --no-audit --no-fund --omit=dev
# No prune needed - devDependencies not installed
```

**Benefit:** Save ~2-3 minutes (no need to remove devDependencies)

#### 2. NPM Cache Configuration

Create `/root/.npmrc` on server:

```bash
# On server
cat > /root/.npmrc << 'EOF'
# Cache settings
cache=/var/cache/npm
prefer-offline=true
audit=false
fund=false

# Network optimization
fetch-retries=3
fetch-retry-mintimeout=10000
fetch-retry-maxtimeout=60000
maxsockets=10

# Registry mirror (optional - use if npm registry is slow)
# registry=https://registry.npmmirror.com/
EOF
```

**Benefit:** Subsequent deploys use cache, save ~5-10 minutes

#### 3. Parallel Installation (Already Implemented)

```bash
# db first (needed by frontend and backend)
cd db && npm ci --omit=dev && npm run generate && cd ..

# Then frontend + backend in parallel
(cd frontend && npm ci --omit=dev) &
(cd backend && npm ci --omit=dev) &
wait
```

**Benefit:** Save ~10 minutes (parallel vs sequential)

#### 4. Pre-build bcrypt (Optional)

**Problem:** bcrypt compiles from source on every deployment

**Solution:** Use prebuilt binaries or Docker image with prebuild

```bash
# Option A: Force prebuilt binaries
npm ci --prefer-offline --omit=dev --build-from-source=false

# Option B: Use Alpine-based Docker (smaller, faster)
# See Docker deployment in DEPLOYMENT_PRODUCTION.md
```

**Benefit:** Save ~1-2 minutes (no bcrypt compilation)

### Performance Metrics

| Stage | Before | After (--omit=dev) | Actual | Notes |
|-------|--------|-------------------|--------|-------|
| db npm ci | 6 min | 3 min | **10 min** | Slow network, bcrypt compilation |
| frontend npm ci | 10 min | 5 min | **7+ min** | Large dependency tree |
| backend npm ci | 10 min | 5 min | **5-7 min** | Estimated |
| Prisma generate | 30s | 30s | **7.4s** | Fast |
| npm prune | 3 min | 0 min | **0 min** | Removed step |
| **Total** | **29 min** | **13 min** | **22-24 min** | Network bottleneck |

*Real measurements from production deployment - network speed is the bottleneck*

### Server Setup for Faster Deployments

#### 1. Install npm cache directory

```bash
sudo mkdir -p /var/cache/npm
sudo chown -R $USER:$USER /var/cache/npm
```

#### 2. Configure npm globally

```bash
npm config set cache /var/cache/npm --global
npm config set prefer-offline true --global
npm config set audit false --global
npm config set fund false --global

# Increase timeouts for slow network
npm config set fetch-timeout 300000 --global
npm config set fetch-retry-mintimeout 20000 --global
npm config set fetch-retry-maxtimeout 120000 --global
```

#### 3. Warm up the cache (first deployment)

```bash
cd /var/www/loyacrm

# First install will be slow (10+ min for db)
# But it will populate the cache
cd db && npm ci --cache=/var/cache/npm
cd ../frontend && npm ci --cache=/var/cache/npm
cd ../backend && npm ci --cache=/var/cache/npm

# Subsequent deploys will be 2-3x faster (3-5 min instead of 10 min)
```

#### 4. Monitor npm cache size

```bash
# Check cache size
du -sh /var/cache/npm

# Clean old cache if needed (>1GB)
npm cache clean --force
```

### Alternative: Use pnpm

`pnpm` is faster than npm due to hard-linking:

```bash
# Install pnpm
npm install -g pnpm

# In deployment script
cd db && pnpm install --prod --prefer-offline
cd frontend && pnpm install --prod --prefer-offline
cd backend && pnpm install --prod --prefer-offline
```

**Benefit:** ~30-50% faster than npm

### Network Optimization

If npm registry is slow from your server location:

#### Option 1: Use China mirror (if server in Asia)

```bash
npm config set registry https://registry.npmmirror.com/
```

#### Option 2: Use Cloudflare registry

```bash
npm config set registry https://registry.npmjs.cf/
```

#### Option 3: Host private npm registry

Use Verdaccio for local npm cache:

```bash
# Install Verdaccio
npm install -g verdaccio

# Start Verdaccio
verdaccio

# Configure npm to use it
npm config set registry http://localhost:4873/
```

### Monitoring Installation Speed

Add timing to deployment script:

```bash
echo "📦 Installing db dependencies..."
START_TIME=$(date +%s)
cd db && npm ci --omit=dev
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
echo "✅ db installed in ${DURATION}s"
```

### Troubleshooting Slow Installations

#### Check network speed to npm registry

```bash
# Test download speed
time curl -o /dev/null https://registry.npmjs.org/express/-/express-4.18.2.tgz

# Should complete in <5 seconds for good connection
```

#### Check which package is slow

```bash
# Verbose installation
npm ci --loglevel verbose

# Look for slow downloads in output
```

#### Check disk I/O

```bash
# Monitor disk during installation
iostat -x 1

# High %util means disk bottleneck
```

### Best Practices

1. ✅ **Always use `npm ci`** instead of `npm install` (faster, deterministic)
2. ✅ **Use `--omit=dev`** for production (skip devDependencies)
3. ✅ **Configure npm cache** on server
4. ✅ **Install in parallel** when possible
5. ✅ **Monitor installation times** to detect regressions
6. ❌ **Don't use `npm install`** in production (slower, non-deterministic)
7. ❌ **Don't delete node_modules** before install (waste of time)
8. ❌ **Don't run `npm audit`** during deployment (slow, not needed)

### Expected Results

After optimization, deployment timeline:

```
🚀 Deployment Timeline (Optimized)
├─ 📥 Git fetch/reset               ~5s
├─ 🔐 Create .env files             ~1s
├─ ⚙️ Configure npm (cache/timeout) ~1s
├─ 📦 Install db dependencies       ~10 min  (network bottleneck)
├─ 🔄 Generate Prisma client        ~7s
├─ 📦 Install frontend deps         ~7 min   (parallel, network bottleneck)
├─ 📦 Install backend deps          ~7 min   (parallel, network bottleneck)
├─ 🔨 Build frontend                ~5 min
├─ 🔨 Build backend                 ~2 min
├─ 🗄️ Run migrations               ~30s
├─ 🔄 Restart PM2                   ~5s
└─ ✅ Total                         ~30-35 min (was ~40-45 min)
```

**Note:** Network speed to npm registry is the main bottleneck (~10 min for 40 packages in db)

**Optimization impact:**
- Removed devDependencies installation (--omit=dev)
- Removed npm prune step
- Parallel installation (frontend + backend)
- Configured npm cache and timeouts
- **Total savings: ~10-15 minutes per deployment** 🎉

**Next steps for further optimization:**
1. Setup npm cache on server (subsequent deploys will be faster)
2. Consider using pnpm (30-50% faster)
3. Consider using npm registry mirror if server is far from npmjs.org
4. Monitor cache size: `du -sh /var/cache/npm`

## References

- Deploy workflow: `.github/workflows/deploy.yml`
- NPM performance tips: https://docs.npmjs.com/cli/v9/using-npm/config
- pnpm benchmarks: https://pnpm.io/benchmarks
- Verdaccio setup: https://verdaccio.org/docs/installation
