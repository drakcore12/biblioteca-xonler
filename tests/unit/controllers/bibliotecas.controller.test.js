// Mock database
jest.mock('../../src/config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

const { obtenerBibliotecas } = require('../../src/controllers/bibliotecas.controller');
const { pool } = require('../../src/config/database');

describe('bibliotecas.controller', () => {
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
    console.error = jest.fn();
  });

  describe('obtenerBibliotecas', () => {
    it('debe obtener todas las bibliotecas sin filtros', async () => {
      const mockBibliotecas = [
        { id: 1, nombre: 'Biblioteca 1', colegio_id: 1 },
        { id: 2, nombre: 'Biblioteca 2', colegio_id: 2 }
      ];

      pool.query
        .mockResolvedValueOnce({ rows: mockBibliotecas })
        .mockResolvedValueOnce({ rows: [{ total: 2 }] });

      await obtenerBibliotecas(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: mockBibliotecas,
          paginacion: expect.objectContaining({
            total: 2
          })
        })
      );
    });

    it('debe filtrar por término de búsqueda', async () => {
      mockReq.query = { q: 'Central' };

      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: 0 }] });

      await obtenerBibliotecas(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        expect.arrayContaining(['%Central%'])
      );
    });

    it('debe filtrar por colegio_id', async () => {
      mockReq.query = { colegio_id: '1' };

      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: 0 }] });

      await obtenerBibliotecas(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('colegio_id'),
        expect.arrayContaining([1])
      );
    });

    it('debe manejar paginación', async () => {
      mockReq.query = { limit: '10', offset: '20' };

      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: 0 }] });

      await obtenerBibliotecas(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        expect.arrayContaining([10, 20])
      );
    });

    it('debe limitar el límite máximo a 100', async () => {
      mockReq.query = { limit: '200' };

      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: 0 }] });

      await obtenerBibliotecas(mockReq, mockRes);

      const limitCall = pool.query.mock.calls[0];
      expect(limitCall[1]).toContain(100);
    });

    it('debe manejar errores', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await obtenerBibliotecas(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Error listando bibliotecas'
      });
    });
  });
});

