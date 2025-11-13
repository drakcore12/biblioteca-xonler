const express = require('express');

// Mock controllers
jest.mock('../../src/controllers/usuarios.controller', () => ({
  obtenerUsuarios: jest.fn((req, res) => res.json({ message: 'obtenerUsuarios' })),
  obtenerUsuarioActual: jest.fn((req, res) => res.json({ message: 'obtenerUsuarioActual' })),
  obtenerUsuarioPorId: jest.fn((req, res) => res.json({ message: 'obtenerUsuarioPorId' })),
  crearUsuario: jest.fn((req, res) => res.json({ message: 'crearUsuario' })),
  actualizarUsuario: jest.fn((req, res) => res.json({ message: 'actualizarUsuario' })),
  actualizarUsuarioActual: jest.fn((req, res) => res.json({ message: 'actualizarUsuarioActual' })),
  actualizarUsuarioCompleto: jest.fn((req, res) => res.json({ message: 'actualizarUsuarioCompleto' })),
  eliminarUsuario: jest.fn((req, res) => res.json({ message: 'eliminarUsuario' })),
  eliminarUsuarioCompleto: jest.fn((req, res) => res.json({ message: 'eliminarUsuarioCompleto' })),
  loginUsuario: jest.fn((req, res) => res.json({ message: 'loginUsuario' })),
  cambiarPasswordUsuario: jest.fn((req, res) => res.json({ message: 'cambiarPasswordUsuario' })),
  actualizarPreferenciasUsuario: jest.fn((req, res) => res.json({ message: 'actualizarPreferenciasUsuario' }))
}));

// Mock middleware
jest.mock('../../src/middleware/hybrid-auth', () => ({
  hybridAuth: jest.fn((req, res, next) => next())
}));

const usuariosRoutes = require('../../src/routes/usuarios.routes');

describe('usuarios.routes', () => {
  it('debe tener ruta GET / configurada', () => {
    expect(usuariosRoutes.stack).toBeDefined();
    const listRoute = usuariosRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/' && layer.route.methods.get
    );
    expect(listRoute).toBeDefined();
  });

  it('debe tener ruta GET /me configurada', () => {
    const meRoute = usuariosRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/me' && layer.route.methods.get
    );
    expect(meRoute).toBeDefined();
  });

  it('debe tener ruta PUT /me configurada', () => {
    const updateMeRoute = usuariosRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/me' && layer.route.methods.put
    );
    expect(updateMeRoute).toBeDefined();
  });

  it('debe tener ruta GET /:id configurada', () => {
    const detailRoute = usuariosRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/:id' && layer.route.methods.get
    );
    expect(detailRoute).toBeDefined();
  });

  it('debe tener ruta POST / configurada', () => {
    const createRoute = usuariosRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/' && layer.route.methods.post
    );
    expect(createRoute).toBeDefined();
  });

  it('debe tener ruta PUT /:id configurada', () => {
    const updateRoute = usuariosRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/:id' && layer.route.methods.put
    );
    expect(updateRoute).toBeDefined();
  });

  it('debe tener ruta DELETE /:id configurada', () => {
    const deleteRoute = usuariosRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/:id' && layer.route.methods.delete
    );
    expect(deleteRoute).toBeDefined();
  });
});

