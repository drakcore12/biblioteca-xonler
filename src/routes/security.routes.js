const express = require('express');
const router = express.Router();
const { hybridAuth } = require('../middleware/hybrid-auth');
const securityMonitoring = require('../middleware/security-monitoring');
const jwtRotation = require('../utils/jwt-rotation');
const { logAudit } = require('../config/logger');
const securityAlerts = require('../utils/security-alerts');
const logBackup = require('../utils/log-backup');
const realtimeMonitoring = require('../utils/realtime-monitoring');
const encryptionManager = require('../utils/simple-encryption');
const { encryptedLogger } = require('../config/encrypted-logger');

// Middleware para requerir rol de administrador
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Acceso denegado', 
      message: 'Se requiere rol de administrador' 
    });
  }
  next();
};

// GET /api/security/stats - Estadísticas de seguridad
router.get('/stats', hybridAuth, requireAdmin, (req, res) => {
  try {
    const stats = securityMonitoring.getSecurityStats();
    const jwtInfo = jwtRotation.getKeyInfo();
    
    res.json({
      success: true,
      data: {
        security: stats,
        jwt: jwtInfo,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas de seguridad:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener las estadísticas de seguridad'
    });
  }
});

// POST /api/security/rotate-jwt - Forzar rotación de claves JWT
router.post('/rotate-jwt', hybridAuth, requireAdmin, (req, res) => {
  try {
    const newKeyId = jwtRotation.forceRotation();
    
    logAudit('JWT_ROTATION', req.user.id, {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      newKeyId: newKeyId
    });
    
    res.json({
      success: true,
      message: 'Rotación de claves JWT ejecutada exitosamente',
      data: {
        newKeyId: newKeyId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error en rotación de JWT:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudo ejecutar la rotación de claves JWT'
    });
  }
});

// GET /api/security/jwt-info - Información de claves JWT
router.get('/jwt-info', hybridAuth, requireAdmin, (req, res) => {
  try {
    const jwtInfo = jwtRotation.getKeyInfo();
    
    res.json({
      success: true,
      data: jwtInfo
    });
  } catch (error) {
    console.error('Error obteniendo información JWT:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudo obtener la información de claves JWT'
    });
  }
});

// POST /api/security/revoke-jwt - Revocar clave JWT específica
router.post('/revoke-jwt', hybridAuth, requireAdmin, (req, res) => {
  try {
    const { keyId } = req.body;
    
    if (!keyId) {
      return res.status(400).json({ 
        error: 'Parámetro requerido',
        message: 'Se requiere el ID de la clave a revocar'
      });
    }
    
    const revoked = jwtRotation.revokeKey(keyId);
    
    if (revoked) {
      logAudit('JWT_REVOKE', req.user.id, {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        revokedKeyId: keyId
      });
      
      res.json({
        success: true,
        message: 'Clave JWT revocada exitosamente',
        data: { revokedKeyId: keyId }
      });
    } else {
      res.status(404).json({ 
        error: 'Clave no encontrada',
        message: 'La clave especificada no existe'
      });
    }
  } catch (error) {
    console.error('Error revocando clave JWT:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudo revocar la clave JWT'
    });
  }
});

// GET /api/security/audit-logs - Logs de auditoría (últimos 100)
router.get('/audit-logs', hybridAuth, requireAdmin, (req, res) => {
  try {
    // En una implementación real, esto leería de la base de datos o archivos de log
    // Por ahora, devolvemos un mensaje informativo
    res.json({
      success: true,
      message: 'Los logs de auditoría se encuentran en el directorio logs/',
      data: {
        logFiles: [
          'audit-YYYY-MM-DD.log',
          'security-YYYY-MM-DD.log',
          'error-YYYY-MM-DD.log'
        ],
        location: './logs/',
        note: 'Los logs se rotan diariamente y se mantienen según la configuración'
      }
    });
  } catch (error) {
    console.error('Error obteniendo logs de auditoría:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener los logs de auditoría'
    });
  }
});

// GET /api/security/monitoring - Métricas de monitoreo en tiempo real
router.get('/monitoring', hybridAuth, requireAdmin, (req, res) => {
  try {
    const metrics = realtimeMonitoring.getMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error obteniendo métricas de monitoreo:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener las métricas de monitoreo'
    });
  }
});

// GET /api/security/monitoring/simple - Métricas simplificadas
router.get('/monitoring/simple', hybridAuth, requireAdmin, (req, res) => {
  try {
    const metrics = realtimeMonitoring.getSimpleMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error obteniendo métricas simplificadas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener las métricas simplificadas'
    });
  }
});

// POST /api/security/backup - Ejecutar backup de logs
router.post('/backup', hybridAuth, requireAdmin, async (req, res) => {
  try {
    const result = await logBackup.performBackup();
    
    logAudit('LOG_BACKUP', req.user.id, {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      success: result.success
    });
    
    res.json({
      success: result.success,
      message: result.success ? 'Backup de logs ejecutado exitosamente' : 'Error en backup de logs',
      data: result
    });
  } catch (error) {
    console.error('Error ejecutando backup:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudo ejecutar el backup de logs'
    });
  }
});

