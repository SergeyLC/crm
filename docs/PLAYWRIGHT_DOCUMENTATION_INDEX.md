# Playwright E2E Tests - Documentation Index

## 📚 Documentation

Comprehensive Playwright test documentation for the LoyaCare CRM project.

### 🔧 Technical Documentation

- **Test Suite README**: [frontend/e2e/README.md](../frontend/e2e/README.md) - Detailed setup and usage
- **Configuration**: [frontend/playwright.config.ts](../frontend/playwright.config.ts) - Playwright configuration

## 📊 Test Coverage

```bash
# Install Playwright browsers (first time only)
pnpm exec playwright install

# Run all tests
pnpm run playwright

# Interactive UI mode
pnpm run playwright:ui

# Run specific test suites
pnpm run playwright:demo        # Demo tests
pnpm run playwright:deal        # Deal dialog tests
pnpm run playwright:lead        # Lead dialog tests
pnpm run playwright:management  # Management tests
```

## 📊 Test Coverage

- **Total Tests**: 41
- **Test Files**: 4
- **Areas Covered**: 
  - Deal Management (CRUD operations, form validation)
  - Lead Management (CRUD operations, form validation)
  - Accessibility (ARIA labels, keyboard navigation)
  - Form Validation (required fields, data formats)

## 🐳 Docker Environment Testing

For testing in Docker containers:

```bash
# Production container
docker exec loyacrm-frontend sh -c "cd /app/frontend && pnpm run playwright"

# Staging container
docker exec loyacrm-staging-frontend sh -c "cd /app/frontend && pnpm run playwright"
```

## Related Documentation

- **[TESTING_STRATEGY.md](TESTING_STRATEGY.md)** - Overall testing approach
- **[deployment/06-troubleshooting.md](deployment/06-troubleshooting.md)** - Troubleshooting guide

---

**Last Updated:** December 20, 2024  
**Status:** ✅ Active and maintained
