const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');
const { logInfo, logError } = require('../config/logger');
const securityAlerts = require('./security-alerts');

/**
 * Sistema de monitoreo en tiempo real
 */
class RealtimeMonitoring {
  constructor() {
    this.metrics = {
      system: {},
      application: {},
      security: {},
      performance: {}
    };
    
    this.monitoringInterval = null;
    this.updateInterval = Number.parseInt(process.env.MONITORING_INTERVAL ?? '30000', 10); // 30 segundos
    this.alertThresholds = {
      cpu: Number.parseFloat(process.env.MONITORING_THRESHOLD_CPU ?? '0.8'), // 80%
      memory: Number.parseFloat(process.env.MONITORING_THRESHOLD_MEMORY ?? '0.85'), // 85%
      disk: Number.parseFloat(process.env.MONITORING_THRESHOLD_DISK ?? '0.9'), // 90%
      responseTime: Number.parseInt(process.env.MONITORING_THRESHOLD_RESPONSE_TIME ?? '1000', 10), // 1 segundo
      errorRate: Number.parseFloat(process.env.MONITORING_THRESHOLD_ERROR_RATE ?? '0.05') // 5%
    };
    
    this.requestMetrics = {
      total: 0,
      errors: 0,
      responseTimes: [],
      lastReset: Date.now()
    };
    
    this.startMonitoring();
  }

