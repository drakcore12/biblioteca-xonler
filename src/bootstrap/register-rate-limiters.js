const rateLimit = require('express-rate-limit');
const { env } = require('../config/env');

function createGeneralLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.nodeEnv === 'production' ? 100 : 1000,
    message: {
      error: 'Demasiadas peticiones',
      message: 'Has excedido el límite de peticiones. Intenta de nuevo en 15 minutos.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

function shouldSkipStaticResources(req) {
  return (
    req.path.startsWith('/css/') ||
    req.path.startsWith('/js/') ||
    req.path.startsWith('/assets/') ||
    req.path.startsWith('/services/') ||
    req.path.endsWith('.css') ||
    req.path.endsWith('.js') ||
    req.path.endsWith('.jpg') ||
    req.path.endsWith('.png') ||
    req.path.endsWith('.ico')
  );
}

function shouldSkipHealthChecks(req) {
  return (
    req.path === '/health' ||
    req.path === '/api/health' ||
    req.path === '/metrics'
  );
}

function registerRateLimiters(app) {
  const generalLimiter = createGeneralLimiter();

  app.use((req, res, next) => {
    // Excluir recursos estáticos y health checks del rate limiting
    if (shouldSkipStaticResources(req) || shouldSkipHealthChecks(req)) {
      return next();
    }
    return generalLimiter(req, res, next);
  });
}

module.exports = { registerRateLimiters };
