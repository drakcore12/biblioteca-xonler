// Mock http-response antes de importar el módulo
jest.mock('../../../src/utils/http-response', () => ({
  unauthorized: jest.fn((res, message) => res.status(401).json({ error: message })),
  forbidden: jest.fn((res, message) => res.status(403).json({ error: message }))
}));

const {
  checkAuthentication,
  hasRoleAccess,
  requireRole,
  requireAnyRole,
  requireOwnershipOrAdmin,
  extractTokenFromHeader,
  setUserFromDecoded,
  handleAuthError,
  handleAuthServerError,
  checkPermission
} = require('../../../src/utils/auth-middleware-helpers');
const { unauthorized, forbidden } = require('../../../src/utils/http-response');

describe('auth-middleware-helpers', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      user: null,
      params: {},
      headers: {},
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' },
      get: jest.fn(),
      url: '/test'
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('checkAuthentication', () => {
    it('debe retornar false y llamar unauthorized si no hay usuario', () => {
      const result = checkAuthentication(mockReq, mockRes);
      expect(result).toBe(false);
      expect(unauthorized).toHaveBeenCalledWith(mockRes, 'Debes iniciar sesión para acceder a este recurso');
    });

    it('debe retornar true si hay usuario', () => {
      mockReq.user = { id: 1, role: 'usuario' };
      const result = checkAuthentication(mockReq, mockRes);
      expect(result).toBe(true);
      expect(unauthorized).not.toHaveBeenCalled();
    });
  });

  describe('hasRoleAccess', () => {
    it('debe retornar true si el usuario es admin', () => {
      expect(hasRoleAccess('admin', 'usuario')).toBe(true);
    });

    it('debe retornar true si el usuario es supadmin', () => {
      expect(hasRoleAccess('supadmin', 'usuario')).toBe(true);
    });

    it('debe retornar true si el rol coincide con string requerido', () => {
      expect(hasRoleAccess('usuario', 'usuario')).toBe(true);
    });

    it('debe retornar false si el rol no coincide', () => {
      expect(hasRoleAccess('usuario', 'admin')).toBe(false);
    });

    it('debe retornar true si el rol está en el array requerido', () => {
      expect(hasRoleAccess('usuario', ['usuario', 'bibliotecario'])).toBe(true);
    });

    it('debe retornar false si el rol no está en el array requerido', () => {
      expect(hasRoleAccess('usuario', ['admin', 'bibliotecario'])).toBe(false);
    });
  });

  describe('requireRole', () => {
    it('debe llamar unauthorized si no hay usuario', () => {
      requireRole('admin')(mockReq, mockRes, mockNext);
      expect(unauthorized).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe llamar forbidden si el usuario no tiene el rol requerido', () => {
      mockReq.user = { id: 1, role: 'usuario' };
      requireRole('admin')(mockReq, mockRes, mockNext);
      expect(forbidden).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe llamar next si el usuario tiene el rol requerido', () => {
      mockReq.user = { id: 1, role: 'admin' };
      requireRole('admin')(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(forbidden).not.toHaveBeenCalled();
    });
  });

  describe('requireAnyRole', () => {
    it('debe llamar unauthorized si no hay usuario', () => {
      requireAnyRole(['admin', 'bibliotecario'])(mockReq, mockRes, mockNext);
      expect(unauthorized).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe llamar forbidden si el usuario no tiene ninguno de los roles', () => {
      mockReq.user = { id: 1, role: 'usuario' };
      requireAnyRole(['admin', 'bibliotecario'])(mockReq, mockRes, mockNext);
      expect(forbidden).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe llamar next si el usuario tiene uno de los roles', () => {
      mockReq.user = { id: 1, role: 'admin' };
      requireAnyRole(['admin', 'bibliotecario'])(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(forbidden).not.toHaveBeenCalled();
    });
  });

  describe('requireOwnershipOrAdmin', () => {
    it('debe llamar unauthorized si no hay usuario', () => {
      mockReq.params.id = '1';
      requireOwnershipOrAdmin()(mockReq, mockRes, mockNext);
      expect(unauthorized).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe permitir acceso a admin', () => {
      mockReq.user = { id: 1, role: 'admin' };
      mockReq.params.id = '999';
      requireOwnershipOrAdmin()(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(forbidden).not.toHaveBeenCalled();
    });

    it('debe permitir acceso a supadmin', () => {
      mockReq.user = { id: 1, role: 'supadmin' };
      mockReq.params.id = '999';
      requireOwnershipOrAdmin()(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(forbidden).not.toHaveBeenCalled();
    });

    it('debe permitir acceso si el usuario es propietario', () => {
      mockReq.user = { id: 1, role: 'usuario' };
      mockReq.params.id = '1';
      requireOwnershipOrAdmin()(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(forbidden).not.toHaveBeenCalled();
    });

    it('debe llamar forbidden si el usuario no es propietario ni admin', () => {
      mockReq.user = { id: 1, role: 'usuario' };
      mockReq.params.id = '999';
      requireOwnershipOrAdmin()(mockReq, mockRes, mockNext);
      expect(forbidden).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe usar el parámetro personalizado', () => {
      mockReq.user = { id: 1, role: 'usuario' };
      mockReq.params.userId = '1';
      requireOwnershipOrAdmin('userId')(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('extractTokenFromHeader', () => {
    it('debe retornar null si no hay header authorization', () => {
      expect(extractTokenFromHeader(mockReq)).toBeNull();
    });

    it('debe retornar null si el header no empieza con Bearer', () => {
      mockReq.headers.authorization = 'Token abc123';
      expect(extractTokenFromHeader(mockReq)).toBeNull();
    });

    it('debe extraer el token correctamente', () => {
      mockReq.headers.authorization = 'Bearer abc123token';
      expect(extractTokenFromHeader(mockReq)).toBe('abc123token');
    });

    it('debe retornar null si el token está vacío', () => {
      mockReq.headers.authorization = 'Bearer ';
      expect(extractTokenFromHeader(mockReq)).toBeNull();
    });
  });

  describe('setUserFromDecoded', () => {
    it('debe configurar req.user con información del token', () => {
      const decoded = {
        user_id: 1,
        email: 'test@example.com',
        role: 'usuario',
        nombre: 'Test User',
        exp: 1234567890
      };
      setUserFromDecoded(mockReq, decoded);
      expect(mockReq.user).toEqual({
        id: 1,
        email: 'test@example.com',
        role: 'usuario',
        nombre: 'Test User',
        tokenExp: 1234567890
      });
    });

    it('debe usar id si user_id no existe', () => {
      const decoded = { id: 2, email: 'test@example.com' };
      setUserFromDecoded(mockReq, decoded);
      expect(mockReq.user.id).toBe(2);
    });

    it('debe agregar authSource si se proporciona', () => {
      const decoded = { id: 1, email: 'test@example.com' };
      setUserFromDecoded(mockReq, decoded, 'cookie');
      expect(mockReq.user.authSource).toBe('cookie');
    });
  });

  describe('handleAuthError', () => {
    it('debe manejar JsonWebTokenError', () => {
      const error = { name: 'JsonWebTokenError', message: 'Invalid token' };
      const result = handleAuthError(error, mockRes, mockReq);
      expect(result).toBe(true);
      expect(unauthorized).toHaveBeenCalled();
    });

    it('debe manejar TokenExpiredError', () => {
      const error = { name: 'TokenExpiredError', message: 'Token expired' };
      const result = handleAuthError(error, mockRes, mockReq);
      expect(result).toBe(true);
      expect(unauthorized).toHaveBeenCalled();
    });

    it('debe retornar false para errores no reconocidos', () => {
      const error = { name: 'UnknownError', message: 'Unknown' };
      const result = handleAuthError(error, mockRes, mockReq);
      expect(result).toBe(false);
    });

    it('debe agregar authSource a la respuesta si se proporciona', () => {
      const error = { name: 'JsonWebTokenError', message: 'Invalid token' };
      const originalJson = mockRes.json;
      handleAuthError(error, mockRes, mockReq, null, { authSource: 'invalid' });
      expect(mockRes.json).not.toBe(originalJson);
    });
  });

  describe('handleAuthServerError', () => {
    it('debe retornar respuesta 500', () => {
      handleAuthServerError(mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('debe incluir authSource si se proporciona', () => {
      handleAuthServerError(mockRes, 'cookie');
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ authSource: 'cookie' })
      );
    });
  });

  describe('checkPermission', () => {
    it('debe llamar unauthorized si no hay usuario', () => {
      checkPermission('manage_users')(mockReq, mockRes, mockNext);
      expect(unauthorized).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe llamar forbidden si el usuario no tiene el permiso', () => {
      mockReq.user = { id: 1, role: 'usuario' };
      checkPermission('manage_users')(mockReq, mockRes, mockNext);
      expect(forbidden).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe llamar next si el usuario tiene el permiso', () => {
      mockReq.user = { id: 1, role: 'admin' };
      checkPermission('manage_users')(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(forbidden).not.toHaveBeenCalled();
    });
  });
});

