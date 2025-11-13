// Mock database
jest.mock('../../../src/config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

const supAdminController = require('../../../src/controllers/supadmin.controller');
const { pool } = require('../../../src/config/database');

describe('supadmin.controller - casos adicionales', () => {
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

  describe('obtenerLogs - casos edge', () => {
    it('debe procesar logs de tipo application', async () => {
      mockReq.query = { tipo: 'application' };
      
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1, nombre: 'Usuario', email: 'test@test.com', created_at: new Date() }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, nombre: 'Usuario', updated_at: new Date() }] });

      await supAdminController.obtenerLogs(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });

    it('debe procesar logs de tipo security', async () => {
      mockReq.query = { tipo: 'security' };
      
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          nombre: 'Usuario',
          apellido: 'Test',
          email: 'test@test.com',
          created_at: new Date(),
          rol: 'usuario'
        }]
      });

      await supAdminController.obtenerLogs(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });

    it('debe procesar logs de tipo audit', async () => {
      mockReq.query = { tipo: 'audit' };
      
      const mockDate = new Date();
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          nombre: 'Usuario',
          apellido: 'Test',
          email: 'test@test.com',
          created_at: mockDate,
          updated_at: new Date(mockDate.getTime() + 1000),
          rol: 'usuario'
        }]
      });

      await supAdminController.obtenerLogs(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });

    it('debe procesar logs de tipo error', async () => {
      mockReq.query = { tipo: 'error' };

      await supAdminController.obtenerLogs(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });

    it('debe filtrar por nivel', async () => {
      mockReq.query = { tipo: 'error', nivel: 'error' };

      await supAdminController.obtenerLogs(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });

    it('debe filtrar por fecha_desde', async () => {
      mockReq.query = { tipo: 'error', fecha_desde: '2024-01-01' };

      await supAdminController.obtenerLogs(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });

    it('debe filtrar por fecha_hasta', async () => {
      mockReq.query = { tipo: 'error', fecha_hasta: '2024-12-31' };

      await supAdminController.obtenerLogs(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });

    it('debe aplicar paginación', async () => {
      mockReq.query = { tipo: 'error', limit: '10', offset: '20' };

      await supAdminController.obtenerLogs(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 20
        })
      );
    });
  });
});

