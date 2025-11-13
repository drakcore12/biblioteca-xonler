const express = require('express');

// Mock controllers
jest.mock('../../../src/controllers/prestamos.controller', () => ({
  obtenerPrestamos: jest.fn((req, res) => res.json({ message: 'obtenerPrestamos' })),
  obtenerPrestamoPorId: jest.fn((req, res) => res.json({ message: 'obtenerPrestamoPorId' })),
  crearPrestamo: jest.fn((req, res) => res.json({ message: 'crearPrestamo' })),
  marcarDevolucion: jest.fn((req, res) => res.json({ message: 'marcarDevolucion' })),
  renovarPrestamo: jest.fn((req, res) => res.json({ message: 'renovarPrestamo' })),
  obtenerPrestamosUsuarioActual: jest.fn((req, res) => res.json({ message: 'obtenerPrestamosUsuarioActual' }))
}));

// Mock middleware
jest.mock('../../../src/middleware/hybrid-auth', () => ({
  hybridAuth: jest.fn((req, res, next) => next())
}));

// Mock database
jest.mock('../../../src/config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

const prestamosRoutes = require('../../../src/routes/prestamos.routes');
const { pool } = require('../../../src/config/database');

describe('prestamos.routes', () => {
  it('debe tener ruta GET /test configurada', () => {
    expect(prestamosRoutes.stack).toBeDefined();
    const testRoute = prestamosRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/test' && layer.route.methods.get
    );
    expect(testRoute).toBeDefined();
  });

  it('debe tener ruta GET /test-db configurada', () => {
    const testDbRoute = prestamosRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/test-db' && layer.route.methods.get
    );
    expect(testDbRoute).toBeDefined();
  });

  it('debe tener ruta GET /usuario/actual configurada', () => {
    const usuarioRoute = prestamosRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/usuario/actual' && layer.route.methods.get
    );
    expect(usuarioRoute).toBeDefined();
  });

  it('debe tener ruta GET / configurada', () => {
    const listRoute = prestamosRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/' && layer.route.methods.get
    );
    expect(listRoute).toBeDefined();
  });

  it('debe tener ruta GET /:id configurada', () => {
    const detailRoute = prestamosRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/:id' && layer.route.methods.get
    );
    expect(detailRoute).toBeDefined();
  });

  it('debe tener ruta POST / configurada', () => {
    const createRoute = prestamosRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/' && layer.route.methods.post
    );
    expect(createRoute).toBeDefined();
  });

  it('debe tener ruta POST /:id/devolucion configurada', () => {
    const devolucionRoute = prestamosRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/:id/devolucion' && layer.route.methods.post
    );
    expect(devolucionRoute).toBeDefined();
  });

  it('debe tener ruta POST /:id/renovar configurada', () => {
    const renovarRoute = prestamosRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/:id/renovar' && layer.route.methods.post
    );
    expect(renovarRoute).toBeDefined();
  });
});

