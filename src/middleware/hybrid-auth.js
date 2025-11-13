// src/middleware/hybrid-auth.js
// Middleware híbrido de autenticación: Cookies HTTP-only + localStorage fallback
const { checkCookieStatus } = require('../utils/cookie-utils');
const { logSecurity } = require('../config/logger');
const { jwtCompatibility } = require('./jwt-compatibility');
const { unauthorized } = require('../utils/http-response');
const {
  requireRole: requireRoleCommon,
  requireAnyRole: requireAnyRoleCommon,
  requireOwnershipOrAdmin: requireOwnershipOrAdminCommon,
  handleAuthError,
  handleAuthServerError,
  extractTokenFromHeader
} = require('../utils/auth-middleware-helpers');

/**
 * Middleware híbrido de autenticación
 * Prioriza cookies HTTP-only, con fallback a localStorage (header Authorization)
 */
function hybridAuth(req, res, next) {
  try {
    let token = null;
    
    // 1. PRIORIDAD: Intentar obtener token de cookie HTTP-only
    if (req.cookies?.authToken) {
      token = req.cookies.authToken;
      console.log('🍪 [HYBRID-AUTH] Token obtenido de cookie HTTP-only');
    }
    // 2. FALLBACK: Header Authorization (localStorage/sessionStorage)
    else {
      token = extractTokenFromHeader(req);
      if (token) {
        console.log('🔑 [HYBRID-AUTH] Token obtenido de header Authorization (localStorage)');
      }
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
    
    if (handleAuthError(error, res, req, logSecurity, { authSource: 'error' })) {
      return;
    }
    
    return handleAuthServerError(res, 'error');
  }
}

// Re-exportar funciones comunes con prefijo para logging
const requireRole = requireRoleCommon;
const requireAnyRole = requireAnyRoleCommon;
const requireOwnershipOrAdmin = requireOwnershipOrAdminCommon;

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
