// Mock database
jest.mock('../../../src/config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

// Mock logger para evitar dependencia circular con simple-encryption
jest.mock('../../../src/config/logger', () => ({
  logError: jest.fn(),
  logInfo: jest.fn(),
  logWarning: jest.fn(),
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

// Mock simple-jwt
jest.mock('../../../src/utils/simple-jwt', () => ({
  verifyToken: jest.fn()
}));

const {
  me
} = require('../../../src/controllers/auth.controller');
const { pool } = require('../../../src/config/database');
const simpleJWT = require('../../../src/utils/simple-jwt');

describe('auth.controller - me', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      user: { id: 1 }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  describe('me - casos edge', () => {
    it('debe retornar usuario si existe', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          nombre: 'Juan',
          email: 'test@test.com',
          rol: 'usuario',
          rol_id: 1
        }]
      });

      await me(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('debe retornar 404 si el usuario no existe', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await me(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Usuario no encontrado' });
    });

    it('debe retornar 500 si hay error en la base de datos', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await me(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(console.error).toHaveBeenCalled();
    });

    it('debe retornar 500 si req.user no existe', async () => {
      mockReq.user = null;

      await me(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});

