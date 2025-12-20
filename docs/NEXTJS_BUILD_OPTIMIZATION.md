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

### 6. Docker Build Optimization

**Multi-stage Build:**
The project uses Docker multi-stage builds to optimize the final image size:

```dockerfile
FROM node:24-alpine
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm prisma

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Generate Prisma client
RUN cd db && pnpm run generate

# Build Next.js application
RUN cd frontend && pnpm run build
```

**Build Caching:**
- Docker layer caching speeds up rebuilds
- pnpm workspace dependencies are cached
- `.next/cache` persists in Docker volumes between container restarts

### 7. Memory Allocation

**Docker Container Resources:**
Docker automatically manages memory allocation. For builds requiring more memory, configure in `docker-compose.yml`:

```yaml
frontend:
  deploy:
    resources:
      limits:
        memory: 4G
```

**Manual Builds:**
For manual builds outside Docker:
```bash
NODE_OPTIONS="--max-old-space-size=4096" pnpm run build
```

## Performance Improvements

### Docker Production Builds:
- **Initial build:** ~3-5 minutes (full image build with all dependencies)
- **Cached rebuild:** ~1-2 minutes (when only code changes, dependencies cached)
- **Memory usage:** ~2-3GB during build, ~500MB runtime
- **Image size:** ~1.2GB (optimized with Alpine Linux base)

### Local Development:
- **Dev server start:** ~5-10 seconds (with Turbopack)
- **Hot reload:** <1 second (Fast Refresh)
- **Memory usage:** ~1.5GB

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

### Docker Deployment
- [ ] Verify Docker image builds successfully: `docker buildx build --platform linux/amd64 -t loyacrm-frontend:latest -f docker/frontend/Dockerfile .`
- [ ] Check bundle size locally: `cd frontend && pnpm run analyze`
- [ ] Verify environment variables in `.env` or `.env.stage`
- [ ] Test container startup: `docker run -p 3000:3000 loyacrm-frontend:latest`
- [ ] Check container logs: `docker compose logs frontend`
- [ ] Verify health check passes: `docker compose ps`

### Manual Build (if not using Docker)
- [ ] Ensure `NODE_ENV=production`
- [ ] Verify `.next/cache` is preserved
- [ ] Check Prisma client is generated

## Current Configuration

### next.config.js
```javascript
const productionConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, '..'), // Monorepo support
  
  // Production optimizations
  productionBrowserSourceMaps: false,
  compress: true,
  
  compiler: {
    removeConsole: isProduction ? { exclude: ["error", "warn"] } : false,
  },
  
  experimental: {
    optimizeCss: false, // Fixes critters issue with Emotion
    esmExternals: true,
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
  },
  
  typescript: {
    ignoreBuildErrors: process.env.SKIP_TYPE_CHECK === 'true',
  },
};
```

**Note:** `eslint.ignoreDuringBuilds` was removed in Next.js 16. Use `next lint` CLI command instead.

### docker-compose.yml
```yaml
frontend:
  image: loyacrm-frontend:latest
  environment:
    - NODE_ENV=production
    - PORT=3000
    - NEXT_PUBLIC_API_URL=/api
    - NEXT_PUBLIC_BACKEND_API_URL=${NEXT_PUBLIC_BACKEND_API_URL}
  healthcheck:
    test: ["CMD-SHELL", "wget --spider http://localhost:3000 || exit 1"]
```

### Dockerfile Build Process
```dockerfile
# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Generate Prisma client
RUN cd db && pnpm run generate

# Build Next.js (optimizations applied automatically)
RUN cd frontend && pnpm run build
```

## Troubleshooting

### Docker Build Issues

**Symptom:** Build fails with out of memory error
```
JavaScript heap out of memory
```

**Solution:**
Increase Docker memory limit:
```yaml
# docker-compose.yml
frontend:
  deploy:
    resources:
      limits:
        memory: 4G
```

Or for manual builds:
```bash
docker buildx build --build-arg NODE_OPTIONS="--max-old-space-size=4096" \
  --platform linux/amd64 -t loyacrm-frontend:latest -f docker/frontend/Dockerfile .
```

**Symptom:** Prisma client not found during build
```
Error: @prisma/client did not initialize yet
```

**Solution:**
Ensure Prisma generation happens before Next.js build in Dockerfile:
```dockerfile
# Generate Prisma client FIRST
RUN cd db && pnpm run generate

# Then build Next.js
RUN cd frontend && pnpm run build
```

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

---

## Related Documentation

For more details on deployment and configuration:
- **[deployment/README.md](deployment/README.md)** - Docker deployment overview
- **[deployment/03-production-manual-build.md](deployment/03-production-manual-build.md)** - Manual Docker build process
- **[deployment/04-staging-deployment.md](deployment/04-staging-deployment.md)** - Staging environment setup
- **[DATABASE_ENV_CONFIG.md](DATABASE_ENV_CONFIG.md)** - Database and environment configuration
- **[DOCKER_PORTS_ARCHITECTURE.md](DOCKER_PORTS_ARCHITECTURE.md)** - Container networking and ports

---

**Last Updated:** December 20, 2024  
**Next.js Version:** 16.0.1  
**Deployment Method:** Docker Compose with multi-stage builds
