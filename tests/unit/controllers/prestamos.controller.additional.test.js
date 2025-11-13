// Mock database
jest.mock('../../src/config/database', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn()
  }
}));

const {
  obtenerPrestamos
} = require('../../src/controllers/prestamos.controller');
const { pool } = require('../../src/config/database');

describe('prestamos.controller - casos adicionales', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      query: {},
      params: {},
      body: {},
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

  describe('buildPrestamosFilters - casos edge', () => {
    test('debe filtrar por activo=false', async () => {
      mockReq.query = { activo: 'false' };

      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await obtenerPrestamos(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('fecha_devolucion IS NOT NULL'),
        expect.any(Array)
      );
    });

    test('debe filtrar por fecha_desde', async () => {
      mockReq.query = { fecha_desde: '2024-01-01' };

      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await obtenerPrestamos(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('fecha_prestamo >= $'),
        expect.arrayContaining(['2024-01-01'])
      );
    });

    test('debe filtrar por fecha_hasta', async () => {
      mockReq.query = { fecha_hasta: '2024-12-31' };

      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await obtenerPrestamos(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('fecha_prestamo <= $'),
        expect.arrayContaining(['2024-12-31'])
      );
    });

    test('debe filtrar por múltiples filtros', async () => {
      mockReq.query = {
        usuario_id: '1',
        biblioteca_id: '2',
        activo: 'true',
        fecha_desde: '2024-01-01',
        fecha_hasta: '2024-12-31'
      };

      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await obtenerPrestamos(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE'),
        expect.any(Array)
      );
    });

    test('debe manejar errores', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await obtenerPrestamos(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});

