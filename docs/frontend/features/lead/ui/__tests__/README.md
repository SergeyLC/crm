# LeadEditDialog Tests

This file contains instructions for running and working with tests for the `LeadEditDialog` component.

## Test Structure

```
frontend/
├── src/
│   ├── __tests__/
│   │   ├── setupTests.ts          # Jest setup
│   │   └── test-utils.tsx         # Test utilities
│   └── features/lead/ui/__tests__/
│       └── LeadEditDialog.test.tsx # Unit tests
├── cypress/
│   ├── e2e/
│   │   └── lead-edit-dialog.cy.ts  # E2E tests
│   ├── fixtures/
│   │   └── lead.json               # Test data
│   └── support/
│       └── commands.ts             # Cypress commands
└── jest.config.cjs                 # Jest configuration
```

## Unit Tests (Jest + React Testing Library)

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run only LeadEditDialog tests
npm run test:lead-dialog

# Run tests with code coverage
npm run test:coverage

# Verbose test output
npm run test:ui
```

### What is tested

#### Creating Lead
- ✅ Proper display of create dialog
- ✅ Form filling and data submission
- ✅ Create error handling
- ✅ Form initialization with default values

#### Updating Lead
- ✅ Proper display of edit dialog
- ✅ Loading existing data
- ✅ Loading state
- ✅ Data updates and submission
- ✅ Data type conversion (string → number)
- ✅ Update error handling

#### Dialog behavior
- ✅ Opening/closing dialog
- ✅ Operation cancellation
- ✅ Button blocking during submission
- ✅ Loading states

#### Form interactions
- ✅ Field change handling
- ✅ Appointments sanitization
- ✅ Data validation

#### Accessibility
- ✅ ARIA attributes
- ✅ Keyboard navigation
- ✅ Semantic markup

## E2E Tests (Cypress)

### Running Tests

```bash
# Open Cypress in interactive mode
npm run cypress:open

# Run E2E tests in headless mode
npm run cypress:run

# Run only LeadEditDialog tests
npm run test:e2e

# Open E2E tests in browser
npm run test:e2e:open
```

### What is tested

#### Complete Lead creation workflow
- ✅ Opening create dialog
- ✅ Filling all form fields
- ✅ Submission and result verification
- ✅ Success notifications display

#### Complete Lead editing workflow
- ✅ Opening edit dialog
- ✅ Form pre-population with data
- ✅ Data modification
- ✅ Saving changes

#### Validation and errors
- ✅ Required fields validation
- ✅ Server error handling
- ✅ Network error handling
- ✅ Validation error display

#### UI interactions
- ✅ Field navigation
- ✅ Appointments management
- ✅ Autocomplete and selectors
- ✅ Form data persistence

#### Accessibility
- ✅ Keyboard navigation
- ✅ ARIA attributes and roles
- ✅ Focus and tabulation

#### Loading states
- ✅ Loading indicators
- ✅ UI blocking during operations
- ✅ Timeouts and long operations

## Mocks and Fixtures

### Jest mocks
- `@/entities/lead` - Lead API hooks
- `@/shared/lib/auth` - Authentication
- `@/features/form/ui/BaseUpsertFields` - Form component
- `@/entities/appointment/lib/sanitizers` - Appointments sanitization

### Cypress fixtures
- `cypress/fixtures/lead.json` - Lead test data

### Cypress commands
- `cy.login()` - User authentication
- `cy.createTestLead(data)` - Create test Lead
- `cy.tab()` - Navigate to next element

## Test Debugging

### Jest
```bash
# Run specific test
npm test -- --testNamePattern="should create lead successfully"

# Debug with verbose output
npm test -- --verbose

# Run with watch and coverage
npm run test:watch -- --coverage
```

### Cypress
```bash
# Open specific test in browser
npx cypress open --spec cypress/e2e/lead-edit-dialog.cy.ts

# Run with video recording
npx cypress run --record --key YOUR_KEY

# Debug with browser
npx cypress run --headed --no-exit
```

## Code Coverage

Tests are configured to collect code coverage metrics:

```bash
npm run test:coverage
```

Reports are saved in the `coverage/` folder and include:
- HTML report (`coverage/lcov-report/index.html`)
- LCOV file for CI/CD
- Text output in console

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      # Unit tests
      - run: npm ci
      - run: npm run test:coverage
      
      # E2E tests
      - run: npm run build
      - run: npm start &
      - run: npm run test:e2e
```

## Requirements

### Jest Dependencies
- `@testing-library/react`
- `@testing-library/jest-dom`
- `@testing-library/user-event`
- `jest-environment-jsdom`

### Cypress Dependencies
- `cypress`
- `@cypress/webpack-preprocessor`

All necessary dependencies are already included in `package.json`.

## Useful Commands

```bash
# Clear Jest cache
npx jest --clearCache

# Update snapshots
npm test -- --updateSnapshot

# Run tests for specific file
npm test LeadEditDialog.test.tsx

# Cypress with specific browser
npx cypress run --browser chrome

# View list of available tests
npm test -- --listTests
```
