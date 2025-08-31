import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextFunction } from 'express';
import { authenticateToken, authorizeRoles } from '../../src/middlewares/authMiddleware';

describe('Auth Middleware', () => {
  let mockRequest: any;
  let mockResponse: any;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      cookies: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should return 401 if no authorization header is provided', () => {
      authenticateToken(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Token required.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if authorization header does not contain Bearer token', () => {
      mockRequest.headers = {
        authorization: 'InvalidToken',
      };

      authenticateToken(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Token required.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next() if token is valid', () => {
      const mockUser = { id: '123', role: 'admin' };
      mockRequest.headers = {
        authorization: 'Bearer valid.token.here',
      };

      // Mock jwt.verify to return valid user
      const jwt = require('jsonwebtoken');
      const verifySpy = jest.spyOn(jwt, 'verify').mockReturnValue(mockUser as any);

      authenticateToken(mockRequest, mockResponse, mockNext);

      expect(verifySpy).toHaveBeenCalledWith('valid.token.here', expect.any(String));
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();

      verifySpy.mockRestore();
    });
  });

  describe('authorizeRoles', () => {
    it('should return 401 if user is not authenticated', () => {
      const middleware = authorizeRoles('admin');

      middleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not authenticated',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 if user does not have required role', () => {
      mockRequest.user = { id: '123', role: 'user' };
      const middleware = authorizeRoles('admin');

      middleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Role user is not allowed to access this resource',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next() if user has required role', () => {
      mockRequest.user = { id: '123', role: 'admin' };
      const middleware = authorizeRoles('admin');

      middleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});
