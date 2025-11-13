const winston = require('winston');
const path = require('node:path');
const fs = require('node:fs');
const encryptionManager = require('../utils/simple-encryption');

/**
 * Transport personalizado para archivos encriptados
 */
class EncryptedFileTransport extends winston.Transport {
  constructor(options) {
    super(options);
    this.filename = options.filename;
    this.datePattern = options.datePattern;
    this.maxSize = options.maxSize;
    this.maxFiles = options.maxFiles;
    this.level = options.level;
    this.context = options.context;
    this.currentFile = null;
    this.currentSize = 0;
    this.buffer = '';
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    try {
      this.writeToEncryptedFile(info);
      callback();
    } catch (error) {
      callback(error);
    }
  }

  writeToEncryptedFile(info) {
    const now = new Date();
    const dateStr = this.formatDate(now, this.datePattern);
    const filename = this.filename.replace('%DATE%', dateStr);
    
    // Crear directorio si no existe
    const dir = path.dirname(filename);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0x1C0 }); // 0o700
    }

    // Si es un archivo nuevo, encriptar el contenido existente
    if (this.currentFile !== filename) {
      this.rotateFile(filename);
    }

    // Agregar nueva entrada al buffer
    const logEntry = JSON.stringify(info) + '\n';
    this.buffer += logEntry;
    this.currentSize += Buffer.byteLength(logEntry, 'utf8');

    // Verificar si necesitamos rotar el archivo
    if (this.shouldRotate()) {
      this.flushAndRotate();
    }
  }

  rotateFile(filename) {
    // Flush buffer anterior si existe
    if (this.buffer && this.currentFile) {
      this.flushBuffer();
    }

    this.currentFile = filename;
    this.currentSize = 0;
    this.buffer = '';

    // Cargar contenido existente si el archivo ya existe
    if (fs.existsSync(filename)) {
      try {
        const encryptedData = fs.readFileSync(filename, 'utf8');
        const decryptedData = encryptionManager.decrypt(encryptedData, this.context);
        this.buffer = decryptedData;
        this.currentSize = Buffer.byteLength(decryptedData, 'utf8');
      } catch (error) {
        console.warn('No se pudo cargar archivo encriptado existente:', error.message);
        this.buffer = '';
        this.currentSize = 0;
      }
    }
  }

  shouldRotate() {
    const maxSizeBytes = this.parseSize(this.maxSize);
    return this.currentSize >= maxSizeBytes;
  }

  parseSize(sizeStr) {
    const units = { 'k': 1024, 'm': 1024 * 1024, 'g': 1024 * 1024 * 1024 };
    const match = sizeStr.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([kmg])?$/);
    
    if (!match) return 20 * 1024 * 1024; // Default 20MB
    
    const size = Number.parseFloat(match[1]);
    const unit = match[2] || 'm';
    
    return Math.floor(size * units[unit]);
  }

  formatDate(date, pattern) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    
    return pattern
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hour)
      .replace('mm', minute)
      .replace('ss', second);
  }

  flushAndRotate() {
    this.flushBuffer();
    this.cleanupOldFiles();
  }

  flushBuffer() {
    if (this.buffer && this.currentFile) {
      try {
        const encryptedData = encryptionManager.encrypt(this.buffer, this.context);
        fs.writeFileSync(this.currentFile, encryptedData, { mode: 0x180 }); // 0o600
      } catch (error) {
        console.error('Error escribiendo archivo encriptado:', error.message);
      }
    }
  }

  cleanupOldFiles() {
    // Implementar limpieza de archivos antiguos
    // Esto se puede hacer de forma asíncrona
  }
}

/**
 * Logger encriptado para producción
 */
class EncryptedLogger {
  constructor() {
    this.logDir = path.join(process.cwd(), 'logs', 'encrypted');
    this.ensureLogDirectory();
    
    this.transports = this.createEncryptedTransports();
    this.logger = this.createLogger();
  }

