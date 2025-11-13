// Mock express - create a real router-like object with stack
const createMockRouter = () => {
  const stack = [];
  const router = {
    stack,
    get: jest.fn((path, ...handlers) => {
      stack.push({
        route: { path, stack: handlers.map(h => ({ handle: h })) },
        path
      });
      return router;
    }),
    post: jest.fn((path, ...handlers) => {
      stack.push({
        route: { path, stack: handlers.map(h => ({ handle: h })) },
        path
      });
      return router;
    }),
    use: jest.fn(() => router)
  };
  return router;
};

jest.mock('express', () => ({
  Router: jest.fn(() => createMockRouter())
}));

// Mock database
jest.mock('../../../src/config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

// Mock controllers
jest.mock('../../../src/controllers/prestamos.controller', () => ({
  obtenerPrestamos: jest.fn(),
  obtenerPrestamoPorId: jest.fn(),
  crearPrestamo: jest.fn(),
  marcarDevolucion: jest.fn(),
  renovarPrestamo: jest.fn(),
  obtenerPrestamosUsuarioActual: jest.fn()
}));

// Mock middleware
jest.mock('../../../src/middleware/hybrid-auth', () => ({
  hybridAuth: jest.fn((req, res, next) => next())
}));

const router = require('../../../src/routes/prestamos.routes');
const { pool } = require('../../../src/config/database');

describe('prestamos.routes - cobertura completa', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      params: {},
      query: {},
      body: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  describe('GET /test', () => {
    it('debe retornar mensaje de test', async () => {
      const route = router.stack.find(r => r.route?.path === '/test');
      expect(route).toBeDefined();
      
      await route.route.stack[0].handle(mockReq, mockRes);
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Rutas de préstamos funcionando'
        })
      );
    });
  });

  describe('GET /test-db', () => {
    it('debe retornar información de base de datos', async () => {
      const route = router.stack.find(r => r.route?.path === '/test-db');
      expect(route).toBeDefined();
      
      pool.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [{ count: '10' }] })
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })
        .mockResolvedValueOnce({ rows: [] });
      
      await route.route.stack[0].handle(mockReq, mockRes);
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'OK',
          counts: expect.objectContaining({
            libros: 10,
            biblioteca_libros: 5
          })
        })
      );
    });

    it('debe manejar error en test-db', async () => {
      const route = router.stack.find(r => r.route?.path === '/test-db');
      
      pool.query.mockRejectedValueOnce(new Error('Database error'));
      
      await route.route.stack[0].handle(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});

