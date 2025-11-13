// Mock database
jest.mock('../../src/config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

// Mock middleware
jest.mock('../../src/middleware/hybrid-auth', () => ({
  hybridAuth: jest.fn((req, res, next) => next())
}));

const prestamosRoutes = require('../../src/routes/prestamos.routes');
const { pool } = require('../../src/config/database');

describe('prestamos.routes - rutas inline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  describe('GET /test', () => {
    it('debe tener ruta configurada', () => {
      const route = prestamosRoutes.stack.find(layer => 
        layer.route && layer.route.path === '/test' && layer.route.methods.get
      );
      expect(route).toBeDefined();
    });
  });

  describe('GET /test-db', () => {
    it('debe tener ruta configurada', () => {
      const route = prestamosRoutes.stack.find(layer => 
        layer.route && layer.route.path === '/test-db' && layer.route.methods.get
      );
      expect(route).toBeDefined();
    });
  });
});

