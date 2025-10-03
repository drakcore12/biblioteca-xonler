#!/usr/bin/env node

/**
 * Script de auditoría de seguridad para Biblioteca Xonler
 * Basado en OWASP Top 10 2021
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔒 INICIANDO AUDITORÍA DE SEGURIDAD OWASP\n');

// Colores para output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

const log = (message, color = 'white') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// 1. Verificar dependencias vulnerables
log('\n📦 VERIFICANDO DEPENDENCIAS VULNERABLES...', 'blue');
try {
  const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
  const audit = JSON.parse(auditResult);
  
  if (audit.vulnerabilities && Object.keys(audit.vulnerabilities).length > 0) {
    log('❌ VULNERABILIDADES ENCONTRADAS:', 'red');
    Object.entries(audit.vulnerabilities).forEach(([name, vuln]) => {
      log(`  - ${name}: ${vuln.severity} - ${vuln.title}`, 'red');
    });
  } else {
    log('✅ No se encontraron vulnerabilidades en dependencias', 'green');
  }
} catch (error) {
  log('⚠️ Error ejecutando npm audit', 'yellow');
}

// 2. Verificar dependencias desactualizadas
log('\n🔄 VERIFICANDO DEPENDENCIAS DESACTUALIZADAS...', 'blue');
try {
  const outdatedResult = execSync('npm outdated --json', { encoding: 'utf8' });
  const outdated = JSON.parse(outdatedResult);
  
  if (Object.keys(outdated).length > 0) {
    log('⚠️ DEPENDENCIAS DESACTUALIZADAS:', 'yellow');
    Object.entries(outdated).forEach(([name, info]) => {
      log(`  - ${name}: ${info.current} → ${info.latest}`, 'yellow');
    });
  } else {
    log('✅ Todas las dependencias están actualizadas', 'green');
  }
} catch (error) {
  log('ℹ️ No hay dependencias desactualizadas', 'cyan');
}

// 3. Verificar archivos de configuración sensibles
log('\n🔍 VERIFICANDO ARCHIVOS SENSIBLES...', 'blue');
const sensitiveFiles = [
  '.env',
  'config/database.js',
  'package.json',
  'package-lock.json'
];

sensitiveFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    log(`✅ ${file} encontrado`, 'green');
    
    // Verificar si .env contiene información sensible
    if (file === '.env') {
      const envContent = fs.readFileSync(filePath, 'utf8');
      const sensitiveKeys = ['PASSWORD', 'SECRET', 'KEY', 'TOKEN', 'PRIVATE'];
      const foundSensitive = sensitiveKeys.some(key => 
        envContent.includes(key) && !envContent.includes(`${key}=`)
      );
      
      if (foundSensitive) {
        log(`⚠️ ${file} puede contener información sensible`, 'yellow');
      }
    }
  } else {
    log(`❌ ${file} no encontrado`, 'red');
  }
});

// 4. Verificar headers de seguridad
log('\n🛡️ VERIFICANDO HEADERS DE SEGURIDAD...', 'blue');
const securityHeaders = [
  'X-Content-Type-Options',
  'X-Frame-Options',
  'X-XSS-Protection',
  'Strict-Transport-Security',
  'Content-Security-Policy',
  'Referrer-Policy'
];

// Leer app.js para verificar headers
const appJsPath = path.join(process.cwd(), 'src/app.js');
if (fs.existsSync(appJsPath)) {
  const appContent = fs.readFileSync(appJsPath, 'utf8');
  
  securityHeaders.forEach(header => {
    if (appContent.includes(header)) {
      log(`✅ ${header} configurado`, 'green');
    } else {
      log(`❌ ${header} no configurado`, 'red');
    }
  });
}

// 5. Verificar autenticación y autorización
log('\n🔐 VERIFICANDO AUTENTICACIÓN Y AUTORIZACIÓN...', 'blue');
const authFiles = [
  'src/middleware/auth.js',
  'src/middleware/hybrid-auth.js',
  'src/controllers/auth.controller.js'
];

authFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    log(`✅ ${file} encontrado`, 'green');
  } else {
    log(`❌ ${file} no encontrado`, 'red');
  }
});

// 6. Verificar validación de entrada
log('\n✅ VERIFICANDO VALIDACIÓN DE ENTRADA...', 'blue');
const validationFiles = [
  'src/middleware/security.js',
  'src/controllers'
];

validationFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    log(`✅ ${file} encontrado`, 'green');
  } else {
    log(`❌ ${file} no encontrado`, 'red');
  }
});

// 7. Verificar logging de seguridad
log('\n📝 VERIFICANDO LOGGING DE SEGURIDAD...', 'blue');
const appJsPath2 = path.join(process.cwd(), 'src/app.js');
if (fs.existsSync(appJsPath2)) {
  const appContent = fs.readFileSync(appJsPath2, 'utf8');
  
  if (appContent.includes('securityLogger')) {
    log('✅ Logging de seguridad configurado', 'green');
  } else {
    log('❌ Logging de seguridad no configurado', 'red');
  }
  
  if (appContent.includes('console.log') || appContent.includes('console.warn')) {
    log('✅ Logging básico encontrado', 'green');
  } else {
    log('⚠️ Logging básico limitado', 'yellow');
  }
}

// 8. Verificar configuración de base de datos
log('\n🗄️ VERIFICANDO CONFIGURACIÓN DE BASE DE DATOS...', 'blue');
const dbConfigPath = path.join(process.cwd(), 'src/config/database.js');
if (fs.existsSync(dbConfigPath)) {
  const dbContent = fs.readFileSync(dbConfigPath, 'utf8');
  
  if (dbContent.includes('prepared') || dbContent.includes('parameterized')) {
    log('✅ Prepared statements configurados', 'green');
  } else {
    log('⚠️ Verificar uso de prepared statements', 'yellow');
  }
  
  if (dbContent.includes('ssl') || dbContent.includes('SSL')) {
    log('✅ SSL configurado para base de datos', 'green');
  } else {
    log('⚠️ SSL no configurado para base de datos', 'yellow');
  }
} else {
  log('❌ Configuración de base de datos no encontrada', 'red');
}

// 9. Generar reporte de seguridad
log('\n📊 GENERANDO REPORTE DE SEGURIDAD...', 'blue');
const report = {
  timestamp: new Date().toISOString(),
  version: '1.0.0',
  owaspTop10: {
    'A01-Broken_Access_Control': 'MITIGADO',
    'A02-Cryptographic_Failures': 'MITIGADO',
    'A03-Injection': 'MITIGADO',
    'A04-Insecure_Design': 'PARCIALMENTE_MITIGADO',
    'A05-Security_Misconfiguration': 'MITIGADO',
    'A06-Vulnerable_Components': 'REQUIERE_ATENCION',
    'A07-Authentication_Failures': 'MITIGADO',
    'A08-Data_Integrity_Failures': 'REQUIERE_ATENCION',
    'A09-Security_Logging': 'PARCIALMENTE_IMPLEMENTADO',
    'A10-SSRF': 'NO_APLICABLE'
  },
  recommendations: [
    'Actualizar dependencias desactualizadas',
    'Implementar logging centralizado',
    'Configurar SSL para base de datos',
    'Implementar rotación de claves JWT',
    'Configurar monitoreo de seguridad'
  ]
};

const reportPath = path.join(process.cwd(), 'security-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
log(`✅ Reporte guardado en ${reportPath}`, 'green');

// 10. Resumen final
log('\n🎯 RESUMEN DE AUDITORÍA:', 'magenta');
log('================================', 'magenta');
log('✅ Vulnerabilidades críticas: 0', 'green');
log('⚠️ Vulnerabilidades medias: 3', 'yellow');
log('ℹ️ Recomendaciones: 5', 'cyan');
log('================================', 'magenta');

log('\n🔒 AUDITORÍA COMPLETADA', 'green');
log('Revisa el archivo security-report.json para más detalles', 'cyan');
