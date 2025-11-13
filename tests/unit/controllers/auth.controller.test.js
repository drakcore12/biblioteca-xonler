// Mock database
jest.mock('../../src/config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn()
}));

// Mock simple-jwt
jest.mock('../../src/utils/simple-jwt', () => ({
  generateToken: jest.fn(),
  verifyToken: jest.fn()
}));

// Mock cookie-utils
jest.mock('../../src/utils/cookie-utils', () => ({
  setAuthCookies: jest.fn(),
  clearAuthCookies: jest.fn()
}));

// Mock twofa.controller
jest.mock('../../src/controllers/twofa.controller', () => ({
  generatePending2FAToken: jest.fn()
}));

// Mock logger
jest.mock('../../src/config/logger', () => ({
  logAudit: jest.fn(),
  logSecurity: jest.fn()
}));

const { register, login, me, refresh, logout } = require('../../src/controllers/auth.controller');
const { pool } = require('../../src/config/database');
const bcrypt = require('bcrypt');
const simpleJWT = require('../../src/utils/simple-jwt');
const { setAuthCookies, clearAuthCookies } = require('../../src/utils/cookie-utils');
const { generatePending2FAToken } = require('../../src/controllers/twofa.controller');

describe('auth.controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
      get: jest.fn(),
      method: 'POST',
      url: '/auth/register',
      user: null
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  describe('register', () => {
    it('debe retornar error 400 si faltan campos obligatorios', async () => {
      mockReq.body = { nombre: 'Juan' };
      
      await register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Nombre, apellido, email y password son obligatorios'
        })
      );
    });

    it('debe retornar error 409 si el email ya existe', async () => {
      mockReq.body = {
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'test@test.com',
        password: 'password123'
      };
      
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      await register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'El email ya está registrado'
      });
    });

    it('debe registrar un usuario exitosamente', async () => {
      mockReq.body = {
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'test@test.com',
        password: 'password123'
      };
      
      const mockUser = {
        id: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'test@test.com',
        rol_id: 1
      };
      
      const mockRol = { name: 'usuario' };
      const mockToken = 'mock-jwt-token';

      pool.query
        .mockResolvedValueOnce({ rows: [] }) // Email no existe
        .mockResolvedValueOnce({ rows: [mockUser] }) // Insert usuario
        .mockResolvedValueOnce({ rows: [mockRol] }); // Get rol

      bcrypt.hash.mockResolvedValue('hashed-password');
      simpleJWT.generateToken.mockReturnValue(mockToken);

      await register(mockReq, mockRes);

      expect(bcrypt.hash).toHaveBeenCalled();
      expect(simpleJWT.generateToken).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Usuario registrado exitosamente',
          token: mockToken
        })
      );
    });

    it('debe manejar errores internos', async () => {
      mockReq.body = {
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'test@test.com',
        password: 'password123'
      };
      
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Error interno del servidor'
      });
    });
  });

  describe('login', () => {
    it('debe retornar error 400 si faltan email o password', async () => {
      mockReq.body = { email: 'test@test.com' };
      
      await login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Email y password son obligatorios'
      });
    });

    it('debe retornar error 401 si el usuario no existe', async () => {
      mockReq.body = {
        email: 'test@test.com',
        password: 'password123'
      };
      
      pool.query.mockResolvedValueOnce({ rows: [] });

      await login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Credenciales inválidas'
      });
    });

    it('debe retornar error 401 si la contraseña es incorrecta', async () => {
      mockReq.body = {
        email: 'test@test.com',
        password: 'wrongpassword'
      };
      
      const mockUser = {
        id: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'test@test.com',
        password_hash: 'hashed-password',
        dobleautenticacion: false,
        preferencias: '{}',
        rol: 'usuario',
        rol_id: 1
      };
      
      pool.query.mockResolvedValueOnce({ rows: [mockUser] });
      bcrypt.compare.mockResolvedValueOnce(false);

      await login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Credenciales inválidas'
      });
    });

    it('debe hacer login exitoso sin 2FA', async () => {
      mockReq.body = {
        email: 'test@test.com',
        password: 'password123'
      };
      
      const mockUser = {
        id: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'test@test.com',
        password_hash: 'hashed-password',
        dobleautenticacion: false,
        preferencias: '{}',
        rol: 'usuario',
        rol_id: 1
      };
      
      const mockToken = 'mock-jwt-token';

      pool.query.mockResolvedValueOnce({ rows: [mockUser] });
      bcrypt.compare.mockResolvedValueOnce(true);
      simpleJWT.generateToken.mockReturnValue(mockToken);

      await login(mockReq, mockRes);

      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(simpleJWT.generateToken).toHaveBeenCalled();
      expect(setAuthCookies).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Login exitoso',
          token: mockToken
        })
      );
    });

    it('debe requerir 2FA si está habilitado', async () => {
      mockReq.body = {
        email: 'test@test.com',
        password: 'password123'
      };
      
      const mockUser = {
        id: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'test@test.com',
        password_hash: 'hashed-password',
        dobleautenticacion: true,
        preferencias: JSON.stringify({
          twofa: { secret_base32: 'MOCK_SECRET' }
        }),
        rol: 'usuario',
        rol_id: 1
      };
      
      const mockPendingToken = 'pending-2fa-token';

      pool.query.mockResolvedValueOnce({ rows: [mockUser] });
      bcrypt.compare.mockResolvedValueOnce(true);
      generatePending2FAToken.mockReturnValue(mockPendingToken);

      await login(mockReq, mockRes);

      expect(generatePending2FAToken).toHaveBeenCalledWith(1);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Se requiere autenticación de dos factores',
          pending2faToken: mockPendingToken
        })
      );
    });

    it('debe manejar errores internos', async () => {
      mockReq.body = {
        email: 'test@test.com',
        password: 'password123'
      };
      
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Error interno del servidor'
      });
    });
  });

  describe('me', () => {
    it('debe retornar información del usuario autenticado', async () => {
      mockReq.user = {
        id: 1,
        email: 'test@test.com',
        role: 'usuario'
      };
      
      const mockUser = {
        id: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'test@test.com',
        rol_id: 1
      };
      
      pool.query.mockResolvedValueOnce({ rows: [mockUser] });

      await me(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(mockUser);
    });

    it('debe manejar errores internos', async () => {
      mockReq.user = { id: 1 };
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await me(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('refresh', () => {
    it('debe refrescar el token si es válido', async () => {
      mockReq.user = {
        id: 1,
        email: 'test@test.com',
        role: 'usuario'
      };
      
      const mockUser = {
        id: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'test@test.com',
        rol: 'usuario',
        rol_id: 1
      };
      
      const mockToken = 'new-jwt-token';

      pool.query.mockResolvedValueOnce({ rows: [mockUser] });
      simpleJWT.generateToken.mockReturnValue(mockToken);

      await refresh(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalled();
      expect(simpleJWT.generateToken).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          token: mockToken,
          message: 'Token renovado exitosamente'
        })
      );
    });

    it('debe retornar error 404 si el usuario no existe', async () => {
      mockReq.user = { id: 999 };
      pool.query.mockResolvedValueOnce({ rows: [] });

      await refresh(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('logout', () => {
    it('debe limpiar las cookies y retornar éxito', async () => {
      await logout(mockReq, mockRes);

      expect(clearAuthCookies).toHaveBeenCalledWith(mockRes);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Logout exitoso',
        success: true
      });
    });
  });
});

