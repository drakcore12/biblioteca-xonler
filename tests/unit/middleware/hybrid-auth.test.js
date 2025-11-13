// Mock dependencies
jest.mock('../../../src/utils/cookie-utils', () => ({
  checkCookieStatus: jest.fn(() => ({ hasCookie: true, cookieName: 'authToken' }))
}));

jest.mock('../../../src/config/logger', () => ({
  logSecurity: jest.fn()
}));

jest.mock('../../../src/middleware/jwt-compatibility', () => ({
  jwtCompatibility: jest.fn((req, res, next) => {
    req.user = { id: 1, email: 'test@test.com', role: 'usuario' };
    next();
  })
}));

jest.mock('../../../src/utils/http-response', () => ({
  unauthorized: jest.fn((res, message) => res.status(401).json({ error: message }))
}));

jest.mock('../../../src/utils/auth-middleware-helpers', () => ({
  requireRole: jest.fn(),
  requireAnyRole: jest.fn(),
  requireOwnershipOrAdmin: jest.fn(),
  handleAuthError: jest.fn(() => false),
  handleAuthServerError: jest.fn((res) => res.status(500).json({ error: 'Server error' })),
  extractTokenFromHeader: jest.fn(() => null)
}));

const { hybridAuth, debugAuth } = require('../../../src/middleware/hybrid-auth');
const { extractTokenFromHeader } = require('../../../src/utils/auth-middleware-helpers');
const { jwtCompatibility } = require('../../../src/middleware/jwt-compatibility');

describe('hybrid-auth middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      cookies: {},
      headers: {}
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

  describe('hybridAuth', () => {
    it('debe usar token de cookie si está disponible', () => {
      mockReq.cookies = { authToken: 'cookie-token' };
      jwtCompatibility.mockImplementationOnce((req, res, next) => {
        req.user = { id: 1 };
        next();
      });

      hybridAuth(mockReq, mockRes, mockNext);

      expect(jwtCompatibility).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('debe usar token de header Authorization como fallback', () => {
      extractTokenFromHeader.mockReturnValueOnce('header-token');
      mockReq.headers = { authorization: 'Bearer header-token' };
      jwtCompatibility.mockImplementationOnce((req, res, next) => {
        req.user = { id: 1 };
        next();
      });

      hybridAuth(mockReq, mockRes, mockNext);

      expect(extractTokenFromHeader).toHaveBeenCalledWith(mockReq);
      expect(jwtCompatibility).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('debe retornar 401 si no hay token', () => {
      extractTokenFromHeader.mockReturnValueOnce(null);

      hybridAuth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Token de acceso requerido',
        message: 'Debes iniciar sesión para acceder a este recurso',
        authSource: 'none'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar errores de autenticación', () => {
      const { handleAuthError } = require('../../../src/utils/auth-middleware-helpers');
      handleAuthError.mockReturnValueOnce(true);
      jwtCompatibility.mockImplementationOnce(() => {
        throw new Error('Token inválido');
      });
      mockReq.cookies = { authToken: 'invalid-token' };

      hybridAuth(mockReq, mockRes, mockNext);

      expect(handleAuthError).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('debugAuth', () => {
    it('debe ejecutar next sin modificar request', () => {
      debugAuth(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalled();
    });

    it('debe mostrar información de usuario si está presente', () => {
      mockReq.user = { id: 1, email: 'test@test.com', role: 'usuario', authSource: 'cookie' };

      debugAuth(mockReq, mockRes, mockNext);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('HYBRID-AUTH DEBUG'),
        expect.objectContaining({
          hasUser: true,
          userInfo: expect.objectContaining({ id: 1 })
        })
      );
    });
  });
});

