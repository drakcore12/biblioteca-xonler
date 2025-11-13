// Mock simple-jwt
jest.mock('../../../src/utils/simple-jwt', () => ({
  verifyToken: jest.fn()
}));

// Mock http-response
jest.mock('../../../src/utils/http-response', () => ({
  unauthorized: jest.fn((res, message) => res.status(401).json({ error: message }))
}));

// Mock auth-middleware-helpers
jest.mock('../../../src/utils/auth-middleware-helpers', () => ({
  extractTokenFromHeader: jest.fn(),
  setUserFromDecoded: jest.fn(),
  handleAuthError: jest.fn(),
  handleAuthServerError: jest.fn(),
  requireRole: jest.fn(),
  requireAnyRole: jest.fn(),
  requireOwnershipOrAdmin: jest.fn(),
  checkPermission: jest.fn()
}));

const { auth, requireRole, requireAnyRole, requireOwnershipOrAdmin, checkPermission } = require('../../../src/middleware/auth');
const simpleJWT = require('../../../src/utils/simple-jwt');
const { unauthorized } = require('../../../src/utils/http-response');
const {
  extractTokenFromHeader,
  setUserFromDecoded,
  handleAuthError,
  handleAuthServerError
} = require('../../../src/utils/auth-middleware-helpers');

describe('middleware/auth', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {},
      get: jest.fn(),
      user: null
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  describe('auth', () => {
    it('debe retornar 401 si no hay token', () => {
      extractTokenFromHeader.mockReturnValue(null);

      auth(mockReq, mockRes, mockNext);

      expect(unauthorized).toHaveBeenCalledWith(
        mockRes,
        'Debes incluir un token Bearer en el header Authorization'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe autenticar correctamente con token válido', () => {
      const mockToken = 'valid-token';
      const mockDecoded = {
        id: 1,
        email: 'test@test.com',
        role: 'usuario'
      };

      extractTokenFromHeader.mockReturnValue(mockToken);
      simpleJWT.verifyToken.mockReturnValue(mockDecoded);
      setUserFromDecoded.mockImplementation((req, decoded) => {
        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role
        };
      });

      auth(mockReq, mockRes, mockNext);

      expect(simpleJWT.verifyToken).toHaveBeenCalledWith(mockToken);
      expect(setUserFromDecoded).toHaveBeenCalledWith(mockReq, mockDecoded);
      expect(mockNext).toHaveBeenCalled();
    });

    it('debe manejar errores de token expirado', () => {
      const mockToken = 'expired-token';
      const mockError = { name: 'TokenExpiredError', message: 'Token expired' };

      extractTokenFromHeader.mockReturnValue(mockToken);
      simpleJWT.verifyToken.mockImplementation(() => {
        throw mockError;
      });
      handleAuthError.mockReturnValue(true);

      auth(mockReq, mockRes, mockNext);

      expect(handleAuthError).toHaveBeenCalledWith(mockError, mockRes);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar errores de token inválido', () => {
      const mockToken = 'invalid-token';
      const mockError = { name: 'JsonWebTokenError', message: 'Invalid token' };

      extractTokenFromHeader.mockReturnValue(mockToken);
      simpleJWT.verifyToken.mockImplementation(() => {
        throw mockError;
      });
      handleAuthError.mockReturnValue(true);

      auth(mockReq, mockRes, mockNext);

      expect(handleAuthError).toHaveBeenCalledWith(mockError, mockRes);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar errores del servidor', () => {
      const mockToken = 'token';
      const mockError = new Error('Server error');

      extractTokenFromHeader.mockReturnValue(mockToken);
      simpleJWT.verifyToken.mockImplementation(() => {
        throw mockError;
      });
      handleAuthError.mockReturnValue(false);

      auth(mockReq, mockRes, mockNext);

      expect(handleAuthError).toHaveBeenCalledWith(mockError, mockRes);
      expect(handleAuthServerError).toHaveBeenCalledWith(mockRes);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('debe re-exportar requireRole de auth-middleware-helpers', () => {
      expect(requireRole).toBeDefined();
      expect(typeof requireRole).toBe('function');
    });
  });

  describe('requireAnyRole', () => {
    it('debe re-exportar requireAnyRole de auth-middleware-helpers', () => {
      expect(requireAnyRole).toBeDefined();
      expect(typeof requireAnyRole).toBe('function');
    });
  });

  describe('requireOwnershipOrAdmin', () => {
    it('debe re-exportar requireOwnershipOrAdmin de auth-middleware-helpers', () => {
      expect(requireOwnershipOrAdmin).toBeDefined();
      expect(typeof requireOwnershipOrAdmin).toBe('function');
    });
  });

  describe('checkPermission', () => {
    it('debe re-exportar checkPermission de auth-middleware-helpers', () => {
      expect(checkPermission).toBeDefined();
      expect(typeof checkPermission).toBe('function');
    });
  });
});

