// Mock database
jest.mock('../../src/config/database', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn()
  }
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn()
}));

const {
  eliminarUsuarioCompleto
} = require('../../src/controllers/usuarios.controller');
const { pool } = require('../../src/config/database');

describe('usuarios.controller - casos completos', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      params: {},
      headers: {},
      user: null
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  describe('eliminarUsuarioCompleto - casos de error', () => {
    it('debe manejar error de foreign key constraint', async () => {
      mockReq.params.id = '1';
      const error = new Error('Foreign key violation');
      error.code = '23503';
      error.constraint = 'fk_prestamos_usuario';
      error.detail = 'Key (id)=(1) is still referenced from table "prestamos"';

      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1, nombre: 'Juan', email: 'juan@test.com' }] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      pool.connect.mockResolvedValueOnce(mockClient);

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockRejectedValueOnce(error);

      await eliminarUsuarioCompleto(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'FOREIGN_KEY_VIOLATION'
        })
      );
    });

    it('debe manejar error de not null constraint', async () => {
      mockReq.params.id = '1';
      const error = new Error('Not null violation');
      error.code = '23502';

      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      pool.connect.mockResolvedValueOnce(mockClient);

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockRejectedValueOnce(error);

      await eliminarUsuarioCompleto(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'NOT_NULL_VIOLATION'
        })
      );
    });

    it('debe manejar error de unique constraint', async () => {
      mockReq.params.id = '1';
      const error = new Error('Unique violation');
      error.code = '23505';

      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      pool.connect.mockResolvedValueOnce(mockClient);

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockRejectedValueOnce(error);

      await eliminarUsuarioCompleto(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'UNIQUE_VIOLATION'
        })
      );
    });

    it('debe manejar error general', async () => {
      mockReq.params.id = '1';
      const error = new Error('General error');
      error.code = 'GENERAL_ERROR';

      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      pool.connect.mockResolvedValueOnce(mockClient);

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockRejectedValueOnce(error);

      await eliminarUsuarioCompleto(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'GENERAL_ERROR'
        })
      );
    });
  });
});

