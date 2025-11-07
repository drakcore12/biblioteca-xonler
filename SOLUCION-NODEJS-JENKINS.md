# 🔧 Solución: Node.js no encontrado en Jenkins

## ❌ Error

```
npm: not found
ERROR: script returned exit code 127
```

## 🔍 Diagnóstico

Jenkins está ejecutándose pero **Node.js no está instalado** en el servidor Jenkins.

## ✅ Soluciones

### Opción 1: Instalar Node.js en el servidor Jenkins (Recomendado)

#### Si Jenkins está en Docker:

```bash
# Conectarse al contenedor
docker exec -it jenkins bash

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get update
apt-get install -y nodejs

# Verificar
node --version
npm --version
```

#### Si Jenkins está instalado directamente en Windows:

1. **Descargar Node.js:**
   - Ve a: https://nodejs.org/
   - Descarga la versión LTS
   - Instala normalmente

2. **Verificar instalación:**
   ```powershell
   node --version
   npm --version
   ```

3. **Reiniciar Jenkins:**
   - Ve a: `http://localhost:8080/restart`
   - O reinicia el servicio de Windows

### Opción 2: Usar el Plugin de Node.js (Más fácil)

1. **Instalar el plugin:**
   - Jenkins → **Manage Jenkins** → **Manage Plugins**
   - Pestaña **Available** → Buscar **"NodeJS Plugin"**
   - Instalar y reiniciar

2. **Configurar Node.js:**
   - **Manage Jenkins** → **Global Tool Configuration**
   - **Node.js installations:**
     - Name: `NodeJS`
     - Install automatically: ✅ (marca)
     - Version: `18.x` o `20.x`
   - **Save**

3. **Actualizar el Jenkinsfile:**
   - Descomenta la sección `tools` en el Jenkinsfile:
   ```groovy
   tools {
       nodejs 'NodeJS'
   }
   ```

### Opción 3: Usar un agente Docker con Node.js

Si usas Docker para Jenkins, puedes usar una imagen con Node.js:

```groovy
pipeline {
    agent {
        docker {
            image 'node:18'
        }
    }
    // ... resto del pipeline
}
```

## 🚀 Solución Rápida (Para tu caso)

### Si Jenkins está en tu PC (Windows):

1. **Instala Node.js:**
   ```powershell
   # Descargar e instalar desde https://nodejs.org/
   # O usar winget:
   winget install OpenJS.NodeJS.LTS
   ```

2. **Verifica que esté en el PATH:**
   ```powershell
   node --version
   npm --version
   ```

3. **Reinicia Jenkins:**
   - Ve a: `http://localhost:8080/restart`
   - O reinicia el servicio:
     ```powershell
     net stop Jenkins
     net start Jenkins
     ```

4. **Ejecuta el pipeline nuevamente**

## 📋 Verificación

Después de instalar Node.js, verifica:

```bash
# En Jenkins (si es Linux/Docker)
node --version
npm --version

# En Windows
node --version
npm --version
```

## ⚠️ Nota Importante

El `Jenkinsfile` ahora incluye una etapa que **intenta instalar Node.js automáticamente** en sistemas Linux, pero:

- **Requiere permisos de root** (puede fallar en contenedores)
- **En Windows**, solo verifica que esté instalado (no instala automáticamente)

**Recomendación:** Instala Node.js manualmente en el servidor Jenkins para mejor control.

## 🔗 Enlaces Útiles

- [Node.js Downloads](https://nodejs.org/)
- [Jenkins Node.js Plugin](https://plugins.jenkins.io/nodejs/)
- [Instalar Node.js en Windows](https://nodejs.org/en/download/)

---

**Una vez instalado Node.js, el pipeline debería ejecutarse correctamente.** ✅

