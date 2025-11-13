const express = require('express');

// Mock controllers
jest.mock('../../src/controllers/twofa.controller', () => ({
  verify2FALogin: jest.fn((req, res) => res.json({ message: 'verify2FALogin' })),
  setup2FA: jest.fn((req, res) => res.json({ message: 'setup2FA' })),
  verify2FA: jest.fn((req, res) => res.json({ message: 'verify2FA' })),
  disable2FA: jest.fn((req, res) => res.json({ message: 'disable2FA' })),
  get2FAStatus: jest.fn((req, res) => res.json({ message: 'get2FAStatus' }))
}));

// Mock middleware
jest.mock('../../src/middleware/hybrid-auth', () => ({
  hybridAuth: jest.fn((req, res, next) => next())
}));

const twofaRoutes = require('../../src/routes/twofa.routes');

describe('twofa.routes', () => {
  it('debe tener ruta POST /login/2fa configurada', () => {
    expect(twofaRoutes.stack).toBeDefined();
    const login2faRoute = twofaRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/login/2fa' && layer.route.methods.post
    );
    expect(login2faRoute).toBeDefined();
  });

  it('debe tener ruta POST /2fa/setup configurada', () => {
    const setupRoute = twofaRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/2fa/setup' && layer.route.methods.post
    );
    expect(setupRoute).toBeDefined();
  });

  it('debe tener ruta POST /2fa/verify configurada', () => {
    const verifyRoute = twofaRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/2fa/verify' && layer.route.methods.post
    );
    expect(verifyRoute).toBeDefined();
  });

  it('debe tener ruta POST /2fa/disable configurada', () => {
    const disableRoute = twofaRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/2fa/disable' && layer.route.methods.post
    );
    expect(disableRoute).toBeDefined();
  });

  it('debe tener ruta GET /2fa/status configurada', () => {
    const statusRoute = twofaRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/2fa/status' && layer.route.methods.get
    );
    expect(statusRoute).toBeDefined();
  });
});

