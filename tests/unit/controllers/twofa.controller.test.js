// Mock dependencies
jest.mock('../../../src/db/usuarios.db', () => ({
  getById: jest.fn(),
  saveTwoFASecret: jest.fn(),
  enableTwoFA: jest.fn(),
  disableTwoFA: jest.fn()
}));

jest.mock('speakeasy', () => ({
  generateSecret: jest.fn(),
  totp: {
    verify: jest.fn()
  },
  otpauthURL: jest.fn()
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn()
}));

jest.mock('../../../src/config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

const {
  get2FAStatus,
  setup2FA,
  verify2FA,
  disable2FA,
  verify2FALogin,
  generatePending2FAToken
} = require('../../../src/controllers/twofa.controller');
const db = require('../../../src/db/usuarios.db');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');
const { pool } = require('../../../src/config/database');

describe('twofa.controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      auth: null,
      user: { id: 1 },
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
  });

  describe('get2FAStatus', () => {
    it('debe obtener estado 2FA del usuario', async () => {
      const mockUser = {
        id: 1,
        dobleautenticacion: true,
        preferencias: { twofa: { secret_base32: 'ABC123' } }
      };
      db.getById.mockResolvedValueOnce(mockUser);

      await get2FAStatus(mockReq, mockRes);

      expect(db.getById).toHaveBeenCalledWith(1);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        enabled: true,
        hasSecret: true
      });
    });

    it('debe retornar 404 si el usuario no existe', async () => {
      db.getById.mockResolvedValueOnce(null);

      await get2FAStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('debe manejar errores', async () => {
      db.getById.mockRejectedValueOnce(new Error('Database error'));

      await get2FAStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('setup2FA', () => {
    it('debe configurar 2FA exitosamente', async () => {
      const mockUser = { id: 1, email: 'test@test.com' };
      const mockSecret = { base32: 'ABC123' };
      const mockQR = 'data:image/png;base64,...';

      db.getById.mockResolvedValueOnce(mockUser);
      speakeasy.generateSecret.mockReturnValueOnce(mockSecret);
      db.saveTwoFASecret.mockResolvedValueOnce({ rowCount: 1 });
      speakeasy.otpauthURL.mockReturnValueOnce('otpauth://totp/...');
      QRCode.toDataURL.mockResolvedValueOnce(mockQR);

      await setup2FA(mockReq, mockRes);

      expect(db.saveTwoFASecret).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          qrcodeDataURL: mockQR,
          secret: 'ABC123'
        })
      );
    });

    it('debe retornar 401 si no hay usuario autenticado', async () => {
      mockReq.user = null;
      mockReq.auth = null;

      await setup2FA(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('debe retornar 404 si el usuario no existe', async () => {
      db.getById.mockResolvedValueOnce(null);

      await setup2FA(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('debe retornar 500 si no se puede guardar el secreto', async () => {
      const mockUser = { id: 1 };
      db.getById.mockResolvedValueOnce(mockUser);
      speakeasy.generateSecret.mockReturnValueOnce({ base32: 'ABC123' });
      db.saveTwoFASecret.mockResolvedValueOnce({ rowCount: 0 });

      await setup2FA(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('verify2FA', () => {
    it('debe verificar y activar 2FA exitosamente', async () => {
      mockReq.body = { code: '123456' };
      const mockUser = {
        id: 1,
        preferencias: { twofa: { secret_base32: 'ABC123' } }
      };

      db.getById.mockResolvedValueOnce(mockUser);
      speakeasy.totp.verify.mockReturnValueOnce(true);
      db.enableTwoFA.mockResolvedValueOnce({ rowCount: 1 });

      await verify2FA(mockReq, mockRes);

      expect(speakeasy.totp.verify).toHaveBeenCalled();
      expect(db.enableTwoFA).toHaveBeenCalledWith(1);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: '2FA activado correctamente'
      });
    });

    it('debe retornar 400 si falta el código', async () => {
      mockReq.body = {};

      await verify2FA(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('debe retornar 400 si el código es inválido', async () => {
      mockReq.body = { code: '123456' };
      const mockUser = {
        id: 1,
        preferencias: { twofa: { secret_base32: 'ABC123' } }
      };

      db.getById.mockResolvedValueOnce(mockUser);
      speakeasy.totp.verify.mockReturnValueOnce(false);

      await verify2FA(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('disable2FA', () => {
    it('debe desactivar 2FA exitosamente', async () => {
      const mockUser = { id: 1 };
      db.getById.mockResolvedValueOnce(mockUser);
      db.disableTwoFA.mockResolvedValueOnce({ rowCount: 1 });

      await disable2FA(mockReq, mockRes);

      expect(db.disableTwoFA).toHaveBeenCalledWith(1);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: '2FA desactivado correctamente'
      });
    });

    it('debe retornar 404 si el usuario no existe', async () => {
      db.getById.mockResolvedValueOnce(null);

      await disable2FA(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('verify2FALogin', () => {
    it('debe verificar código 2FA en login exitosamente', async () => {
      mockReq.body = { pending2faToken: 'token', code: '123456' };
      const mockPayload = { sub: 1, twofa: 1 };
      const mockUser = {
        id: 1,
        email: 'test@test.com',
        rol_id: 1,
        dobleautenticacion: true,
        preferencias: { twofa: { secret_base32: 'ABC123' } }
      };

      jwt.verify.mockReturnValueOnce(mockPayload);
      db.getById.mockResolvedValueOnce(mockUser);
      speakeasy.totp.verify.mockReturnValueOnce(true);
      pool.query.mockResolvedValueOnce({ rows: [{ name: 'usuario' }] });
      jwt.sign.mockReturnValueOnce('final-token');

      await verify2FALogin(mockReq, mockRes);

      expect(jwt.verify).toHaveBeenCalled();
      expect(speakeasy.totp.verify).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          token: 'final-token'
        })
      );
    });

    it('debe retornar 400 si faltan parámetros', async () => {
      mockReq.body = {};

      await verify2FALogin(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('debe retornar 401 si el token es inválido', async () => {
      mockReq.body = { pending2faToken: 'invalid', code: '123456' };
      jwt.verify.mockReturnValueOnce({ twofa: 0 });

      await verify2FALogin(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('generatePending2FAToken', () => {
    it('debe generar token pendiente de 2FA', () => {
      jwt.sign.mockReturnValueOnce('pending-token');

      const result = generatePending2FAToken(1);

      expect(jwt.sign).toHaveBeenCalledWith(
        { sub: 1, twofa: 1 },
        'test-secret',
        { expiresIn: '5m' }
      );
      expect(result).toBe('pending-token');
    });
  });
});

