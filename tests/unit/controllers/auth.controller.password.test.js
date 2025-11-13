// Mock database
jest.mock('../../src/config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn()
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
} = require('../../src/controllers/auth.controller');
const { pool } = require('../../src/config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

describe('auth.controller - password recovery', () => {
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

  describe('forgotPassword - casos edge', () => {
    it('debe retornar mensaje genérico si el email no existe', async () => {
      mockReq.body = { email: 'nonexistent@test.com' };
      pool.query.mockResolvedValueOnce({ rows: [] });

      await forgotPassword(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Si el correo electrónico existe'),
          success: true
        })
      );
    });

    it('debe retornar token en desarrollo', async () => {
      process.env.NODE_ENV = 'development';
      mockReq.body = { email: 'test@test.com' };
      
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1, nombre: 'Juan', email: 'test@test.com' }] })
        .mockResolvedValueOnce({ rows: [] });
      jwt.sign.mockReturnValueOnce('reset-token');

      await forgotPassword(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          resetToken: 'reset-token',
          resetUrl: expect.stringContaining('reset-password')
        })
      );
    });

    it('debe retornar mensaje genérico en producción', async () => {
      process.env.NODE_ENV = 'production';
      mockReq.body = { email: 'test@test.com' };
      
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1, nombre: 'Juan', email: 'test@test.com' }] })
        .mockResolvedValueOnce({ rows: [] });
      jwt.sign.mockReturnValueOnce('reset-token');

      await forgotPassword(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Si el correo electrónico existe'),
          success: true
        })
      );
      expect(mockRes.json).not.toHaveBeenCalledWith(
        expect.objectContaining({
          resetToken: expect.anything()
        })
      );
    });
  });

  describe('verifyResetToken - casos edge', () => {
    it('debe retornar error si el token no tiene type correcto', async () => {
      mockReq.body = { token: 'valid-token' };
      
      jwt.verify.mockReturnValueOnce({ userId: 1, type: 'invalid' });

      await verifyResetToken(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('debe retornar error si el token no existe en BD', async () => {
      mockReq.body = { token: 'valid-token' };
      
      jwt.verify.mockReturnValueOnce({ userId: 1, type: 'password_reset' });
      pool.query.mockResolvedValueOnce({ rows: [] });

      await verifyResetToken(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('debe retornar error si el token expiró', async () => {
      mockReq.body = { token: 'valid-token' };
      const expiredDate = new Date();
      expiredDate.setHours(expiredDate.getHours() - 2);
      
      jwt.verify.mockReturnValueOnce({ userId: 1, type: 'password_reset' });
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          user_id: 1,
          expires_at: expiredDate,
          used: false
        }]
      });

      await verifyResetToken(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('debe retornar error si el token ya fue usado', async () => {
      mockReq.body = { token: 'valid-token' };
      
      jwt.verify.mockReturnValueOnce({ userId: 1, type: 'password_reset' });
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          user_id: 1,
          expires_at: new Date(Date.now() + 3600000),
          used: true
        }]
      });

      await verifyResetToken(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('debe manejar JsonWebTokenError', async () => {
      mockReq.body = { token: 'invalid-token' };
      
      jwt.verify.mockImplementationOnce(() => {
        const error = new Error('Invalid token');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      await verifyResetToken(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('debe manejar TokenExpiredError', async () => {
      mockReq.body = { token: 'expired-token' };
      
      jwt.verify.mockImplementationOnce(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      await verifyResetToken(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('resetPassword - casos edge', () => {
    it('debe retornar error si la contraseña es muy corta', async () => {
      mockReq.body = { token: 'valid-token', password: '12345' };

      await resetPassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('debe actualizar contraseña y marcar token como usado', async () => {
      mockReq.body = { token: 'valid-token', password: 'newpassword123' };
      const futureDate = new Date(Date.now() + 3600000);
      
      jwt.verify.mockReturnValueOnce({ userId: 1, type: 'password_reset' });
      pool.query
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            user_id: 1,
            expires_at: futureDate,
            used: false
          }]
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });
      bcrypt.hash.mockResolvedValueOnce('hashed-password');

      await resetPassword(mockReq, mockRes);

      expect(bcrypt.hash).toHaveBeenCalled();
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE usuarios SET password_hash'),
        expect.any(Array)
      );
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE password_reset_tokens SET used'),
        expect.any(Array)
      );
    });

    it('debe usar BCRYPT_ROUNDS de env si está configurado', async () => {
      process.env.BCRYPT_ROUNDS = '15';
      mockReq.body = { token: 'valid-token', password: 'newpassword123' };
      const futureDate = new Date(Date.now() + 3600000);
      
      jwt.verify.mockReturnValueOnce({ userId: 1, type: 'password_reset' });
      pool.query
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            user_id: 1,
            expires_at: futureDate,
            used: false
          }]
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });
      bcrypt.hash.mockResolvedValueOnce('hashed-password');

      await resetPassword(mockReq, mockRes);

      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 15);
    });
  });
});

