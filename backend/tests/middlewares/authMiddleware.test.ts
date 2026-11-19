import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextFunction } from 'express';
import { authenticateToken, authorizeRoles, SESSION_COOKIE_NAME } from '@/middlewares/authMiddleware';

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
    it('should return 401 if no authorization header or cookie is provided', () => {
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

    it('should call next() if Bearer token is valid', () => {
      const mockUser = { id: '123', role: 'ADMIN' };
      mockRequest.headers = {
        authorization: 'Bearer valid.token.here',
      };

      const jwt = require('jsonwebtoken');
      const verifySpy = jest.spyOn(jwt, 'verify').mockReturnValue(mockUser as any);

      authenticateToken(mockRequest, mockResponse, mockNext);

      expect(verifySpy).toHaveBeenCalledWith('valid.token.here', expect.any(String));
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();

      verifySpy.mockRestore();
    });

    it('should prefer crm_session cookie over Bearer token', () => {
      const mockUser = { id: '456', role: 'EMPLOYEE' };
      mockRequest.cookies = {
        [SESSION_COOKIE_NAME]: 'cookie.token.here',
      };
      mockRequest.headers = {
        authorization: 'Bearer bearer.token.here',
      };

      const jwt = require('jsonwebtoken');
      const verifySpy = jest.spyOn(jwt, 'verify').mockReturnValue(mockUser as any);

      authenticateToken(mockRequest, mockResponse, mockNext);

      expect(verifySpy).toHaveBeenCalledWith('cookie.token.here', expect.any(String));
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();

      verifySpy.mockRestore();
    });

    it('should authenticate from crm_session cookie alone', () => {
      const mockUser = { id: '789', role: 'ADMIN' };
      mockRequest.cookies = {
        [SESSION_COOKIE_NAME]: 'cookie.only.token',
      };

      const jwt = require('jsonwebtoken');
      const verifySpy = jest.spyOn(jwt, 'verify').mockReturnValue(mockUser as any);

      authenticateToken(mockRequest, mockResponse, mockNext);

      expect(verifySpy).toHaveBeenCalledWith('cookie.only.token', expect.any(String));
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();

      verifySpy.mockRestore();
    });

    it('should return 403 if token is invalid', () => {
      mockRequest.cookies = {
        [SESSION_COOKIE_NAME]: 'bad.token',
      };

      const jwt = require('jsonwebtoken');
      const verifySpy = jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new Error('invalid token');
      });

      authenticateToken(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token',
      });
      expect(mockNext).not.toHaveBeenCalled();

      verifySpy.mockRestore();
    });
  });

  describe('authorizeRoles', () => {
    it('should return 401 if user is not authenticated', () => {
      const middleware = authorizeRoles('ADMIN');

      middleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not authenticated',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 if user does not have required role', () => {
      mockRequest.user = { id: '123', role: 'EMPLOYEE' };
      const middleware = authorizeRoles('ADMIN');

      middleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Role EMPLOYEE is not allowed to access this resource',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next() if user has required role', () => {
      mockRequest.user = { id: '123', role: 'ADMIN' };
      const middleware = authorizeRoles('ADMIN');

      middleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});
