const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { helmetConfig, securityLogger, inputValidator } = require('../middleware/security');
const securityMonitoring = require('../middleware/security-monitoring');
const { requestLogger, encryptedLogger } = require('../config/logger');
const realtimeMonitoring = require('../utils/realtime-monitoring');
const { env } = require('../config/env');

function attachEncryptedLogger(app) {
  // Siempre adjuntar logger encriptado (sin condición)
  app.use((req, _res, next) => {
    req.encryptedLogger = encryptedLogger.getLogger();
    next();
  });
}

function registerSecurityMonitoring(app) {
  const monitoringMiddlewares = [
    'monitorSuspiciousActivity',
    'monitorAuthAttempts',
    'monitorDataChanges',
    'monitorUnauthorizedAccess',
  ];

  for (const method of monitoringMiddlewares) {
    if (typeof securityMonitoring[method] === 'function') {
      app.use(securityMonitoring[method].bind(securityMonitoring));
    }
  }
}

function registerPerformanceMonitoring(app) {
  app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const isError = res.statusCode >= 400;
      realtimeMonitoring.recordRequest(duration, isError);
    });

    next();
  });
}

function registerDebugLogging(app) {
  app.use((req, _res, next) => {
    if (req.method === 'POST') {
      console.log('🔍 [DEBUG] POST Request:', {
        url: req.url,
        contentType: req.get('Content-Type'),
        body: req.body,
        bodyKeys: Object.keys(req.body || {}),
      });
    }
    next();
  });

  app.use((req, _res, next) => {
    console.log(`↗️  ${req.method} ${req.originalUrl}`);
    next();
  });
}

function registerBaseMiddleware(app) {
  app.use(helmetConfig);
  app.use(requestLogger);
  app.use(securityLogger);

  attachEncryptedLogger(app);

  app.use(inputValidator);

  registerSecurityMonitoring(app);
  registerPerformanceMonitoring(app);

  app.use(express.json());
  app.use(cookieParser());

  app.use(
    cors({
      origin: env.frontendUrl,
      credentials: true,
    }),
  );

  registerDebugLogging(app);
}

module.exports = { registerBaseMiddleware };
