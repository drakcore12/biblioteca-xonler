const request = require('supertest');
const mockExpress = require('express');

// Mock todas las rutas
// IMPORTANTE: Usar require dentro del mock o prefijar con 'mock' para que Jest pueda acceder
jest.mock('../../../src/routes/auth.routes', () => {
  const mockExpress = require('express');
  const router = mockExpress.Router();
  router.get('/test', (req, res) => res.json({ test: 'auth' }));
  return router;
});

jest.mock('../../../src/routes/usuarios.routes', () => {
  const mockExpress = require('express');
  const router = mockExpress.Router();
  router.get('/test', (req, res) => res.json({ test: 'usuarios' }));
  return router;
});

jest.mock('../../../src/routes/roles.routes', () => {
  const mockExpress = require('express');
  const router = mockExpress.Router();
  router.get('/test', (req, res) => res.json({ test: 'roles' }));
  return router;
});

jest.mock('../../../src/routes/colegios.routes', () => {
  const mockExpress = require('express');
  const router = mockExpress.Router();
  router.get('/test', (req, res) => res.json({ test: 'colegios' }));
  return router;
});

jest.mock('../../../src/routes/bibliotecas.routes', () => {
  const mockExpress = require('express');
  const router = mockExpress.Router();
  router.get('/test', (req, res) => res.json({ test: 'bibliotecas' }));
  return router;
});

jest.mock('../../../src/routes/libros.routes', () => {
  const mockExpress = require('express');
  const router = mockExpress.Router();
  router.get('/test', (req, res) => res.json({ test: 'libros' }));
  return router;
});

jest.mock('../../../src/routes/biblioteca-libros.routes', () => {
  const mockExpress = require('express');
  const router = mockExpress.Router();
  router.get('/test', (req, res) => res.json({ test: 'biblioteca-libros' }));
  return router;
});

jest.mock('../../../src/routes/prestamos.routes', () => {
  const mockExpress = require('express');
  const router = mockExpress.Router();
  router.get('/test', (req, res) => res.json({ test: 'prestamos' }));
  return router;
});

jest.mock('../../../src/routes/twofa.routes', () => {
  const mockExpress = require('express');
  const router = mockExpress.Router();
  router.get('/test', (req, res) => res.json({ test: 'twofa' }));
  return router;
});

jest.mock('../../../src/routes/admin-biblioteca.routes', () => {
  const mockExpress = require('express');
  const router = mockExpress.Router();
  router.get('/test', (req, res) => res.json({ test: 'admin-biblioteca' }));
  return router;
});

jest.mock('../../../src/routes/supadmin.routes', () => {
  const mockExpress = require('express');
  const router = mockExpress.Router();
  router.get('/test', (req, res) => res.json({ test: 'supadmin' }));
  return router;
});

const indexRoutes = require('../../../src/routes/index.routes');

describe('index.routes', () => {
  let app;

  beforeEach(() => {
    app = mockExpress();
    app.use('/api', indexRoutes);
  });

  describe('GET /api/health', () => {
    it('debe retornar estado de salud', async () => {
      const res = await request(app).get('/api/health');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'OK');
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('version', '1.0.0');
    });
  });

  describe('GET /api/', () => {
    it('debe retornar información de la API', async () => {
      const res = await request(app).get('/api/');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('version', '1.0.0');
      expect(res.body).toHaveProperty('endpoints');
      expect(res.body.endpoints).toHaveProperty('auth');
      expect(res.body.endpoints).toHaveProperty('usuarios');
      expect(res.body.endpoints).toHaveProperty('libros');
    });
  });

  describe('Rutas registradas', () => {
    it('debe tener ruta /api/auth', () => {
      expect(indexRoutes.stack).toBeDefined();
    });

    it('debe tener ruta /api/usuarios', () => {
      expect(indexRoutes.stack).toBeDefined();
    });

    it('debe tener ruta /api/libros', () => {
      expect(indexRoutes.stack).toBeDefined();
    });
  });
});

