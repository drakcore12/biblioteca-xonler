// Mock speakeasy
jest.mock('speakeasy', () => ({
  generateSecret: jest.fn(),
  totp: {
    verify: jest.fn()
  },
  otpauthURL: jest.fn()
}));

// Mock qrcode
jest.mock('qrcode', () => ({
  toDataURL: jest.fn()
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn()
}));

// Mock database
jest.mock('../../../src/db/usuarios.db', () => ({
  getById: jest.fn(),
  getByEmail: jest.fn(),
  saveTwoFASecret: jest.fn(),
  enableTwoFA: jest.fn(),
  disableTwoFA: jest.fn()
}));

// Mock database pool
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
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');
const db = require('../../../src/db/usuarios.db');

describe('twofa.controller - cobertura completa', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      auth: null,
      user: null,
      body: {},
      params: {}
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

  describe('get2FAStatus - casos edge', () => {
    it('debe usar req.auth.sub si está disponible', async () => {
      mockReq.auth = { sub: 1 };
      db.getById.mockResolvedValueOnce({
        id: 1,
        dobleautenticacion: true,
        preferencias: { twofa: { secret_base32: 'ABC123' } }
      });

      await get2FAStatus(mockReq, mockRes);

      expect(db.getById).toHaveBeenCalledWith(1);
    });

    it('debe usar req.user.id si req.auth no está disponible', async () => {
      mockReq.user = { id: 1 };
      db.getById.mockResolvedValueOnce({
        id: 1,
        dobleautenticacion: false,
        preferencias: {}
      });

      await get2FAStatus(mockReq, mockRes);

      expect(db.getById).toHaveBeenCalledWith(1);
    });
  });

  describe('setup2FA - casos edge', () => {
    it('debe manejar error al generar QR', async () => {
      mockReq.user = { id: 1 };
      db.getById.mockResolvedValueOnce({
        id: 1,
        email: 'test@test.com',
        nombre: 'Test'
      });
      speakeasy.generateSecret.mockReturnValueOnce({ base32: 'ABC123' });
      db.saveTwoFASecret.mockResolvedValueOnce({ rowCount: 1 });
      speakeasy.otpauthURL.mockReturnValueOnce('otpauth://...');
      QRCode.toDataURL.mockRejectedValueOnce(new Error('QR error'));

      await setup2FA(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('debe usar nombre si email no está disponible', async () => {
      mockReq.user = { id: 1 };
      db.getById.mockResolvedValueOnce({
        id: 1,
        nombre: 'Test User'
      });
      speakeasy.generateSecret.mockReturnValueOnce({ base32: 'ABC123' });
      db.saveTwoFASecret.mockResolvedValueOnce({ rowCount: 1 });
      speakeasy.otpauthURL.mockReturnValueOnce('otpauth://...');
      QRCode.toDataURL.mockResolvedValueOnce('data:image/png;base64,...');

      await setup2FA(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe('verify2FA - casos edge', () => {
    it('debe manejar error al verificar código', async () => {
      mockReq.user = { id: 1 };
      mockReq.body = { code: '123456' };
      
      db.getById.mockResolvedValueOnce({
        id: 1,
        preferencias: { twofa: { secret_base32: 'ABC123' } }
      });
      speakeasy.totp.verify.mockImplementationOnce(() => {
        throw new Error('Verify error');
      });

      await verify2FA(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('disable2FA - casos edge', () => {
    it('debe manejar error al desactivar', async () => {
      mockReq.user = { id: 1 };
      
      db.getById.mockResolvedValueOnce({ id: 1 });
      db.disableTwoFA.mockRejectedValueOnce(new Error('Disable error'));

      await disable2FA(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('verify2FALogin - casos edge', () => {
    it('debe manejar error al obtener rol', async () => {
      mockReq.body = { pending2faToken: 'valid-token', code: '123456' };
      
      // Mock JWT verify para retornar payload con sub
      jwt.verify.mockReturnValueOnce({ sub: 1, twofa: 1 });
      
      // Mock db.getById para retornar usuario
      db.getById.mockResolvedValueOnce({
        id: 1,
        email: 'test@test.com',
        rol_id: 1,
        dobleautenticacion: true,
        preferencias: { twofa: { secret_base32: 'ABC123' } }
      });
      
      // Mock speakeasy para verificar código
      speakeasy.totp.verify.mockReturnValueOnce(true);
      
      // Mock pool.query para que falle al obtener rol
      const { pool } = require('../../../src/config/database');
      pool.query.mockRejectedValueOnce(new Error('Role query error'));

      await verify2FALogin(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('generatePending2FAToken', () => {
    it('debe generar token con sub y twofa', () => {
      jwt.sign.mockReturnValueOnce('pending-token');
      
      const token = generatePending2FAToken(1);
      
      expect(jwt.sign).toHaveBeenCalledWith(
        { sub: 1, twofa: 1 },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );
      expect(token).toBe('pending-token');
    });
  });
});

