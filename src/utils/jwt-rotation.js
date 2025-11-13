const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');

class JWTRotation {
  constructor() {
    this.keys = new Map();
    this.currentKeyId = null;
    this.keyRotationInterval = 24 * 60 * 60 * 1000; // 24 horas
    this.maxKeys = 3; // Mantener máximo 3 claves
    this.rotationInterval = null; // Intervalo de rotación
    
    // Inicializar con clave por defecto
    this.generateNewKey();
    
    // Configurar rotación automática
    this.startKeyRotation();
  }

  /**
   * Generar una nueva clave JWT
   */
  generateNewKey() {
    const keyId = crypto.randomUUID();
    const secret = crypto.randomBytes(64).toString('hex');
    
    this.keys.set(keyId, {
      secret,
      createdAt: new Date(),
      active: true
    });
    
    this.currentKeyId = keyId;
    
    console.log(`🔑 [JWT] Nueva clave generada: ${keyId}`);
    
    // Limpiar claves antiguas
    this.cleanupOldKeys();
    
    return keyId;
  }

  /**
   * Limpiar claves antiguas
   */
  cleanupOldKeys() {
    if (this.keys.size <= this.maxKeys) return;
    
    const sortedKeys = Array.from(this.keys.entries())
      .sort((a, b) => a[1].createdAt - b[1].createdAt);
    
    const keysToRemove = sortedKeys.slice(0, this.keys.size - this.maxKeys);
    
    for (const [keyId] of keysToRemove) {
      this.keys.delete(keyId);
      console.log(`🗑️ [JWT] Clave antigua eliminada: ${keyId}`);
    }
  }

  /**
   * Iniciar rotación automática de claves
   */
  startKeyRotation() {
    // Limpiar intervalo anterior si existe
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
    }
    
    this.rotationInterval = setInterval(() => {
      this.generateNewKey();
    }, this.keyRotationInterval);
    
    // Usar unref() para que el intervalo no mantenga el proceso vivo
    // Esto es importante para tests y cuando el proceso necesita terminar
    if (this.rotationInterval && typeof this.rotationInterval.unref === 'function') {
      this.rotationInterval.unref();
    }
    
    console.log(`⏰ [JWT] Rotación automática configurada cada ${this.keyRotationInterval / 1000 / 60} minutos`);
  }

  /**
   * Detener rotación automática
   */
  stopKeyRotation() {
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
      this.rotationInterval = null;
      console.log('⏹️ [JWT] Rotación automática detenida');
    }
  }

  /**
   * Generar token JWT con clave actual
   */
  generateToken(payload, options = {}) {
    const key = this.keys.get(this.currentKeyId);
    if (!key) {
      throw new Error('No hay clave JWT disponible');
    }

    const tokenPayload = {
      ...payload,
      keyId: this.currentKeyId,
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(tokenPayload, key.secret, {
      expiresIn: options.expiresIn || '24h',
      issuer: 'biblioteca-xonler',
      audience: 'biblioteca-users'
    });
  }

  /**
   * Verificar token JWT
   */
  verifyToken(token) {
    try {
      // Decodificar sin verificar para obtener keyId
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded?.header || !decoded?.payload) {
        throw new Error('Token inválido');
      }

      const keyId = decoded.payload.keyId;
      if (!keyId) {
        throw new Error('Token sin keyId');
      }

      // Buscar la clave correspondiente
      const key = this.keys.get(keyId);
      if (!key) {
        throw new Error('Clave JWT no encontrada');
      }

      // Verificar el token con la clave correcta
      const verified = jwt.verify(token, key.secret, {
        issuer: 'biblioteca-xonler',
        audience: 'biblioteca-users'
      });

      return verified;
    } catch (error) {
      // Intentar con la clave actual si falla
      if (error.message !== 'Clave JWT no encontrada') {
        const currentKey = this.keys.get(this.currentKeyId);
        if (currentKey) {
          try {
            return jwt.verify(token, currentKey.secret, {
              issuer: 'biblioteca-xonler',
              audience: 'biblioteca-users'
            });
          } catch (retryError) {
            console.error('Error en reintento de rotación JWT:', retryError);
            throw error; // Lanzar error original
          }
        }
      }
      throw error;
    }
  }

  /**
   * Obtener información de las claves
   */
  getKeyInfo() {
    const keyInfo = Array.from(this.keys.entries()).map(([keyId, key]) => ({
      keyId,
      createdAt: key.createdAt,
      active: key.active,
      isCurrent: keyId === this.currentKeyId
    }));

    return {
      currentKeyId: this.currentKeyId,
      totalKeys: this.keys.size,
      keys: keyInfo
    };
  }

  /**
   * Forzar rotación de clave
   */
  forceRotation() {
    console.log('🔄 [JWT] Forzando rotación de clave...');
    return this.generateNewKey();
  }

  /**
   * Revocar clave específica
   */
  revokeKey(keyId) {
    const key = this.keys.get(keyId);
    if (key) {
      key.active = false;
      console.log(`🚫 [JWT] Clave revocada: ${keyId}`);
      return true;
    }
    return false;
  }
}

// Instancia singleton
const jwtRotation = new JWTRotation();

module.exports = jwtRotation;
