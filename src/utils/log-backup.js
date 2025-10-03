const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const { logInfo, logError } = require('../config/logger');
const encryptionManager = require('./simple-encryption');

const execAsync = promisify(exec);

/**
 * Sistema de backup de logs
 */
class LogBackup {
  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.backupDir = path.join(process.cwd(), 'backups', 'logs');
    this.retentionDays = parseInt(process.env.LOG_RETENTION_DAYS) || 30;
    this.compressionEnabled = process.env.LOG_COMPRESSION !== 'false';
    this.encryptionEnabled = process.env.LOG_ENCRYPTION === 'true';
    this.encryptionKey = process.env.LOG_ENCRYPTION_KEY;
    
    this.ensureBackupDirectory();
  }

  /**
   * Crear directorio de backup si no existe
   */
  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      console.log(`📁 [BACKUP] Directorio de backup creado: ${this.backupDir}`);
    }
  }

  /**
   * Ejecutar backup completo de logs
   */
  async performBackup() {
    try {
      console.log('🔄 [BACKUP] Iniciando backup de logs...');
      
      const timestamp = new Date().toISOString().split('T')[0];
      const backupName = `logs-backup-${timestamp}`;
      const backupPath = path.join(this.backupDir, backupName);

      // Crear directorio de backup para esta fecha
      if (!fs.existsSync(backupPath)) {
        fs.mkdirSync(backupPath, { recursive: true });
      }

      // Copiar archivos de log
      await this.copyLogFiles(backupPath);

      // Comprimir si está habilitado
      if (this.compressionEnabled) {
        await this.compressBackup(backupPath);
      }

      // Encriptar si está habilitado
      if (this.encryptionEnabled && this.encryptionKey) {
        await this.encryptBackup(backupPath);
      }

      // Limpiar backups antiguos
      await this.cleanupOldBackups();

      // Generar reporte de backup
      await this.generateBackupReport(backupPath, timestamp);

      logInfo('Backup de logs completado exitosamente', {
        backupPath,
        timestamp,
        compression: this.compressionEnabled,
        encryption: this.encryptionEnabled
      });

      console.log('✅ [BACKUP] Backup de logs completado');
      return { success: true, backupPath, timestamp };

    } catch (error) {
      logError(error, { context: 'log-backup' });
      console.error('❌ [BACKUP] Error en backup de logs:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Copiar archivos de log
   */
  async copyLogFiles(backupPath) {
    const logFiles = fs.readdirSync(this.logDir)
      .filter(file => file.endsWith('.log'))
      .map(file => ({
        source: path.join(this.logDir, file),
        destination: path.join(backupPath, file)
      }));

    for (const file of logFiles) {
      try {
        fs.copyFileSync(file.source, file.destination);
        console.log(`📄 [BACKUP] Copiado: ${file.source} -> ${file.destination}`);
      } catch (error) {
        console.error(`❌ [BACKUP] Error copiando ${file.source}:`, error.message);
      }
    }

    return logFiles.length;
  }

  /**
   * Comprimir backup
   */
  async compressBackup(backupPath) {
    try {
      const compressedFile = `${backupPath}.tar.gz`;
      
      // Crear archivo tar.gz
      await execAsync(`tar -czf "${compressedFile}" -C "${path.dirname(backupPath)}" "${path.basename(backupPath)}"`);
      
      // Eliminar directorio original
      fs.rmSync(backupPath, { recursive: true, force: true });
      
      console.log(`🗜️ [BACKUP] Backup comprimido: ${compressedFile}`);
      return compressedFile;
    } catch (error) {
      console.error('❌ [BACKUP] Error comprimiendo backup:', error.message);
      throw error;
    }
  }

  /**
   * Encriptar backup usando el sistema de encriptación
   */
  async encryptBackup(backupPath) {
    try {
      if (!this.encryptionEnabled || !this.encryptionKey) {
        console.log('⚠️ [BACKUP] Encriptación deshabilitada o clave no disponible');
        return backupPath;
      }

      console.log(`🔐 [BACKUP] Encriptando backup: ${backupPath}`);
      
      // Leer archivo de backup
      const backupData = fs.readFileSync(backupPath, 'utf8');
      
      // Encriptar usando el sistema de encriptación
      const encryptedData = encryptionManager.encrypt(backupData, 'backup');
      
      // Guardar archivo encriptado
      const encryptedPath = `${backupPath}.enc`;
      fs.writeFileSync(encryptedPath, encryptedData, { mode: 0x180 }); // 0o600
      
      // Eliminar archivo sin encriptar
      fs.unlinkSync(backupPath);
      
      console.log(`✅ [BACKUP] Backup encriptado: ${encryptedPath}`);
      return encryptedPath;
      
    } catch (error) {
      console.error('❌ [BACKUP] Error encriptando backup:', error.message);
      throw error;
    }
  }

  /**
   * Limpiar backups antiguos
   */
  async cleanupOldBackups() {
    try {
      const files = fs.readdirSync(this.backupDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

      let deletedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.rmSync(filePath, { recursive: true, force: true });
          deletedCount++;
          console.log(`🗑️ [BACKUP] Eliminado backup antiguo: ${file}`);
        }
      }

      if (deletedCount > 0) {
        console.log(`🧹 [BACKUP] Limpieza completada: ${deletedCount} archivos eliminados`);
      }

      return deletedCount;
    } catch (error) {
      console.error('❌ [BACKUP] Error en limpieza:', error.message);
      return 0;
    }
  }

  /**
   * Generar reporte de backup
   */
  async generateBackupReport(backupPath, timestamp) {
    try {
      const report = {
        timestamp: new Date().toISOString(),
        backupDate: timestamp,
        backupPath: backupPath,
        logFiles: [],
        totalSize: 0,
        compression: this.compressionEnabled,
        encryption: this.encryptionEnabled,
        retentionDays: this.retentionDays
      };

      // Obtener información de archivos
      const files = fs.readdirSync(backupPath);
      for (const file of files) {
        const filePath = path.join(backupPath, file);
        const stats = fs.statSync(filePath);
        
        report.logFiles.push({
          name: file,
          size: stats.size,
          modified: stats.mtime
        });
        
        report.totalSize += stats.size;
      }

      // Guardar reporte
      const reportPath = path.join(backupPath, 'backup-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

      console.log(`📊 [BACKUP] Reporte generado: ${reportPath}`);
      return report;
    } catch (error) {
      console.error('❌ [BACKUP] Error generando reporte:', error.message);
      return null;
    }
  }

  /**
   * Restaurar backup
   */
  async restoreBackup(backupPath) {
    try {
      console.log(`🔄 [BACKUP] Restaurando backup desde: ${backupPath}`);
      
      // Verificar que el backup existe
      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup no encontrado: ${backupPath}`);
      }

      // Desencriptar si es necesario
      if (this.encryptionEnabled && backupPath.endsWith('.enc')) {
        await this.decryptBackup(backupPath);
        backupPath = backupPath.replace('.enc', '');
      }

      // Descomprimir si es necesario
      if (backupPath.endsWith('.tar.gz')) {
        await this.decompressBackup(backupPath);
        backupPath = backupPath.replace('.tar.gz', '');
      }

      // Restaurar archivos
      const files = fs.readdirSync(backupPath);
      for (const file of files) {
        if (file.endsWith('.log')) {
          const source = path.join(backupPath, file);
          const destination = path.join(this.logDir, file);
          fs.copyFileSync(source, destination);
          console.log(`📄 [BACKUP] Restaurado: ${file}`);
        }
      }

      console.log('✅ [BACKUP] Restauración completada');
      return { success: true };

    } catch (error) {
      logError(error, { context: 'log-restore', backupPath });
      console.error('❌ [BACKUP] Error restaurando backup:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Desencriptar backup
   */
  async decryptBackup(encryptedPath) {
    try {
      console.log(`🔓 [BACKUP] Desencriptando: ${encryptedPath}`);
      
      // Leer archivo encriptado
      const encryptedData = fs.readFileSync(encryptedPath, 'utf8');
      
      // Desencriptar usando el sistema de encriptación
      const decryptedData = encryptionManager.decrypt(encryptedData, 'backup');
      
      // Guardar archivo desencriptado
      const decryptedPath = encryptedPath.replace('.enc', '');
      fs.writeFileSync(decryptedPath, decryptedData, { mode: 0x180 }); // 0o600
      
      console.log(`✅ [BACKUP] Backup desencriptado: ${decryptedPath}`);
      return decryptedPath;
      
    } catch (error) {
      console.error('❌ [BACKUP] Error desencriptando backup:', error.message);
      throw error;
    }
  }

  /**
   * Descomprimir backup
   */
  async decompressBackup(compressedPath) {
    try {
      const extractPath = compressedPath.replace('.tar.gz', '');
      await execAsync(`tar -xzf "${compressedPath}" -C "${path.dirname(compressedPath)}"`);
      console.log(`📦 [BACKUP] Descomprimido: ${compressedPath}`);
      return extractPath;
    } catch (error) {
      console.error('❌ [BACKUP] Error descomprimiendo:', error.message);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de backup
   */
  getBackupStats() {
    try {
      const files = fs.readdirSync(this.backupDir);
      const stats = {
        totalBackups: files.length,
        totalSize: 0,
        oldestBackup: null,
        newestBackup: null,
        retentionDays: this.retentionDays
      };

      let oldestDate = null;
      let newestDate = null;

      for (const file of files) {
        const filePath = path.join(this.backupDir, file);
        const fileStats = fs.statSync(filePath);
        
        stats.totalSize += fileStats.size;
        
        if (!oldestDate || fileStats.mtime < oldestDate) {
          oldestDate = fileStats.mtime;
          stats.oldestBackup = file;
        }
        
        if (!newestDate || fileStats.mtime > newestDate) {
          newestDate = fileStats.mtime;
          stats.newestBackup = file;
        }
      }

      return stats;
    } catch (error) {
      console.error('❌ [BACKUP] Error obteniendo estadísticas:', error.message);
      return null;
    }
  }
}

// Instancia singleton
const logBackup = new LogBackup();

module.exports = logBackup;
