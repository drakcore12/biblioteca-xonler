# 🔐 Configurar SSH en Windows para Jenkins

## 🎯 Objetivo

Permitir que Jenkins (en Docker) ejecute comandos automáticamente en tu máquina Windows usando SSH.

## 📋 Pasos

### 1. Instalar OpenSSH Server en Windows

```powershell
# En PowerShell como Administrador
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
Start-Service sshd
Set-Service -Name sshd -StartupType 'Automatic'
```

### 2. Configurar Firewall

```powershell
# Permitir conexiones SSH
New-NetFirewallRule -Name sshd -DisplayName 'OpenSSH Server (sshd)' -Enabled True -Direction Inbound -Protocol TCP -Action Allow -LocalPort 22
```

### 3. Verificar que SSH funciona

```powershell
# Desde otra terminal PowerShell
ssh MIGUEL@localhost
# O desde el contenedor Jenkins:
# ssh MIGUEL@host.docker.internal
```

### 4. (Opcional) Configurar autenticación por clave

```powershell
# Generar clave SSH (si no tienes una)
ssh-keygen -t rsa -b 4096

# Copiar clave pública a authorized_keys
mkdir -p $env:USERPROFILE\.ssh
copy $env:USERPROFILE\.ssh\id_rsa.pub $env:USERPROFILE\.ssh\authorized_keys
```

### 5. Configurar Jenkins

#### Opción A: Usar credenciales SSH en Jenkins

1. **Jenkins → Manage Jenkins → Manage Credentials**
2. **Agregar credenciales:**
   - Kind: `SSH Username with private key` o `Username with password`
   - Username: `MIGUEL` (tu usuario de Windows)
   - Password: (tu contraseña de Windows)
   - ID: `windows-ssh-credentials`
   - Description: `Credenciales SSH para Windows`

3. **Actualizar Jenkinsfile** para usar las credenciales:
   ```groovy
   stage('Ejecutar Comandos en Windows') {
     steps {
       sshagent(['windows-ssh-credentials']) {
         sh 'ssh MIGUEL@host.docker.internal "powershell -File C:/ruta/script.ps1"'
       }
     }
   }
   ```

#### Opción B: Usar variables de entorno

Si prefieres no usar credenciales de Jenkins, puedes configurar variables de entorno en el `Jenkinsfile`:

```groovy
environment {
  WINDOWS_USER = 'MIGUEL'
  WINDOWS_PASSWORD = credentials('windows-password')  // Si usas credenciales
}
```

### 6. Instalar SSH Client en Jenkins (si no está)

```bash
# Desde el contenedor Jenkins
docker exec -u root -it jenkins bash
apt-get update
apt-get install -y openssh-client
```

## ✅ Verificar Configuración

### Desde Jenkins (Docker):

```bash
# Conectarse al contenedor
docker exec -it jenkins bash

# Probar conexión SSH
ssh MIGUEL@host.docker.internal "powershell Get-Process node"
```

### Desde Windows:

```powershell
# Verificar que el servicio SSH está corriendo
Get-Service sshd

# Verificar que el puerto 22 está abierto
Test-NetConnection -ComputerName localhost -Port 22
```

## 🔧 Solución de Problemas

### Error: "Connection refused"

- Verifica que el servicio SSH está corriendo: `Get-Service sshd`
- Verifica el firewall: `Get-NetFirewallRule -Name sshd`
- Verifica que el puerto 22 está abierto

### Error: "Permission denied"

- Verifica que el usuario y contraseña son correctos
- Si usas claves, verifica que `authorized_keys` tiene los permisos correctos

### Error: "Host key verification failed"

- Agrega `-o StrictHostKeyChecking=no` al comando SSH (ya está en el Jenkinsfile)
- O acepta la clave manualmente la primera vez

## 🎯 Uso en Jenkinsfile

El `Jenkinsfile` ya está configurado para intentar usar SSH. Si SSH no está configurado, mostrará instrucciones para ejecutar los comandos manualmente.

## 📝 Notas de Seguridad

- ⚠️ SSH expone tu máquina Windows a conexiones remotas
- ✅ Usa autenticación por clave en lugar de contraseña cuando sea posible
- ✅ Considera restringir el acceso SSH solo a la red local
- ✅ Usa un firewall para limitar quién puede conectarse

