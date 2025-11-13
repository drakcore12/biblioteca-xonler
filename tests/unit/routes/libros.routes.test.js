const express = require('express');

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

describe('libros.routes', () => {
  it('debe tener ruta GET /test-db configurada', () => {
    expect(librosRoutes.stack).toBeDefined();
    const testDbRoute = librosRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/test-db' && layer.route.methods.get
    );
    expect(testDbRoute).toBeDefined();
  });

  it('debe tener ruta GET /test-table configurada', () => {
    const testTableRoute = librosRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/test-table' && layer.route.methods.get
    );
    expect(testTableRoute).toBeDefined();
  });

  it('debe tener ruta GET /recomendaciones configurada', () => {
    const recomendacionesRoute = librosRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/recomendaciones' && layer.route.methods.get
    );
    expect(recomendacionesRoute).toBeDefined();
  });

  it('debe tener ruta GET / configurada', () => {
    const listRoute = librosRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/' && layer.route.methods.get
    );
    expect(listRoute).toBeDefined();
  });

  it('debe tener ruta GET /:id configurada', () => {
    const detailRoute = librosRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/:id' && layer.route.methods.get
    );
    expect(detailRoute).toBeDefined();
  });
});

