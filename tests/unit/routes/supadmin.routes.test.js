const express = require('express');

// Mock controller
jest.mock('../../src/controllers/supadmin.controller', () => ({
  obtenerEstadisticasGlobales: jest.fn((req, res) => res.json({ message: 'obtenerEstadisticasGlobales' })),
  obtenerActividadReciente: jest.fn((req, res) => res.json({ message: 'obtenerActividadReciente' })),
  obtenerLogs: jest.fn((req, res) => res.json({ message: 'obtenerLogs' }))
}));

// Mock middleware
jest.mock('../../src/middleware/auth', () => ({
  auth: jest.fn((req, res, next) => next()),
  requireRole: jest.fn(() => (req, res, next) => next())
}));

const supadminRoutes = require('../../src/routes/supadmin.routes');

describe('supadmin.routes', () => {
  it('debe tener ruta GET /estadisticas configurada', () => {
    expect(supadminRoutes.stack).toBeDefined();
    const estadisticasRoute = supadminRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/estadisticas' && layer.route.methods.get
    );
    expect(estadisticasRoute).toBeDefined();
  });

  it('debe tener ruta GET /actividad configurada', () => {
    const actividadRoute = supadminRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/actividad' && layer.route.methods.get
    );
    expect(actividadRoute).toBeDefined();
  });

  it('debe tener ruta GET /logs configurada', () => {
    const logsRoute = supadminRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/logs' && layer.route.methods.get
    );
    expect(logsRoute).toBeDefined();
  });
});

