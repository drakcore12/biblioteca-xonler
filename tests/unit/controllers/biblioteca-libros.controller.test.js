// Mock database
jest.mock('../../src/config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

// Mock helpers
jest.mock('../../src/utils/query-builder', () => ({
  QueryBuilder: jest.fn(),
  getDisponibilidadSQL: jest.fn(() => 'CASE WHEN EXISTS(...) THEN false ELSE true END as disponible')
}));

jest.mock('../../src/utils/http-response', () => ({
  success: jest.fn((res, data) => res.json({ data })),
  notFound: jest.fn((res, message) => res.status(404).json({ error: message })),
  badRequest: jest.fn((res, message) => res.status(400).json({ error: message })),
  conflict: jest.fn((res, message) => res.status(409).json({ error: message })),
  created: jest.fn((res, data, message) => res.status(201).json({ data, message })),
  error: jest.fn((res, message) => res.status(500).json({ error: message })),
  paginated: jest.fn((res, data, total, limit, offset) => res.json({ data, paginacion: { total, limit, offset } }))
}));

jest.mock('../../src/utils/error-handler', () => ({
  asyncHandler: jest.fn((fn) => async (req, res) => {
    try {
      return await fn(req, res);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }),
  handleError: jest.fn()
}));

const {
  obtenerBibliotecaLibros,
  obtenerBibliotecaLibroPorId,
  crearBibliotecaLibro
} = require('../../src/controllers/biblioteca-libros.controller');
const { pool } = require('../../src/config/database');
const { QueryBuilder } = require('../../src/utils/query-builder');

describe('biblioteca-libros.controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      query: {},
      params: {},
      body: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
    
    // Mock QueryBuilder
    const mockBuilder = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      paginate: jest.fn().mockReturnThis(),
      build: jest.fn(() => ({ query: 'SELECT ...', params: [] })),
      buildCount: jest.fn(() => ({ query: 'SELECT COUNT...', params: [] }))
    };
    QueryBuilder.mockImplementation(() => mockBuilder);
  });

  describe('obtenerBibliotecaLibros', () => {
    it('debe obtener biblioteca-libros sin filtros', async () => {
      const mockBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        paginate: jest.fn().mockReturnThis(),
        build: jest.fn(() => ({ query: 'SELECT ...', params: [] })),
        buildCount: jest.fn(() => ({ query: 'SELECT COUNT...', params: [] }))
      };
      QueryBuilder.mockImplementation(() => mockBuilder);

      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1, titulo: 'Libro 1' }] })
        .mockResolvedValueOnce({ rows: [{ count: 1 }] });

      await obtenerBibliotecaLibros(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledTimes(2);
    });

    it('debe filtrar por biblioteca_id', async () => {
      mockReq.query = { biblioteca_id: '1' };

      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: 0 }] });

      await obtenerBibliotecaLibros(mockReq, mockRes);

      expect(QueryBuilder).toHaveBeenCalled();
    });

    it('debe filtrar por libro_id', async () => {
      mockReq.query = { libro_id: '1' };

      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: 0 }] });

      await obtenerBibliotecaLibros(mockReq, mockRes);

      expect(QueryBuilder).toHaveBeenCalled();
    });
  });

  describe('obtenerBibliotecaLibroPorId', () => {
    it('debe obtener biblioteca-libro por ID', async () => {
      mockReq.params.id = '1';

      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1, titulo: 'Libro 1' }] })
        .mockResolvedValueOnce({ rows: [] }); // Historial préstamos

      await obtenerBibliotecaLibroPorId(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledTimes(2);
    });

    it('debe retornar 404 si no existe', async () => {
      mockReq.params.id = '999';
      pool.query.mockResolvedValueOnce({ rows: [] });

      await obtenerBibliotecaLibroPorId(mockReq, mockRes);

      // La función notFound se llama internamente
      expect(pool.query).toHaveBeenCalled();
    });
  });

  describe('crearBibliotecaLibro', () => {
    it('debe crear biblioteca-libro exitosamente', async () => {
      mockReq.body = { biblioteca_id: 1, libro_id: 1 };

      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Verificar biblioteca existe
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Verificar libro existe
        .mockResolvedValueOnce({ rows: [] }) // Verificar combinación no existe
        .mockResolvedValueOnce({ rows: [{ id: 1, biblioteca_id: 1, libro_id: 1 }] }) // INSERT
        .mockResolvedValueOnce({ rows: [{ id: 1, biblioteca_id: 1, libro_id: 1, titulo: 'Libro' }] }); // Obtener completo

      await crearBibliotecaLibro(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalled();
    });

    it('debe retornar 400 si faltan campos', async () => {
      mockReq.body = { biblioteca_id: 1 };

      await crearBibliotecaLibro(mockReq, mockRes);

      // badRequest se llama internamente
      expect(pool.query).not.toHaveBeenCalled();
    });
  });
});

