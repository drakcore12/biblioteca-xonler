const jwt = require('jsonwebtoken');

// ✅ ARREGLADO: Middleware de autenticación simple
function auth(req, res, next) {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!token) {
      return res.status(401).json({ error: 'Token de autenticación requerido' });
    }

    // ✅ ARREGLADO: Verificar token (usar una clave secreta simple para desarrollo)
    // En producción, usa process.env.JWT_SECRET
    const secret = process.env.JWT_SECRET || 'dev-secret-key-2025';
    
    try {
      const payload = jwt.verify(token, secret);
      
      // ✅ ARREGLADO: Extraer userId del payload
      const userId = payload.user_id || payload.id || payload.sub;
      
      if (!userId) {
        return res.status(401).json({ error: 'Token inválido: sin userId' });
      }
      
      // ✅ ARREGLADO: Añadir userId al request
      req.user = { id: userId };
      req.userId = userId; // Compatibilidad con código existente
      
      console.log('🔐 Usuario autenticado:', userId);
      next();
      
    } catch (jwtError) {
      console.error('❌ Error verificando JWT:', jwtError);
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }
    
  } catch (error) {
    console.error('❌ Error en middleware de auth:', error);
    return res.status(500).json({ error: 'Error interno de autenticación' });
  }
}

// ✅ ARREGLADO: Middleware opcional (no falla si no hay token)
function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (token) {
      const secret = process.env.JWT_SECRET || 'dev-secret-key-2025';
      
      try {
        const payload = jwt.verify(token, secret);
        const userId = payload.user_id || payload.id || payload.sub;
        
        if (userId) {
          req.user = { id: userId };
          req.userId = userId;
          console.log('🔐 Usuario autenticado (opcional):', userId);
        }
      } catch (jwtError) {
        // Token inválido, pero no falla la request
        console.warn('⚠️ Token inválido en auth opcional:', jwtError.message);
      }
    }
    
    next();
    
  } catch (error) {
    console.error('❌ Error en auth opcional:', error);
    next(); // Continuar sin autenticación
  }
}

module.exports = {
  auth,
  optionalAuth
};
