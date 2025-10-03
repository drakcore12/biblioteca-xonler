// src/app.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { 
  authRateLimit, 
  apiRateLimit, 
  sensitiveRateLimit, 
  helmetConfig, 
  securityLogger, 
  inputValidator 
} = require('./middleware/security');
const { requestLogger } = require('./config/logger');
const { encryptedLogger } = require('./config/encrypted-logger');
const securityMonitoring = require('./middleware/security-monitoring');
const jwtRotation = require('./utils/jwt-rotation');
const securityAlerts = require('./utils/security-alerts');
const logBackup = require('./utils/log-backup');
const realtimeMonitoring = require('./utils/realtime-monitoring');
const crypto = require('crypto');

const app = express();

// ================== CONFIGURACIÓN BÁSICA ==================
const SERVER_STARTED_AT = Date.now();

// ================== MIDDLEWARES BASE ==================
app.use(helmetConfig); // Headers de seguridad
app.use(requestLogger); // Logging centralizado
app.use(securityLogger); // Logging de seguridad

// Logger encriptado para producción
if (process.env.NODE_ENV === 'production' && process.env.LOG_ENCRYPTION === 'true') {
  app.use((req, res, next) => {
    req.encryptedLogger = encryptedLogger.getLogger();
    next();
  });
}

app.use(inputValidator); // Validación de entrada
app.use(securityMonitoring.monitorSuspiciousActivity.bind(securityMonitoring)); // Monitoreo de seguridad
app.use(securityMonitoring.monitorAuthAttempts.bind(securityMonitoring)); // Monitoreo de autenticación
app.use(securityMonitoring.monitorDataChanges.bind(securityMonitoring)); // Monitoreo de cambios
app.use(securityMonitoring.monitorUnauthorizedAccess.bind(securityMonitoring)); // Monitoreo de accesos

// Middleware para monitoreo de rendimiento
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const isError = res.statusCode >= 400;
    realtimeMonitoring.recordRequest(duration, isError);
  });
  
  next();
});
app.use(express.json());
app.use(cookieParser());

// ================== RATE LIMITING ==================
// Rate limiting general (más permisivo para desarrollo)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 100 en producción, 1000 en desarrollo
  message: {
    error: 'Demasiadas peticiones',
    message: 'Has excedido el límite de peticiones. Intenta de nuevo en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting estricto para auth (más restrictivo)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos de login por IP por ventana
  message: {
    error: 'Demasiados intentos de login',
    message: 'Has excedido el límite de intentos de login. Intenta de nuevo en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // No contar requests exitosos
});

// Aplicar rate limiting general (excluir archivos estáticos)
app.use((req, res, next) => {
  // Excluir archivos estáticos del rate limiting
  if (req.path.startsWith('/css/') || 
      req.path.startsWith('/js/') || 
      req.path.startsWith('/assets/') ||
      req.path.startsWith('/services/') ||
      req.path.endsWith('.css') ||
      req.path.endsWith('.js') ||
      req.path.endsWith('.jpg') ||
      req.path.endsWith('.png') ||
      req.path.endsWith('.ico')) {
    return next();
  }
  generalLimiter(req, res, next);
});

// ================== HEADERS DE SEGURIDAD ==================
app.use((req, res, next) => {
  // Prevenir MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevenir clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Protección XSS básica
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy para privacidad
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy (reemplaza Feature-Policy)
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Content Security Policy (CSP) - Protección contra XSS
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' http://localhost:3000 https://localhost:3000 https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  
  res.setHeader('Content-Security-Policy', csp);
  
  next();
});

// CORS (ajusta origin si necesitas restringir)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Middleware de debug para POST requests
app.use((req, res, next) => {
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



// Logs simples
app.use((req, _res, next) => {
  console.log(`↗️  ${req.method} ${req.originalUrl}`);
  next();
});



// ================== RUTAS API ==================
// Ruta de prueba antes de las rutas API
app.get('/api/test', (req, res) => {
  res.json({ message: 'API funcionando correctamente' });
});

const apiRoutes = require('./routes/index.routes');
app.use('/api', apiRoutes);
app.use('/api/security', require('./routes/security.routes'));

// ================== ESTÁTICOS ==================
app.use(express.static(path.join(__dirname, '../public')));

// ================== RUTAS DE PÁGINAS ==================
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/guest/index.html'));
});

app.get('/contacto', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/guest/contacto.html'));
});

app.get('/login', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/guest/login.html'));
});

app.get('/reset-password', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/guest/reset-password.html'));
});

app.get('/monitoring', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/admin/monitoring.html'));
});

// Página de limpieza de tokens
app.get('/cleanup-tokens', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/cleanup-tokens.html'));
});

// ================== ERRORES ==================
app.use((err, req, res, next) => {
  console.error('❌ Error no manejado:', err);
  if (res.headersSent) return next(err);

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'JSON inválido en el body' });
  }

  if (err.code === '23505') {
    return res.status(409).json({ error: 'Conflicto: el recurso ya existe' });
  }

  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referencia inválida' });
  }

  res.status(500).json({ error: 'Error interno del servidor' });
});

// 404 JSON para endpoints no encontrados
app.use((req, res) => {
  res.status(404).json({ error: 'No encontrado' });
});

module.exports = app;
