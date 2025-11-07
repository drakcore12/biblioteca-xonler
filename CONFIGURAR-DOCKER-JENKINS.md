# 🐳 Configurar Docker-in-Docker para Jenkins

Si tu Jenkins está en un contenedor Docker y quieres usar el `Jenkinsfile` con `agent { docker { ... } }`, necesitas configurar Docker-in-Docker.

## 🔍 Problema

Si Jenkins está en Docker y el `Jenkinsfile` usa `agent { docker { ... } }`, Jenkins necesita poder ejecutar contenedores Docker dentro de su contenedor.

## ✅ Solución: Montar el Socket de Docker

### Opción 1: Reiniciar Jenkins con Docker Socket (Recomendado)

Si tu Jenkins está corriendo en Docker, reinícialo montando el socket de Docker:

```bash
# Detener Jenkins actual
docker stop jenkins

# Reiniciar Jenkins con acceso a Docker del host
docker run -d \
  --name jenkins \
  -p 8080:8080 \
  -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /usr/bin/docker:/usr/bin/docker \
  jenkins/jenkins:lts
```

**Windows (Docker Desktop):**
```powershell
# Detener Jenkins
docker stop jenkins

# Reiniciar con socket de Docker
docker run -d `
  --name jenkins `
  -p 8080:8080 `
  -p 50000:50000 `
  -v jenkins_home:/var/jenkins_home `
  -v //var/run/docker.sock:/var/run/docker.sock `
  jenkins/jenkins:lts
```

### Opción 2: Instalar Docker dentro del Contenedor Jenkins

```bash
# Conectarse al contenedor como root
docker exec -u root -it jenkins bash

# Instalar Docker
apt-get update
apt-get install -y docker.io

# Agregar usuario jenkins al grupo docker
usermod -aG docker jenkins

# Salir y reiniciar contenedor
exit
docker restart jenkins
```

## 🎯 Alternativa: Usar `agent any` (Más Simple)

Si no quieres configurar Docker-in-Docker, el `Jenkinsfile` actual usa `agent any`, lo que significa que ejecuta todo directamente en el contenedor de Jenkins.

**Ventajas:**
- ✅ No requiere configuración adicional
- ✅ Funciona inmediatamente
- ✅ Más simple

**Desventajas:**
- ⚠️ Necesitas instalar Node.js en el contenedor Jenkins
- ⚠️ Necesitas instalar dependencias del sistema

## 📋 Pasos para `agent any` (Actual)

1. **Instalar Node.js en el contenedor Jenkins:**
   ```bash
   docker exec -u root -it jenkins bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
   apt-get update && apt-get install -y nodejs
   exit
   ```

2. **El pipeline intentará instalar Node.js automáticamente** si no está disponible

3. **Ejecutar el pipeline** - debería funcionar

## 🔄 Cambiar entre Modos

### Para usar Docker-in-Docker:

1. Configura el socket de Docker (Opción 1 arriba)
2. En el `Jenkinsfile`, descomenta:
   ```groovy
   agent {
     docker {
       image 'mcr.microsoft.com/playwright:v1.47.0-jammy'
       args '-u root'
     }
   }
   ```
3. Comenta `agent any`

### Para usar `agent any` (actual):

1. El `Jenkinsfile` ya está configurado así
2. Solo necesitas Node.js en el contenedor Jenkins
3. El pipeline intentará instalarlo automáticamente

## ✅ Verificación

Después de configurar, verifica:

```bash
# Desde fuera del contenedor
docker exec jenkins docker --version
# Debería mostrar la versión de Docker

# O verificar Node.js
docker exec jenkins node --version
```

---

**El `Jenkinsfile` actual usa `agent any` que funciona sin Docker-in-Docker.** ✅

