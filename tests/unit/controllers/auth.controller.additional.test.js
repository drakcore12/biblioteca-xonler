// Mock database
jest.mock('../../../src/config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn()
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn()
}));

const {
  forgotPassword,
  verifyResetToken,
  resetPassword
} = require('../../../src/controllers/auth.controller');
const { pool } = require('../../../src/config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

describe('auth.controller - funciones adicionales', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      body: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
    process.env.JWT_SECRET = 'test-secret';
    process.env.NODE_ENV = 'test';
  });

  describe('forgotPassword', () => {
    it('debe generar token de reset si el usuario existe', async () => {
      mockReq.body = { email: 'test@test.com' };
      const mockUser = { id: 1, email: 'test@test.com' };
      const mockToken = 'reset-token';

      pool.query
        .mockResolvedValueOnce({ rows: [mockUser] })
        .mockResolvedValueOnce({ rows: [] }); // Verificar token existente
      jwt.sign.mockReturnValueOnce(mockToken);
      pool.query.mockResolvedValueOnce({ rows: [] }); // INSERT token

      await forgotPassword(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalled();
      expect(jwt.sign).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('debe retornar 400 si falta el email', async () => {
      mockReq.body = {};

      await forgotPassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('debe retornar mensaje genérico si el usuario no existe', async () => {
      mockReq.body = { email: 'nonexistent@test.com' };
      pool.query.mockResolvedValueOnce({ rows: [] });

      await forgotPassword(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('Si el correo electrónico existe')
        })
      );
    });

    it('debe manejar errores', async () => {
      mockReq.body = { email: 'test@test.com' };
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await forgotPassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('verifyResetToken', () => {
    it('debe verificar token válido', async () => {
      mockReq.body = { token: 'valid-token' };
      const mockDecoded = { type: 'password_reset', userId: 1 };
      const mockTokenData = {
        id: 1,
        user_id: 1,
        expires_at: new Date(Date.now() + 3600000), // 1 hora en el futuro
        used: false
      };

      jwt.verify.mockReturnValueOnce(mockDecoded);
      pool.query.mockResolvedValueOnce({ rows: [mockTokenData] });

      await verifyResetToken(mockReq, mockRes);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Token válido'
        })
      );
    });

    it('debe retornar 400 si falta el token', async () => {
      mockReq.body = {};

      await verifyResetToken(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('debe retornar 400 si el token es inválido', async () => {
      mockReq.body = { token: 'invalid-token' };
      jwt.verify.mockReturnValueOnce({ type: 'invalid' });

      await verifyResetToken(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('debe retornar 400 si el token no existe en DB', async () => {
      mockReq.body = { token: 'valid-token' };
      jwt.verify.mockReturnValueOnce({ type: 'password_reset', userId: 1 });
      pool.query.mockResolvedValueOnce({ rows: [] });

      await verifyResetToken(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('debe retornar 400 si el token expiró', async () => {
      mockReq.body = { token: 'expired-token' };
      jwt.verify.mockReturnValueOnce({ type: 'password_reset', userId: 1 });
      const expiredToken = {
        id: 1,
        user_id: 1,
        expires_at: new Date(Date.now() - 3600000), // 1 hora en el pasado
        used: false
      };
      pool.query.mockResolvedValueOnce({ rows: [expiredToken] });

      await verifyResetToken(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('debe retornar 400 si el token ya fue usado', async () => {
      mockReq.body = { token: 'used-token' };
      jwt.verify.mockReturnValueOnce({ type: 'password_reset', userId: 1 });
      const usedToken = {
        id: 1,
        user_id: 1,
        expires_at: new Date(Date.now() + 3600000),
        used: true
      };
      pool.query.mockResolvedValueOnce({ rows: [usedToken] });

      await verifyResetToken(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('debe manejar errores de JWT', async () => {
      mockReq.body = { token: 'invalid-token' };
      const jwtError = new Error('Invalid token');
      jwtError.name = 'JsonWebTokenError';
      jwt.verify.mockImplementationOnce(() => {
        throw jwtError;
      });

      await verifyResetToken(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('resetPassword', () => {
    it('debe restablecer contraseña exitosamente', async () => {
      mockReq.body = { token: 'valid-token', password: 'newpassword123' };
      const mockDecoded = { type: 'password_reset', userId: 1 };
      const mockTokenData = {
        id: 1,
        user_id: 1,
        expires_at: new Date(Date.now() + 3600000),
        used: false
      };

      jwt.verify.mockReturnValueOnce(mockDecoded);
      pool.query
        .mockResolvedValueOnce({ rows: [mockTokenData] })
        .mockResolvedValueOnce({ rows: [] }) // UPDATE password
        .mockResolvedValueOnce({ rows: [] }); // UPDATE token
      bcrypt.hash.mockResolvedValueOnce('hashed-password');

      await resetPassword(mockReq, mockRes);

      expect(bcrypt.hash).toHaveBeenCalled();
      expect(pool.query).toHaveBeenCalledTimes(3);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Contraseña restablecida exitosamente'
        })
      );
    });

    it('debe retornar 400 si faltan datos', async () => {
      mockReq.body = {};

      await resetPassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('debe retornar 400 si la contraseña es muy corta', async () => {
      mockReq.body = { token: 'valid-token', password: '123' };

      await resetPassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Contraseña inválida'
        })
      );
    });

    it('debe retornar 400 si el token es inválido', async () => {
      mockReq.body = { token: 'invalid-token', password: 'newpassword123' };
      jwt.verify.mockReturnValueOnce({ type: 'invalid' });

      await resetPassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('debe manejar errores', async () => {
      mockReq.body = { token: 'valid-token', password: 'newpassword123' };
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await resetPassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});

