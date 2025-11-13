// Mock database
jest.mock('../../../src/config/database', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn()
  }
}));

const {
  obtenerPrestamos,
  obtenerPrestamoPorId,
  crearPrestamo,
  marcarDevolucion,
  renovarPrestamo,
  obtenerPrestamosUsuarioActual
} = require('../../../src/controllers/prestamos.controller');
const { pool } = require('../../../src/config/database');

describe('prestamos.controller - cobertura completa', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      user: { id: 1 },
      params: {},
      query: {},
      body: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  describe('buildPrestamosFilters', () => {
    it('debe construir filtros con todos los parámetros', async () => {
      mockReq.query = {
        usuario_id: '1',
        biblioteca_id: '2',
        activo: 'true',
        fecha_desde: '2024-01-01',
        fecha_hasta: '2024-12-31',
        limit: '10',
        offset: '0'
      };
      
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await obtenerPrestamos(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE'),
        expect.arrayContaining(['1', '2', '2024-01-01', '2024-12-31'])
      );
    });

    it('debe manejar activo=false', async () => {
      mockReq.query = { activo: 'false', limit: '10', offset: '0' };
      
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await obtenerPrestamos(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('fecha_devolucion IS NOT NULL'),
        expect.any(Array)
      );
    });
  });

  describe('crearPrestamo - casos edge', () => {
    it('debe manejar error en transacción', async () => {
      mockReq.body = { libro_id: 1 };
      
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      pool.connect.mockResolvedValueOnce(mockClient);
      
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1, disponibilidad: true }] })
        .mockResolvedValueOnce({ rows: [{ biblioteca_libro_id: 1 }] })
        .mockResolvedValueOnce({ rows: [] });

      mockClient.query
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('Transaction error'));

      await crearPrestamo(mockReq, mockRes);

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('marcarDevolucion - casos edge', () => {
    it('debe manejar error al actualizar', async () => {
      mockReq.params.id = '1';
      mockReq.user = { id: 1, rol: 'usuario' };
      
      pool.query
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            usuario_id: 1,
            fecha_devolucion: null
          }]
        })
        .mockRejectedValueOnce(new Error('Database error'));

      await marcarDevolucion(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('renovarPrestamo - casos edge', () => {
    it('debe manejar error al actualizar', async () => {
      mockReq.params.id = '1';
      mockReq.user = { id: 1 };
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 5);
      
      pool.query
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            usuario_id: 1,
            fecha_devolucion: null,
            fecha_prestamo: recentDate.toISOString().split('T')[0]
          }]
        })
        .mockRejectedValueOnce(new Error('Database error'));

      await renovarPrestamo(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});

