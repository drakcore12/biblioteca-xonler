const express = require('express');

// Mock controllers
jest.mock('../../src/controllers/bibliotecas.controller', () => ({
  obtenerBibliotecas: jest.fn((req, res) => res.json({ message: 'obtenerBibliotecas' })),
  obtenerBibliotecaPorId: jest.fn((req, res) => res.json({ message: 'obtenerBibliotecaPorId' })),
  obtenerLibrosPorBiblioteca: jest.fn((req, res) => res.json({ message: 'obtenerLibrosPorBiblioteca' })),
  crearBiblioteca: jest.fn((req, res) => res.json({ message: 'crearBiblioteca' })),
  actualizarBiblioteca: jest.fn((req, res) => res.json({ message: 'actualizarBiblioteca' })),
  eliminarBiblioteca: jest.fn((req, res) => res.json({ message: 'eliminarBiblioteca' }))
}));

const bibliotecasRoutes = require('../../src/routes/bibliotecas.routes');

describe('bibliotecas.routes', () => {
  it('debe tener ruta GET / configurada', () => {
    expect(bibliotecasRoutes.stack).toBeDefined();
    const listRoute = bibliotecasRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/' && layer.route.methods.get
    );
    expect(listRoute).toBeDefined();
  });

  it('debe tener ruta GET /:id configurada', () => {
    const detailRoute = bibliotecasRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/:id' && layer.route.methods.get
    );
    expect(detailRoute).toBeDefined();
  });

  it('debe tener ruta GET /:id/libros configurada', () => {
    const librosRoute = bibliotecasRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/:id/libros' && layer.route.methods.get
    );
    expect(librosRoute).toBeDefined();
  });

  it('debe tener ruta POST / configurada', () => {
    const createRoute = bibliotecasRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/' && layer.route.methods.post
    );
    expect(createRoute).toBeDefined();
  });

  it('debe tener ruta PUT /:id configurada', () => {
    const updateRoute = bibliotecasRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/:id' && layer.route.methods.put
    );
    expect(updateRoute).toBeDefined();
  });

  it('debe tener ruta DELETE /:id configurada', () => {
    const deleteRoute = bibliotecasRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/:id' && layer.route.methods.delete
    );
    expect(deleteRoute).toBeDefined();
  });
});

