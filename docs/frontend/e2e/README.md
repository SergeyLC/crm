# Playwright End-to-End Tests

Comprehensive end-to-end test suite for the LoyaCareCRM application using Playwright Test framework.

This directory contains automated tests for critical user workflows including Deal management, Lead management, form validation, and accessibility features.

## Prerequisites

### Local Development
- Node.js 24+
- pnpm package manager
- Project dependencies installed (`pnpm install`)
- Playwright browsers installed (`npx playwright install`)

### Docker Environment
- Docker and Docker Compose installed
- Frontend container running (`docker compose up frontend`)

## Running Tests

### Local Development

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run all tests
pnpm run playwright

# Run tests in UI mode (interactive)
pnpm run playwright:ui

# Run tests in headed mode (see browser)
pnpm run playwright:headed

# Run specific test file
pnpm run playwright:demo
pnpm run playwright:deal
pnpm run playwright:lead
pnpm run playwright:management

# View test report
pnpm run playwright:report
```

### Docker Environment

```bash
# Production container
docker exec loyacrm-frontend sh -c "cd /app/frontend && pnpm run playwright"

# Staging container
docker exec loyacrm-staging-frontend sh -c "cd /app/frontend && pnpm run playwright"

# View test report from container
docker exec loyacrm-frontend sh -c "cd /app/frontend && pnpm run playwright:report"
```

## Test Structure

```
frontend/e2e/
├── demo-playwright.spec.ts          # Basic sanity tests (2 tests)
├── deal-edit-dialog.spec.ts         # Deal CRUD operations (15 tests)
├── lead-edit-dialog.spec.ts         # Lead CRUD operations (15 tests)
├── lead-management.spec.ts          # Lead listing and management (8 tests)
├── group-save.spec.ts               # Group/batch operations tests
├── helpers/
│   └── auth.ts                      # Authentication mocking utilities
└── fixtures/
    ├── deals.json                   # Mock deal data
    ├── leads.json                   # Mock lead data
    └── users.json                   # Mock user data
```

## Test Coverage

### Deal Edit Dialog Tests (15 tests)
- ✅ Create Deal: 4 tests (success, validation, cancel, close)
- ✅ Update Deal: 3 tests (success, loading state, error handling)
- ✅ Form Interactions: 2 tests (field interactions, appointments)
- ✅ Accessibility: 2 tests (keyboard navigation, ARIA labels)
- ✅ Error Handling: 2 tests (network errors, server validation)
- ✅ Data Persistence: 2 tests (field switching, validation failure)

### Lead Edit Dialog Tests (15 tests)
- ✅ Create Lead: 4 tests (success, validation, cancel, close)
- ✅ Update Lead: 3 tests (success, loading state, error handling)
- ✅ Form Interactions: 2 tests (field interactions, appointments)
- ✅ Accessibility: 2 tests (keyboard navigation, ARIA labels)
- ✅ Error Handling: 2 tests (network errors, server validation)
- ✅ Data Persistence: 2 tests (field switching, validation failure)

## Configuration

The Playwright configuration is defined in `playwright.config.ts` at the root of the frontend directory.

Key configuration:
- Test directory: `./e2e`
- Timeout: 60 seconds per test
- Browser: Chromium (Desktop Chrome)
- Headless mode by default
- Automatic dev server startup

## Writing Tests

All tests use the Playwright Test framework with TypeScript. Tests follow these patterns:

1. **Setup authentication** - Use `setupAuth(page)` helper to mock authentication
2. **Mock API routes** - Use `page.route()` to intercept and mock API calls
3. **Navigate to page** - Visit the page with `?disableSsr=on` parameter to bypass SSR
4. **Interact with elements** - Use `page.getByTestId()` or locators to find elements
5. **Assert expectations** - Use `expect()` assertions from Playwright

### Example

```typescript
import { test, expect } from '@playwright/test';
import { setupAuth } from './helpers/auth';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
    await page.goto('/en/my-feature?disableSsr=on');
  });

  test('should do something', async ({ page }) => {
    await page.getByTestId('my-button').click();
    await expect(page.getByTestId('my-result')).toBeVisible();
  });
});
```

## Debugging

- Use `pnpm run playwright:ui` to run tests in interactive mode with time travel debugging
- Use `pnpm run playwright:headed` to see the browser while tests run
- Add `await page.pause()` in your test to pause execution
- Use VS Code Playwright extension for debugging
- Check the `playwright-report/` directory for HTML reports after test runs

## CI/CD Integration

Tests run in headless mode by default, making them suitable for:
- GitHub Actions workflows
- Docker container environments
- Pre-deployment validation
- Automated testing pipelines

### Pre-Push Hook

Playwright tests run automatically before git push via the pre-push hook:
```bash
# Defined in scripts/pre-push
pnpm run playwright
```

## Comparison with Cypress

These Playwright tests are functionally equivalent to the Cypress tests in `cypress/e2e/`:
- `deal-edit-dialog.spec.ts` ≈ `cypress/e2e/deal-edit-dialog.cy.ts`
- `lead-edit-dialog.spec.ts` ≈ `cypress/e2e/lead-edit-dialog.cy.ts`
- `demo-playwright.spec.ts` ≈ `cypress/e2e/demo-cypress.cy.ts`
- `lead-management.spec.ts` ≈ `cypress/e2e/lead-management.cy.ts`

Both test suites provide comprehensive coverage for:
- Dialog creation and editing workflows
- Form validation and error handling
- Accessibility features
- Data persistence
- Network error scenarios

## Related Documentation

- **[PLAYWRIGHT_DOCUMENTATION_INDEX.md](../../PLAYWRIGHT_DOCUMENTATION_INDEX.md)** - Documentation index and quick start
- **[TESTING_STRATEGY.md](../../TESTING_STRATEGY.md)** - Overall testing strategy
- **[deployment/06-troubleshooting.md](../../deployment/06-troubleshooting.md)** - Troubleshooting guide
- **[Playwright Config](../../playwright.config.ts)** - Test configuration

---

**Last Updated:** December 20, 2024  
**Test Framework:** Playwright 1.49+  
**Total Tests:** 40+

