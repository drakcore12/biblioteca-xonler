const express = require('express');

// Mock controllers
jest.mock('../../../src/controllers/auth.controller', () => ({
  register: jest.fn((req, res) => res.json({ message: 'register' })),
  login: jest.fn((req, res) => res.json({ message: 'login' })),
  me: jest.fn((req, res) => res.json({ message: 'me' })),
  refresh: jest.fn((req, res) => res.json({ message: 'refresh' })),
  logout: jest.fn((req, res) => res.json({ message: 'logout' })),
  forgotPassword: jest.fn((req, res) => res.json({ message: 'forgotPassword' })),
  verifyResetToken: jest.fn((req, res) => res.json({ message: 'verifyResetToken' })),
  resetPassword: jest.fn((req, res) => res.json({ message: 'resetPassword' }))
}));

// Mock middleware
jest.mock('../../../src/middleware/hybrid-auth', () => ({
  hybridAuth: jest.fn((req, res, next) => next())
}));

const authRoutes = require('../../../src/routes/auth.routes');

describe('auth.routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/auth', authRoutes);
    jest.clearAllMocks();
  });

  it('debe tener ruta POST /register configurada', () => {
    expect(authRoutes.stack).toBeDefined();
    const registerRoute = authRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/register' && layer.route.methods.post
    );
    expect(registerRoute).toBeDefined();
  });

  it('debe tener ruta POST /login configurada', () => {
    const loginRoute = authRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/login' && layer.route.methods.post
    );
    expect(loginRoute).toBeDefined();
  });

  it('debe tener ruta GET /me configurada', () => {
    const meRoute = authRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/me' && layer.route.methods.get
    );
    expect(meRoute).toBeDefined();
  });

  it('debe tener ruta POST /refresh configurada', () => {
    const refreshRoute = authRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/refresh' && layer.route.methods.post
    );
    expect(refreshRoute).toBeDefined();
  });

  it('debe tener ruta POST /logout configurada', () => {
    const logoutRoute = authRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/logout' && layer.route.methods.post
    );
    expect(logoutRoute).toBeDefined();
  });

  it('debe tener ruta POST /forgot-password configurada', () => {
    const forgotRoute = authRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/forgot-password' && layer.route.methods.post
    );
    expect(forgotRoute).toBeDefined();
  });

  it('debe tener ruta POST /verify-reset-token configurada', () => {
    const verifyRoute = authRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/verify-reset-token' && layer.route.methods.post
    );
    expect(verifyRoute).toBeDefined();
  });

  it('debe tener ruta POST /reset-password configurada', () => {
    const resetRoute = authRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/reset-password' && layer.route.methods.post
    );
    expect(resetRoute).toBeDefined();
  });
});