  /**
   * Iniciar monitoreo
   */
  startMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.checkThresholds();
    }, this.updateInterval);
    
    // Usar unref() para que el intervalo no mantenga el proceso vivo
    // Esto es importante para tests y cuando el proceso necesita terminar
    if (this.monitoringInterval && typeof this.monitoringInterval.unref === 'function') {
      this.monitoringInterval.unref();
    }

    console.log(`📊 [MONITORING] Monitoreo en tiempo real iniciado (intervalo: ${this.updateInterval}ms)`);
  }

  /**
   * Detener monitoreo
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('⏹️ [MONITORING] Monitoreo detenido');
    }
  }

  /**
   * Recopilar métricas del sistema
   */
  collectMetrics() {
    try {
      // Métricas del sistema
      this.metrics.system = {
        cpu: this.getCpuUsage(),
        memory: this.getMemoryUsage(),
        disk: this.getDiskUsage(),
        uptime: os.uptime(),
        loadAverage: os.loadavg(),
        timestamp: new Date().toISOString()
      };

      // Métricas de la aplicación
      this.metrics.application = {
        nodeVersion: process.version,
        platform: os.platform(),
        arch: os.arch(),
        pid: process.pid,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString()
      };

      // Métricas de rendimiento
      this.metrics.performance = {
        requestCount: this.requestMetrics.total,
        errorCount: this.requestMetrics.errors,
        errorRate: this.requestMetrics.total > 0 ? this.requestMetrics.errors / this.requestMetrics.total : 0,
        averageResponseTime: this.calculateAverageResponseTime(),
        timestamp: new Date().toISOString()
      };

      // Métricas de seguridad
      this.metrics.security = {
        blockedIPs: this.getBlockedIPsCount(),
        failedLogins: this.getFailedLoginsCount(),
        suspiciousActivity: this.getSuspiciousActivityCount(),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logError(error, { context: 'realtime-monitoring' });
    }
  }

  /**
   * Obtener uso de CPU
   */
  getCpuUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    }

    return {
      cores: cpus.length,
      model: cpus[0].model,
      speed: cpus[0].speed,
      usage: 1 - (totalIdle / totalTick)
    };
  }

  /**
   * Obtener uso de memoria
   */
  getMemoryUsage() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;

    return {
      total: total,
      used: used,
      free: free,
      usage: used / total
    };
  }

  /**
   * Obtener uso de disco
   */
  getDiskUsage() {
    try {
      fs.statSync(process.cwd());
      // En un entorno real, usaría una librería como 'diskusage'
      // Por ahora, simulamos el uso de disco
      return {
        total: 1000000000, // 1GB simulado
        used: 500000000,   // 500MB simulado
        free: 500000000,   // 500MB simulado
        usage: 0.5
      };
    } catch (error) {
      console.error('Error obteniendo uso de disco:', error);
      return {
        total: 0,
        used: 0,
        free: 0,
        usage: 0
      };
    }
  }

  /**
   * Calcular tiempo promedio de respuesta
   */
  calculateAverageResponseTime() {
    if (this.requestMetrics.responseTimes.length === 0) return 0;
    
    const sum = this.requestMetrics.responseTimes.reduce((a, b) => a + b, 0);
    return sum / this.requestMetrics.responseTimes.length;
  }

  /**
   * Obtener número de IPs bloqueadas
   */
  getBlockedIPsCount() {
    // Esta función debería obtener datos del sistema de monitoreo de seguridad
    return 0; // Placeholder
  }

  /**
   * Obtener número de logins fallidos
   */
  getFailedLoginsCount() {
    // Esta función debería obtener datos del sistema de monitoreo de seguridad
    return 0; // Placeholder
  }

  /**
   * Obtener número de actividades sospechosas
   */
  getSuspiciousActivityCount() {
    // Esta función debería obtener datos del sistema de monitoreo de seguridad
    return 0; // Placeholder
  }

  /**
   * Verificar umbrales y enviar alertas
   */
  async checkThresholds() {
    try {
      // Verificar CPU
      if (this.metrics.system.cpu.usage > this.alertThresholds.cpu) {
        await securityAlerts.alertResourceUsage(
          'cpu',
          this.metrics.system.cpu.usage,
          this.alertThresholds.cpu
        );
      }

      // Verificar memoria
      if (this.metrics.system.memory.usage > this.alertThresholds.memory) {
        await securityAlerts.alertResourceUsage(
          'memory',
          this.metrics.system.memory.usage,
          this.alertThresholds.memory
        );
      }

      // Verificar disco
      if (this.metrics.system.disk.usage > this.alertThresholds.disk) {
        await securityAlerts.alertResourceUsage(
          'disk',
          this.metrics.system.disk.usage,
          this.alertThresholds.disk
        );
      }

      // Verificar tasa de errores
      if (this.metrics.performance.errorRate > this.alertThresholds.errorRate) {
        await securityAlerts.alertHighErrorRate(
          this.metrics.performance.errorRate,
          this.metrics.performance.requestCount
        );
      }

      // Verificar tiempo de respuesta
      if (this.metrics.performance.averageResponseTime > this.alertThresholds.responseTime) {
        await securityAlerts.sendSecurityAlert(
          'high_response_time',
          'medium',
          `Tiempo de respuesta alto: ${this.metrics.performance.averageResponseTime}ms`,
          { responseTime: this.metrics.performance.averageResponseTime }
        );
      }

    } catch (error) {
      logError(error, { context: 'threshold-checking' });
    }
  }

  /**
   * Registrar request
   */
  recordRequest(responseTime, isError = false) {
    this.requestMetrics.total++;
    this.requestMetrics.responseTimes.push(responseTime);
    
    if (isError) {
      this.requestMetrics.errors++;
    }

    // Mantener solo los últimos N tiempos de respuesta (configurable)
    const maxResponseTimes = Number.parseInt(process.env.MONITORING_MAX_RESPONSE_TIMES ?? '1000', 10);
    if (this.requestMetrics.responseTimes.length > maxResponseTimes) {
      this.requestMetrics.responseTimes = this.requestMetrics.responseTimes.slice(-maxResponseTimes);
    }
  }

  /**
   * Obtener métricas actuales
   */
  getMetrics() {
    return {
      ...this.metrics,
      thresholds: this.alertThresholds,
      monitoring: {
        interval: this.updateInterval,
        active: !!this.monitoringInterval,
        lastUpdate: new Date().toISOString()
      }
    };
  }

  /**
   * Obtener métricas en formato simplificado
   */
  getSimpleMetrics() {
    return {
      cpu: Math.round(this.metrics.system.cpu.usage * 100),
      memory: Math.round(this.metrics.system.memory.usage * 100),
      disk: Math.round(this.metrics.system.disk.usage * 100),
      requests: this.requestMetrics.total,
      errors: this.requestMetrics.errors,
      errorRate: Math.round(this.metrics.performance.errorRate * 100),
      responseTime: Math.round(this.metrics.performance.averageResponseTime),
      uptime: Math.round(process.uptime())
    };
  }

  /**
   * Resetear métricas
   */
  resetMetrics() {
    this.requestMetrics = {
      total: 0,
      errors: 0,
      responseTimes: [],
      lastReset: Date.now()
    };
    
    console.log('🔄 [MONITORING] Métricas reseteadas');
  }

  /**
   * Obtener historial de métricas (últimas 24 horas)
   */
  getMetricsHistory() {
    // En una implementación real, esto vendría de una base de datos
    // Por ahora, devolvemos las métricas actuales
    return {
      current: this.getMetrics(),
      history: [] // Placeholder para historial
    };
  }
}

// Instancia singleton
const realtimeMonitoring = new RealtimeMonitoring();

module.exports = realtimeMonitoring;
