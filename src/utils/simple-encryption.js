const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { logError, logInfo } = require('../config/logger');

/**
 * Sistema de encriptación simplificado para logs
 */
class SimpleEncryption {
  constructor() {
    this.algorithm = 'aes-256-cbc';
    this.keyLength = 32; // 256 bits
    this.ivLength = 16; // 128 bits
    
    this.masterKey = null;
    this.keyDerivationRounds = 100000; // PBKDF2 rounds
    
    this.initializeEncryption();
  }

  /**
   * Inicializar sistema de encriptación
   */
  initializeEncryption() {
    try {
      // Intentar cargar clave maestra desde archivo seguro
      this.masterKey = this.loadMasterKey();
      
      if (!this.masterKey) {
        // Generar nueva clave maestra si no existe
        this.masterKey = this.generateMasterKey();
        this.saveMasterKey(this.masterKey);
        console.log('🔑 [ENCRYPTION] Nueva clave maestra generada');
      } else {
        console.log('🔑 [ENCRYPTION] Clave maestra cargada exitosamente');
      }
      
      logInfo('Sistema de encriptación inicializado', {
        algorithm: this.algorithm,
        keyLength: this.keyLength,
        rounds: this.keyDerivationRounds
      });
      
    } catch (error) {
      logError(error, { context: 'encryption-initialization' });
      throw new Error('Error inicializando sistema de encriptación');
    }
  }

  /**
   * Generar clave maestra
   */
  generateMasterKey() {
    return crypto.randomBytes(this.keyLength);
  }

  /**
   * Cargar clave maestra desde archivo seguro
   */
  loadMasterKey() {
    try {
      const keyPath = this.getMasterKeyPath();
      
      if (!fs.existsSync(keyPath)) {
        return null;
      }

      // Leer clave encriptada
      const encryptedData = fs.readFileSync(keyPath, 'utf8');
      
      // Extraer IV (primeros 32 caracteres hex = 16 bytes) y datos encriptados
      const ivHex = encryptedData.substring(0, 32);
      const encryptedHex = encryptedData.substring(32);
      
      // Desencriptar con clave derivada de variables de entorno
      const derivedKey = this.deriveKeyFromEnv();
      const decipher = crypto.createDecipheriv(this.algorithm, derivedKey, Buffer.from(ivHex, 'hex'));
      
      let decryptedKey = decipher.update(encryptedHex, 'hex', 'utf8');
      decryptedKey += decipher.final('utf8');
      
      return Buffer.from(decryptedKey, 'hex');
      
    } catch (error) {
      console.error('❌ [ENCRYPTION] Error cargando clave maestra:', error.message);
      return null;
    }
  }

