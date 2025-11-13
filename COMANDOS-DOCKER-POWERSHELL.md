# Comandos Docker en PowerShell - Guía Rápida

## Problema: Rutas con Espacios

En PowerShell, las rutas con espacios necesitan comillas o el operador `&`.

## Soluciones

### Opción 1: Usar Operador `&` (Recomendado)

```powershell
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose restart jenkins
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose ps
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose logs jenkins
```

### Opción 2: Crear Alias en PowerShell

Abre PowerShell como administrador y ejecuta:

```powershell
# Crear alias permanente
Set-Alias -Name docker -Value "C:\Program Files\Docker\Docker\resources\bin\docker.exe"

# O agregar al perfil de PowerShell (permanente)
Add-Content $PROFILE "Set-Alias -Name docker -Value 'C:\Program Files\Docker\Docker\resources\bin\docker.exe'"
```

### Opción 3: Agregar al PATH

1. Abre **Variables de entorno** (Win + R → `sysdm.cpl` → Avanzado)
2. Edita la variable **Path**
3. Agrega: `C:\Program Files\Docker\Docker\resources\bin`
4. Reinicia PowerShell

Después podrás usar:
```powershell
docker compose restart jenkins
docker compose ps
```

### Opción 4: Usar el Script docker.ps1

```powershell
.\docker.ps1 compose restart jenkins
.\docker.ps1 compose ps
.\docker.ps1 compose logs jenkins
```

## Comandos Útiles

### Gestión de Contenedores

```powershell
# Ver estado
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose ps

# Reiniciar Jenkins
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose restart jenkins

# Ver logs
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose logs jenkins

# Ver logs en tiempo real
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose logs -f jenkins

# Detener todo
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose down

# Iniciar todo
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose up -d
```

### Verificar Jenkins

```powershell
# Ver estado de Jenkins
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose ps jenkins

# Entrar al contenedor
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" exec -it jenkins bash

# Ver contraseña inicial
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword

# Verificar acceso a Docker desde Jenkins
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" exec jenkins docker ps
```

### Verificar Docker Compose

```powershell
# Ver versión
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose version

# Ver servicios
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose config --services
```

## Atajos Rápidos

Crea un archivo `docker-shortcuts.ps1`:

```powershell
# docker-shortcuts.ps1
$docker = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"

function docker-compose { & $docker compose $args }
function docker-ps { & $docker compose ps }
function docker-logs { & $docker compose logs -f $args }
function docker-restart { & $docker compose restart $args }
function docker-up { & $docker compose up -d }
function docker-down { & $docker compose down }

# Cargar en PowerShell
# . .\docker-shortcuts.ps1

# Uso:
# docker-ps
# docker-restart jenkins
# docker-logs jenkins
```

## Solución Rápida: Variable de Entorno

```powershell
# En la sesión actual
$env:Path += ";C:\Program Files\Docker\Docker\resources\bin"

# Ahora puedes usar directamente:
docker compose restart jenkins
docker compose ps
```

## Verificar que Funciona

```powershell
# Verificar que docker está en el PATH
where.exe docker

# Verificar versión
docker --version

# Verificar compose
docker compose version
```

