# 🪟 Guía: Ejecutar Comandos en Windows desde Jenkins Docker

## 🎯 Objetivo

Hacer que Jenkins (corriendo en Docker) pueda ejecutar comandos en tu máquina Windows para:
- ✅ Iniciar el servidor Node.js
- ✅ Iniciar PostgreSQL
- ✅ Ejecutar otros comandos necesarios

## 🔧 Métodos Disponibles

### Método 1: SSH (Recomendado para automatización completa)

#### Configurar SSH en Windows

1. **Instalar OpenSSH Server en Windows:**
   ```powershell
   # En PowerShell como Administrador
   Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
   Start-Service sshd
   Set-Service -Name sshd -StartupType 'Automatic'
   ```

2. **Configurar firewall:**
   ```powershell
   New-NetFirewallRule -Name sshd -DisplayName 'OpenSSH Server (sshd)' -Enabled True -Direction Inbound -Protocol TCP -Action Allow -LocalPort 22
   ```

3. **Verificar que SSH funciona:**
   ```powershell
   # Desde otra terminal
   ssh usuario@localhost
   ```

4. **Configurar Jenkins para usar SSH:**
   - Jenkins → **Manage Jenkins** → **Manage Credentials**
   - Agregar credenciales SSH (usuario/contraseña o clave privada)
   - En el `Jenkinsfile`, usar:
     ```groovy
     sshagent(['windows-ssh-credentials']) {
       sh 'ssh usuario@host.docker.internal "powershell -File C:/ruta/script.ps1"'
     }
     ```

**Ventajas:**
- ✅ Automatización completa
- ✅ Jenkins puede iniciar/detener servicios
- ✅ No requiere intervención manual

**Desventajas:**
- ⚠️ Requiere configuración inicial
- ⚠️ Necesita credenciales SSH

---

### Método 2: Scripts PowerShell Compartidos (Más Simple)

#### Configurar Volumen Compartido

1. **Asegúrate de que el proyecto está montado como volumen:**
   ```powershell
   # Al iniciar Jenkins, monta el proyecto:
   docker run -d `
     --name jenkins `
     -p 8080:8080 `
     -v jenkins_home:/var/jenkins_home `
     -v C:/Users/MIGUEL/Documents/Proyectos-Cursor/Biblioteca-Xonler-main:/workspace/project `
     jenkins/jenkins:lts
   ```

2. **Ejecutar scripts desde Jenkins:**
   ```groovy
   sh '''
     # Desde el contenedor, ejecutar script en Windows
     powershell.exe -File /workspace/project/scripts/start-server-windows.ps1
   '''
   ```

**Ventajas:**
- ✅ Simple de configurar
- ✅ No requiere SSH
- ✅ Scripts disponibles directamente

**Desventajas:**
- ⚠️ Requiere montar volúmenes
- ⚠️ PowerShell debe estar disponible desde Docker

---

### Método 3: Usar Docker Exec con Volúmenes (Alternativa)

Si tienes Docker Desktop en Windows, puedes ejecutar comandos en el host:

```groovy
sh '''
  # Ejecutar PowerShell en el host Windows desde Docker
  docker run --rm -v C:/Users/MIGUEL/Documents/Proyectos-Cursor/Biblioteca-Xonler-main:/project `
    mcr.microsoft.com/powershell:latest `
    pwsh -File /project/scripts/start-server-windows.ps1
'''
```

**Ventajas:**
- ✅ No requiere SSH
- ✅ Usa contenedores Docker

**Desventajas:**
- ⚠️ Requiere Docker Desktop
- ⚠️ Más complejo

---

### Método 4: Webhook o API Local (Avanzado)

Crear un servicio web simple en Windows que reciba comandos de Jenkins:

1. **Crear servicio web en Windows:**
   ```javascript
   // server-control.js
   const express = require('express');
   const { exec } = require('child_process');
   const app = express();
   
   app.post('/start-server', (req, res) => {
     exec('npm start', { cwd: 'C:/ruta/proyecto' });
     res.json({ status: 'started' });
   });
   
   app.listen(3001);
   ```

2. **Desde Jenkins:**
   ```groovy
   sh 'curl -X POST http://host.docker.internal:3001/start-server'
   ```

---

## 🚀 Solución Rápida (Para tu Caso)

### Opción A: Manual (Más Simple)

1. **Inicia el servidor manualmente antes de ejecutar el pipeline:**
   ```powershell
   cd C:\Users\MIGUEL\Documents\Proyectos-Cursor\Biblioteca-Xonler-main
   npm start
   ```

2. **El pipeline detectará automáticamente el servidor en `host.docker.internal:3000`**

### Opción B: Scripts PowerShell (Semi-automático)

1. **Usa los scripts creados:**
   ```powershell
   # Iniciar servidor
   .\scripts\start-server-windows.ps1
   
   # Iniciar PostgreSQL
   .\scripts\start-postgres-windows.ps1
   ```

2. **Ejecuta estos scripts antes de correr el pipeline en Jenkins**

### Opción C: SSH (Automático Completo)

1. **Configura SSH en Windows** (ver Método 1 arriba)
2. **Configura credenciales en Jenkins**
3. **El pipeline iniciará automáticamente los servicios**

---

## 📝 Scripts Disponibles

### `scripts/start-server-windows.ps1`
- Inicia el servidor Node.js
- Verifica que esté corriendo
- Espera hasta que esté disponible

### `scripts/stop-server-windows.ps1`
- Detiene el servidor Node.js
- Busca procesos relacionados

### `scripts/start-postgres-windows.ps1`
- Inicia PostgreSQL (si está como servicio)
- Verifica el estado

---

## 🔍 Verificar Configuración

### Verificar que Jenkins puede acceder a Windows:

```bash
# Desde el contenedor Jenkins
docker exec -it jenkins bash
curl http://host.docker.internal:3000
```

### Verificar SSH (si está configurado):

```bash
# Desde el contenedor Jenkins
ssh usuario@host.docker.internal "powershell Get-Process node"
```

---

## ✅ Recomendación

Para tu caso de uso (examen), **usa la Opción A (Manual)**:
1. Es la más simple
2. No requiere configuración adicional
3. El pipeline detecta automáticamente el servidor
4. Funciona inmediatamente

Para producción o automatización completa, configura **SSH (Opción C)**.

