/**
 * Utilidades comunes para middleware de autenticación y autorización
 * Elimina duplicación entre auth.js y hybrid-auth.js
 */

const { unauthorized, forbidden } = require('./http-response');

/**
 * Verifica que el usuario esté autenticado
 * @param {object} req - Request de Express
 * @param {object} res - Response de Express
 * @returns {boolean} - true si está autenticado, false si no
 */
function checkAuthentication(req, res) {
  if (!req.user) {
    unauthorized(res, 'Debes iniciar sesión para acceder a este recurso');
    return false;
  }
  return true;
}

/**
 * Verifica si un rol tiene acceso (considerando admin y supadmin)
 * @param {string} userRole - Rol del usuario
 * @param {string|string[]} requiredRole - Rol(es) requerido(s)
 * @returns {boolean} - true si tiene acceso
 */
function hasRoleAccess(userRole, requiredRole) {
  // Los roles de administrador (admin y supadmin) tienen acceso completo a todos los recursos
  if (userRole === 'admin' || userRole === 'supadmin') {
    return true;
  }
  
  // Si requiredRole es un array, verificar si el usuario tiene alguno
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole);
  }
  
  // Si es un string, verificar igualdad
  return userRole === requiredRole;
}

/**
 * Middleware para requerir un rol específico
 * @param {string} role - Rol requerido
 * @returns {Function} - Middleware de Express
 */
function requireRole(role) {
  return (req, res, next) => {
    if (!checkAuthentication(req, res)) {
      return;
    }
    
    if (!hasRoleAccess(req.user.role, role)) {
      return forbidden(res, `Se requiere rol '${role}' para acceder a este recurso. Tu rol actual es '${req.user.role}'`);
    }
    
    console.log(`🔒 Acceso autorizado para usuario ${req.user.id} con rol ${req.user.role}`);
    next();
  };
}

/**
 * Middleware para requerir múltiples roles (cualquiera de ellos)
 * @param {string[]} roles - Array de roles permitidos
 * @returns {Function} - Middleware de Express
 */
function requireAnyRole(roles) {
  return (req, res, next) => {
    if (!checkAuthentication(req, res)) {
      return;
    }
    
    if (!hasRoleAccess(req.user.role, roles)) {
      return forbidden(res, `Se requiere uno de estos roles: ${roles.join(', ')}. Tu rol actual es '${req.user.role}'`);
    }
    
    console.log(`🔒 Acceso autorizado para usuario ${req.user.id} con rol ${req.user.role}`);
    next();
  };
}

/**
 * Middleware para verificar que el usuario sea propietario del recurso o admin
 * @param {string} resourceIdParam - Nombre del parámetro que contiene el ID del recurso
 * @returns {Function} - Middleware de Express
 */
function requireOwnershipOrAdmin(resourceIdParam = 'id') {
  return (req, res, next) => {
    if (!checkAuthentication(req, res)) {
      return;
    }
    
    const resourceId = req.params[resourceIdParam];
    
    // Los administradores y supadmin pueden acceder a cualquier recurso
    if (req.user.role === 'admin' || req.user.role === 'supadmin') {
      console.log(`🔒 ${req.user.role} ${req.user.id} accediendo a recurso ${resourceId}`);
      return next();
    }
    
    // Verificar que el usuario sea propietario del recurso
    const userId = Number.parseInt(String(req.user.id), 10);
    const resId = Number.parseInt(String(resourceId), 10);
    
    if (userId !== resId) {
      return forbidden(res, 'Solo puedes acceder a tus propios recursos');
    }
    
    console.log(`🔒 Usuario ${req.user.id} accediendo a su propio recurso ${resourceId}`);
    next();
  };
}

/**
 * Extrae el token del header Authorization
 * @param {object} req - Request de Express
 * @returns {string|null} - Token extraído o null si no existe
 */
function extractTokenFromHeader(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  return token || null;
}

