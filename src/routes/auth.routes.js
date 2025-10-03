const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  register,
  login,
  me,
  refresh,
  logout,
  forgotPassword,
  verifyResetToken,
  resetPassword
} = require('../controllers/auth.controller');

const { hybridAuth } = require('../middleware/hybrid-auth');

// Rate limiting específico para auth
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

// Rutas públicas con rate limiting
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/verify-reset-token', authLimiter, verifyResetToken);
router.post('/reset-password', authLimiter, resetPassword);

// Rutas protegidas (requieren autenticación híbrida)
router.get('/me', hybridAuth, me);
router.post('/refresh', hybridAuth, refresh);
router.post('/logout', hybridAuth, logout);

module.exports = router;
