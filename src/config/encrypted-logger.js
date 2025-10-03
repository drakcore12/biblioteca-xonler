const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');
const encryptionManager = require('../utils/simple-encryption');

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
      // Console transport (sin encriptar para desarrollo)
      new winston.transports.Console({
        level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ];

    // Solo crear archivos encriptados en producción
    if (process.env.NODE_ENV === 'production' && process.env.LOG_ENCRYPTION === 'true') {
      // Log general encriptado
      transports.push(new EncryptedFileTransport({
        filename: path.join(this.logDir, 'application-%DATE%.enc'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        level: 'info',
        context: 'application'
      }));

      // Log de errores encriptado
      transports.push(new EncryptedFileTransport({
        filename: path.join(this.logDir, 'error-%DATE%.enc'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '90d',
        level: 'error',
        context: 'error'
      }));

      // Log de seguridad encriptado
      transports.push(new EncryptedFileTransport({
        filename: path.join(this.logDir, 'security-%DATE%.enc'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '365d',
        level: 'warn',
        context: 'security'
      }));

      // Log de auditoría encriptado
      transports.push(new EncryptedFileTransport({
        filename: path.join(this.logDir, 'audit-%DATE%.enc'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '365d',
        level: 'info',
        context: 'audit'
      }));
    } else {
      // Logs normales para desarrollo
      const normalLogDir = path.join(process.cwd(), 'logs');
      
      transports.push(new DailyRotateFile({
        filename: path.join(normalLogDir, 'application-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        level: 'info'
      }));

      transports.push(new DailyRotateFile({
        filename: path.join(normalLogDir, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        level: 'error'
      }));
    }

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
          let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
          
          if (stack) {
            log += `\n${stack}`;
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
        encryptionEnabled: process.env.LOG_ENCRYPTION === 'true'
      };

      files.forEach(file => {
        if (file.endsWith('.enc')) {
          const filepath = path.join(this.logDir, file);
          const fileStats = fs.statSync(filepath);
          
          stats.totalSize += fileStats.size;
          
          // Extraer tipo y fecha del nombre del archivo
          const match = file.match(/^(.+)-(\d{4}-\d{2}-\d{2})\.enc$/);
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
      });

      return stats;
      
    } catch (error) {
      console.error('Error obteniendo estadísticas de logs:', error.message);
      return null;
    }
  }
}

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
    const match = sizeStr.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(k|m|g)?$/);
    
    if (!match) return 20 * 1024 * 1024; // Default 20MB
    
    const size = parseFloat(match[1]);
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

// Instancia singleton
const encryptedLogger = new EncryptedLogger();

module.exports = {
  encryptedLogger,
  EncryptedLogger,
  EncryptedFileTransport
};
