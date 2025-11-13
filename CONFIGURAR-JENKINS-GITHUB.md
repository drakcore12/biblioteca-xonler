# Configurar Jenkins para Actualización Automática desde GitHub

## ✅ Cambios ya Subidos a GitHub

Los cambios ya están en GitHub:
- ✅ Jenkinsfile actualizado
- ✅ docker-compose.yml actualizado
- ✅ Documentación completa

## 🔄 Opción 1: Poll SCM (Consulta Periódica) - Más Simple

Jenkins consulta GitHub periódicamente para ver si hay cambios.

### Pasos:

1. **Accede a Jenkins**: `http://localhost:18080`

2. **Ve a tu Pipeline**: Click en el nombre del Pipeline (ej: "Xonler")

3. **Configurar**: Click en **"Configure"** (o "Configurar")

4. **En la sección "Build Triggers"**:
   - ✅ Marca: **"Poll SCM"**
   - En el campo, escribe: `H/5 * * * *`
     - Esto consulta cada 5 minutos
     - O usa `H/2 * * * *` para cada 2 minutos
     - O `H * * * *` para cada hora

5. **Guardar**: Click en **"Save"**

### Crontab Explicado:

```
H/5 * * * *  → Cada 5 minutos
H/2 * * * *  → Cada 2 minutos  
H * * * *    → Cada hora
H H * * *    → Una vez al día (hora aleatoria)
```

El `H` significa "hash" - distribuye las ejecuciones para no sobrecargar.

---

## 🚀 Opción 2: GitHub Webhook (Recomendado) - Más Eficiente

GitHub notifica a Jenkins inmediatamente cuando hay cambios. **Esta es la mejor opción**.

### Parte A: Configurar Jenkins

1. **Instalar Plugin GitHub** (si no está instalado):
   - Manage Jenkins → Plugins → Available
   - Busca: **"GitHub plugin"**
   - Instala y reinicia

2. **Configurar el Pipeline**:
   - Ve a tu Pipeline → Configure
   - En **"Build Triggers"**:
     - ✅ Marca: **"GitHub hook trigger for GITScm polling"**
   - Guarda

3. **Obtener URL del Webhook**:
   - La URL será: `http://tu-ip:18080/github-webhook/`
   - O si Jenkins está en localhost: `http://localhost:18080/github-webhook/`
   - **Para producción**: Necesitas una URL pública (ngrok, tunnel, etc.)

### Parte B: Configurar GitHub

1. **Ve a tu repositorio en GitHub**: `https://github.com/drakcore12/biblioteca-xonler`

2. **Settings → Webhooks → Add webhook**

3. **Configuración**:
   - **Payload URL**: 
     - Si Jenkins está en tu máquina local: Necesitas un túnel (ver abajo)
     - Si Jenkins está en un servidor: `http://tu-servidor:18080/github-webhook/`
   - **Content type**: `application/json`
   - **Secret**: (opcional, pero recomendado)
   - **Events**: Selecciona **"Just the push event"**
   - ✅ Active: Marcado

4. **Add webhook**

### Parte C: Túnel para Desarrollo Local (Opcional)

Si Jenkins está en tu máquina local, GitHub no puede acceder directamente. Usa un túnel:

#### Opción 1: ngrok (Recomendado)

```bash
# Instalar ngrok: https://ngrok.com/download
# Ejecutar:
ngrok http 18080

# Copiar la URL HTTPS (ej: https://abc123.ngrok.io)
# Usar en GitHub: https://abc123.ngrok.io/github-webhook/
```

#### Opción 2: GitHub CLI (gh)

```bash
# Instalar GitHub CLI
# Ejecutar:
gh auth login
gh api repos/drakcore12/biblioteca-xonler/hooks --method POST \
  --field name=web \
  --field config[url]=http://localhost:18080/github-webhook/ \
  --field config[content_type]=json \
  --field events[]=push
```

---

## 🔧 Opción 3: Híbrida (Poll + Webhook)

Usa ambas opciones para máxima confiabilidad:

1. **Poll SCM**: `H/15 * * * *` (cada 15 minutos como respaldo)
2. **GitHub hook trigger**: Para actualizaciones inmediatas

---

## ✅ Verificación

### Verificar Poll SCM:

1. Haz un cambio pequeño en GitHub (ej: edita README)
2. Haz commit y push
3. Espera el tiempo configurado (ej: 5 minutos)
4. Jenkins debería ejecutar automáticamente

### Verificar Webhook:

1. Haz un cambio en GitHub
2. Haz commit y push
3. **Inmediatamente** ve a GitHub → Settings → Webhooks
4. Click en tu webhook → Ver "Recent Deliveries"
5. Debería mostrar un delivery exitoso (200)
6. Jenkins debería ejecutar **inmediatamente**

---

## 📝 Configuración Recomendada para el Examen

Para el examen, usa **Poll SCM** porque es más simple y no requiere configuración externa:

```
Poll SCM: H/2 * * * *
```

Esto consulta cada 2 minutos, suficiente para demostrar la funcionalidad.

---

## 🎯 Resumen de Configuración en Jenkins

En la interfaz de Jenkins, en **"Build Triggers"**:

```
☑ Poll SCM
  Schedule: H/2 * * * *

☐ GitHub hook trigger for GITScm polling
  (Solo si configuraste webhook en GitHub)
```

---

## 🔍 Troubleshooting

### Poll SCM no funciona:

1. Verifica que el repositorio está correctamente configurado
2. Verifica que Jenkins puede acceder a GitHub
3. Revisa los logs: `docker compose logs jenkins`

### Webhook no funciona:

1. Verifica que el plugin GitHub está instalado
2. Verifica la URL del webhook en GitHub
3. Si Jenkins está en localhost, necesitas un túnel (ngrok)
4. Revisa "Recent Deliveries" en GitHub para ver errores

### Ver logs de Jenkins:

```powershell
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose logs -f jenkins
```

---

## 📚 Referencias

- [Jenkins Poll SCM](https://www.jenkins.io/doc/book/pipeline/syntax/#triggers)
- [GitHub Webhooks](https://docs.github.com/en/developers/webhooks-and-events/webhooks)
- [ngrok](https://ngrok.com/)

---

**¡Configuración completada!** 🎉

