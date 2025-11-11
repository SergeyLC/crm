# Testing Strategy Summary

## Overview

Our project uses a **multi-level testing strategy** to ensure code quality while minimizing deployment time.

## Test Types & Locations

### 1. Unit Tests (Frontend & Backend)

**What they test:**
- Individual functions and components
- Business logic
- Utilities and helpers

**Where they run:**
- ✅ Pre-push hook (locally)
- ✅ Pull Request checks
- ✅ Push to main/develop
- ✅ **Deployment** (fast, ~30s)

**Commands:**
```bash
cd frontend && npm test
cd backend && npm test
```

### 2. E2E Tests (Playwright)

**What they test:**
- Complete user scenarios
- Frontend ↔ backend integration
- UI interactions
- Forms, dialogs, navigation

**Where they run:**
- ✅ Pre-push hook (locally) - **primary protection**
- ✅ Pull Request checks
- ❌ Push to main/develop (skipped for speed)
- ❌ **NOT in Deployment** (too slow, ~5-8 min)

**Commands:**
```bash
cd frontend && npm run playwright
cd frontend && npm run playwright:ui       # Interactive mode
cd frontend && npm run playwright:headed   # Headed mode
```

### 3. Type Checking (TypeScript)

**What it checks:**
- TypeScript types
- Interfaces
- Type safety

**Where it runs:**
- ✅ Pre-push hook
- ✅ Pull Request checks
- ✅ Push to main/develop
- ✅ **Deployment** (fast, ~2 min)

**Commands:**
```bash
cd frontend && npm run type-check
cd backend && npm run type-check
cd db && npm run type-check
```

### 4. Lint Checks (ESLint)

**What it checks:**
- Code style
- Best practices
- Potential errors

**Where it runs:**
- ✅ Pre-push hook
- ✅ Pull Request checks
- ✅ Push to main/develop
- ✅ **Deployment** (fast, ~1 min)

**Commands:**
```bash
cd frontend && npm run lint:check
cd backend && npm run lint:check
cd db && npm run lint:check
```

## Workflow Comparison

### Pre-push Hook (local)

```bash
.git/hooks/pre-push

Checks:
1. TypeScript type check (frontend, backend, db)  ~2 min
2. ESLint lint check (frontend, backend, db)      ~1 min
3. Unit tests (frontend, backend)                 ~30s
4. Playwright E2E tests (frontend)                ~5-8 min ⭐
5. Build check (frontend, backend)                ~3-5 min
---------------------------------------------------------
Total: ~12-17 minutes
```

**Goal:** Maximum quality check before pushing code to repository

### Pull Request Checks

```yaml
.github/workflows/checks.yml

Checks (same as pre-push):
1. TypeScript type check                          ~2 min
2. ESLint lint check                              ~1 min
3. Unit tests                                     ~30s
4. Build check                                    ~3-5 min
---------------------------------------------------------
Total: ~6-8 minutes
```

**Goal:** Fast validation before merging to main/develop (E2E already tested in pre-push)

### Push to main/develop

```yaml
.github/workflows/checks.yml

Checks (same as PR - fast only):
1. TypeScript type check                          ~2 min
2. ESLint lint check                              ~1 min
3. Unit tests                                     ~30s
4. Build check                                    ~3-5 min
---------------------------------------------------------
Total: ~6-8 minutes
```

**Goal:** Quick validation after merge (E2E already validated in pre-push and PR)

### Deployment (production)

```yaml
.github/workflows/deploy.yml

Checks (fast only):
1. TypeScript type check                          ~2 min
2. ESLint lint check                              ~1 min
3. Unit tests                                     ~30s
4. Playwright E2E tests                           ❌ SKIPPED
---------------------------------------------------------
GitHub Actions Total: ~4 minutes

Server Deployment:
5. Create .env files                              ~1s
6. Install dependencies (parallel)                ~10 min
7. Build frontend + backend                       ~5-7 min
8. Run migrations                                 ~30s
9. Restart PM2                                    ~5s
---------------------------------------------------------
Total: ~15-20 minutes (was ~30-40 minutes)
```

**Goal:** Fast and safe deployment (E2E already tested in pre-push and PR)

## Why Skip E2E in Deployment?

### ❌ Problems with E2E in deployment:

1. **Slow** - E2E tests take 5-8 minutes
2. **Require browsers** - need to install Playwright browsers (~2 min)
3. **Already tested** - E2E tests already passed in:
   - Pre-push hook (locally) - **primary validation**
   - Pull Request checks - **before merge to main**

### ✅ Benefits of skipping E2E:

1. **Faster deployment** - save ~7-10 minutes
2. **Less load** - GitHub Actions runner freed faster
3. **Sufficient coverage** - unit tests + type checks + lint cover most bugs

## Test Coverage Strategy

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Developer writes code                              │
│         ↓                                           │
│  git add / git commit                               │
│         ↓                                           │
│  git push  ← PRE-PUSH HOOK                         │
│         ↓    - Type checks ✓                        │
│         ↓    - Lint checks ✓                        │
│         ↓    - Unit tests ✓                         │
│         ↓    - E2E tests ✓ ⭐                        │
│         ↓    - Build check ✓                        │
│         ↓                                           │
│  GitHub (PR or push to main)                        │
│         ↓    - Same checks as pre-push ✓            │
│         ↓                                           │
│  Merge to main                                      │
│         ↓                                           │
│  Create tag (v*)                                    │
│         ↓                                           │
│  DEPLOYMENT ← Fast checks only                      │
│         ↓    - Type checks ✓                        │
│         ↓    - Lint checks ✓                        │
│         ↓    - Unit tests ✓                         │
│         ↓    - E2E tests ✗ (already tested)         │
│         ↓                                           │
│  Production 🚀                                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Running Tests Manually

### Run All Tests (locally)

```bash
# Simulate pre-push hook
./test-pre-push.sh
```

### Run Specific Test Suites

```bash
# Unit tests only
cd frontend && npm test
cd backend && npm test

# E2E tests only
cd frontend && npm run playwright

# Type checks only
npm run type-check  # In frontend, backend, or db

# Lint only
npm run lint:check  # In frontend, backend, or db

# Build only
npm run build  # In frontend or backend
```

### Run E2E Tests in Different Modes

```bash
cd frontend

# Headless (default, for CI/CD)
npm run playwright

# UI mode (interactive)
npm run playwright:ui

# Headed mode (see browser)
npm run playwright:headed

# Specific test file
npm run playwright e2e/lead-management.spec.ts

# Debug mode
npx playwright test --debug
```

## When to Run What

### 🔄 Always (automatic)

- **Pre-push hook** - all checks including E2E (comprehensive)
- **PR checks** - all checks including E2E (before merge)
- **Push to main/develop** - fast checks only (E2E already validated)
- **Deployment** - fast checks only (E2E already validated)

### 🏃 On demand (manual)

- **During development** - unit tests (`npm test`)
- **Before commit** - type check + lint
- **Testing UI changes** - E2E in UI mode
- **Debugging E2E** - Playwright debug mode

### 🚫 Never

- E2E tests in production environment
- E2E tests on every commit (too slow)
- Full build in pre-commit hook (we use pre-push)

## Benefits of This Strategy

1. ✅ **Fast deployments** - ~15-20 min (was ~30-40 min)
2. ✅ **Comprehensive testing** - E2E tests run, but not during deployment
3. ✅ **Early bug detection** - pre-push hook catches bugs before push
4. ✅ **CI/CD efficiency** - less load on GitHub Actions
5. ✅ **Developer experience** - fast feedback loop

## Troubleshooting

### E2E Tests Fail Locally

```bash
# Update Playwright browsers
cd frontend
npx playwright install --with-deps

# Run in UI mode to debug
npm run playwright:ui
```

### Pre-push Hook Too Slow

```bash
# Skip pre-push hook (use with caution!)
git push --no-verify

# Or disable specific checks in .git/hooks/pre-push
```

### Deployment Checks Fail

```bash
# Run checks locally first
cd frontend && npm run type-check
cd frontend && npm run lint:check
cd frontend && npm test

cd backend && npm run type-check
cd backend && npm run lint:check
cd backend && npm test
```

## References

- Pre-push hook: `.git/hooks/pre-push`
- PR/Push checks: `.github/workflows/checks.yml`
- Deployment: `.github/workflows/deploy.yml`
- E2E tests: `frontend/e2e/`
- Test config: `frontend/playwright.config.ts`
