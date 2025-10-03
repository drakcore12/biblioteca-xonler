// src/middleware/hybrid-auth.js
// Middleware híbrido de autenticación: Cookies HTTP-only + localStorage fallback
const jwt = require('jsonwebtoken');
const { checkCookieStatus } = require('../utils/cookie-utils');
const jwtRotation = require('../utils/jwt-rotation');
const { logSecurity } = require('../config/logger');
const { jwtCompatibility } = require('./jwt-compatibility');

/**
 * Middleware híbrido de autenticación
 * Prioriza cookies HTTP-only, con fallback a localStorage (header Authorization)
 */
function hybridAuth(req, res, next) {
  try {
    let token = null;
    let authSource = 'none';
    
    // 1. PRIORIDAD: Intentar obtener token de cookie HTTP-only
    if (req.cookies && req.cookies.authToken) {
      token = req.cookies.authToken;
      authSource = 'cookie';
      console.log('🍪 [HYBRID-AUTH] Token obtenido de cookie HTTP-only');
    }
    // 2. FALLBACK: Header Authorization (localStorage/sessionStorage)
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
      authSource = 'header';
      console.log('🔑 [HYBRID-AUTH] Token obtenido de header Authorization (localStorage)');
    }
    
    if (!token) {
      console.log('❌ [HYBRID-AUTH] No se encontró token de autenticación');
      return res.status(401).json({ 
        error: 'Token de acceso requerido',
        message: 'Debes iniciar sesión para acceder a este recurso',
        authSource: 'none'
      });
    }
    
    // Usar middleware de compatibilidad JWT
    jwtCompatibility(req, res, next);
    
  } catch (error) {
    console.error('❌ [HYBRID-AUTH] Error de autenticación:', error.message);
    
    // Log de seguridad para tokens inválidos
    logSecurity('warn', 'Error de autenticación', {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      url: req.url,
      error: error.message,
      errorType: error.name
    });
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token inválido',
        message: 'El token proporcionado no es válido',
        authSource: 'invalid'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado',
        message: 'El token ha expirado, inicia sesión nuevamente',
        authSource: 'expired'
      });
    }
    
    return res.status(500).json({ 
      error: 'Error de autenticación',
      message: 'Error interno del servidor durante la autenticación',
      authSource: 'error'
    });
  }
}

/**
 * Middleware para requerir un rol específico (usa hybridAuth)
 */
function requireRole(role) {
  return (req, res, next) => {
    // Primero verificar que el usuario esté autenticado
    if (!req.user) {
      return res.status(401).json({ 
        error: 'No autenticado',
        message: 'Debes iniciar sesión para acceder a este recurso'
      });
    }
    
    // Verificar que el usuario tenga el rol requerido
    if (req.user.role !== role && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Acceso denegado',
        message: `Se requiere rol '${role}' para acceder a este recurso. Tu rol actual es '${req.user.role}'`
      });
    }
    
    console.log(`🔒 [HYBRID-AUTH] Acceso autorizado para usuario ${req.user.id} con rol ${req.user.role}`);
    next();
  };
}

/**
 * Middleware para requerir múltiples roles (cualquiera de ellos)
 */
function requireAnyRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'No autenticado',
        message: 'Debes iniciar sesión para acceder a este recurso'
      });
    }
    
    // Verificar que el usuario tenga al menos uno de los roles requeridos
    const hasRequiredRole = roles.includes(req.user.role) || req.user.role === 'admin';
    
    if (!hasRequiredRole) {
      return res.status(403).json({ 
        error: 'Acceso denegado',
        message: `Se requiere uno de estos roles: ${roles.join(', ')}. Tu rol actual es '${req.user.role}'`
      });
    }
    
    console.log(`🔒 [HYBRID-AUTH] Acceso autorizado para usuario ${req.user.id} con rol ${req.user.role}`);
    next();
  };
}

/**
 * Middleware para verificar que el usuario sea propietario del recurso o admin
 */
function requireOwnershipOrAdmin(resourceIdParam = 'id') {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'No autenticado',
        message: 'Debes iniciar sesión para acceder a este recurso'
      });
    }
    
    const resourceId = req.params[resourceIdParam];
    
    // Los administradores pueden acceder a cualquier recurso
    if (req.user.role === 'admin') {
      console.log(`🔒 [HYBRID-AUTH] Admin ${req.user.id} accediendo a recurso ${resourceId}`);
      return next();
    }
    
    // Verificar que el usuario sea propietario del recurso
    if (req.user.id !== parseInt(resourceId)) {
      return res.status(403).json({ 
        error: 'Acceso denegado',
        message: 'Solo puedes acceder a tus propios recursos'
      });
    }
    
    console.log(`🔒 [HYBRID-AUTH] Usuario ${req.user.id} accediendo a su propio recurso ${resourceId}`);
    next();
  };
}

/**
 * Middleware de debug para verificar estado de autenticación
 */
function debugAuth(req, res, next) {
  const cookieStatus = checkCookieStatus(req);
  
  console.log('🔍 [HYBRID-AUTH DEBUG] Estado de autenticación:', {
    hasUser: !!req.user,
    userInfo: req.user ? {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      authSource: req.user.authSource
    } : null,
    cookieStatus,
    headers: {
      authorization: req.headers.authorization ? 'Presente' : 'Ausente',
      cookie: req.headers.cookie ? 'Presente' : 'Ausente'
    }
  });
  
  next();
}

module.exports = {
  hybridAuth,
  requireRole,
  requireAnyRole,
  requireOwnershipOrAdmin,
  debugAuth
};
