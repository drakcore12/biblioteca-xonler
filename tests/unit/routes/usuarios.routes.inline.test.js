// Mock database
jest.mock('../../src/config/database', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn()
  }
}));

// Mock middleware
jest.mock('../../src/middleware/hybrid-auth', () => ({
  hybridAuth: jest.fn((req, res, next) => {
    req.user = { id: 1 };
    next();
  })
}));

const usuariosRoutes = require('../../src/routes/usuarios.routes');

describe('usuarios.routes - rutas inline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  describe('GET /test', () => {
    it('debe tener ruta configurada', () => {
      const route = usuariosRoutes.stack.find(layer => 
        layer.route && layer.route.path === '/test' && layer.route.methods.get
      );
      expect(route).toBeDefined();
    });
  });

  describe('GET /check/:id', () => {
    it('debe tener ruta configurada', () => {
      const route = usuariosRoutes.stack.find(layer => 
        layer.route && layer.route.path === '/check/:id' && layer.route.methods.get
      );
      expect(route).toBeDefined();
    });
  });

  describe('DELETE /test-delete/:id', () => {
    it('debe tener ruta configurada', () => {
      const route = usuariosRoutes.stack.find(layer => 
        layer.route && layer.route.path === '/test-delete/:id' && layer.route.methods.delete
      );
      expect(route).toBeDefined();
    });
  });
});