// GET /api/security/backup/stats - Estadísticas de backup
router.get('/backup/stats', hybridAuth, requireAdmin, (req, res) => {
  try {
    const stats = logBackup.getBackupStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas de backup:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener las estadísticas de backup'
    });
  }
});

// GET /api/security/alerts - Estadísticas de alertas
router.get('/alerts', hybridAuth, requireAdmin, (req, res) => {
  try {
    const stats = securityAlerts.getAlertStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas de alertas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener las estadísticas de alertas'
    });
  }
});

// POST /api/security/test-alert - Probar sistema de alertas
router.post('/test-alert', hybridAuth, requireAdmin, async (req, res) => {
  try {
    const { severity = 'medium', message = 'Alerta de prueba' } = req.body;
    
    await securityAlerts.sendSecurityAlert(
      'test_alert',
      severity,
      message,
      { test: true, timestamp: new Date().toISOString() }
    );
    
    res.json({
      success: true,
      message: 'Alerta de prueba enviada exitosamente'
    });
  } catch (error) {
    console.error('Error enviando alerta de prueba:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudo enviar la alerta de prueba'
    });
  }
});

// GET /api/security/encryption/info - Información del sistema de encriptación
router.get('/encryption/info', hybridAuth, requireAdmin, (req, res) => {
  try {
    const info = encryptionManager.getEncryptionInfo();
    res.json({
      success: true,
      data: info
    });
  } catch (error) {
    console.error('Error obteniendo información de encriptación:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudo obtener la información de encriptación'
    });
  }
});

// POST /api/security/encryption/rotate-key - Rotar clave maestra
router.post('/encryption/rotate-key', hybridAuth, requireAdmin, async (req, res) => {
  try {
    const result = await encryptionManager.rotateMasterKey();
    
    logAudit('ENCRYPTION_KEY_ROTATION', req.user.id, {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      success: result
    });
    
    res.json({
      success: result,
      message: result ? 'Clave maestra rotada exitosamente' : 'Error rotando clave maestra'
    });
  } catch (error) {
    console.error('Error rotando clave maestra:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudo rotar la clave maestra'
    });
  }
});

// GET /api/security/encryption/logs/stats - Estadísticas de logs encriptados
router.get('/encryption/logs/stats', hybridAuth, requireAdmin, (req, res) => {
  try {
    const stats = encryptedLogger.getEncryptedLogStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas de logs encriptados:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener las estadísticas de logs encriptados'
    });
  }
});

// POST /api/security/encryption/logs/decrypt - Desencriptar logs para análisis
router.post('/encryption/logs/decrypt', hybridAuth, requireAdmin, async (req, res) => {
  try {
    const { logType = 'application', date = null } = req.body;
    
    const decryptedData = await encryptedLogger.decryptLogs(logType, date);
    
    logAudit('LOG_DECRYPTION', req.user.id, {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      logType,
      date
    });
    
    res.json({
      success: true,
      data: {
        logType,
        date: date || new Date().toISOString().split('T')[0],
        content: decryptedData
      }
    });
  } catch (error) {
    console.error('Error desencriptando logs:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudieron desencriptar los logs'
    });
  }
});

// GET /api/security/encryption/logs/verify - Verificar integridad de logs encriptados
router.get('/encryption/logs/verify', hybridAuth, requireAdmin, async (req, res) => {
  try {
    const { logType = 'application', date = null } = req.query;
    
    const verification = await encryptedLogger.verifyLogIntegrity(logType, date);
    
    res.json({
      success: true,
      data: verification
    });
  } catch (error) {
    console.error('Error verificando integridad de logs:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudo verificar la integridad de los logs'
    });
  }
});

// POST /api/security/encryption/test - Probar sistema de encriptación
router.post('/encryption/test', hybridAuth, requireAdmin, async (req, res) => {
  try {
    const { data = 'Datos de prueba para encriptación' } = req.body;
    const context = 'test';
    
    // Encriptar datos de prueba
    const encrypted = encryptionManager.encrypt(data, context);
    
    // Desencriptar para verificar
    const decrypted = encryptionManager.decrypt(encrypted, context);
    
    // Verificar integridad
    const integrity = encryptionManager.verifyIntegrity(encrypted, context);
    
    logAudit('ENCRYPTION_TEST', req.user.id, {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      success: data === decrypted && integrity
    });
    
    res.json({
      success: true,
      message: 'Prueba de encriptación exitosa',
      data: {
        original: data,
        encrypted: encrypted.substring(0, 100) + '...',
        decrypted: decrypted,
        integrity: integrity,
        match: data === decrypted
      }
    });
  } catch (error) {
    console.error('Error en prueba de encriptación:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'Error en la prueba de encriptación'
    });
  }
});

module.exports = router;
