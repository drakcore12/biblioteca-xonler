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

// Mock twofa.controller
jest.mock('../../src/controllers/twofa.controller', () => ({
  generatePending2FAToken: jest.fn()
}));

// Mock cookie-utils
jest.mock('../../src/utils/cookie-utils', () => ({
  setAuthCookies: jest.fn(),
  clearAuthCookies: jest.fn()
}));

// Mock simple-jwt
jest.mock('../../src/utils/simple-jwt', () => ({
  generateToken: jest.fn(),
  verifyToken: jest.fn()
}));

// Mock logger
jest.mock('../../src/config/logger', () => ({
  logAudit: jest.fn(),
  logSecurity: jest.fn()
}));

// Mock data-helpers
jest.mock('../../src/utils/data-helpers', () => ({
  asObject: jest.fn((val) => val)
}));

const {
  register,
  login,
  me,
  refresh,
  logout
} = require('../../src/controllers/auth.controller');
const { pool } = require('../../src/config/database');
const bcrypt = require('bcrypt');
const simpleJWT = require('../../src/utils/simple-jwt');

describe('auth.controller - cobertura completa', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
      cookies: {},
      headers: {},
      user: null
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn(),
      clearCookie: jest.fn()
    };
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
    process.env.BCRYPT_ROUNDS = '12';
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('register - casos edge', () => {
    it('debe manejar error al obtener rol', async () => {
      mockReq.body = {
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'test@test.com',
        password: 'password123'
      };
      
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 1, rol_id: 1 }] })
        .mockResolvedValueOnce({ rows: [] });
      bcrypt.hash.mockResolvedValueOnce('hashed-password');

      await register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('debe manejar error en inserción', async () => {
      mockReq.body = {
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'test@test.com',
        password: 'password123'
      };
      
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockRejectedValueOnce(new Error('Insert error'));

      await register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('login - casos edge', () => {
    it('debe manejar error al verificar contraseña', async () => {
      mockReq.body = { email: 'test@test.com', password: 'password' };
      
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          email: 'test@test.com',
          password_hash: 'hash',
          dobleautenticacion: false,
          preferencias: {},
          rol: 'usuario',
          rol_id: 1
        }]
      });
      bcrypt.compare.mockRejectedValueOnce(new Error('Compare error'));

      await login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('debe manejar error al generar token', async () => {
      mockReq.body = { email: 'test@test.com', password: 'password' };
      
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          email: 'test@test.com',
          password_hash: 'hash',
          dobleautenticacion: false,
          preferencias: {},
          rol: 'usuario',
          rol_id: 1
        }]
      });
      bcrypt.compare.mockResolvedValueOnce(true);
      simpleJWT.generateToken.mockImplementationOnce(() => {
        throw new Error('Token error');
      });

      await login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('me - casos edge', () => {
    it('debe manejar error al obtener usuario', async () => {
      mockReq.cookies = { authToken: 'valid-token' };
      simpleJWT.verifyToken.mockReturnValueOnce({ id: 1 });
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await me(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('refresh - casos edge', () => {
    it('debe manejar error al obtener usuario', async () => {
      mockReq.cookies = { refreshToken: 'valid-token' };
      simpleJWT.verifyToken.mockReturnValueOnce({ id: 1 });
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await refresh(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('logout - casos edge', () => {
    it('debe manejar errores', async () => {
      const { clearAuthCookies } = require('../../src/utils/cookie-utils');
      clearAuthCookies.mockImplementationOnce(() => {
        throw new Error('Cookie error');
      });

      await logout(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});