/**
 * Configura req.user con información del token decodificado
 * @param {object} req - Request de Express
 * @param {object} decoded - Token decodificado
 * @param {string} authSource - Fuente de autenticación (opcional)
 */
function setUserFromDecoded(req, decoded, authSource = null) {
  req.user = {
    id: decoded.user_id || decoded.id,
    email: decoded.email,
    role: decoded.role || 'usuario',
    nombre: decoded.nombre
  };
  
  if (authSource) {
    req.user.authSource = authSource;
  }
  
  if (decoded.exp) {
    req.user.tokenExp = decoded.exp;
  }
}

/**
 * Maneja errores de autenticación JWT de forma consistente
 * @param {Error} error - Error capturado
 * @param {object} res - Response de Express
 * @param {object} req - Request de Express (opcional, para logging)
 * @param {Function} logSecurity - Función de logging de seguridad (opcional)
 * @param {object} options - Opciones adicionales (authSource, etc.)
 * @returns {boolean} - true si el error fue manejado, false si no
 */
function handleAuthError(error, res, req = null, logSecurity = null, options = {}) {
  // Log de seguridad si está disponible
  if (logSecurity && req) {
    logSecurity('warn', 'Error de autenticación', {
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent'),
      url: req.url,
      error: error.message,
      errorType: error.name
    });
  }
  
  let message = '';
  let authSource = options.authSource;
  
  if (error.name === 'JsonWebTokenError') {
    message = 'El token proporcionado no es válido';
    if (!authSource) authSource = 'invalid';
  } else if (error.name === 'TokenExpiredError') {
    message = 'El token ha expirado, inicia sesión nuevamente';
    if (!authSource) authSource = 'expired';
  } else {
    // Error no reconocido - retornar false para que el caller maneje
    return false;
  }
  
  // Si hay authSource, agregarlo a la respuesta
  if (authSource) {
    const originalJson = res.json;
    res.json = function(data) {
      if (data && typeof data === 'object') {
        data.authSource = authSource;
      }
      return originalJson.call(this, data);
    };
  }
  
  unauthorized(res, message);
  return true;
}

/**
 * Maneja errores 500 de autenticación de forma consistente
 * @param {object} res - Response de Express
 * @param {string} authSource - Fuente de autenticación (opcional)
 * @returns {object} - Respuesta HTTP
 */
function handleAuthServerError(res, authSource = null) {
  const response = {
    error: 'Error de autenticación',
    message: 'Error interno del servidor durante la autenticación'
  };
  
  if (authSource) {
    response.authSource = authSource;
  }
  
  return res.status(500).json(response);
}

/**
 * Función helper para verificar permisos personalizados
 * @param {string} permission - Permiso a verificar
 * @returns {Function} - Middleware de Express
 */
function checkPermission(permission) {
  return (req, res, next) => {
    if (!checkAuthentication(req, res)) {
      return;
    }
    
    // Aquí puedes implementar lógica de permisos más compleja
    // Por ahora, solo verificamos roles básicos
    const allowedRoles = {
      'manage_users': ['admin'],
      'manage_books': ['admin', 'bibliotecario'],
      'manage_loans': ['admin', 'bibliotecario', 'usuario'],
      'view_statistics': ['admin', 'bibliotecario']
    };
    
    const requiredRoles = allowedRoles[permission] || ['admin'];
    
    if (!hasRoleAccess(req.user.role, requiredRoles)) {
      return forbidden(res, `No tienes permisos para realizar la acción: ${permission}`);
    }
    
    console.log(`🔒 Permiso ${permission} concedido para usuario ${req.user.id}`);
    next();
  };
}

module.exports = {
  checkAuthentication,
  hasRoleAccess,
  requireRole,
  requireAnyRole,
  requireOwnershipOrAdmin,
  handleAuthError,
  handleAuthServerError,
  extractTokenFromHeader,
  setUserFromDecoded,
  checkPermission
};

