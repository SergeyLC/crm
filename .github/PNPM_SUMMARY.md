# pnpm Migration Summary

## ✅ Completed Changes

### 1. Project Configuration

- ✅ Created `pnpm-workspace.yaml` - workspace configuration
- ✅ Created `.npmrc` - pnpm settings (timeouts, hoisting)
- ✅ Added `name` field to all package.json files:
  - `loya-crm-frontend`
  - `loya-crm-backend`
  - `loya-crm-db`

### 2. Dependencies

- ✅ Generated `pnpm-lock.yaml` (484 KB)
- ✅ Installed all dependencies with pnpm (1m 12s - **much faster than npm**)
- ✅ Updated `.gitignore` to commit pnpm-lock.yaml

### 3. CI/CD Workflows

- ✅ Updated `.github/workflows/deploy.yml`:
  - Added pnpm installation step
  - Updated cache strategy for pnpm store
  - Updated all commands to use `pnpm --filter=<package-name>`
  - Server deployment script updated to use pnpm

- ✅ Updated `.github/workflows/checks.yml`:
  - Added pnpm installation step
  - Updated cache strategy for pnpm store
  - Updated all commands to use pnpm

### 4. Documentation

- ✅ Created `.github/PNPM_MIGRATION.md` - comprehensive migration guide
- ✅ Updated `SERVER_PERFORMANCE.md` with pnpm information

## 📊 Performance Comparison

### Local Installation (macOS)

```
npm install:   ~3 minutes
pnpm install:  1m 12s  ⚡ 2.5x faster
```

### Expected Server Performance (Production)

| Task | npm (before) | pnpm (expected) | Improvement |
|------|-------------|-----------------|-------------|
| db install | 10 min | 5-7 min | 30-50% faster |
| frontend install | 7 min | 4-5 min | 30-40% faster |
| backend install | 7 min | 4-5 min | 30-40% faster |
| **Total** | **24 min** | **13-17 min** | **30-45% faster** |

## 🔄 Next Steps

### 1. Test Locally

```bash
# Test build
pnpm --filter=loya-crm-db run generate
pnpm --filter=loya-crm-frontend run build
pnpm --filter=loya-crm-backend run build

# Test type-check
pnpm --filter=loya-crm-frontend run type-check
pnpm --filter=loya-crm-backend run type-check
pnpm --filter=loya-crm-db run type-check

# Test lint
pnpm --filter=loya-crm-frontend run lint:check
pnpm --filter=loya-crm-backend run lint:check

# Test unit tests
pnpm --filter=loya-crm-frontend test
pnpm --filter=loya-crm-backend test
```

### 2. Commit Changes

```bash
git add .
git commit -m "feat: migrate from npm to pnpm for faster builds

- Add pnpm-workspace.yaml and .npmrc configuration
- Add name field to all package.json files
- Generate pnpm-lock.yaml (484 KB)
- Update GitHub Actions workflows (deploy.yml, checks.yml)
- Update server deployment script to use pnpm
- Add pnpm migration documentation

Performance improvement:
- Local install: 3 min → 1m 12s (2.5x faster)
- Expected server install: 24 min → 13-17 min (30-45% faster)
"
```

### 3. Test CI/CD

```bash
# Create a test tag to trigger deployment workflow
git tag v0.1.12-pnpm-test
git push origin v0.1.12-pnpm-test
```

### 4. Server Setup (one-time)

```bash
# SSH to server
ssh user@server

# Install pnpm globally
npm install -g pnpm@10

# Create pnpm store directory
sudo mkdir -p /var/cache/pnpm
sudo chown -R $USER:$USER /var/cache/pnpm

# Verify pnpm installation
pnpm --version  # Should show 9.x.x
```

## 🚨 Important Notes

1. **pnpm-lock.yaml must be committed** - it's required for `--frozen-lockfile` in CI/CD
2. **Package names matter** - use full names like `loya-crm-frontend`, not `frontend`
3. **Server needs pnpm** - deployment script will install it if missing
4. **Workspace filters** - use `--filter=<package-name>` for specific packages

## 🔙 Rollback (if needed)

If something goes wrong, you can rollback:

```bash
# Remove pnpm files
rm pnpm-lock.yaml pnpm-workspace.yaml .npmrc
git checkout .github/workflows/deploy.yml .github/workflows/checks.yml

# Remove name from db and backend package.json
# Reinstall with npm
cd frontend && npm install
cd ../backend && npm install
cd ../db && npm install
```

## 📚 Quick Reference

```bash
# Install all dependencies
pnpm install

# Install for specific package
pnpm --filter=loya-crm-frontend install

# Run script in specific package
pnpm --filter=loya-crm-db run generate
pnpm --filter=loya-crm-frontend dev
pnpm --filter=loya-crm-backend dev

# Add dependency to specific package
pnpm --filter=loya-crm-frontend add axios
pnpm --filter=loya-crm-backend add express -D

# Run script in all packages
pnpm -r build  # Build all packages

# Clean pnpm store
pnpm store prune
```

## 📖 Full Documentation

- Migration guide: `.github/PNPM_MIGRATION.md`
- Performance analysis: `.github/SERVER_PERFORMANCE.md`
- pnpm docs: https://pnpm.io/
