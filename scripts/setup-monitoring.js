#!/usr/bin/env node

/**
 * Script de configuración de monitoreo y backup automático
 */

const cron = require('node-cron');
const logBackup = require('../src/utils/log-backup');
const securityAlerts = require('../src/utils/security-alerts');
const { logInfo } = require('../src/config/logger');

console.log('🔧 CONFIGURANDO SISTEMA DE MONITOREO Y BACKUP\n');

// Configurar backup diario de logs
const setupLogBackup = () => {
  // Backup diario a las 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('🔄 [CRON] Iniciando backup diario de logs...');
    try {
      const result = await logBackup.performBackup();
      if (result.success) {
        console.log('✅ [CRON] Backup diario completado');
        logInfo('Backup diario de logs completado', result);
      } else {
        console.error('❌ [CRON] Error en backup diario:', result.error);
        await securityAlerts.sendSecurityAlert(
          'backup_failure',
          'high',
          'Error en backup diario de logs',
          result
        );
      }
    } catch (error) {
      console.error('❌ [CRON] Error crítico en backup:', error);
      await securityAlerts.sendSecurityAlert(
        'backup_critical_failure',
        'critical',
        'Error crítico en backup diario de logs',
        { error: error.message }
      );
    }
  }, {
    timezone: "America/Mexico_City"
  });

  console.log('✅ Backup diario configurado (2:00 AM)');
};

// Configurar limpieza semanal de logs antiguos
const setupLogCleanup = () => {
  // Limpieza semanal los domingos a las 3:00 AM
  cron.schedule('0 3 * * 0', async () => {
    console.log('🧹 [CRON] Iniciando limpieza semanal de logs...');
    try {
      const deletedCount = await logBackup.cleanupOldBackups();
      console.log(`✅ [CRON] Limpieza completada: ${deletedCount} archivos eliminados`);
      logInfo('Limpieza semanal de logs completada', { deletedCount });
    } catch (error) {
      console.error('❌ [CRON] Error en limpieza:', error);
    }
  }, {
    timezone: "America/Mexico_City"
  });

  console.log('✅ Limpieza semanal configurada (Domingos 3:00 AM)');
};

// Configurar reporte semanal de seguridad
const setupSecurityReport = () => {
  // Reporte semanal los lunes a las 9:00 AM
  cron.schedule('0 9 * * 1', async () => {
    console.log('📊 [CRON] Generando reporte semanal de seguridad...');
    try {
      const alertStats = securityAlerts.getAlertStats();
      const backupStats = logBackup.getBackupStats();
      
      await securityAlerts.sendSecurityAlert(
        'weekly_security_report',
        'info',
        'Reporte semanal de seguridad generado',
        {
          alerts: alertStats,
          backups: backupStats,
          week: new Date().toISOString().split('T')[0]
        }
      );
      
      console.log('✅ [CRON] Reporte semanal enviado');
      logInfo('Reporte semanal de seguridad generado', { alertStats, backupStats });
    } catch (error) {
      console.error('❌ [CRON] Error generando reporte:', error);
    }
  }, {
    timezone: "America/Mexico_City"
  });

  console.log('✅ Reporte semanal configurado (Lunes 9:00 AM)');
};

// Configurar verificación de salud del sistema
const setupHealthCheck = () => {
  // Verificación cada 5 minutos
  cron.schedule('*/5 * * * *', async () => {
    try {
      const os = require('os');
      const cpuUsage = process.cpuUsage();
      const memoryUsage = process.memoryUsage();
      const freeMemory = os.freemem();
      const totalMemory = os.totalmem();
      const memoryPercent = (totalMemory - freeMemory) / totalMemory;

      // Alertar si el uso de memoria es muy alto
      if (memoryPercent > 0.9) {
        await securityAlerts.sendSecurityAlert(
          'high_memory_usage',
          'high',
          `Uso de memoria crítico: ${(memoryPercent * 100).toFixed(2)}%`,
          {
            memoryPercent,
            freeMemory,
            totalMemory,
            processMemory: memoryUsage
          }
        );
      }

      // Alertar si el proceso ha estado corriendo por más de 7 días
      const uptime = process.uptime();
      if (uptime > 7 * 24 * 60 * 60) {
        await securityAlerts.sendSecurityAlert(
          'long_uptime',
          'medium',
          `Proceso corriendo por ${Math.floor(uptime / 86400)} días`,
          { uptime }
        );
      }

    } catch (error) {
      console.error('❌ [CRON] Error en verificación de salud:', error);
    }
  });

  console.log('✅ Verificación de salud configurada (cada 5 minutos)');
};

// Función principal
const setupMonitoring = () => {
  try {
    console.log('🚀 Iniciando configuración de monitoreo...\n');
    
    setupLogBackup();
    setupLogCleanup();
    setupSecurityReport();
    setupHealthCheck();
    
    console.log('\n✅ CONFIGURACIÓN COMPLETADA');
    console.log('📋 Tareas programadas:');
    console.log('  - Backup diario de logs: 2:00 AM');
    console.log('  - Limpieza semanal: Domingos 3:00 AM');
    console.log('  - Reporte semanal: Lunes 9:00 AM');
    console.log('  - Verificación de salud: Cada 5 minutos');
    
    console.log('\n🔧 Para detener las tareas programadas, presiona Ctrl+C');
    
    // Mantener el proceso corriendo
    process.on('SIGINT', () => {
      console.log('\n⏹️ Deteniendo tareas programadas...');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Error configurando monitoreo:', error);
    process.exit(1);
  }
};

// Ejecutar si es llamado directamente
if (require.main === module) {
  setupMonitoring();
}

module.exports = {
  setupLogBackup,
  setupLogCleanup,
  setupSecurityReport,
  setupHealthCheck,
  setupMonitoring
};
