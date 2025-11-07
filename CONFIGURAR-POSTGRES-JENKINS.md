# 🗄️ Configurar PostgreSQL para Jenkins

Esta guía explica cómo configurar PostgreSQL para que funcione con el pipeline de Jenkins.

## 📋 Opciones de Configuración

### Opción 1: PostgreSQL en tu Máquina Local (Recomendado)

Si PostgreSQL ya está instalado en tu máquina Windows:

1. **Asegúrate de que PostgreSQL esté corriendo:**
   ```powershell
   # Verificar si está corriendo
   Get-Service -Name postgresql*
   
   # Si no está corriendo, inícialo
   Start-Service postgresql-x64-15  # Ajusta el nombre según tu versión
   ```

2. **Configurar acceso desde Docker (si Jenkins está en Docker):**
   - PostgreSQL debe estar escuchando en `0.0.0.0:5432` (no solo `localhost`)
   - Edita `postgresql.conf` y busca `listen_addresses`:
     ```
     listen_addresses = '*'
     ```
   - Edita `pg_hba.conf` y agrega:
     ```
     host    all             all             0.0.0.0/0               md5
     ```
   - Reinicia PostgreSQL

3. **Si Jenkins está en Docker, usa `host.docker.internal`:**
   - El pipeline intentará conectarse a `localhost:5432` primero
   - Si no funciona, usa `host.docker.internal:5432`

### Opción 2: PostgreSQL en Docker (Más Simple)

Si prefieres usar Docker para PostgreSQL:

```bash
# Detener contenedor existente si hay
docker stop postgres-xonler || true
docker rm postgres-xonler || true

# Crear y ejecutar contenedor PostgreSQL
docker run -d \
  --name postgres-xonler \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -p 5432:5432 \
  -v postgres-data:/var/lib/postgresql/data \
  postgres:15

# Verificar que está corriendo
docker ps | grep postgres-xonler
```

**Si Jenkins también está en Docker:**
- Usa la misma red Docker o conecta los contenedores:
  ```bash
  docker network create jenkins-network
  docker network connect jenkins-network postgres-xonler
  docker network connect jenkins-network jenkins
  ```

### Opción 3: PostgreSQL en el Contenedor Jenkins

Si quieres instalar PostgreSQL directamente en el contenedor Jenkins:

```bash
# Entrar al contenedor Jenkins
docker exec -u root -it jenkins bash

# Instalar PostgreSQL
apt-get update
apt-get install -y postgresql postgresql-contrib

# Iniciar PostgreSQL
service postgresql start

# Configurar usuario postgres
su - postgres
createuser -s postgres
createdb xonler
exit

# Configurar contraseña
psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';"
```

## 🔧 Configuración del Pipeline

El pipeline ahora incluye una etapa **"Configurar PostgreSQL"** que:

1. ✅ Verifica que PostgreSQL esté disponible
2. ✅ Crea la base de datos `xonler` si no existe
3. ✅ Ejecuta el script `db.sql` para crear tablas y datos
4. ✅ Verifica que las tablas se crearon correctamente

## 🚨 Solución de Problemas

### Error: "PostgreSQL no está instalado en el contenedor Jenkins"

**Solución:**
- Instala `postgresql-client` en el contenedor:
  ```bash
  docker exec -u root -it jenkins bash
  apt-get update
  apt-get install -y postgresql-client
  ```

### Error: "PostgreSQL no está disponible después de 30 segundos"

**Solución:**
1. Verifica que PostgreSQL esté corriendo:
   ```bash
   # En Windows
   Get-Service postgresql*
   
   # En Docker
   docker ps | grep postgres
   ```

2. Verifica que el puerto 5432 esté abierto:
   ```bash
   # En Windows PowerShell
   Test-NetConnection -ComputerName localhost -Port 5432
   ```

3. Si Jenkins está en Docker, asegúrate de que pueda acceder al host:
   - Usa `host.docker.internal` en lugar de `localhost`
   - O conecta los contenedores a la misma red Docker

### Error: "No se pudo crear la base de datos"

**Solución:**
- Verifica las credenciales de PostgreSQL:
  - Usuario: `postgres`
  - Contraseña: `postgres` (o la que configuraste)
  - Puerto: `5432`

### Error al ejecutar db.sql

**Solución:**
- El script `db.sql` tiene comandos `\restrict` y `\unrestrict` que son específicos de `pg_dump`
- El pipeline los filtra automáticamente
- Si aún falla, ejecuta `db.sql` manualmente:
  ```bash
  psql -U postgres -d xonler -f db.sql
  ```

## ✅ Verificación

Para verificar que todo funciona:

1. **Ejecuta el pipeline en Jenkins**
2. **Revisa la etapa "Configurar PostgreSQL"**
3. **Deberías ver:**
   ```
   ✅ PostgreSQL está disponible
   ✅ Base de datos configurada correctamente (X tablas encontradas)
   ```

## 📝 Variables de Entorno

El pipeline usa estas variables (puedes cambiarlas en el `Jenkinsfile`):

```groovy
DB_HOST      = 'localhost'      // o 'host.docker.internal' si Jenkins está en Docker
DB_PORT      = '5432'
DB_NAME      = 'xonler'
DB_USER      = 'postgres'
DB_PASSWORD  = 'postgres'
```

## 🎯 Próximos Pasos

Una vez que PostgreSQL esté configurado:

1. ✅ El pipeline ejecutará los tests unitarios con acceso a la base de datos
2. ✅ El servidor Node.js podrá conectarse a PostgreSQL
3. ✅ Los tests E2E funcionarán correctamente

