const { logSecurity, logError } = require('../config/logger');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

/**
 * Sistema de alertas de seguridad
 */
class SecurityAlerts {
  constructor() {
    this.alertThresholds = {
      failedLogins: 5, // Alertas después de 5 intentos fallidos
      suspiciousActivity: 3, // Alertas después de 3 actividades sospechosas
      blockedIPs: 10, // Alertas cuando hay 10+ IPs bloqueadas
      errorRate: 0.1, // Alertas cuando la tasa de errores es > 10%
      memoryUsage: 0.9, // Alertas cuando el uso de memoria es > 90%
      diskUsage: 0.85 // Alertas cuando el uso de disco es > 85%
    };
    
    this.alertHistory = new Map();
    this.cooldownPeriod = 5 * 60 * 1000; // 5 minutos de cooldown
    this.notificationChannels = this.initializeNotificationChannels();
  }

  /**
   * Inicializar canales de notificación
   */
  initializeNotificationChannels() {
    const channels = {
      email: null,
      webhook: null,
      file: true
    };

    // Configurar email si está disponible
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      channels.email = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }

    // Configurar webhook si está disponible
    if (process.env.WEBHOOK_URL) {
      channels.webhook = process.env.WEBHOOK_URL;
    }

    return channels;
  }

  /**
   * Verificar si debe enviar alerta (cooldown)
   */
  shouldSendAlert(alertType, identifier) {
    const key = `${alertType}_${identifier}`;
    const lastAlert = this.alertHistory.get(key);
    
    if (!lastAlert) return true;
    
    const timeSinceLastAlert = Date.now() - lastAlert;
    return timeSinceLastAlert > this.cooldownPeriod;
  }

  /**
   * Registrar tiempo de alerta
   */
  recordAlert(alertType, identifier) {
    const key = `${alertType}_${identifier}`;
    this.alertHistory.set(key, Date.now());
  }

  /**
   * Enviar alerta de seguridad
   */
  async sendSecurityAlert(alertType, severity, message, data = {}) {
    const alert = {
      type: alertType,
      severity: severity, // 'low', 'medium', 'high', 'critical'
      message: message,
      data: data,
      timestamp: new Date().toISOString(),
      server: process.env.SERVER_NAME || 'biblioteca-xonler',
      environment: process.env.NODE_ENV || 'development'
    };

    // Log de la alerta
    logSecurity(severity === 'critical' ? 'error' : 'warn', `ALERTA DE SEGURIDAD: ${message}`, alert);

    // Enviar a todos los canales configurados
    const promises = [];

    // Archivo de alertas
    if (this.notificationChannels.file) {
      promises.push(this.sendToFile(alert));
    }

    // Email
    if (this.notificationChannels.email) {
      promises.push(this.sendToEmail(alert));
    }

    // Webhook
    if (this.notificationChannels.webhook) {
      promises.push(this.sendToWebhook(alert));
    }

    try {
      await Promise.allSettled(promises);
      console.log(`🚨 [ALERT] Alerta de seguridad enviada: ${alertType}`);
    } catch (error) {
      logError(error, { context: 'security-alerts', alertType });
    }
  }

  /**
   * Enviar alerta a archivo
   */
  async sendToFile(alert) {
    const alertDir = path.join(process.cwd(), 'logs', 'alerts');
    if (!fs.existsSync(alertDir)) {
      fs.mkdirSync(alertDir, { recursive: true });
    }

    const filename = `security-alerts-${new Date().toISOString().split('T')[0]}.log`;
    const filepath = path.join(alertDir, filename);
    
    const logEntry = `${alert.timestamp} [${alert.severity.toUpperCase()}] ${alert.type}: ${alert.message}\n`;
    fs.appendFileSync(filepath, logEntry);
  }

  /**
   * Enviar alerta por email
   */
  async sendToEmail(alert) {
    if (!this.notificationChannels.email) return;

    const subject = `🚨 Alerta de Seguridad - ${alert.severity.toUpperCase()}`;
    const html = this.generateEmailTemplate(alert);

    await this.notificationChannels.email.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.ALERT_EMAIL || process.env.SMTP_USER,
      subject: subject,
      html: html
    });
  }

  /**
   * Enviar alerta a webhook
   */
  async sendToWebhook(alert) {
    if (!this.notificationChannels.webhook) return;

    const fetch = require('node-fetch');
    
    try {
      await fetch(this.notificationChannels.webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.WEBHOOK_TOKEN || ''}`
        },
        body: JSON.stringify(alert)
      });
    } catch (error) {
      console.error('Error enviando webhook:', error.message);
    }
  }

  /**
   * Generar template de email
   */
  generateEmailTemplate(alert) {
    const severityColors = {
      low: '#28a745',
      medium: '#ffc107',
      high: '#fd7e14',
      critical: '#dc3545'
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: ${severityColors[alert.severity]}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; }
          .alert-details { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .data-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .data-table th, .data-table td { padding: 8px; text-align: left; border-bottom: 1px solid #dee2e6; }
          .data-table th { background-color: #e9ecef; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 Alerta de Seguridad</h1>
            <p>Severidad: ${alert.severity.toUpperCase()}</p>
          </div>
          <div class="content">
            <h2>${alert.message}</h2>
            <div class="alert-details">
              <h3>Detalles de la Alerta</h3>
              <table class="data-table">
                <tr><th>Tipo</th><td>${alert.type}</td></tr>
                <tr><th>Severidad</th><td>${alert.severity}</td></tr>
                <tr><th>Timestamp</th><td>${alert.timestamp}</td></tr>
                <tr><th>Servidor</th><td>${alert.server}</td></tr>
                <tr><th>Entorno</th><td>${alert.environment}</td></tr>
              </table>
            </div>
            ${Object.keys(alert.data).length > 0 ? `
              <div class="alert-details">
                <h3>Datos Adicionales</h3>
                <pre>${JSON.stringify(alert.data, null, 2)}</pre>
              </div>
            ` : ''}
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Alertas específicas de seguridad
   */
  async alertFailedLogins(ip, attempts, userAgent) {
    if (attempts >= this.alertThresholds.failedLogins) {
      const identifier = ip;
      if (this.shouldSendAlert('failed_logins', identifier)) {
        await this.sendSecurityAlert(
          'failed_logins',
          attempts >= 10 ? 'critical' : 'high',
          `Múltiples intentos de login fallidos desde IP ${ip}`,
          { ip, attempts, userAgent }
        );
        this.recordAlert('failed_logins', identifier);
      }
    }
  }

  async alertSuspiciousActivity(ip, activity, score) {
    if (score >= 50) {
      const identifier = ip;
      if (this.shouldSendAlert('suspicious_activity', identifier)) {
        await this.sendSecurityAlert(
          'suspicious_activity',
          score >= 100 ? 'critical' : 'high',
          `Actividad sospechosa detectada desde IP ${ip}`,
          { ip, activity, score }
        );
        this.recordAlert('suspicious_activity', identifier);
      }
    }
  }

  async alertHighErrorRate(errorRate, totalRequests) {
    if (errorRate > this.alertThresholds.errorRate) {
      if (this.shouldSendAlert('high_error_rate', 'global')) {
        await this.sendSecurityAlert(
          'high_error_rate',
          errorRate > 0.2 ? 'critical' : 'high',
          `Tasa de errores alta: ${(errorRate * 100).toFixed(2)}%`,
          { errorRate, totalRequests }
        );
        this.recordAlert('high_error_rate', 'global');
      }
    }
  }

  async alertResourceUsage(resource, usage, threshold) {
    if (usage > threshold) {
      if (this.shouldSendAlert('resource_usage', resource)) {
        await this.sendSecurityAlert(
          'resource_usage',
          usage > threshold * 1.2 ? 'critical' : 'high',
          `Uso alto de ${resource}: ${(usage * 100).toFixed(2)}%`,
          { resource, usage, threshold }
        );
        this.recordAlert('resource_usage', resource);
      }
    }
  }

  /**
   * Obtener estadísticas de alertas
   */
  getAlertStats() {
    const now = Date.now();
    const recentAlerts = Array.from(this.alertHistory.entries())
      .filter(([key, timestamp]) => now - timestamp < 24 * 60 * 60 * 1000) // Últimas 24 horas
      .length;

    return {
      totalAlerts: this.alertHistory.size,
      recentAlerts: recentAlerts,
      thresholds: this.alertThresholds,
      channels: {
        email: !!this.notificationChannels.email,
        webhook: !!this.notificationChannels.webhook,
        file: this.notificationChannels.file
      }
    };
  }
}

// Instancia singleton
const securityAlerts = new SecurityAlerts();

module.exports = securityAlerts;