  /**
   * Guardar clave maestra de forma segura
   */
  saveMasterKey(masterKey) {
    try {
      const keyPath = this.getMasterKeyPath();
      const keyDir = path.dirname(keyPath);
      
      // Crear directorio si no existe
      if (!fs.existsSync(keyDir)) {
        fs.mkdirSync(keyDir, { recursive: true, mode: 0o700 });
      }

      // Encriptar clave con clave derivada de variables de entorno
      const derivedKey = this.deriveKeyFromEnv();
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, derivedKey, iv);
      
      let encryptedKey = cipher.update(masterKey.toString('hex'), 'utf8', 'hex');
      encryptedKey += cipher.final('hex');
      
      // Combinar IV + datos encriptados
      const result = iv.toString('hex') + encryptedKey;
      
      // Guardar con permisos restrictivos
      fs.writeFileSync(keyPath, result, { mode: 0o600 });
      
      console.log('🔐 [ENCRYPTION] Clave maestra guardada de forma segura');
      
    } catch (error) {
      logError(error, { context: 'save-master-key' });
      throw new Error('Error guardando clave maestra');
    }
  }

  /**
   * Obtener ruta del archivo de clave maestra
   */
  getMasterKeyPath() {
    const secureDir = process.env.ENCRYPTION_KEY_DIR || path.join(process.cwd(), 'secure');
    return path.join(secureDir, 'master.key');
  }

  /**
   * Derivar clave desde variables de entorno
   */
  deriveKeyFromEnv() {
    const password = process.env.ENCRYPTION_PASSWORD || 'default-password-change-in-production';
    const salt = process.env.ENCRYPTION_SALT || 'default-salt-change-in-production';
    
    return crypto.pbkdf2Sync(password, salt, this.keyDerivationRounds, this.keyLength, 'sha512');
  }

  /**
   * Derivar clave de encriptación para un contexto específico
   */
  deriveContextKey(context, masterKey = null) {
    const key = masterKey || this.masterKey;
    const contextSalt = crypto.createHash('sha256').update(context).digest();
    
    return crypto.pbkdf2Sync(key, contextSalt, 10000, this.keyLength, 'sha512');
  }

  /**
   * Encriptar datos
   */
  encrypt(data, context = 'default') {
    try {
      if (!this.masterKey) {
        throw new Error('Clave maestra no disponible');
      }

      const contextKey = this.deriveContextKey(context);
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, contextKey, iv);
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Combinar IV + Datos encriptados
      const result = {
        iv: iv.toString('hex'),
        data: encrypted,
        context: context,
        timestamp: new Date().toISOString(),
        algorithm: this.algorithm
      };
      
      return JSON.stringify(result);
      
    } catch (error) {
      logError(error, { context: 'encrypt-data', dataContext: context });
      throw new Error('Error encriptando datos');
    }
  }

  /**
   * Desencriptar datos
   */
  decrypt(encryptedData, context = 'default') {
    try {
      if (!this.masterKey) {
        throw new Error('Clave maestra no disponible');
      }

      const parsed = JSON.parse(encryptedData);
      
      // Verificar contexto
      if (parsed.context !== context) {
        throw new Error('Contexto de encriptación no coincide');
      }

      const contextKey = this.deriveContextKey(context);
      const decipher = crypto.createDecipheriv(this.algorithm, contextKey, Buffer.from(parsed.iv, 'hex'));
      
      let decrypted = decipher.update(parsed.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
      
    } catch (error) {
      logError(error, { context: 'decrypt-data', dataContext: context });
      throw new Error('Error desencriptando datos');
    }
  }

  /**
   * Encriptar archivo
   */
  async encryptFile(inputPath, outputPath, context = 'file') {
    try {
      const data = fs.readFileSync(inputPath, 'utf8');
      const encryptedData = this.encrypt(data, context);
      
      // Crear directorio de salida si no existe
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true, mode: 0o700 });
      }
      
      fs.writeFileSync(outputPath, encryptedData, { mode: 0o600 });
      
      logInfo('Archivo encriptado exitosamente', {
        inputPath,
        outputPath,
        context
      });
      
      return true;
      
    } catch (error) {
      logError(error, { context: 'encrypt-file', inputPath, outputPath });
      throw new Error('Error encriptando archivo');
    }
  }

  /**
   * Desencriptar archivo
   */
  async decryptFile(inputPath, outputPath, context = 'file') {
    try {
      const encryptedData = fs.readFileSync(inputPath, 'utf8');
      const decryptedData = this.decrypt(encryptedData, context);
      
      // Crear directorio de salida si no existe
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true, mode: 0o700 });
      }
      
      fs.writeFileSync(outputPath, decryptedData, { mode: 0o600 });
      
      logInfo('Archivo desencriptado exitosamente', {
        inputPath,
        outputPath,
        context
      });
      
      return true;
      
    } catch (error) {
      logError(error, { context: 'decrypt-file', inputPath, outputPath });
      throw new Error('Error desencriptando archivo');
    }
  }

  /**
   * Rotar clave maestra
   */
  async rotateMasterKey() {
    try {
      console.log('🔄 [ENCRYPTION] Iniciando rotación de clave maestra...');
      
      // Generar nueva clave
      const newMasterKey = this.generateMasterKey();
      
      // Guardar clave anterior para migración
      const oldKeyPath = this.getMasterKeyPath() + '.old';
      if (fs.existsSync(this.getMasterKeyPath())) {
        fs.copyFileSync(this.getMasterKeyPath(), oldKeyPath);
      }
      
      // Guardar nueva clave
      this.saveMasterKey(newMasterKey);
      
      // Actualizar clave en memoria
      this.masterKey = newMasterKey;
      
      logInfo('Clave maestra rotada exitosamente', {
        oldKeyBackup: oldKeyPath,
        newKeyPath: this.getMasterKeyPath()
      });
      
      console.log('✅ [ENCRYPTION] Clave maestra rotada exitosamente');
      return true;
      
    } catch (error) {
      logError(error, { context: 'rotate-master-key' });
      throw new Error('Error rotando clave maestra');
    }
  }

  /**
   * Obtener información del sistema de encriptación
   */
  getEncryptionInfo() {
    return {
      algorithm: this.algorithm,
      keyLength: this.keyLength,
      ivLength: this.ivLength,
      keyDerivationRounds: this.keyDerivationRounds,
      masterKeyAvailable: !!this.masterKey,
      masterKeyPath: this.getMasterKeyPath(),
      keyDerivationMethod: 'PBKDF2-SHA512'
    };
  }

  /**
   * Verificar integridad de datos encriptados
   */
  verifyIntegrity(encryptedData, context = 'default') {
    try {
      const parsed = JSON.parse(encryptedData);
      
      // Verificar estructura
      if (!parsed.iv || !parsed.data || !parsed.context) {
        return false;
      }
      
      // Verificar contexto
      if (parsed.context !== context) {
        return false;
      }
      
      // Intentar desencriptar para verificar integridad
      this.decrypt(encryptedData, context);
      
      return true;
      
    } catch (error) {
      return false;
    }
  }
}

// Instancia singleton
const simpleEncryption = new SimpleEncryption();

module.exports = simpleEncryption;
