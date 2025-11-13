const simpleJWT = require('../utils/simple-jwt');
const { unauthorized } = require('../utils/http-response');
const {
  requireRole: requireRoleCommon,
  requireAnyRole: requireAnyRoleCommon,
  requireOwnershipOrAdmin: requireOwnershipOrAdminCommon,
  handleAuthError,
  handleAuthServerError,
  extractTokenFromHeader,
  setUserFromDecoded,
  checkPermission: checkPermissionCommon
} = require('../utils/auth-middleware-helpers');

// Middleware de autenticación
function auth(req, res, next) {
  try {
    // Extraer token del header
    const token = extractTokenFromHeader(req);
    
    if (!token) {
      return unauthorized(res, 'Debes incluir un token Bearer en el header Authorization');
    }
    
    // Verificar el token
    const decoded = simpleJWT.verifyToken(token);
    
    // Configurar req.user
    setUserFromDecoded(req, decoded);
    
    console.log('🔐 Usuario autenticado:', {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    });
    
    next();
    
  } catch (error) {
    console.error('❌ Error de autenticación:', error.message);
    
    if (handleAuthError(error, res)) {
      return;
    }
    
    return handleAuthServerError(res);
  }
}

// Re-exportar funciones comunes
const requireRole = requireRoleCommon;
const requireAnyRole = requireAnyRoleCommon;
const requireOwnershipOrAdmin = requireOwnershipOrAdminCommon;
const checkPermission = checkPermissionCommon;

module.exports = {
  auth,
  requireRole,
  requireAnyRole,
  requireOwnershipOrAdmin,
  checkPermission
};
