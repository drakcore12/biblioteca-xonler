# 🚀 Guía Completa: Cómo Ejecutar el Jenkinsfile

Esta guía te explica paso a paso cómo instalar, configurar y ejecutar el pipeline de Jenkins para tu proyecto Biblioteca Xonler.

---

## 📋 Índice

1. [Instalación de Jenkins](#1-instalación-de-jenkins)
2. [Configuración Inicial](#2-configuración-inicial)
3. [Configurar el Pipeline](#3-configurar-el-pipeline)
4. [Ejecutar el Pipeline](#4-ejecutar-el-pipeline)
5. [Ver Resultados](#5-ver-resultados)
6. [Solución de Problemas](#6-solución-de-problemas)

---

## 1. Instalación de Jenkins

### Opción A: Instalación en Windows (Recomendado)

#### Paso 1.1: Descargar Jenkins

1. Ve a: https://www.jenkins.io/download/
2. Haz clic en **"Download Jenkins"** → **"Windows"**
3. Descarga el archivo `.msi` (Jenkins LTS)

#### Paso 1.2: Instalar Jenkins

1. **Ejecuta el instalador** como administrador
2. **Sigue el asistente:**
   - Selecciona el directorio de instalación (por defecto: `C:\Program Files\Jenkins`)
   - Selecciona el puerto (por defecto: `8080`)
   - Selecciona el directorio de datos (por defecto: `C:\Program Files\Jenkins`)
3. **Completa la instalación**

#### Paso 1.3: Iniciar Jenkins

1. **Abre tu navegador** y ve a: `http://localhost:8080`
2. **Obtén la contraseña inicial:**
   - Abre PowerShell como administrador
   - Ejecuta:
     ```powershell
     type "C:\Program Files\Jenkins\secrets\initialAdminPassword"
     ```
   - Copia la contraseña que aparece
3. **Pega la contraseña** en Jenkins y haz clic en "Continue"

#### Paso 1.4: Configurar Plugins

1. **Selecciona "Install suggested plugins"** (recomendado)
2. Espera a que se instalen (5-10 minutos)
3. **Crea un usuario administrador:**
   - Username: (el que prefieras)
   - Password: (una contraseña segura)
   - Email: (tu email)
4. **Confirma la URL de Jenkins:** `http://localhost:8080`
5. **Haz clic en "Save and Finish"**

✅ **Jenkins está instalado y listo**

---

### Opción B: Jenkins con Docker (Alternativa)

Si prefieres usar Docker:

```bash
docker run -d -p 8080:8080 -p 50000:50000 --name jenkins jenkins/jenkins:lts
```

Luego sigue desde el **Paso 1.3** arriba.

---

## 2. Configuración Inicial

### Paso 2.1: Instalar Plugins Necesarios

1. **Ve a Jenkins Dashboard:** `http://localhost:8080`
2. **Clic en "Manage Jenkins"** (izquierda)
3. **Clic en "Manage Plugins"**
4. **Pestaña "Available"**, busca e instala:
   - ✅ **Pipeline** (ya viene instalado)
   - ✅ **Git** (para repositorios Git)
   - ✅ **HTML Publisher** (para reportes HTML)
   - ✅ **JUnit** (para reportes de pruebas)
   - ✅ **NodeJS Plugin** (opcional, para Node.js)

5. **Clic en "Install without restart"**
6. **Espera a que termine** y reinicia Jenkins si es necesario

### Paso 2.2: Configurar Node.js (Opcional)

Si instalaste el plugin de Node.js:

1. **Manage Jenkins** → **Global Tool Configuration**
2. **Node.js installations:**
   - Name: `NodeJS`
   - Install automatically: ✅ (marca)
   - Version: `18.x` o `20.x`
3. **Save**

### Paso 2.3: Verificar Requisitos

Asegúrate de tener instalado en tu sistema:

- ✅ **Node.js** (v18+)
- ✅ **npm** (viene con Node.js)
- ✅ **Git**
- ✅ **Cloudflared** (en `C:\Users\TU_USUARIO\cloudflared.exe`)
- ✅ **PostgreSQL** (para las pruebas)

Verifica con:

```powershell
node --version
npm --version
git --version
Test-Path "$env:USERPROFILE\cloudflared.exe"
```

---

## 3. Configurar el Pipeline

### Paso 3.1: Crear Nuevo Job

1. **En Jenkins Dashboard**, clic en **"New Item"** (izquierda)
2. **Nombre del job:** `Biblioteca-Xonler-Pipeline`
3. **Selecciona "Pipeline"**
4. **Clic en "OK"**

### Paso 3.2: Configurar el Pipeline

1. **En la página de configuración**, baja hasta **"Pipeline"**
2. **Definition:** Selecciona **"Pipeline script from SCM"**
3. **SCM:** Selecciona **"Git"**
4. **Repository URL:** 
   - Si tu proyecto está en GitHub:
     ```
     https://github.com/tu-usuario/Biblioteca-Xonler.git
     ```
   - Si es local, usa la ruta completa:
     ```
     file:///C:/Users/TU_USUARIO/Documents/Proyectos-Cursor/Biblioteca-Xonler-main
     ```
5. **Credentials:** (déjalo vacío si es público, o agrega credenciales si es privado)
6. **Branches to build:** `*/main` (o la rama que uses)
7. **Script Path:** `Jenkinsfile` (debe estar en la raíz del proyecto)
8. **Clic en "Save"**

### Paso 3.3: Verificar que el Jenkinsfile Existe

Asegúrate de que el archivo `Jenkinsfile` esté en la raíz de tu proyecto:

```
Biblioteca-Xonler-main/
├── Jenkinsfile          ← Debe estar aquí
├── package.json
├── src/
└── ...
```

---

## 4. Ejecutar el Pipeline

### Opción A: Ejecución Manual

1. **Ve al job que creaste:** `Biblioteca-Xonler-Pipeline`
2. **Clic en "Build Now"** (izquierda)
3. **Verás un nuevo build** en "Build History"
4. **Clic en el número del build** (ej: #1)
5. **Clic en "Console Output"** para ver el progreso en tiempo real

### Opción B: Ejecución Automática (con Git)

Si tu proyecto está en Git:

1. **Haz commit y push:**
   ```bash
   git add .
   git commit -m "Actualizar Jenkinsfile"
   git push origin main
   ```

2. **Jenkins se ejecutará automáticamente** si configuraste un webhook (avanzado)

### Opción C: Ejecutar desde Línea de Comandos

Si tienes `jenkins-cli.jar`:

```bash
java -jar jenkins-cli.jar -s http://localhost:8080 build Biblioteca-Xonler-Pipeline
```

---

## 5. Ver Resultados

### Durante la Ejecución

1. **Console Output:** Ve el progreso en tiempo real
2. **Stage View:** Ve qué etapa está ejecutando
3. **Blue Ocean:** Interfaz moderna (instala el plugin)

### Después de la Ejuecución

1. **Estado del Build:**
   - ✅ **Azul** = Éxito
   - ❌ **Rojo** = Falló
   - 🟡 **Amarillo** = Inestable

2. **Ver Reportes:**
   - **Coverage Report:** Cobertura de código (Jest)
   - **Playwright Report:** Reportes de pruebas E2E
   - **Test Results:** Resultados de pruebas unitarias

3. **Ver Logs:**
   - **Console Output:** Log completo
   - **server.log:** Log del servidor Node.js
   - **cloudflare.log:** Log de Cloudflare Tunnel

4. **Ver URL Pública:**
   - Si el pipeline fue exitoso, busca en la consola:
     ```
     🌐 URL pública generada: https://abc123-def456.trycloudflare.com
     ```

---

## 6. Solución de Problemas

### Problema: "Jenkinsfile not found"

**Solución:**
- Verifica que el `Jenkinsfile` esté en la raíz del proyecto
- Verifica la ruta del repositorio en la configuración
- Verifica que la rama sea correcta (`main` o `master`)

### Problema: "npm: command not found"

**Solución:**
- Instala Node.js: https://nodejs.org/
- Reinicia Jenkins después de instalar Node.js
- O configura Node.js en Jenkins (Global Tool Configuration)

### Problema: "cloudflared not found"

**Solución:**
```powershell
# Instalar cloudflared
winget install Cloudflare.Cloudflared

# Verificar que esté en la ubicación correcta
Test-Path "$env:USERPROFILE\cloudflared.exe"
```

### Problema: "Port 3000 already in use"

**Solución:**
- Detén el servidor anterior manualmente:
  ```powershell
  Get-Process -Name "node" | Where-Object {$_.Path -like "*Biblioteca*"} | Stop-Process -Force
  ```
- O cambia el puerto en `.env`:
  ```
  PORT=3001
  ```

### Problema: "Database connection failed"

**Solución:**
- Asegúrate de que PostgreSQL esté corriendo
- Verifica las credenciales en el `Jenkinsfile` (environment)
- Crea la base de datos de test:
  ```sql
  CREATE DATABASE biblioteca_test;
  ```

### Problema: "Playwright browsers not installed"

**Solución:**
El pipeline instala Playwright automáticamente, pero si falla:
```bash
npx playwright install --with-deps
```

### Problema: Pipeline se detiene en una etapa

**Solución:**
1. Ve a **Console Output**
2. Busca el error específico
3. Revisa los logs de esa etapa
4. Verifica que todos los requisitos estén instalados

---

## 📊 Flujo Completo del Pipeline

```
1. Checkout
   ↓
2. Instalar dependencias (npm ci)
   ↓
3. Pruebas Unitarias (Jest)
   ↓
4. Pruebas E2E (Playwright)
   ↓
5. Pruebas de Carga (Artillery)
   ↓
6. Desplegar Localmente (solo si pruebas pasan)
   ↓
7. Cloudflare Tunnel (solo si despliegue exitoso)
   ↓
8. ✅ Pipeline completado
```

---

## 🎯 Comandos Rápidos

### Iniciar Jenkins (si no está como servicio)
```powershell
# Windows
net start Jenkins
```

### Detener Jenkins
```powershell
# Windows
net stop Jenkins
```

### Ver logs de Jenkins
```powershell
# Windows
type "C:\Program Files\Jenkins\logs\jenkins.log"
```

### Reiniciar Jenkins
1. Ve a: `http://localhost:8080/restart`
2. Confirma el reinicio

---

## 📝 Notas Importantes

1. **Primera ejecución:** Puede tardar 10-15 minutos (instala dependencias)
2. **Servidor local:** El servidor se inicia en background, no bloquea el pipeline
3. **Cloudflare Tunnel:** La URL cambia cada vez que reinicias el tunnel
4. **Base de datos:** Asegúrate de que PostgreSQL esté corriendo antes de ejecutar
5. **Rama main:** El despliegue solo ocurre en la rama `main`

---

## 🎥 Para el Video del Examen

### Estructura sugerida:

1. **Mostrar Jenkins Dashboard** (30s)
2. **Ejecutar "Build Now"** (30s)
3. **Mostrar Console Output en tiempo real** (1min)
4. **Mostrar Stage View** (30s)
5. **Mostrar reportes generados** (1min)
6. **Mostrar URL pública de Cloudflare** (30s)
7. **Conclusión** (30s)

---

## ✅ Checklist Pre-Ejecución

Antes de ejecutar el pipeline, verifica:

- [ ] Jenkins instalado y corriendo
- [ ] Node.js instalado
- [ ] npm funcionando
- [ ] Git instalado
- [ ] Cloudflared instalado en `$env:USERPROFILE`
- [ ] PostgreSQL corriendo
- [ ] Base de datos `biblioteca_test` creada
- [ ] `Jenkinsfile` en la raíz del proyecto
- [ ] Repositorio configurado en Jenkins
- [ ] Plugins necesarios instalados

---

## 🆘 ¿Necesitas Ayuda?

Si tienes problemas:

1. Revisa la **Console Output** del build
2. Revisa los **logs de Jenkins**
3. Verifica que todos los **requisitos estén instalados**
4. Consulta la sección de **Solución de Problemas** arriba

---

**¡Listo para ejecutar tu pipeline! 🚀**

