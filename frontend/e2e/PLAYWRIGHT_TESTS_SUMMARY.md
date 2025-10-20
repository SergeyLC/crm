# Playwright Tests for LoyaCareCRM

> 📖 **Also available in:** [🇩🇪 Deutsch](./PLAYWRIGHT_TESTS_SUMMARY.de.md)

A complete set of E2E tests using Playwright, equivalent to the existing Cypress tests.

## Created Files

### Test Files (4 files)
1. **`e2e/deal-edit-dialog.spec.ts`** - 15 tests for Deal CRUD operations
2. **`e2e/lead-edit-dialog.spec.ts`** - 15 tests for Lead CRUD operations
3. **`e2e/demo-playwright.spec.ts`** - 3 basic tests to verify Playwright setup
4. **`e2e/lead-management.spec.ts`** - 8 tests for Lead management

### Helper Files
- **`e2e/helpers/auth.ts`** - Authentication mocking utilities

### Fixtures (test data)
- **`e2e/fixtures/deals.json`** - Mock data for deals
- **`e2e/fixtures/leads.json`** - Mock data for leads
- **`e2e/fixtures/users.json`** - Mock data for users

### Documentation
- **`e2e/README.md`** - Comprehensive test documentation

## Test Coverage

### Deal Edit Dialog (15 tests)
- **Create Deal** (4 tests)
  - ✅ Successfully create a new deal
  - ✅ Validate required fields
  - ✅ Close dialog with Cancel button
  - ✅ Close dialog with Close icon

- **Update Deal** (3 tests)
  - ✅ Successfully update an existing deal
  - ✅ Show loading state
  - ✅ Handle update errors

- **Form Interactions** (2 tests)
  - ✅ Correct form field behavior
  - ✅ Manage appointments section

- **Accessibility** (2 tests)
  - ✅ Keyboard navigation
  - ✅ ARIA labels and roles

- **Error Handling** (2 tests)
  - ✅ Handle network errors
  - ✅ Server validation errors

- **Data Persistence** (2 tests)
  - ✅ Preserve data when switching between fields
  - ✅ Preserve data on validation failure

### Lead Edit Dialog (15 tests)
Identical structure to Deal Edit Dialog tests:
- ✅ 4 creation tests
- ✅ 3 update tests
- ✅ 2 form interaction tests
- ✅ 2 accessibility tests
- ✅ 2 error handling tests
- ✅ 2 data persistence tests

### Lead Management (8 tests)
- ✅ Display leads page
- ✅ Open edit dialog
- ✅ Close edit dialog
- ✅ Create new lead
- ✅ Validate empty form
- ✅ Create lead with valid data
- ✅ Filter leads by search term
- ✅ Sort leads by column
- ✅ Archive a lead

### Demo Tests (3 tests)
- ✅ Verify Playwright configuration
- ✅ localStorage functionality
- ✅ Basic DOM interactions

## Running Tests

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run all tests
npm run playwright

# Interactive UI mode
npm run playwright:ui

# Run with visible browser
npm run playwright:headed

# Run specific tests
npm run playwright:demo        # Demo tests
npm run playwright:deal        # Deal tests
npm run playwright:lead        # Lead tests
npm run playwright:management  # Management tests

# View report
npm run playwright:report
```

## Updated Files

- ✅ **`package.json`** - Added 7 new Playwright scripts
- ✅ **`e2e/README.md`** - Updated documentation with full description

## Comparison with Cypress

| Cypress Tests | Playwright Tests | Status |
|---------------|------------------|--------|
| `cypress/e2e/deal-edit-dialog.cy.ts` | `e2e/deal-edit-dialog.spec.ts` | ✅ Full equivalent |
| `cypress/e2e/lead-edit-dialog.cy.ts` | `e2e/lead-edit-dialog.spec.ts` | ✅ Full equivalent |
| `cypress/e2e/demo-cypress.cy.ts` | `e2e/demo-playwright.spec.ts` | ✅ Full equivalent |
| `cypress/e2e/lead-management.cy.ts` | `e2e/lead-management.spec.ts` | ✅ Full equivalent |

## Key Implementation Differences

### Cypress → Playwright

1. **Commands**
   - `cy.visit()` → `page.goto()`
   - `cy.get()` → `page.locator()` / `page.getByTestId()`
   - `cy.intercept()` → `page.route()`
   - `cy.wait()` → `page.waitForResponse()`

2. **Assertions**
   - `cy.should('be.visible')` → `expect().toBeVisible()`
   - `cy.should('have.value', x)` → `expect().toHaveValue(x)`
   - `cy.should('contain', x)` → `expect().toContainText(x)`

3. **Authentication**
   - Cypress: `cy.login()` custom command
   - Playwright: `setupAuth(page)` helper function

4. **Fixtures**
   - Cypress: JSON imports with `@ts-expect-error`
   - Playwright: Direct JSON imports with TypeScript types

5. **Code Reuse**
   - Uses existing `currencyFormatter` from `src/shared/lib/formatCurrency.ts`
   - Minimal code duplication between tests and application

## Playwright Advantages

- ✅ Better TypeScript support out of the box
- ✅ Built-in auto-waiting support
- ✅ UI Mode for interactive debugging
- ✅ Faster test execution
- ✅ Native parallel execution support
- ✅ Built-in tracing and debugging tools
- ✅ Automatic dev server startup

## Summary

**Total: 41 Playwright tests created**
- Deal Edit Dialog: 15 tests ✅
- Lead Edit Dialog: 15 tests ✅
- Lead Management: 8 tests ✅
- Demo: 3 tests ✅

All tests are fully equivalent to Cypress tests and ready to use!
