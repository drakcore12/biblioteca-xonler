const simpleJWT = require('../utils/simple-jwt');

// Middleware de autenticación
function auth(req, res, next) {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Token de acceso requerido',
        message: 'Debes incluir un token Bearer en el header Authorization'
      });
    }
    
    // Extraer el token (remover "Bearer ")
    const token = authHeader.substring(7);
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Token inválido',
        message: 'El token no puede estar vacío'
      });
    }
    
    // Verificar el token
    const decoded = simpleJWT.verifyToken(token);
    
    // Agregar información del usuario al request
    req.user = {
      id: decoded.user_id || decoded.id,
      email: decoded.email,
      role: decoded.role || 'usuario',
      nombre: decoded.nombre
    };
    
    console.log('🔐 Usuario autenticado:', {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    });
    
    next();
    
  } catch (error) {
    console.error('❌ Error de autenticación:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token inválido',
        message: 'El token proporcionado no es válido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado',
        message: 'El token ha expirado, inicia sesión nuevamente'
      });
    }
    
    return res.status(500).json({ 
      error: 'Error de autenticación',
      message: 'Error interno del servidor durante la autenticación'
    });
  }
}

// Middleware para requerir un rol específico
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
    // Supadmin tiene acceso a todo, admin tiene acceso a la mayoría de recursos
    if (req.user.role !== role && req.user.role !== 'admin' && req.user.role !== 'supadmin') {
      return res.status(403).json({ 
        error: 'Acceso denegado',
        message: `Se requiere rol '${role}' para acceder a este recurso. Tu rol actual es '${req.user.role}'`
      });
    }
    
    console.log(`🔒 Acceso autorizado para usuario ${req.user.id} con rol ${req.user.role}`);
    next();
  };
}

// Middleware para requerir múltiples roles (cualquiera de ellos)
function requireAnyRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'No autenticado',
        message: 'Debes iniciar sesión para acceder a este recurso'
      });
    }
    
    // Verificar que el usuario tenga al menos uno de los roles requeridos
    // Supadmin tiene acceso a todo, admin tiene acceso a la mayoría de recursos
    const hasRequiredRole = roles.includes(req.user.role) || req.user.role === 'admin' || req.user.role === 'supadmin';
    
    if (!hasRequiredRole) {
      return res.status(403).json({ 
        error: 'Acceso denegado',
        message: `Se requiere uno de estos roles: ${roles.join(', ')}. Tu rol actual es '${req.user.role}'`
      });
    }
    
    console.log(`🔒 Acceso autorizado para usuario ${req.user.id} con rol ${req.user.role}`);
    next();
  };
}

// Middleware para verificar que el usuario sea propietario del recurso o admin
function requireOwnershipOrAdmin(resourceIdParam = 'id') {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'No autenticado',
        message: 'Debes iniciar sesión para acceder a este recurso'
      });
    }
    
    const resourceId = req.params[resourceIdParam];
    
    // Los administradores y supadmin pueden acceder a cualquier recurso
    if (req.user.role === 'admin' || req.user.role === 'supadmin') {
      console.log(`🔒 ${req.user.role} ${req.user.id} accediendo a recurso ${resourceId}`);
      return next();
    }
    
    // Verificar que el usuario sea propietario del recurso
    if (req.user.id !== parseInt(resourceId)) {
      return res.status(403).json({ 
        error: 'Acceso denegado',
        message: 'Solo puedes acceder a tus propios recursos'
      });
    }
    
    console.log(`🔒 Usuario ${req.user.id} accediendo a su propio recurso ${resourceId}`);
    next();
  };
}

// Función helper para verificar permisos personalizados
function checkPermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'No autenticado',
        message: 'Debes iniciar sesión para acceder a este recurso'
      });
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
    
    if (!requiredRoles.includes(req.user.role) && req.user.role !== 'admin' && req.user.role !== 'supadmin') {
      return res.status(403).json({ 
        error: 'Permiso denegado',
        message: `No tienes permisos para realizar la acción: ${permission}`
      });
    }
    
    console.log(`🔒 Permiso ${permission} concedido para usuario ${req.user.id}`);
    next();
  };
}

module.exports = {
  auth,
  requireRole,
  requireAnyRole,
  requireOwnershipOrAdmin,
  checkPermission
};
