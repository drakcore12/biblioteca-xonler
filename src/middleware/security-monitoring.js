const { logSecurity, logAudit } = require('../config/logger');

/**
 * Middleware de monitoreo de seguridad
 */
class SecurityMonitoring {
  constructor() {
    this.failedAttempts = new Map();
    this.blockedIPs = new Set();
    this.suspiciousPatterns = [
      /\.\.\//, // Path traversal
      /<script/i, // XSS
      /union.*select/i, // SQL injection
      /javascript:/i, // JavaScript injection
      /on\w+\s*=/i, // Event handlers
      /eval\s*\(/i, // Code injection
      /document\.cookie/i, // Cookie access
      /localStorage/i, // Local storage access
      /sessionStorage/i, // Session storage access
      /XMLHttpRequest/i, // AJAX requests
      /fetch\s*\(/i, // Fetch API
      /import\s*\(/i, // Dynamic imports
      /require\s*\(/i // Dynamic requires
    ];
    
    this.rateLimitConfig = {
      windowMs: 15 * 60 * 1000, // 15 minutos
      maxAttempts: 5, // 5 intentos por ventana
      blockDuration: 60 * 60 * 1000 // 1 hora de bloqueo
    };
  }

  /**
   * Detectar patrones sospechosos
   */
  detectSuspiciousActivity(req) {
    const suspicious = {
      patterns: [],
      score: 0,
      level: 'low'
    };

    // Verificar URL
    this.suspiciousPatterns.forEach((pattern, index) => {
      if (pattern.test(req.url)) {
        suspicious.patterns.push(`URL pattern ${index + 1}`);
        suspicious.score += 10;
      }
    });

    // Verificar body
    if (req.body && typeof req.body === 'object') {
      const bodyStr = JSON.stringify(req.body);
      this.suspiciousPatterns.forEach((pattern, index) => {
        if (pattern.test(bodyStr)) {
          suspicious.patterns.push(`Body pattern ${index + 1}`);
          suspicious.score += 15;
        }
      });
    }

    // Verificar query parameters
    if (req.query && typeof req.query === 'object') {
      const queryStr = JSON.stringify(req.query);
      this.suspiciousPatterns.forEach((pattern, index) => {
        if (pattern.test(queryStr)) {
          suspicious.patterns.push(`Query pattern ${index + 1}`);
          suspicious.score += 10;
        }
      });
    }

    // Verificar headers sospechosos
    const suspiciousHeaders = [
      'x-forwarded-for',
      'x-real-ip',
      'x-cluster-client-ip',
      'x-forwarded',
      'forwarded-for',
      'forwarded'
    ];

    suspiciousHeaders.forEach(header => {
      if (req.headers[header]) {
        suspicious.patterns.push(`Suspicious header: ${header}`);
        suspicious.score += 5;
      }
    });

    // Determinar nivel de amenaza
    if (suspicious.score >= 50) {
      suspicious.level = 'high';
    } else if (suspicious.score >= 25) {
      suspicious.level = 'medium';
    }

    return suspicious;
  }

  /**
   * Monitorear intentos de autenticación fallidos
   */
  monitorAuthAttempts(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - this.rateLimitConfig.windowMs;

    // Limpiar intentos antiguos
    if (this.failedAttempts.has(ip)) {
      const attempts = this.failedAttempts.get(ip).filter(time => time > windowStart);
      this.failedAttempts.set(ip, attempts);
    }

    // Verificar si la IP está bloqueada
    if (this.blockedIPs.has(ip)) {
      logSecurity('warn', 'Acceso bloqueado desde IP', {
        ip,
        reason: 'IP bloqueada por intentos fallidos',
        userAgent: req.get('User-Agent'),
        url: req.url
      });

      return res.status(429).json({
        error: 'IP bloqueada temporalmente',
        message: 'Demasiados intentos fallidos. Intenta de nuevo más tarde.'
      });
    }

    // Interceptar respuestas de autenticación
    const originalSend = res.send;
    res.send = function(data) {
      if (req.path.includes('/auth/') && res.statusCode === 401) {
        // Registrar intento fallido
        const attempts = this.failedAttempts.get(ip) || [];
        attempts.push(now);
        this.failedAttempts.set(ip, attempts);

        logSecurity('warn', 'Intento de autenticación fallido', {
          ip,
          attempts: attempts.length,
          userAgent: req.get('User-Agent'),
          body: req.body
        });

        // Bloquear IP si excede el límite
        if (attempts.length >= this.rateLimitConfig.maxAttempts) {
          this.blockedIPs.add(ip);
          logSecurity('error', 'IP bloqueada por intentos excesivos', {
            ip,
            attempts: attempts.length,
            blockedUntil: new Date(now + this.rateLimitConfig.blockDuration)
          });

          // Desbloquear después del tiempo de bloqueo
          setTimeout(() => {
            this.blockedIPs.delete(ip);
            this.failedAttempts.delete(ip);
            logSecurity('info', 'IP desbloqueada', { ip });
          }, this.rateLimitConfig.blockDuration);
        }
      }

      return originalSend.call(res, data);
    };

    next();
  }

  /**
   * Monitorear actividad sospechosa
   */
  monitorSuspiciousActivity(req, res, next) {
    const suspicious = this.detectSuspiciousActivity(req);

    if (suspicious.score > 0) {
      const logLevel = suspicious.level === 'high' ? 'error' : 'warn';
      
      logSecurity(logLevel, 'Actividad sospechosa detectada', {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        url: req.url,
        method: req.method,
        suspicious: suspicious,
        body: req.body,
        query: req.query
      });

      // Si es de alto riesgo, bloquear la request
      if (suspicious.level === 'high') {
        return res.status(403).json({
          error: 'Request bloqueada',
          message: 'Actividad sospechosa detectada'
        });
      }
    }

    next();
  }

  /**
   * Monitorear cambios de datos sensibles
   */
  monitorDataChanges(req, res, next) {
    const sensitiveEndpoints = [
      '/api/auth/',
      '/api/usuarios/',
      '/api/admin/',
      '/api/prestamos/'
    ];

    const isSensitive = sensitiveEndpoints.some(endpoint => 
      req.path.startsWith(endpoint)
    );

    if (isSensitive) {
      const originalSend = res.send;
      res.send = function(data) {
        // Log de cambios en datos sensibles
        if (res.statusCode >= 200 && res.statusCode < 300) {
          logAudit('DATA_CHANGE', req.user?.id || 'anonymous', {
            ip: req.ip || req.connection.remoteAddress,
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            body: req.body,
            query: req.query,
            userAgent: req.get('User-Agent')
          });
        }

        return originalSend.call(this, data);
      };
    }

    next();
  }

  /**
   * Monitorear accesos no autorizados
   */
  monitorUnauthorizedAccess(req, res, next) {
    const originalSend = res.send;
    res.send = function(data) {
      if (res.statusCode === 403 || res.statusCode === 401) {
        logSecurity('warn', 'Acceso no autorizado', {
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          url: req.url,
          method: req.method,
          statusCode: res.statusCode,
          userId: req.user?.id || 'anonymous',
          body: req.body
        });
      }

      return originalSend.call(res, data);
    };

    next();
  }

  /**
   * Obtener estadísticas de seguridad
   */
  getSecurityStats() {
    return {
      blockedIPs: this.blockedIPs.size,
      failedAttempts: this.failedAttempts.size,
      suspiciousPatterns: this.suspiciousPatterns.length,
      rateLimitConfig: this.rateLimitConfig
    };
  }

  /**
   * Limpiar datos antiguos
   */
  cleanup() {
    const now = Date.now();
    const windowStart = now - this.rateLimitConfig.windowMs;

    // Limpiar intentos fallidos antiguos
    for (const [ip, attempts] of this.failedAttempts.entries()) {
      const recentAttempts = attempts.filter(time => time > windowStart);
      if (recentAttempts.length === 0) {
        this.failedAttempts.delete(ip);
      } else {
        this.failedAttempts.set(ip, recentAttempts);
      }
    }

    console.log('🧹 [SECURITY] Datos de monitoreo limpiados');
  }
}

// Instancia singleton
const securityMonitoring = new SecurityMonitoring();

// Limpiar datos cada 5 minutos
setInterval(() => {
  securityMonitoring.cleanup();
}, 5 * 60 * 1000);

module.exports = securityMonitoring;
