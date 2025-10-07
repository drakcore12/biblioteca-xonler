const jwt = require('jsonwebtoken');

// Clave fija para JWT (en producción debería estar en variables de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'biblioteca-xonler-secret-key-2024';

class SimpleJWT {
  /**
   * Generar token JWT
   */
  generateToken(payload, options = {}) {
    const defaultOptions = {
      expiresIn: '24h',
      issuer: 'biblioteca-xonler',
      audience: 'biblioteca-users'
    };

    const tokenOptions = { ...defaultOptions, ...options };
    
    return jwt.sign(payload, JWT_SECRET, tokenOptions);
  }

  /**
   * Verificar token JWT
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET, {
        issuer: 'biblioteca-xonler',
        audience: 'biblioteca-users'
      });
    } catch (error) {
      throw new Error('Token inválido');
    }
  }

  /**
   * Decodificar token sin verificar (para debugging)
   */
  decodeToken(token) {
    return jwt.decode(token);
  }
}

module.exports = new SimpleJWT();
