# 🔐 Documentación de Seguridad - Encriptación de Logs

## Configuración de Encriptación

### Variables de Entorno Requeridas

```env
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
```

### Algoritmos de Encriptación

- **Algoritmo**: AES-256-GCM
- **Derivación de claves**: PBKDF2-SHA512
- **Rounds de derivación**: 100,000
- **Longitud de clave**: 256 bits
- **Longitud de IV**: 128 bits
- **Longitud de tag**: 128 bits

### Estructura de Archivos Encriptados

```
{
  "iv": "hex-encoded-iv",
  "tag": "hex-encoded-tag",
  "data": "hex-encoded-encrypted-data",
  "context": "context-name",
  "timestamp": "ISO-8601-timestamp",
  "algorithm": "aes-256-gcm"
}
```

### Gestión de Claves

1. **Clave maestra**: Generada automáticamente y almacenada de forma segura
2. **Rotación**: Mensual o bajo demanda
3. **Backup**: Clave anterior guardada durante rotación
4. **Contextos**: Diferentes claves para diferentes tipos de datos

### Logs Encriptados

- **Ubicación**: `./logs/encrypted/`
- **Formato**: `{tipo}-{fecha}.enc`
- **Tipos**: application, error, security, audit
- **Permisos**: 600 (solo propietario)

### Backup Encriptado

- **Ubicación**: `./backups/logs/`
- **Formato**: `logs-backup-{fecha}.tar.gz.enc`
- **Retención**: 365 días
- **Compresión**: Sí (antes de encriptación)

### Comandos de Gestión

```bash
# Probar encriptación
curl -X POST http://localhost:3000/api/security/encryption/test

# Rotar clave maestra
curl -X POST http://localhost:3000/api/security/encryption/rotate-key

# Verificar integridad de logs
curl "http://localhost:3000/api/security/encryption/logs/verify?logType=application"

# Desencriptar logs para análisis
curl -X POST http://localhost:3000/api/security/encryption/logs/decrypt \
  -H "Content-Type: application/json" \
  -d '{"logType": "application", "date": "2024-01-01"}'
```

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
