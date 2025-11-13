# Configuración de Jenkins - Solución de Problemas

## Problema: `npm: not found`

### Solución Implementada

Se modificó el `Jenkinsfile` para usar contenedores Docker con Node.js en los stages que lo necesitan.

### Pasos para Aplicar la Solución

#### 1. Reiniciar Jenkins con la nueva configuración

```bash
# Reiniciar Jenkins
docker compose restart jenkins

# O si necesitas reconstruir
docker compose down
docker compose up -d jenkins
```

#### 2. Instalar Plugin Docker en Jenkins

1. Accede a Jenkins: `http://localhost:18080`
2. Ve a: **Manage Jenkins** → **Plugins**
3. Busca: **Docker Pipeline**
4. Instala el plugin
5. Reinicia Jenkins

#### 3. Verificar que Docker funciona en Jenkins

```bash
# Entrar al contenedor de Jenkins
docker exec -it jenkins bash

# Verificar acceso a Docker
docker ps
docker --version
```

#### 4. Ejecutar el Pipeline

1. Ve a tu Pipeline en Jenkins
2. Click en **Build Now**
3. Verifica que ahora encuentra `npm`

## Configuración Aplicada

### docker-compose.yml
- ✅ Acceso a Docker socket: `/var/run/docker.sock`
- ✅ Red compartida: `networks: default`
- ✅ Usuario root para acceso a Docker

### Jenkinsfile
- ✅ Stage "Instalar dependencias": Usa `node:20-alpine`
- ✅ Stages de tests: Usan `node:20-alpine` con `reuseNode true`
- ✅ Stage "Iniciar contenedores": Usa `agent any` (host de Jenkins)

## Si el Plugin Docker no está disponible

Si no puedes instalar el plugin Docker, alternativa:

### Opción Alternativa: Instalar Node.js en el contenedor Jenkins

Modifica `docker-compose.yml`:

```yaml
jenkins:
  # ... configuración existente ...
  command: >
    sh -c "
      apt-get update &&
      apt-get install -y curl &&
      curl -fsSL https://deb.nodesource.com/setup_20.x | bash - &&
      apt-get install -y nodejs &&
      /usr/local/bin/jenkins.sh
    "
```

Y modifica el `Jenkinsfile` para usar `agent any` en todos los stages.

## Verificación Final

Después de aplicar los cambios:

```bash
# 1. Verificar que Jenkins puede acceder a Docker
docker exec jenkins docker ps

# 2. Verificar que el plugin Docker está instalado
# (En Jenkins: Manage Jenkins → Plugins → Installed)

# 3. Ejecutar el pipeline y verificar que npm funciona
```

## Troubleshooting

### Error: "Docker pipeline plugin not found"
- Instala el plugin "Docker Pipeline" desde Manage Jenkins → Plugins

### Error: "Cannot connect to Docker daemon"
- Verifica que `/var/run/docker.sock` está montado en docker-compose.yml
- Verifica permisos: `ls -la /var/run/docker.sock`

### Error: "Workspace not shared between stages"
- Asegúrate de usar `reuseNode true` en stages que comparten código
- O usa un solo agente docker para todos los stages

