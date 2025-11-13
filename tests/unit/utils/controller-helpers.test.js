// Mock database
jest.mock('../../src/config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

// Mock http-response
jest.mock('../../src/utils/http-response', () => ({
  success: jest.fn((res, data) => res.status(200).json(data)),
  notFound: jest.fn((res, message) => res.status(404).json({ error: message })),
  error: jest.fn((res, message) => res.status(500).json({ error: message }))
}));

// Mock error-handler - debe devolver una función middleware
jest.mock('../../src/utils/error-handler', () => ({
  asyncHandler: (fn) => {
    // asyncHandler devuelve un middleware (req, res, next)
    // Para los tests, simplemente ejecutamos la función directamente
    return async (req, res, next) => {
      try {
        return await fn(req, res, next);
      } catch (error) {
        if (next) {
          return next(error);
        }
        throw error;
      }
    };
  }
}));

const {
  getAllRecords,
  getRecordById,
  createCrudController
} = require('../../src/utils/controller-helpers');
const { pool } = require('../../src/config/database');
const { success, notFound } = require('../../src/utils/http-response');

describe('controller-helpers', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      params: {},
      query: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getAllRecords', () => {
    it('debe obtener todos los registros de una tabla', async () => {
      const mockRows = [
        { id: 1, name: 'Test 1' },
        { id: 2, name: 'Test 2' }
      ];
      pool.query.mockResolvedValue({ rows: mockRows });

      const controller = getAllRecords('test_table');
      await controller(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM test_table ORDER BY id');
      expect(success).toHaveBeenCalledWith(mockRes, mockRows);
    });

    it('debe usar campos personalizados', async () => {
      const mockRows = [{ id: 1, name: 'Test' }];
      pool.query.mockResolvedValue({ rows: mockRows });

      const controller = getAllRecords('test_table', 'id, name', 'name');
      await controller(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledWith('SELECT id, name FROM test_table ORDER BY name');
    });
  });

  describe('getRecordById', () => {
    it('debe obtener un registro por ID', async () => {
      const mockRow = { id: 1, name: 'Test' };
      pool.query.mockResolvedValue({ rows: [mockRow] });
      mockReq.params.id = '1';

      const controller = getRecordById('test_table');
      await controller(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM test_table WHERE id = $1', ['1']);
      expect(success).toHaveBeenCalledWith(mockRes, mockRow);
    });

    it('debe retornar notFound si no existe el registro', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      mockReq.params.id = '999';

      const controller = getRecordById('test_table');
      await controller(mockReq, mockRes);

      expect(notFound).toHaveBeenCalledWith(mockRes, 'test_table no encontrado');
    });

    it('debe usar campo ID personalizado', async () => {
      const mockRow = { user_id: 1, name: 'Test' };
      pool.query.mockResolvedValue({ rows: [mockRow] });
      mockReq.params.id = '1';

      const controller = getRecordById('test_table', '*', 'user_id');
      await controller(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM test_table WHERE user_id = $1', ['1']);
    });
  });

  describe('createCrudController', () => {
    it('debe crear un controlador CRUD con opciones por defecto', () => {
      const crud = createCrudController('test_table');
      expect(crud).toHaveProperty('getAll');
      expect(crud).toHaveProperty('getById');
      expect(typeof crud.getAll).toBe('function');
      expect(typeof crud.getById).toBe('function');
    });

    it('debe usar opciones personalizadas', async () => {
      const mockRows = [{ id: 1 }];
      pool.query.mockResolvedValue({ rows: mockRows });

      const crud = createCrudController('test_table', {
        selectFields: 'id, name',
        orderBy: 'name',
        idField: 'user_id'
      });

      await crud.getAll(mockReq, mockRes);
      expect(pool.query).toHaveBeenCalledWith('SELECT id, name FROM test_table ORDER BY name');

      mockReq.params.id = '1';
      await crud.getById(mockReq, mockRes);
      expect(pool.query).toHaveBeenCalledWith('SELECT id, name FROM test_table WHERE user_id = $1', ['1']);
    });
  });
});

