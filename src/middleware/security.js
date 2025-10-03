const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Rate limiting para diferentes tipos de endpoints
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true
  });
};

// Rate limiting específico para autenticación
const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutos
  5, // 5 intentos por IP
  'Demasiados intentos de login. Intenta de nuevo en 15 minutos.'
);

// Rate limiting para API general
const apiRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutos
  100, // 100 requests por IP
  'Demasiadas peticiones. Intenta de nuevo en 15 minutos.'
);

// Rate limiting para endpoints sensibles
const sensitiveRateLimit = createRateLimit(
  60 * 60 * 1000, // 1 hora
  10, // 10 requests por IP
  'Límite de peticiones excedido para este endpoint.'
);

// Configuración de Helmet para headers de seguridad
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "https://fonts.googleapis.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdn.jsdelivr.net"
      ],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: [
        "'self'",
        "http://localhost:3000",
        "https://localhost:3000",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com"
      ],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Middleware para logging de seguridad
const securityLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log de requests sospechosos
  const suspiciousPatterns = [
    /\.\.\//, // Path traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection
    /javascript:/i, // JavaScript injection
    /on\w+\s*=/i // Event handlers
  ];
  
  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(req.url) || 
    pattern.test(JSON.stringify(req.body)) ||
    pattern.test(JSON.stringify(req.query))
  );
  
  if (isSuspicious) {
    console.warn('🚨 [SECURITY] Request sospechoso detectado:', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
      body: req.body,
      query: req.query,
      timestamp: new Date().toISOString()
    });
  }
  
  // Log de requests de autenticación
  if (req.path.includes('/auth/')) {
    console.log('🔐 [AUTH] Request de autenticación:', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// Middleware para validación de entrada
const inputValidator = (req, res, next) => {
  // Sanitizar strings básicos
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/[<>]/g, '') // Remover < y >
      .replace(/javascript:/gi, '') // Remover javascript:
      .replace(/on\w+\s*=/gi, '') // Remover event handlers
      .trim();
  };
  
  // Sanitizar body
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    }
  }
  
  // Sanitizar query
  if (req.query && typeof req.query === 'object') {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key]);
      }
    }
  }
  
  next();
};

module.exports = {
  authRateLimit,
  apiRateLimit,
  sensitiveRateLimit,
  helmetConfig,
  securityLogger,
  inputValidator
};
