# Backend Tests

This directory contains unit tests for the backend application.

## Test Structure

```
tests/
├── controllers/
│   └── authController.test.js    # Tests for authentication controller
├── middlewares/
│   └── authMiddleware.test.js    # Tests for authentication middleware
└── setup.ts                      # Jest setup and global mocks
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Coverage

The tests cover the following functionality:

### Auth Middleware (`authMiddleware.test.js`)
- ✅ `authenticateToken` function
  - Returns 401 for missing authorization header
  - Returns 401 for invalid Bearer token format
  - Returns 403 for invalid/expired tokens
  - Calls next() and sets req.user for valid tokens

- ✅ `authorizeRoles` function
  - Returns 401 for unauthenticated users
  - Returns 403 for insufficient permissions
  - Calls next() for users with required roles

### Auth Controller (`authController.test.js`)
- ✅ `login` function
  - Returns 400 for missing email/password
  - Returns 401 for non-existent users
  - Returns 401 for invalid passwords
  - Returns 200 with user data and token for successful login

- ✅ `logout` function
  - Returns 200 with success message

## Mocking Strategy

The tests use Jest mocks for:
- **Prisma Client**: Database operations
- **bcrypt**: Password hashing/comparison
- **jsonwebtoken**: JWT token operations

All external dependencies are mocked to ensure tests run in isolation and focus on business logic.

## Test Results

```
Test Suites: 2 passed, 2 total
Tests:       10 passed, 10 total
Snapshots:   0 total
```

All tests are currently passing and provide good coverage of the authentication functionality.
