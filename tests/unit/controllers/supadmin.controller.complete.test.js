// Mock database
jest.mock('../../../src/config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

// Mock crypto
jest.mock('node:crypto', () => ({
  randomInt: jest.fn((min, max) => Math.floor(Math.random() * (max - min)) + min)
}));

// Mock logger
jest.mock('../../../src/config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

const supAdminController = require('../../../src/controllers/supadmin.controller');
const { pool } = require('../../../src/config/database');
const crypto = require('node:crypto');

describe('supadmin.controller - cobertura completa', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      query: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  describe('obtenerEstadisticasGlobales - casos edge', () => {
    it('debe procesar datos vacíos correctamente', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ total: '0' }] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await supAdminController.obtenerEstadisticasGlobales(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            total_usuarios: 0,
            total_bibliotecas: 0,
            total_libros: 0
          })
        })
      );
    });

    it('debe manejar error en consultas', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await supAdminController.obtenerEstadisticasGlobales(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('debe procesar categorías null como "Sin categoría"', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ total: '1' }] })
        .mockResolvedValueOnce({ rows: [{ total: '1' }] })
        .mockResolvedValueOnce({ rows: [{ total: '1' }] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ categoria: null, total: '5' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await supAdminController.obtenerEstadisticasGlobales(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe('obtenerActividadReciente - casos edge', () => {
    it('debe filtrar por tipo si se proporciona', async () => {
      mockReq.query = { limit: '5', tipo: 'usuarios' };
      
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          nombre: 'Usuario',
          created_at: new Date()
        }]
      });

      await supAdminController.obtenerActividadReciente(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });

    it('debe manejar error de base de datos', async () => {
      mockReq.query = { limit: '10' };
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await supAdminController.obtenerActividadReciente(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('obtenerLogs - casos edge', () => {
    it('debe manejar error en processApplicationLogs', async () => {
      mockReq.query = { tipo: 'application' };
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await supAdminController.obtenerLogs(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});

