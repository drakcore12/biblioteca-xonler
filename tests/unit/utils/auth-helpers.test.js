// Mock http-response antes de importar el módulo
jest.mock('../../../src/utils/http-response', () => ({
  unauthorized: jest.fn((res, message) => res.status(401).json({ error: message })),
  forbidden: jest.fn((res, message) => res.status(403).json({ error: message }))
}));

const {
  getUserId,
  getUserRole,
  isAuthenticated,
  hasRole,
  isAdmin,
  requireAuth,
  requireRole,
  canAccessResource,
  requireResourceAccess
} = require('../../../src/utils/auth-helpers');
const { unauthorized, forbidden } = require('../../../src/utils/http-response');

describe('auth-helpers', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      user: null,
      auth: null,
      userId: null,
      params: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('getUserId', () => {
    it('debe retornar null si req no es válido', () => {
      expect(getUserId(null)).toBeNull();
      expect(getUserId(undefined)).toBeNull();
    });

    it('debe obtener ID de req.user', () => {
      mockReq.user = { id: 1 };
      expect(getUserId(mockReq)).toBe(1);
    });

    it('debe obtener ID de req.auth.sub', () => {
      mockReq.auth = { sub: 2 };
      expect(getUserId(mockReq)).toBe(2);
    });

    it('debe obtener ID de req.userId', () => {
      mockReq.userId = 3;
      expect(getUserId(mockReq)).toBe(3);
    });

    it('debe priorizar req.user sobre req.auth', () => {
      mockReq.user = { id: 1 };
      mockReq.auth = { sub: 2 };
      expect(getUserId(mockReq)).toBe(1);
    });
  });

  describe('getUserRole', () => {
    it('debe retornar null si req no es válido', () => {
      expect(getUserRole(null)).toBeNull();
    });

    it('debe obtener rol de req.user.role', () => {
      mockReq.user = { role: 'admin' };
      expect(getUserRole(mockReq)).toBe('admin');
    });

    it('debe obtener rol de req.user.rol (alternativo)', () => {
      mockReq.user = { rol: 'usuario' };
      expect(getUserRole(mockReq)).toBe('usuario');
    });

    it('debe retornar null si no hay rol', () => {
      mockReq.user = {};
      expect(getUserRole(mockReq)).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('debe retornar false si no hay usuario', () => {
      expect(isAuthenticated(mockReq)).toBe(false);
    });

    it('debe retornar true si hay usuario', () => {
      mockReq.user = { id: 1 };
      expect(isAuthenticated(mockReq)).toBe(true);
    });
  });

  describe('hasRole', () => {
    it('debe retornar false si role no es string válido', () => {
      mockReq.user = { role: 'admin' };
      expect(hasRole(mockReq, '')).toBe(false);
      expect(hasRole(mockReq, null)).toBe(false);
    });

    it('debe retornar true si el usuario tiene el rol', () => {
      mockReq.user = { role: 'admin' };
      expect(hasRole(mockReq, 'admin')).toBe(true);
    });

    it('debe retornar false si el usuario no tiene el rol', () => {
      mockReq.user = { role: 'usuario' };
      expect(hasRole(mockReq, 'admin')).toBe(false);
    });

    it('debe hacer trim del rol', () => {
      mockReq.user = { role: 'admin' };
      expect(hasRole(mockReq, ' admin ')).toBe(true);
    });
  });

  describe('isAdmin', () => {
    it('debe retornar true para admin', () => {
      mockReq.user = { role: 'admin' };
      expect(isAdmin(mockReq)).toBe(true);
    });

    it('debe retornar true para supadmin', () => {
      mockReq.user = { role: 'supadmin' };
      expect(isAdmin(mockReq)).toBe(true);
    });

    it('debe retornar false para otros roles', () => {
      mockReq.user = { role: 'usuario' };
      expect(isAdmin(mockReq)).toBe(false);
    });
  });

  describe('requireAuth', () => {
    it('debe llamar unauthorized si req no es válido', () => {
      requireAuth(null, mockRes, mockNext);
      expect(unauthorized).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe llamar unauthorized si no está autenticado', () => {
      requireAuth(mockReq, mockRes, mockNext);
      expect(unauthorized).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe llamar next si está autenticado', () => {
      mockReq.user = { id: 1 };
      requireAuth(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(unauthorized).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('debe lanzar error si role no es string válido', () => {
      expect(() => requireRole('')).toThrow(TypeError);
      expect(() => requireRole(null)).toThrow(TypeError);
    });

    it('debe llamar unauthorized si no está autenticado', () => {
      const middleware = requireRole('admin');
      middleware(mockReq, mockRes, mockNext);
      expect(unauthorized).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe llamar forbidden si no tiene el rol requerido', () => {
      mockReq.user = { id: 1, role: 'usuario' };
      const middleware = requireRole('admin');
      middleware(mockReq, mockRes, mockNext);
      expect(forbidden).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe permitir acceso a admin aunque no tenga el rol específico', () => {
      mockReq.user = { id: 1, role: 'admin' };
      const middleware = requireRole('bibliotecario');
      middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(forbidden).not.toHaveBeenCalled();
    });

    it('debe llamar next si tiene el rol requerido', () => {
      mockReq.user = { id: 1, role: 'admin' };
      const middleware = requireRole('admin');
      middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('canAccessResource', () => {
    it('debe retornar false si req no es válido', () => {
      expect(canAccessResource(null, 1)).toBe(false);
    });

    it('debe retornar false si no está autenticado', () => {
      expect(canAccessResource(mockReq, 1)).toBe(false);
    });

    it('debe retornar true si es admin', () => {
      mockReq.user = { id: 1, role: 'admin' };
      expect(canAccessResource(mockReq, 999)).toBe(true);
    });

    it('debe retornar true si es propietario', () => {
      mockReq.user = { id: 1, role: 'usuario' };
      expect(canAccessResource(mockReq, 1)).toBe(true);
    });

    it('debe retornar false si no es propietario ni admin', () => {
      mockReq.user = { id: 1, role: 'usuario' };
      expect(canAccessResource(mockReq, 999)).toBe(false);
    });

    it('debe manejar resourceUserId como string', () => {
      mockReq.user = { id: 1, role: 'usuario' };
      expect(canAccessResource(mockReq, '1')).toBe(true);
    });

    it('debe retornar false para string inválido', () => {
      mockReq.user = { id: 1, role: 'usuario' };
      expect(canAccessResource(mockReq, 'invalid')).toBe(false);
    });
  });

  describe('requireResourceAccess', () => {
    it('debe lanzar error si extractor no es función', () => {
      expect(() => requireResourceAccess(null)).toThrow(TypeError);
    });

    it('debe llamar unauthorized si no está autenticado', () => {
      const extractor = (req) => req.params.id;
      const middleware = requireResourceAccess(extractor);
      middleware(mockReq, mockRes, mockNext);
      expect(unauthorized).toHaveBeenCalled();
    });

    it('debe llamar forbidden si no puede acceder al recurso', () => {
      mockReq.user = { id: 1, role: 'usuario' };
      mockReq.params.id = '999';
      const extractor = (req) => req.params.id;
      const middleware = requireResourceAccess(extractor);
      middleware(mockReq, mockRes, mockNext);
      expect(forbidden).toHaveBeenCalled();
    });

    it('debe llamar next si puede acceder al recurso', () => {
      mockReq.user = { id: 1, role: 'usuario' };
      mockReq.params.id = '1';
      const extractor = (req) => req.params.id;
      const middleware = requireResourceAccess(extractor);
      middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('debe manejar errores del extractor', () => {
      mockReq.user = { id: 1, role: 'usuario' };
      const extractor = () => { throw new Error('Extractor error'); };
      const middleware = requireResourceAccess(extractor);
      middleware(mockReq, mockRes, mockNext);
      expect(forbidden).toHaveBeenCalled();
    });
  });
});