  /**
   * Crear directorio de logs encriptados
   */
  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true, mode: 0x1C0 }); // 0o700
    }
  }

  /**
   * Crear transportes encriptados
   */
  createEncryptedTransports() {
    const transports = [
      // Console transport (logs en consola sin encriptar para debugging)
      new winston.transports.Console({
        level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ];

    // Siempre crear archivos encriptados (sin condición)
    // Logs encriptados
    transports.push(
      new EncryptedFileTransport({
        filename: path.join(this.logDir, 'application-%DATE%.enc'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        level: 'info',
        context: 'application'
      }),
      new EncryptedFileTransport({
        filename: path.join(this.logDir, 'error-%DATE%.enc'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '90d',
        level: 'error',
        context: 'error'
      }),
      new EncryptedFileTransport({
        filename: path.join(this.logDir, 'security-%DATE%.enc'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '365d',
        level: 'warn',
        context: 'security'
      }),
      new EncryptedFileTransport({
        filename: path.join(this.logDir, 'audit-%DATE%.enc'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '365d',
        level: 'info',
        context: 'audit'
      })
    );

    return transports;
  }

  /**
   * Crear logger
   */
  createLogger() {
    return winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
          const ts = typeof timestamp === 'string' ? timestamp : JSON.stringify(timestamp);
          const msg = typeof message === 'string' ? message : JSON.stringify(message);
          let st = '';
          if (stack) {
            st = typeof stack === 'string' ? stack : JSON.stringify(stack);
          }
          
          let log = `${ts} [${level.toUpperCase()}]: ${msg}`;
          
          if (st) {
            log += `\n${st}`;
    }
    
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
      ),
      transports: this.transports,
      exitOnError: false
    });
  }

  /**
   * Obtener logger
   */
  getLogger() {
    return this.logger;
  }

  /**
   * Desencriptar logs para análisis
   */
  async decryptLogs(logType = 'application', date = null) {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const filename = `${logType}-${targetDate}.enc`;
      const filepath = path.join(this.logDir, filename);
      
      if (!fs.existsSync(filepath)) {
        throw new Error(`Archivo de log no encontrado: ${filename}`);
      }

      const encryptedData = fs.readFileSync(filepath, 'utf8');
      const decryptedData = encryptionManager.decrypt(encryptedData, logType);
      
      return decryptedData;
      
    } catch (error) {
      console.error('Error desencriptando logs:', error.message);
      throw error;
    }
  }

  /**
   * Verificar integridad de logs encriptados
   */
  async verifyLogIntegrity(logType = 'application', date = null) {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const filename = `${logType}-${targetDate}.enc`;
      const filepath = path.join(this.logDir, filename);
      
      if (!fs.existsSync(filepath)) {
        return { exists: false, integrity: false };
      }

      const encryptedData = fs.readFileSync(filepath, 'utf8');
      const integrity = encryptionManager.verifyIntegrity(encryptedData, logType);
      
      return {
        exists: true,
        integrity: integrity,
        filepath: filepath,
        size: fs.statSync(filepath).size
      };
      
    } catch (error) {
      return {
        exists: false,
        integrity: false,
        error: error.message
      };
    }
  }

  /**
   * Obtener estadísticas de logs encriptados
   */
  getEncryptedLogStats() {
    try {
      const files = fs.readdirSync(this.logDir);
      const stats = {
        totalFiles: files.length,
        totalSize: 0,
        byType: {},
        byDate: {},
        encryptionEnabled: true
      };

      for (const file of files) {
        if (!file.endsWith('.enc')) continue;
        
        const filepath = path.join(this.logDir, file);
        const fileStats = fs.statSync(filepath);
        
        stats.totalSize += fileStats.size;
        
        // Extraer tipo y fecha del nombre del archivo
        const regex = /^(.+)-(\d{4}-\d{2}-\d{2})\.enc$/;
        const match = regex.exec(file);
        if (match) {
          const [, type, date] = match;
          
          if (!stats.byType[type]) {
            stats.byType[type] = { count: 0, size: 0 };
          }
          stats.byType[type].count++;
          stats.byType[type].size += fileStats.size;
          
          if (!stats.byDate[date]) {
            stats.byDate[date] = { count: 0, size: 0 };
          }
          stats.byDate[date].count++;
          stats.byDate[date].size += fileStats.size;
        }
      }

      return stats;
      
    } catch (error) {
      console.error('Error obteniendo estadísticas de logs:', error.message);
      return null;
    }
  }
}

// Instancia singleton
const encryptedLogger = new EncryptedLogger();

// Crear loggers específicos usando transportes encriptados
const logger = encryptedLogger.getLogger();

/**
 * Crea un logger con transporte encriptado
 * @param {string} context - Contexto del logger (security, audit, etc.)
 * @param {string} level - Nivel de log (info, warn, error, etc.)
 * @param {string} consoleLevel - Nivel para consola en producción
 * @returns {winston.Logger} - Logger configurado
 */
function createEncryptedLogger(context, level, consoleLevel = 'warn') {
  return winston.createLogger({
    level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console({
        level: process.env.NODE_ENV === 'production' ? consoleLevel : 'debug',
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }),
      new EncryptedFileTransport({
        filename: path.join(encryptedLogger.logDir, `${context}-%DATE%.enc`),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '365d',
        level,
        context
      })
    ]
  });
}

// Logger específico para seguridad (usa transporte encriptado de security)
const securityLogger = createEncryptedLogger('security', 'warn', 'warn');

// Logger específico para auditoría (usa transporte encriptado de audit)
const auditLogger = createEncryptedLogger('audit', 'info', 'info');

// Funciones de logging específicas
const logSecurity = (level, message, meta = {}) => {
  securityLogger.log(level, message, {
    ...meta,
    type: 'security',
    timestamp: new Date().toISOString()
  });
};

const logAudit = (action, userId, details = {}) => {
  auditLogger.info('Audit Event', {
    action,
    userId,
    details,
    type: 'audit',
    timestamp: new Date().toISOString(),
    ip: details.ip || 'unknown'
  });
};

const logError = (error, context = {}) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    ...context,
    type: 'error'
  });
};

const logInfo = (message, meta = {}) => {
  logger.info(message, meta);
};

const logWarning = (message, meta = {}) => {
  logger.warn(message, meta);
};

// Middleware para Express
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log de request
  logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || 'anonymous'
  });
  
  // Log de response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger.log(level, 'HTTP Response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: req.user?.id || 'anonymous'
    });
  });
  
  next();
};

// Exportar todas las funciones y clases del logger para compatibilidad con código existente
module.exports = {
  logger,
  securityLogger,
  auditLogger,
  logSecurity,
  logAudit,
  logError,
  logInfo,
  logWarning,
  requestLogger,
  // Exportar también las clases y la instancia del logger encriptado (para uso avanzado)
  encryptedLogger,
  EncryptedLogger,
  EncryptedFileTransport
};

