// Mock database
jest.mock('../../../src/config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

// Mock controller
jest.mock('../../../src/controllers/libros.controller', () => ({
  obtenerRecomendaciones: jest.fn((req, res) => res.json({ message: 'recomendaciones' }))
}));

// Mock middleware
jest.mock('../../../src/middleware/hybrid-auth', () => ({
  hybridAuth: jest.fn((req, res, next) => next())
}));

const librosRoutes = require('../../../src/routes/libros.routes');
const { pool } = require('../../../src/config/database');

describe('libros.routes - rutas inline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  describe('GET /test-db', () => {
    it('debe tener ruta configurada', () => {
      const route = librosRoutes.stack.find(layer => 
        layer.route && layer.route.path === '/test-db' && layer.route.methods.get
      );
      expect(route).toBeDefined();
    });
  });

  describe('GET /test-table', () => {
    it('debe tener ruta configurada', () => {
      const route = librosRoutes.stack.find(layer => 
        layer.route && layer.route.path === '/test-table' && layer.route.methods.get
      );
      expect(route).toBeDefined();
    });
  });
});

