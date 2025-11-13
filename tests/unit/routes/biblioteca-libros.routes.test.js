const express = require('express');

// Mock controllers
jest.mock('../../src/controllers/biblioteca-libros.controller', () => ({
  obtenerBibliotecaLibros: jest.fn((req, res) => res.json({ message: 'obtenerBibliotecaLibros' })),
  obtenerBibliotecaLibroPorId: jest.fn((req, res) => res.json({ message: 'obtenerBibliotecaLibroPorId' })),
  crearBibliotecaLibro: jest.fn((req, res) => res.json({ message: 'crearBibliotecaLibro' })),
  eliminarBibliotecaLibro: jest.fn((req, res) => res.json({ message: 'eliminarBibliotecaLibro' })),
  verificarDisponibilidad: jest.fn((req, res) => res.json({ message: 'verificarDisponibilidad' }))
}));

const bibliotecaLibrosRoutes = require('../../src/routes/biblioteca-libros.routes');

describe('biblioteca-libros.routes', () => {
  it('debe tener ruta GET / configurada', () => {
    expect(bibliotecaLibrosRoutes.stack).toBeDefined();
    const listRoute = bibliotecaLibrosRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/' && layer.route.methods.get
    );
    expect(listRoute).toBeDefined();
  });

  it('debe tener ruta GET /:id configurada', () => {
    const detailRoute = bibliotecaLibrosRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/:id' && layer.route.methods.get
    );
    expect(detailRoute).toBeDefined();
  });

  it('debe tener ruta POST / configurada', () => {
    const createRoute = bibliotecaLibrosRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/' && layer.route.methods.post
    );
    expect(createRoute).toBeDefined();
  });

  it('debe tener ruta DELETE /:id configurada', () => {
    const deleteRoute = bibliotecaLibrosRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/:id' && layer.route.methods.delete
    );
    expect(deleteRoute).toBeDefined();
  });

  it('debe tener ruta GET /:id/disponibilidad configurada', () => {
    const disponibilidadRoute = bibliotecaLibrosRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/:id/disponibilidad' && layer.route.methods.get
    );
    expect(disponibilidadRoute).toBeDefined();
  });
});

