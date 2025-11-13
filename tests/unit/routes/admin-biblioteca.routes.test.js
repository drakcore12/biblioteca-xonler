const express = require('express');

// Mock controllers
jest.mock('../../../src/controllers/admin-biblioteca.controller', () => ({
  obtenerBibliotecaAsignada: jest.fn((req, res) => res.json({ message: 'obtenerBibliotecaAsignada' })),
  obtenerEstadisticasBiblioteca: jest.fn((req, res) => res.json({ message: 'obtenerEstadisticasBiblioteca' })),
  obtenerLibrosBiblioteca: jest.fn((req, res) => res.json({ message: 'obtenerLibrosBiblioteca' })),
  agregarLibroABiblioteca: jest.fn((req, res) => res.json({ message: 'agregarLibroABiblioteca' })),
  removerLibroDeBiblioteca: jest.fn((req, res) => res.json({ message: 'removerLibroDeBiblioteca' })),
  crearLibro: jest.fn((req, res) => res.json({ message: 'crearLibro' })),
  obtenerPrestamosBiblioteca: jest.fn((req, res) => res.json({ message: 'obtenerPrestamosBiblioteca' })),
  marcarPrestamoDevuelto: jest.fn((req, res) => res.json({ message: 'marcarPrestamoDevuelto' }))
}));

// Mock middleware
jest.mock('../../../src/middleware/hybrid-auth', () => ({
  hybridAuth: jest.fn((req, res, next) => next())
}));

jest.mock('../../../src/middleware/auth', () => ({
  requireRole: jest.fn(() => (req, res, next) => next())
}));

const adminBibliotecaRoutes = require('../../../src/routes/admin-biblioteca.routes');

describe('admin-biblioteca.routes', () => {
  it('debe tener ruta GET /biblioteca configurada', () => {
    expect(adminBibliotecaRoutes.stack).toBeDefined();
    const bibliotecaRoute = adminBibliotecaRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/biblioteca' && layer.route.methods.get
    );
    expect(bibliotecaRoute).toBeDefined();
  });

  it('debe tener ruta GET /estadisticas configurada', () => {
    const estadisticasRoute = adminBibliotecaRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/estadisticas' && layer.route.methods.get
    );
    expect(estadisticasRoute).toBeDefined();
  });

  it('debe tener ruta GET /libros configurada', () => {
    const librosRoute = adminBibliotecaRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/libros' && layer.route.methods.get
    );
    expect(librosRoute).toBeDefined();
  });

  it('debe tener ruta POST /libros configurada', () => {
    const agregarLibroRoute = adminBibliotecaRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/libros' && layer.route.methods.post
    );
    expect(agregarLibroRoute).toBeDefined();
  });

  it('debe tener ruta POST /libros/crear configurada', () => {
    const crearLibroRoute = adminBibliotecaRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/libros/crear' && layer.route.methods.post
    );
    expect(crearLibroRoute).toBeDefined();
  });

  it('debe tener ruta DELETE /libros/:biblioteca_libro_id configurada', () => {
    const removerLibroRoute = adminBibliotecaRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/libros/:biblioteca_libro_id' && layer.route.methods.delete
    );
    expect(removerLibroRoute).toBeDefined();
  });

  it('debe tener ruta GET /prestamos configurada', () => {
    const prestamosRoute = adminBibliotecaRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/prestamos' && layer.route.methods.get
    );
    expect(prestamosRoute).toBeDefined();
  });

  it('debe tener ruta PATCH /prestamos/:prestamo_id/devolver configurada', () => {
    const devolverRoute = adminBibliotecaRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/prestamos/:prestamo_id/devolver' && layer.route.methods.patch
    );
    expect(devolverRoute).toBeDefined();
  });
});

