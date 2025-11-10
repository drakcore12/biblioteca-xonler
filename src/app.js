// src/app.js
const { registerBaseMiddleware } = require('./bootstrap/register-base-middleware');
const { registerRateLimiters } = require('./bootstrap/register-rate-limiters');
const { registerSecurityHeaders } = require('./bootstrap/register-security-headers');
const { registerRoutes } = require('./bootstrap/register-routes');
const { registerErrorHandlers } = require('./bootstrap/register-error-handlers');
const { metricsMiddleware } = require('./middleware/metrics');
const metricsRouter = require('./routes/metrics');

function createApp() {
  const app = require('express')();

  registerBaseMiddleware(app);
  
  // Middleware de métricas (antes de las rutas)
  app.use(metricsMiddleware);
  
  // Endpoint de métricas (antes de otras rutas)
  app.use(metricsRouter);
  
  registerRateLimiters(app);
  registerSecurityHeaders(app);
  registerRoutes(app);
  registerErrorHandlers(app);

  return app;
}

module.exports = { createApp };
