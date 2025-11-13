# Instrucciones para Jenkins en Windows

## ✅ Cambios Aplicados

1. **docker-compose.yml**: Jenkins tiene acceso al socket de Docker
2. **Jenkinsfile**: Usa agentes Docker con Node.js para los stages que necesitan npm

## 🔧 Pasos Siguientes

### 1. Instalar Plugin Docker Pipeline en Jenkins

1. Accede a Jenkins: `http://localhost:18080`
2. Ve a: **Manage Jenkins** → **Plugins** → **Available plugins**
3. Busca: **"Docker Pipeline"**
4. Marca la casilla y click **Install without restart**
5. Espera a que se instale
6. Si pide reiniciar, hazlo

### 2. Instalar Docker CLI en el Contenedor Jenkins (Opcional)

Si necesitas que Jenkins ejecute `docker compose` directamente (no solo a través de agentes Docker):

```powershell
# Entrar al contenedor
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" exec -it jenkins bash

# Dentro del contenedor, instalar Docker CLI
apt-get update
apt-get install -y docker.io docker-compose

# Verificar
docker --version
docker compose version
```

### 3. Verificar Configuración

```powershell
# Verificar que Jenkins puede acceder a Docker socket
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" exec jenkins ls -la /var/run/docker.sock

# Verificar estado de Jenkins
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose ps jenkins
```

### 4. Ejecutar el Pipeline

1. Ve a tu Pipeline en Jenkins
2. Click **Build Now**
3. El pipeline debería:
   - ✅ Encontrar npm (en el agente Docker)
   - ✅ Ejecutar tests
   - ✅ Generar reportes

## 📝 Comandos Útiles en PowerShell

### Reiniciar Jenkins

```powershell
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose restart jenkins
```

### Ver Logs de Jenkins

```powershell
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose logs -f jenkins
```

### Entrar al Contenedor

```powershell
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" exec -it jenkins bash
```

### Ver Contraseña Inicial

```powershell
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

## ⚠️ Si el Plugin Docker no está Disponible

Si no puedes instalar el plugin Docker Pipeline, el `Jenkinsfile` actual **NO funcionará** porque usa `agent { docker { ... } }`.

### Solución Alternativa: Instalar Node.js en Jenkins

Si no puedes usar agentes Docker, necesitas modificar el `Jenkinsfile` para usar `agent any` y tener Node.js instalado en el contenedor de Jenkins.

**Opción A**: Modificar docker-compose.yml para instalar Node.js:

```yaml
jenkins:
  # ... configuración existente ...
  command: >
    sh -c "
      apt-get update &&
      curl -fsSL https://deb.nodesource.com/setup_20.x | bash - &&
      apt-get install -y nodejs &&
      /usr/local/bin/jenkins.sh
    "
```

**Opción B**: Usar un Dockerfile personalizado (más limpio):

Crea `Dockerfile.jenkins`:
```dockerfile
FROM jenkins/jenkins:lts
USER root
RUN apt-get update && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs docker.io docker-compose && \
    apt-get clean
USER jenkins
```

Y en docker-compose.yml:
```yaml
jenkins:
  build:
    context: .
    dockerfile: Dockerfile.jenkins
  # ... resto de configuración
```

Luego modifica el `Jenkinsfile` para usar `agent any` en todos los stages.

## 🎯 Resumen

- ✅ **docker-compose.yml**: Configurado con acceso a Docker socket
- ✅ **Jenkinsfile**: Usa agentes Docker con Node.js
- ⏳ **Pendiente**: Instalar plugin "Docker Pipeline" en Jenkins
- ⏳ **Pendiente**: Ejecutar el pipeline y verificar que funciona

## 🔍 Verificación Final

Después de instalar el plugin y reiniciar:

1. Ve a tu Pipeline
2. Click **Build Now**
3. Verifica en la consola que:
   - ✅ Encuentra el Jenkinsfile
   - ✅ Clona el repositorio
   - ✅ Ejecuta npm ci (en el agente Docker)
   - ✅ Continúa con los demás stages

