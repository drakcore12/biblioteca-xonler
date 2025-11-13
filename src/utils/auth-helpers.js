/**
 * Utilidades para autenticación y autorización
 * Elimina duplicación de código para validación de usuarios
 */

const { unauthorized, forbidden } = require('./http-response');

/**
 * Valida que req sea un objeto request válido
 */
function validateRequest(req) {
  return req && typeof req === 'object';
}

/**
 * Extrae el ID del usuario autenticado de la request
 * Soporta múltiples formas de autenticación (req.user, req.auth, req.userId)
 * @param {object} req - Objeto request de Express
 * @returns {number|null} - ID del usuario o null si no está autenticado
 */
function getUserId(req) {
  if (!validateRequest(req)) {
    return null;
  }
  
  // Intentar obtener ID de diferentes fuentes
  if (req.user && typeof req.user === 'object' && typeof req.user.id === 'number') {
    return req.user.id;
  }
  
  if (req.auth && typeof req.auth === 'object' && typeof req.auth.sub === 'number') {
    return req.auth.sub;
  }
  
  if (typeof req.userId === 'number') {
    return req.userId;
  }
  
  return null;
}

/**
 * Obtiene el rol del usuario autenticado
 * @param {object} req - Objeto request de Express
 * @returns {string|null} - Rol del usuario o null si no está disponible
 */
function getUserRole(req) {
  if (!validateRequest(req)) {
    return null;
  }
  
  if (req.user && typeof req.user === 'object') {
    return req.user.role || req.user.rol || null;
  }
  
  return null;
}

/**
 * Verifica si el usuario está autenticado
 * @param {object} req - Objeto request de Express
 * @returns {boolean} - true si está autenticado, false en caso contrario
 */
function isAuthenticated(req) {
  return getUserId(req) !== null;
}

/**
 * Verifica si el usuario tiene un rol específico
 * @param {object} req - Objeto request de Express
 * @param {string} role - Rol a verificar
 * @returns {boolean} - true si tiene el rol, false en caso contrario
 */
function hasRole(req, role) {
  if (typeof role !== 'string' || role.trim() === '') {
    return false;
  }
  
  const userRole = getUserRole(req);
  return userRole === role.trim();
}

/**
 * Verifica si el usuario es admin o superadmin
 * @param {object} req - Objeto request de Express
 * @returns {boolean} - true si es admin o superadmin
 */
function isAdmin(req) {
  const role = getUserRole(req);
  return role === 'admin' || role === 'supadmin';
}

/**
 * Middleware para verificar autenticación
 * Retorna error 401 si no está autenticado
 * @param {object} req - Objeto request de Express
 * @param {object} res - Objeto response de Express
 * @param {Function} next - Función next de Express
 * @returns {object|void} - Respuesta HTTP si no está autenticado, o llama a next()
 */
function requireAuth(req, res, next) {
  if (!validateRequest(req)) {
    return unauthorized(res, 'Request inválido');
  }
  
  if (!isAuthenticated(req)) {
    return unauthorized(res, 'Usuario no autenticado');
  }
  
  next();
}

/**
 * Middleware para verificar rol específico
 * Retorna error 403 si no tiene el rol requerido
 * @param {string} role - Rol requerido
 * @returns {Function} - Middleware de Express
 */
function requireRole(role) {
  if (typeof role !== 'string' || role.trim() === '') {
    throw new TypeError('requireRole requiere un string no vacío');
  }
  
  const requiredRole = role.trim();
  
  return (req, res, next) => {
    if (!validateRequest(req)) {
      return unauthorized(res, 'Request inválido');
    }
    
    if (!isAuthenticated(req)) {
      return unauthorized(res, 'Usuario no autenticado');
    }
    
    const userRole = getUserRole(req);
    if (userRole !== requiredRole && !isAdmin(req)) {
      return forbidden(res, `Se requiere rol: ${requiredRole}`);
    }
    
    next();
  };
}

/**
 * Verifica si el usuario puede acceder a un recurso
 * (es el dueño del recurso o es admin)
 * @param {object} req - Objeto request de Express
 * @param {string|number} resourceUserId - ID del usuario dueño del recurso
 * @returns {boolean} - true si puede acceder, false en caso contrario
 */
function canAccessResource(req, resourceUserId) {
  if (!validateRequest(req) || !isAuthenticated(req)) {
    return false;
  }
  
  const userId = getUserId(req);
  if (userId === null) {
    return false;
  }
  
  // Normalizar resourceUserId a número
  let resourceId;
  if (typeof resourceUserId === 'string') {
    const parsed = Number.parseInt(resourceUserId, 10);
    if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
      return false;
    }
    resourceId = parsed;
  } else if (typeof resourceUserId === 'number' && Number.isFinite(resourceUserId)) {
    resourceId = resourceUserId;
  } else {
    return false;
  }
  
  return userId === resourceId || isAdmin(req);
}

/**
 * Middleware para verificar acceso a recurso
 * Retorna error 403 si no puede acceder
 * @param {Function} resourceIdExtractor - Función que extrae el ID del recurso de req
 * @returns {Function} - Middleware de Express
 */
function requireResourceAccess(resourceIdExtractor) {
  if (typeof resourceIdExtractor !== 'function') {
    throw new TypeError('requireResourceAccess requiere una función extractor');
  }
  
  return (req, res, next) => {
    if (!validateRequest(req)) {
      return unauthorized(res, 'Request inválido');
    }
    
    if (!isAuthenticated(req)) {
      return unauthorized(res, 'Usuario no autenticado');
    }
    
    let resourceId;
    try {
      resourceId = resourceIdExtractor(req);
    } catch (err) {
      console.error('Error al obtener ID del recurso:', err);
      return forbidden(res, 'Error al obtener ID del recurso');
    }
    
    if (!canAccessResource(req, resourceId)) {
      return forbidden(res, 'No tienes permisos para acceder a este recurso');
    }
    
    next();
  };
}

module.exports = {
  getUserId,
  getUserRole,
  isAuthenticated,
  hasRole,
  isAdmin,
  requireAuth,
  requireRole,
  canAccessResource,
  requireResourceAccess
};

