import { jest, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

// Mock Prisma client
jest.mock('../src/prisma/client', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $disconnect: jest.fn(),
  } as unknown as PrismaClient,
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

// Set test environment variables
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.NODE_ENV = 'test';

// Global test setup
beforeAll(async () => {
  // Any global setup
});

afterAll(async () => {
  // Any global cleanup
});
