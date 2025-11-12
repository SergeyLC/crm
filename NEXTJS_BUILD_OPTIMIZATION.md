# Next.js Build Optimization Guide

## Implemented Optimizations

### 1. Package Import Optimization
```javascript
experimental: {
  optimizePackageImports: ['@mui/material', '@mui/icons-material'],
}
```
Reduces bundle size by only importing used components.

### 2. Disabled Source Maps in Production
```javascript
productionBrowserSourceMaps: false
```
Significantly speeds up build by skipping source map generation.

### 3. Console.log Removal
```javascript
compiler: {
  removeConsole: isProduction ? { exclude: ["error", "warn"] } : false,
}
```
Removes console.log statements in production while keeping errors/warnings.

### 4. Disabled CSS Optimization
```javascript
experimental: {
  optimizeCss: false,
}
```
Fixes critters issue with Emotion styling.

### 5. Disabled Build-time Checks
```javascript
eslint: {
  ignoreDuringBuilds: true,
}
```
Linting is already done in CI, no need to repeat during build.

## ⚠️ Removed Optimizations (Caused Build Errors)

### Worker Threads - REMOVED
```javascript
// DO NOT USE - causes DataCloneError
experimental: {
  workerThreads: true,
  cpus: 4,
}
```
**Issue:** Causes `DataCloneError: ()=>null could not be cloned` during static page generation.
**Root Cause:** Worker threads try to serialize build data using structured clone, which fails on functions.
**Solution:** Removed from config. Next.js 13+ already uses SWC which is fast enough.

## Additional Optimizations Applied

### 6. Build Cache in GitHub Actions
```yaml
- uses: actions/cache@v4
  with:
    path: |
      ~/.pnpm-store
      ${{ github.workspace }}/frontend/.next/cache
    key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
```
Caches Next.js build cache and pnpm store between CI runs.

### 7. Memory Allocation
```bash
NODE_OPTIONS="--max-old-space-size=4096"
```
Allocates 4GB of memory for Node.js during build.

### 8. Telemetry Disabled
```bash
NEXT_TELEMETRY_DISABLED=1
```
Disables Next.js telemetry during builds.

## Performance Improvements

### Before Optimization:
- Build time: ~3-5 minutes
- Memory usage: ~2GB
- No caching between builds

### After Optimization:
- Build time: ~1.5-2.5 minutes (50% faster)
- Memory usage: ~3GB (with cache)
- Incremental builds: ~30-60 seconds

## Additional Recommendations

### 1. Use Incremental Static Regeneration (ISR)
For static pages:
```typescript
export const revalidate = 60; // Revalidate every 60 seconds
```

### 2. Code Splitting
Dynamic imports for heavy components:
```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Spinner />,
  ssr: false // Optional: client-side rendering only
});
```

### 3. Image Optimization
```typescript
import Image from 'next/image';

<Image 
  src="/image.jpg" 
  width={500} 
  height={300}
  loading="lazy"
  placeholder="blur"
/>
```

### 4. Bundle Analyzer
Periodically analyze bundle size:
```bash
pnpm run analyze
```

### 5. Performance Monitoring
- Use Next.js built-in analytics
- Lighthouse CI for metric checks

## Environment-Specific Configuration

### Development
- No minification
- With source maps
- With React Strict Mode

### Production
- With minification (SWC)
- No source maps
- Import optimization
- Parallel compilation

## Pre-Deployment Checklist

- [ ] Check bundle size (`pnpm run analyze`)
- [ ] Ensure `.next/cache` is not deleted
- [ ] Verify `NODE_ENV=production`
- [ ] Ensure dependency cache is up to date
- [ ] Monitor build time in CI/CD

## Current Configuration

### next.config.js
```javascript
{
  productionBrowserSourceMaps: false,
  compiler: {
    removeConsole: isProduction ? { exclude: ["error", "warn"] } : false,
  },
  experimental: {
    optimizeCss: false,
    esmExternals: true,
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
}
```

### deploy-production.yml / deploy-staging.yml
```bash
export NEXT_TELEMETRY_DISABLED=1
export NODE_OPTIONS="--max-old-space-size=4096"
# Preserve .next/cache for faster builds
```

## Troubleshooting

### DataCloneError: ()=>null could not be cloned

**Symptom:**
```
Error [DataCloneError]: ()=>null could not be cloned.
    at new Promise (<anonymous>) {
  code: 25,
  DATA_CLONE_ERR: 25
}
```

**Cause:** 
The `workerThreads: true` and `cpus: X` experimental features use structured clone algorithm to serialize build data between worker threads. This algorithm cannot clone:
- Functions (including arrow functions, async functions)
- Symbol values
- DOM nodes
- Other non-serializable objects

When Next.js tries to pass page data or context between workers, it encounters functions (like React Context default values, or inline functions in components) and fails.

**Solution:**
Remove `workerThreads` and `cpus` from experimental config. Next.js 13+ uses SWC compiler by default, which is already very fast without worker threads.

### Invalid Configuration Warning

**Symptom:**
```
Invalid next.config.js options detected: 
  - Unrecognized key: swcMinify
```

**Cause:** 
`swcMinify` option is deprecated and removed in Next.js 13+. SWC is now the default minifier.

**Solution:**
Remove `swcMinify` from config. SWC minification is automatic in Next.js 13+.

## Future Improvements

### 1. Turbopack - ✅ Now Active (Next.js 16.0.1)
**Status:** ✅ **Enabled and working!**

**Current Setup:** 
The project is now using Next.js 16.0.1 with Turbopack enabled by default for development:

```json
{
  "scripts": {
    "dev": "next dev --turbo",  // ✅ Turbopack active!
    "build": "next build"       // Uses Turbopack for production
  }
}
```

**Performance:**
- ✅ Faster local development (incremental bundling, lazy loading)
- ✅ Better memory efficiency
- ✅ Production builds using Turbopack
- ✅ Most beneficial for large applications

**Key Features:**
- ✅ Zero configuration
- ✅ Full TypeScript/JavaScript support  
- ✅ CSS Modules, PostCSS, Sass
- ✅ Fast Refresh
- ✅ Webpack loader support (custom loaders can be configured)
- ⚠️ Webpack plugins NOT supported - use Turbopack alternatives

**Breaking Changes in Next.js 16:**
- ❌ `eslint` config in `next.config.js` is no longer supported
  - Use `next lint` CLI command instead
  - Removed from our config ✅

**Migration Completed:** ✅
- Updated from Next.js 15.4.6 → 16.0.1
- Updated React 18.3.1 → 19.2.0
- Removed deprecated `eslint` config from `next.config.js`
- All tests passing (type-check, lint, jest, playwright, build)

### 2. Edge Runtime
For API routes and middleware - provides faster cold starts and global distribution.

### 3. Partial Prerendering
Combination of static + dynamic content - experimental feature in Next.js 14+.

### 4. Turbopack File System Cache (Beta)
Similar to Webpack's disk caching. Enable with:

```javascript
// next.config.js
experimental: {
  turbopackFileSystemCacheForDev: true,
  turbopackFileSystemCacheForBuild: true,
}
```

**Note:** When comparing performance between Webpack and Turbopack, delete `.next` folder between builds for fair comparison, or enable Turbopack's filesystem cache.
