#!/usr/bin/env node

/**
 * Script de configuración de encriptación para producción
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const encryptionManager = require('../src/utils/simple-encryption');

console.log('🔐 CONFIGURANDO SISTEMA DE ENCRIPTACIÓN\n');

// Función para generar variables de entorno seguras
const generateSecureEnvVars = () => {
  const envVars = {
    // Clave de encriptación (32 caracteres)
    ENCRYPTION_PASSWORD: crypto.randomBytes(32).toString('hex'),
    
    // Salt para derivación de claves (32 caracteres)
    ENCRYPTION_SALT: crypto.randomBytes(32).toString('hex'),
    
    // Directorio para claves (relativo al proyecto)
    ENCRYPTION_KEY_DIR: './secure',
    
    // Habilitar encriptación de logs en producción
    LOG_ENCRYPTION: 'true',
    
    // Configuración de retención de logs
    LOG_RETENTION_DAYS: '90',
    LOG_COMPRESSION: 'true',
    
    // Configuración de backup encriptado
    BACKUP_ENCRYPTION: 'true'
  };

  return envVars;
};

// Función para crear archivo .env.encryption
const createEncryptionEnvFile = () => {
  try {
    const envVars = generateSecureEnvVars();
    const envContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const envPath = path.join(process.cwd(), '.env.encryption');
    fs.writeFileSync(envPath, envContent, { mode: 0x180 }); // 0o600

    console.log('✅ Archivo .env.encryption creado');
    console.log('📝 Variables de encriptación generadas:');
    Object.entries(envVars).forEach(([key, value]) => {
      console.log(`   ${key}=${value.substring(0, 8)}...`);
    });

    return envVars;
  } catch (error) {
    console.error('❌ Error creando archivo .env.encryption:', error.message);
    return null;
  }
};

// Función para crear directorio seguro
const createSecureDirectory = () => {
  try {
    const secureDir = path.join(process.cwd(), 'secure');
    
    if (!fs.existsSync(secureDir)) {
      fs.mkdirSync(secureDir, { recursive: true, mode: 0x1C0 }); // 0o700
      console.log('✅ Directorio seguro creado: ./secure');
    } else {
      console.log('✅ Directorio seguro ya existe: ./secure');
    }

    return secureDir;
  } catch (error) {
    console.error('❌ Error creando directorio seguro:', error.message);
    return null;
  }
};

// Función para inicializar sistema de encriptación
const initializeEncryption = async () => {
  try {
    console.log('🔑 Inicializando sistema de encriptación...');
    
    // Obtener información del sistema
    const info = encryptionManager.getEncryptionInfo();
    
    console.log('✅ Sistema de encriptación inicializado');
    console.log('📊 Información del sistema:');
    console.log(`   Algoritmo: ${info.algorithm}`);
    console.log(`   Longitud de clave: ${info.keyLength} bytes`);
    console.log(`   Longitud de IV: ${info.ivLength} bytes`);
    console.log(`   Longitud de tag: ${info.tagLength} bytes`);
    console.log(`   Rounds de derivación: ${info.keyDerivationRounds}`);
    console.log(`   Clave maestra disponible: ${info.masterKeyAvailable ? 'Sí' : 'No'}`);
    console.log(`   Ruta de clave: ${info.masterKeyPath}`);

    return true;
  } catch (error) {
    console.error('❌ Error inicializando sistema de encriptación:', error.message);
    return false;
  }
};

// Función para probar encriptación
const testEncryption = async () => {
  try {
    console.log('🧪 Probando sistema de encriptación...');
    
    const testData = 'Datos de prueba para encriptación - ' + new Date().toISOString();
    const context = 'test';
    
    // Encriptar
    const encrypted = encryptionManager.encrypt(testData, context);
    console.log('✅ Datos encriptados exitosamente');
    
    // Desencriptar
    const decrypted = encryptionManager.decrypt(encrypted, context);
    console.log('✅ Datos desencriptados exitosamente');
    
    // Verificar integridad
    const integrity = encryptionManager.verifyIntegrity(encrypted, context);
    console.log(`✅ Integridad verificada: ${integrity ? 'Válida' : 'Inválida'}`);
    
    // Verificar coincidencia
    const match = testData === decrypted;
    console.log(`✅ Datos coinciden: ${match ? 'Sí' : 'No'}`);
    
    if (match && integrity) {
      console.log('🎉 Prueba de encriptación exitosa');
      return true;
    } else {
      console.log('❌ Prueba de encriptación fallida');
      return false;
    }
  } catch (error) {
    console.error('❌ Error en prueba de encriptación:', error.message);
    return false;
  }
};

// Función para crear archivo de configuración de producción
const createProductionConfig = () => {
  try {
    const config = {
      encryption: {
        enabled: true,
        algorithm: 'aes-256-gcm',
        keyDerivation: 'PBKDF2-SHA512',
        rounds: 100000
      },
      logging: {
        encrypted: true,
        retentionDays: 90,
        compression: true,
        rotation: 'daily'
      },
      backup: {
        encrypted: true,
        retentionDays: 365,
        compression: true,
        schedule: 'daily'
      },
      security: {
        keyRotation: 'monthly',
        integrityCheck: 'daily',
        auditLogging: true
      }
    };

    const configPath = path.join(process.cwd(), 'encryption-config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), { mode: 0x180 }); // 0o600

    console.log('✅ Archivo de configuración creado: encryption-config.json');
    return true;
  } catch (error) {
    console.error('❌ Error creando configuración:', error.message);
    return false;
  }
};

// Función para crear documentación de seguridad
const createSecurityDocumentation = () => {
  try {
    const doc = `# 🔐 Documentación de Seguridad - Encriptación de Logs

## Configuración de Encriptación

### Variables de Entorno Requeridas

\`\`\`env
# Encriptación
ENCRYPTION_PASSWORD=tu-clave-secreta-32-caracteres
ENCRYPTION_SALT=tu-salt-secreto-32-caracteres
ENCRYPTION_KEY_DIR=./secure

# Logs encriptados
LOG_ENCRYPTION=true
LOG_RETENTION_DAYS=90
LOG_COMPRESSION=true

# Backup encriptado
BACKUP_ENCRYPTION=true
\`\`\`

### Algoritmos de Encriptación

- **Algoritmo**: AES-256-GCM
- **Derivación de claves**: PBKDF2-SHA512
- **Rounds de derivación**: 100,000
- **Longitud de clave**: 256 bits
- **Longitud de IV**: 128 bits
- **Longitud de tag**: 128 bits

### Estructura de Archivos Encriptados

\`\`\`
{
  "iv": "hex-encoded-iv",
  "tag": "hex-encoded-tag",
  "data": "hex-encoded-encrypted-data",
  "context": "context-name",
  "timestamp": "ISO-8601-timestamp",
  "algorithm": "aes-256-gcm"
}
\`\`\`

### Gestión de Claves

1. **Clave maestra**: Generada automáticamente y almacenada de forma segura
2. **Rotación**: Mensual o bajo demanda
3. **Backup**: Clave anterior guardada durante rotación
4. **Contextos**: Diferentes claves para diferentes tipos de datos

### Logs Encriptados

- **Ubicación**: \`./logs/encrypted/\`
- **Formato**: \`{tipo}-{fecha}.enc\`
- **Tipos**: application, error, security, audit
- **Permisos**: 600 (solo propietario)

### Backup Encriptado

- **Ubicación**: \`./backups/logs/\`
- **Formato**: \`logs-backup-{fecha}.tar.gz.enc\`
- **Retención**: 365 días
- **Compresión**: Sí (antes de encriptación)

### Comandos de Gestión

\`\`\`bash
# Probar encriptación
curl -X POST http://localhost:3000/api/security/encryption/test

# Rotar clave maestra
curl -X POST http://localhost:3000/api/security/encryption/rotate-key

# Verificar integridad de logs
curl "http://localhost:3000/api/security/encryption/logs/verify?logType=application"

# Desencriptar logs para análisis
curl -X POST http://localhost:3000/api/security/encryption/logs/decrypt \\
  -H "Content-Type: application/json" \\
  -d '{"logType": "application", "date": "2024-01-01"}'
\`\`\`

### Consideraciones de Seguridad

1. **Variables de entorno**: Nunca committear al repositorio
2. **Claves**: Rotar regularmente
3. **Permisos**: Mantener archivos con permisos restrictivos
4. **Backup**: Hacer backup de claves de forma segura
5. **Monitoreo**: Verificar integridad regularmente

### Troubleshooting

#### Error: "Clave maestra no disponible"
- Verificar que las variables de entorno estén configuradas
- Verificar que el archivo de clave existe y es legible
- Verificar permisos del directorio secure/

#### Error: "Contexto de encriptación no coincide"
- Verificar que se use el mismo contexto para encriptar/desencriptar
- Verificar que los datos no hayan sido modificados

#### Error: "Error desencriptando datos"
- Verificar integridad del archivo encriptado
- Verificar que la clave maestra sea correcta
- Verificar que el contexto sea correcto
`;

    const docPath = path.join(process.cwd(), 'ENCRYPTION-SECURITY.md');
    fs.writeFileSync(docPath, doc, { mode: 0x180 }); // 0o600

    console.log('✅ Documentación de seguridad creada: ENCRYPTION-SECURITY.md');
    return true;
  } catch (error) {
    console.error('❌ Error creando documentación:', error.message);
    return false;
  }
};

// Función principal
const setupEncryption = async () => {
  try {
    console.log('🚀 Iniciando configuración de encriptación...\n');
    
    // 1. Crear variables de entorno
    const envVars = createEncryptionEnvFile();
    if (!envVars) {
      throw new Error('Error creando variables de entorno');
    }
    
    // 2. Crear directorio seguro
    const secureDir = createSecureDirectory();
    if (!secureDir) {
      throw new Error('Error creando directorio seguro');
    }
    
    // 3. Inicializar sistema de encriptación
    const initSuccess = await initializeEncryption();
    if (!initSuccess) {
      throw new Error('Error inicializando sistema de encriptación');
    }
    
    // 4. Probar encriptación
    const testSuccess = await testEncryption();
    if (!testSuccess) {
      throw new Error('Error en prueba de encriptación');
    }
    
    // 5. Crear configuración de producción
    const configSuccess = createProductionConfig();
    if (!configSuccess) {
      throw new Error('Error creando configuración');
    }
    
    // 6. Crear documentación
    const docSuccess = createSecurityDocumentation();
    if (!docSuccess) {
      throw new Error('Error creando documentación');
    }
    
    console.log('\n🎉 CONFIGURACIÓN DE ENCRIPTACIÓN COMPLETADA');
    console.log('\n📋 Archivos creados:');
    console.log('   - .env.encryption (variables de entorno)');
    console.log('   - ./secure/ (directorio de claves)');
    console.log('   - encryption-config.json (configuración)');
    console.log('   - ENCRYPTION-SECURITY.md (documentación)');
    
    console.log('\n⚠️  IMPORTANTE:');
    console.log('   1. Copia las variables de .env.encryption a tu .env');
    console.log('   2. Nunca committees .env.encryption al repositorio');
    console.log('   3. Haz backup seguro de las claves');
    console.log('   4. Configura LOG_ENCRYPTION=true en producción');
    
    console.log('\n🔧 Para activar en producción:');
    console.log('   export NODE_ENV=production');
    console.log('   export LOG_ENCRYPTION=true');
    console.log('   npm start');
    
  } catch (error) {
    console.error('\n❌ Error en configuración de encriptación:', error.message);
    process.exit(1);
  }
};

// Ejecutar si es llamado directamente
if (require.main === module) {
  setupEncryption();
}

module.exports = {
  setupEncryption,
  generateSecureEnvVars,
  createEncryptionEnvFile,
  createSecureDirectory,
  initializeEncryption,
  testEncryption
};
