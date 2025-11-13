# Playwright End-to-End Tests

> 📖 **Documentation:** [Detailed Summary](./PLAYWRIGHT_TESTS_SUMMARY.md) | [🇪 Deutsche Version](./PLAYWRIGHT_TESTS_SUMMARY.de.md)

This directory contains Playwright end-to-end tests for the LoyaCareCRM application.

## Prerequisites

- Node.js 24+ 
- pnpm package manager
- Project dependencies installed

## Running Tests

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

## Test Structure

- `demo-playwright.spec.ts` - Basic sanity tests to verify Playwright setup
- `deal-edit-dialog.spec.ts` - Comprehensive tests for Deal CRUD operations (15 tests)
- `lead-edit-dialog.spec.ts` - Comprehensive tests for Lead CRUD operations (15 tests)
- `lead-management.spec.ts` - Tests for Lead listing and management features (8 tests)
- `helpers/` - Shared utilities and helper functions
  - `auth.ts` - Authentication mocking utilities
- `fixtures/` - Test data
  - `deals.json` - Mock deal data
  - `leads.json` - Mock lead data
  - `users.json` - Mock user data

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

## CI/CD

Tests are configured to run in headless mode by default, suitable for CI/CD pipelines.

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

