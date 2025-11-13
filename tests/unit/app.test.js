// Mock de todas las dependencias (estas se pueden hacer con jest.mock normal)
jest.mock('../../src/bootstrap/register-base-middleware', () => ({
  registerBaseMiddleware: jest.fn()
}));

jest.mock('../../src/bootstrap/register-rate-limiters', () => ({
  registerRateLimiters: jest.fn()
}));

jest.mock('../../src/bootstrap/register-security-headers', () => ({
  registerSecurityHeaders: jest.fn()
}));

jest.mock('../../src/bootstrap/register-routes', () => ({
  registerRoutes: jest.fn()
}));

jest.mock('../../src/bootstrap/register-error-handlers', () => ({
  registerErrorHandlers: jest.fn()
}));

jest.mock('../../src/middleware/metrics', () => ({
  metricsMiddleware: jest.fn((req, res, next) => next())
}));

const mockRouter = {
  use: jest.fn(),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn()
};

jest.mock('../../src/routes/metrics', () => mockRouter);

// Mock de logger para evitar errores
jest.mock('../../src/config/logger', () => ({
  requestLogger: jest.fn((req, res, next) => next()),
  encryptedLogger: {
    getLogger: jest.fn(() => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    }))
  }
}));

describe('app.js', () => {
  let mockApp;
  let createApp;
  let registerBaseMiddleware;
  let registerRateLimiters;
  let registerSecurityHeaders;
  let registerRoutes;
  let registerErrorHandlers;
  let metricsMiddleware;
  let express;

  beforeEach(() => {
    // Crear una nueva instancia de mockApp para cada test
    mockApp = {
      use: jest.fn(),
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      listen: jest.fn()
    };

    // Limpiar el caché del módulo para que el mock se aplique
    jest.resetModules();

    // Configurar el mock de Express ANTES de cargar app.js
    jest.doMock('express', () => {
      const expressFn = jest.fn(() => mockApp);
      expressFn.Router = jest.fn(() => mockRouter);
      expressFn.json = jest.fn(() => (req, res, next) => next());
      expressFn.static = jest.fn(() => (req, res, next) => next());
      return expressFn;
    });

    // Cargar el módulo DENTRO del beforeEach después del mock
    ({ createApp } = require('../../src/app'));
    express = require('express');

    // Obtener referencias a los mocks
    registerBaseMiddleware = require('../../src/bootstrap/register-base-middleware').registerBaseMiddleware;
    registerRateLimiters = require('../../src/bootstrap/register-rate-limiters').registerRateLimiters;
    registerSecurityHeaders = require('../../src/bootstrap/register-security-headers').registerSecurityHeaders;
    registerRoutes = require('../../src/bootstrap/register-routes').registerRoutes;
    registerErrorHandlers = require('../../src/bootstrap/register-error-handlers').registerErrorHandlers;
    metricsMiddleware = require('../../src/middleware/metrics').metricsMiddleware;

    jest.clearAllMocks();
  });

  describe('createApp', () => {
    it('debe crear una instancia de Express', () => {
      createApp();
      
      expect(express).toHaveBeenCalled();
    });

    it('debe registrar el middleware base primero', () => {
      createApp();
      
      expect(registerBaseMiddleware).toHaveBeenCalledWith(mockApp);
    });

    it('debe registrar el middleware de métricas después del middleware base', () => {
      createApp();
      
      // Verificar que metricsMiddleware se llama
      expect(mockApp.use).toHaveBeenCalledWith(metricsMiddleware);
      
      // Verificar que registerBaseMiddleware se llamó
      expect(registerBaseMiddleware).toHaveBeenCalled();
    });

    it('debe registrar el router de métricas después del middleware de métricas', () => {
      createApp();
      
      expect(mockApp.use).toHaveBeenCalledWith(mockRouter);
    });

    it('debe registrar los rate limiters después de las métricas', () => {
      createApp();
      
      expect(registerRateLimiters).toHaveBeenCalledWith(mockApp);
    });

    it('debe registrar los security headers después de los rate limiters', () => {
      createApp();
      
      expect(registerSecurityHeaders).toHaveBeenCalledWith(mockApp);
    });

    it('debe registrar las rutas después de los security headers', () => {
      createApp();
      
      expect(registerRoutes).toHaveBeenCalledWith(mockApp);
    });

    it('debe registrar los error handlers al final', () => {
      createApp();
      
      expect(registerErrorHandlers).toHaveBeenCalledWith(mockApp);
    });

    it('debe retornar la instancia de Express', () => {
      const app = createApp();
      
      expect(app).toBe(mockApp);
    });

    it('debe llamar todas las funciones de registro en el orden correcto', () => {
      createApp();
      
      // Verificar el orden de las llamadas
      expect(registerBaseMiddleware).toHaveBeenCalledWith(mockApp);
      expect(mockApp.use).toHaveBeenCalledWith(metricsMiddleware);
      expect(mockApp.use).toHaveBeenCalledWith(mockRouter);
      expect(registerRateLimiters).toHaveBeenCalledWith(mockApp);
      expect(registerSecurityHeaders).toHaveBeenCalledWith(mockApp);
      expect(registerRoutes).toHaveBeenCalledWith(mockApp);
      expect(registerErrorHandlers).toHaveBeenCalledWith(mockApp);
    });

    it('debe llamar a app.use para metricsMiddleware antes que registerRateLimiters', () => {
      createApp();
      
      // Verificar que metricsMiddleware se usa
      expect(mockApp.use).toHaveBeenCalledWith(metricsMiddleware);
      expect(registerRateLimiters).toHaveBeenCalled();
    });

    it('debe llamar a app.use para metricsRouter antes que registerRateLimiters', () => {
      createApp();
      
      // Verificar que metricsRouter se usa
      expect(mockApp.use).toHaveBeenCalledWith(mockRouter);
      expect(registerRateLimiters).toHaveBeenCalled();
    });

    it('debe llamar a registerBaseMiddleware antes que metricsMiddleware', () => {
      createApp();
      
      // Verificar el orden: registerBaseMiddleware debe llamarse primero
      const baseMiddlewareCallOrder = registerBaseMiddleware.mock.invocationCallOrder[0];
      const metricsUseCallOrder = mockApp.use.mock.invocationCallOrder.find(
        (order, index) => mockApp.use.mock.calls[index][0] === metricsMiddleware
      );
      
      expect(baseMiddlewareCallOrder).toBeLessThan(metricsUseCallOrder);
    });
  });
});
