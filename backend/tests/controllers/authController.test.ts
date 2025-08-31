import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { login, logout } from '../../src/controllers/authController';

// Mock all dependencies at the top
jest.mock('../../src/prisma/client', () => ({
  user: {
    findUnique: jest.fn(),
  },
}));

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

describe('Auth Controller', () => {
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockRequest = {};
  });

  describe('login', () => {
    it('should return 400 if email or password is missing', async () => {
      mockRequest.body = { email: 'test@example.com' };

      await login(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email and password are required',
      });
    });

    it('should return 401 if user is not found', async () => {
      mockRequest.body = { email: 'nonexistent@example.com', password: 'password123' };

      // Get the mocked prisma
      const prisma = require('../../src/prisma/client');
      prisma.user.findUnique.mockResolvedValue(null);

      await login(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid credentials',
      });
    });

    it('should return 200 with user and token if login is successful', async () => {
      const mockUser = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        role: 'user',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.body = { email: 'test@example.com', password: 'correctpassword' };

      // Get the mocked modules
      const prisma = require('../../src/prisma/client');
      const bcrypt = require('bcrypt');
      const jwt = require('jsonwebtoken');

      // Set up mocks
      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('jwt.token.here');

      await login(mockRequest, mockResponse);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('correctpassword', 'hashedPassword');
      expect(jwt.sign).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('logout', () => {
    it('should return 200 with success message', () => {
      logout(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully',
      });
    });
  });
});