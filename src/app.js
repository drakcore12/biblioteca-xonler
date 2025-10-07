// src/app.js
const { registerBaseMiddleware } = require('./bootstrap/register-base-middleware');
const { registerRateLimiters } = require('./bootstrap/register-rate-limiters');
const { registerSecurityHeaders } = require('./bootstrap/register-security-headers');
const { registerRoutes } = require('./bootstrap/register-routes');
const { registerErrorHandlers } = require('./bootstrap/register-error-handlers');

function createApp() {
  const app = require('express')();

  registerBaseMiddleware(app);
  registerRateLimiters(app);
  registerSecurityHeaders(app);
  registerRoutes(app);
  registerErrorHandlers(app);

  return app;
}

module.exports = { createApp };
