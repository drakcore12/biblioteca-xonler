const jwt = require('jsonwebtoken');
const jwtRotation = require('../utils/jwt-rotation');
const { logSecurity } = require('../config/logger');

/**
 * Middleware de compatibilidad JWT que maneja tokens antiguos y nuevos
 */
function jwtCompatibility(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7);
  
  try {
    // Primero intentar con el sistema de rotación
    const decoded = jwtRotation.verifyToken(token);
    
    req.user = {
      id: decoded.user_id || decoded.id,
      email: decoded.email,
      role: decoded.role || 'usuario',
      nombre: decoded.nombre,
      authSource: 'jwt-rotation',
      tokenExp: decoded.exp
    };
    
    console.log('✅ [JWT-COMPAT] Token verificado con rotación JWT');
    return next();
    
  } catch (rotationError) {
    console.log('⚠️ [JWT-COMPAT] Error con rotación JWT, intentando verificación directa:', rotationError.message);
    
    try {
      // Intentar verificación directa con JWT_SECRET
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role || 'usuario',
        nombre: decoded.nombre,
        authSource: 'jwt-direct',
        tokenExp: decoded.exp
      };
      
      console.log('✅ [JWT-COMPAT] Token verificado con JWT directo');
      
      // Log de seguridad para tokens antiguos
      logSecurity('warn', 'Token antiguo detectado', {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        url: req.url,
        userId: decoded.id,
        email: decoded.email
      });
      
      return next();
      
    } catch (directError) {
      console.log('❌ [JWT-COMPAT] Error en verificación directa:', directError.message);
      
      // Log de seguridad para tokens inválidos
      logSecurity('warn', 'Token inválido detectado', {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        url: req.url,
        error: directError.message,
        errorType: directError.name
      });
      
      return res.status(401).json({ 
        error: 'Token inválido',
        message: 'El token proporcionado no es válido. Por favor, inicia sesión nuevamente.',
        authSource: 'invalid'
      });
    }
  }
}

module.exports = { jwtCompatibility };
