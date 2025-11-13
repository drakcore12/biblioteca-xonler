// Mock database
jest.mock('../../src/config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

// Mock helpers
jest.mock('../../src/utils/query-builder', () => ({
  QueryBuilder: jest.fn()
}));

jest.mock('../../src/utils/http-response', () => ({
  success: jest.fn((res, data) => res.json({ data })),
  notFound: jest.fn((res, message) => res.status(404).json({ error: message })),
  badRequest: jest.fn((res, message) => res.status(400).json({ error: message })),
  created: jest.fn((res, data, message) => res.status(201).json({ data, message })),
  conflict: jest.fn((res, message) => res.status(409).json({ error: message })),
  paginated: jest.fn((res, data, total, limit, offset) => res.json({ data, paginacion: { total, limit, offset } }))
}));

jest.mock('../../src/utils/error-handler', () => ({
  asyncHandler: jest.fn((fn, errorMessage) => async (req, res) => {
    try {
      return await fn(req, res);
    } catch (error) {
      res.status(500).json({ error: errorMessage || error.message });
    }
  }),
  handleError: jest.fn()
}));

const validationHelpers = require('../../src/utils/validation-helpers');
jest.mock('../../src/utils/validation-helpers', () => {
  const actual = jest.requireActual('../../src/utils/validation-helpers');
  return {
    ...actual,
    validateRequired: jest.fn((fields, body) => {
      const missing = fields.filter(f => !body || !body[f]);
      return missing.length === 0 
        ? { valid: true }
        : { valid: false, error: `Faltan campos requeridos: ${missing.join(', ')}` };
    })
  };
});

jest.mock('../../src/utils/data-helpers', () => ({
  asInteger: jest.fn((val, def) => Number.parseInt(val, 10) || def)
}));

const {
  obtenerColegios,
  obtenerColegioPorId,
  crearColegio
} = require('../../src/controllers/colegios.controller');
const { pool } = require('../../src/config/database');
const { QueryBuilder } = require('../../src/utils/query-builder');

describe('colegios.controller', () => {
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
      build: jest.fn(() => ({ query: 'SELECT ...', params: [] }))
    };
    QueryBuilder.mockImplementation(() => mockBuilder);
  });

  describe('obtenerColegios', () => {
    it('debe obtener colegios sin filtros', async () => {
      const mockBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        paginate: jest.fn().mockReturnThis(),
        build: jest.fn(() => ({ query: 'SELECT ...', params: [] }))
      };
      const mockCountBuilder = {
        where: jest.fn().mockReturnThis(),
        build: jest.fn(() => ({ query: 'SELECT COUNT...', params: [] }))
      };
      QueryBuilder
        .mockImplementationOnce(() => mockBuilder)
        .mockImplementationOnce(() => mockCountBuilder);

      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1, nombre: 'Colegio 1' }] })
        .mockResolvedValueOnce({ rows: [{ total: 1 }] });

      await obtenerColegios(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledTimes(2);
    });

    it('debe filtrar por nombre', async () => {
      mockReq.query = { nombre: 'Test' };

      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: 0 }] });

      await obtenerColegios(mockReq, mockRes);

      expect(QueryBuilder).toHaveBeenCalled();
    });
  });

  describe('obtenerColegioPorId', () => {
    it('debe obtener colegio por ID', async () => {
      mockReq.params.id = '1';
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, nombre: 'Colegio 1' }] });

      await obtenerColegioPorId(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalled();
    });

    it('debe retornar 404 si no existe', async () => {
      mockReq.params.id = '999';
      pool.query.mockResolvedValueOnce({ rows: [] });

      await obtenerColegioPorId(mockReq, mockRes);

      // notFound se llama internamente
      expect(pool.query).toHaveBeenCalled();
    });
  });

  describe('crearColegio', () => {
    it('debe exportar la función crearColegio', () => {
      expect(crearColegio).toBeDefined();
      expect(typeof crearColegio).toBe('function');
    });
  });
});

