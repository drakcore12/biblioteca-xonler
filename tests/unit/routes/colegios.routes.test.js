const express = require('express');

// Mock controllers
jest.mock('../../../src/controllers/colegios.controller', () => ({
  obtenerColegios: jest.fn((req, res) => res.json({ message: 'obtenerColegios' })),
  obtenerColegioPorId: jest.fn((req, res) => res.json({ message: 'obtenerColegioPorId' })),
  crearColegio: jest.fn((req, res) => res.json({ message: 'crearColegio' })),
  actualizarColegio: jest.fn((req, res) => res.json({ message: 'actualizarColegio' })),
  eliminarColegio: jest.fn((req, res) => res.json({ message: 'eliminarColegio' }))
}));

const colegiosRoutes = require('../../../src/routes/colegios.routes');

describe('colegios.routes', () => {
  it('debe tener ruta GET / configurada', () => {
    expect(colegiosRoutes.stack).toBeDefined();
    const listRoute = colegiosRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/' && layer.route.methods.get
    );
    expect(listRoute).toBeDefined();
  });

  it('debe tener ruta GET /:id configurada', () => {
    const detailRoute = colegiosRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/:id' && layer.route.methods.get
    );
    expect(detailRoute).toBeDefined();
  });

  it('debe tener ruta POST / configurada', () => {
    const createRoute = colegiosRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/' && layer.route.methods.post
    );
    expect(createRoute).toBeDefined();
  });

  it('debe tener ruta PUT /:id configurada', () => {
    const updateRoute = colegiosRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/:id' && layer.route.methods.put
    );
    expect(updateRoute).toBeDefined();
  });

  it('debe tener ruta DELETE /:id configurada', () => {
    const deleteRoute = colegiosRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/:id' && layer.route.methods.delete
    );
    expect(deleteRoute).toBeDefined();
  });
});

