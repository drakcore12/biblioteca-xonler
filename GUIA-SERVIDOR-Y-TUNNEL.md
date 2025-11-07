# 🌐 Guía: Dónde Corre el Servidor y Cloudflare Tunnel

## 📍 Dónde Corre el Servidor Node.js

### Configuración Actual

El servidor está configurado en `src/server.js`:
```javascript
app.listen(PORT, () => {
  // Escucha en todas las interfaces de red (0.0.0.0)
  // Accesible desde: localhost:3000, 127.0.0.1:3000, y tu IP local
});
```

**Por defecto, Express escucha en `0.0.0.0`**, lo que significa:
- ✅ Accesible desde `localhost:3000` (en tu máquina Windows)
- ✅ Accesible desde `127.0.0.1:3000` (en tu máquina Windows)
- ✅ Accesible desde la IP de tu máquina (ej: `192.168.1.100:3000`)
- ✅ Accesible desde Docker usando `host.docker.internal:3000`

## 🔄 Flujo Actual del Pipeline

```
┌─────────────────────────────────────────┐
│ 1. Jenkins (Docker) ejecuta pipeline   │
│    - Checkout código                    │
│    - Instala dependencias              │
│    - Ejecuta tests unitarios           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 2. Verifica Servidor Local              │
│    Busca en:                            │
│    - localhost:3000 (dentro del        │
│      contenedor, NO funciona)           │
│    - host.docker.internal:3000         │
│      (acceso al host Windows)           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 3. Si servidor NO está corriendo:       │
│    - Omitir tests E2E                   │
│    - Omitir tests de carga              │
│    - Pipeline continúa                  │
└─────────────────────────────────────────┘
```

## 🚀 Cómo Iniciar el Servidor

### Opción 1: En tu Máquina Windows (Recomendado)

```powershell
# 1. Abre PowerShell en tu máquina Windows
cd C:\Users\MIGUEL\Documents\Proyectos-Cursor\Biblioteca-Xonler-main

# 2. Inicia el servidor
npm start

# El servidor estará disponible en:
# - http://localhost:3000 (desde tu Windows)
# - http://host.docker.internal:3000 (desde Jenkins Docker)
```

### Opción 2: Verificar que Está Corriendo

```powershell
# En PowerShell:
Test-NetConnection -ComputerName localhost -Port 3000

# O en el navegador:
# http://localhost:3000
```

## 🌐 Cloudflare Tunnel: Dónde Debe Correr

### ⚠️ Problema Actual

Si el servidor corre en **Windows** y Jenkins está en **Docker**:

1. **Tunnel desde Jenkins (Docker)**:
   - Intenta conectarse a `localhost:3000` → ❌ No funciona (busca dentro del contenedor)
   - Intenta conectarse a `host.docker.internal:3000` → ✅ Funciona (acceso al host)

2. **Tunnel desde Windows**:
   - Se conecta a `localhost:3000` → ✅ Funciona perfectamente
   - Más simple y directo

### ✅ Solución Recomendada: Tunnel en Windows

**Ejecuta Cloudflare Tunnel directamente en tu Windows:**

```powershell
# Terminal 1: Inicia el servidor
npm start

# Terminal 2: Inicia el tunnel (en otra terminal)
cloudflared tunnel --url http://localhost:3000
```

**Ventajas:**
- ✅ Tunnel y servidor en la misma máquina
- ✅ No hay problemas de red entre contenedores
- ✅ Más simple y confiable
- ✅ Puedes ver la URL pública inmediatamente

### 🔄 Alternativa: Tunnel desde Jenkins

Si prefieres que Jenkins cree el tunnel automáticamente:

1. **El servidor debe estar corriendo en Windows**
2. **Jenkins debe poder acceder a `host.docker.internal:3000`**
3. **Cloudflare Tunnel en Jenkins apunta a `host.docker.internal:3000`**

El pipeline ya está configurado para esto, pero requiere:
- Que `cloudflared` esté instalado en el contenedor Jenkins
- Que el servidor esté corriendo en Windows

## 📊 Comparación de Opciones

| Opción | Servidor | Tunnel | Ventajas | Desventajas |
|--------|----------|--------|----------|-------------|
| **Opción 1** | Windows | Windows | ✅ Más simple<br>✅ Más confiable<br>✅ Sin problemas de red | ⚠️ Debes iniciarlo manualmente |
| **Opción 2** | Windows | Jenkins (Docker) | ✅ Automático | ⚠️ Requiere cloudflared en Jenkins<br>⚠️ Más complejo |

## 🎯 Flujo Recomendado para tu Examen

### Paso 1: Iniciar Servidor
```powershell
# En tu terminal Windows
cd C:\Users\MIGUEL\Documents\Proyectos-Cursor\Biblioteca-Xonler-main
npm start
```

### Paso 2: Iniciar Cloudflare Tunnel (Opcional)
```powershell
# En otra terminal Windows
cloudflared tunnel --url http://localhost:3000
# Copia la URL pública que aparece
```

### Paso 3: Ejecutar Pipeline en Jenkins
- Jenkins detectará el servidor en `host.docker.internal:3000`
- Ejecutará tests E2E y Artillery
- Si el tunnel está corriendo en Windows, Jenkins puede omitir crear otro

## 🔧 Configuración del Servidor para Mejor Acceso

Si quieres asegurarte de que el servidor escuche en todas las interfaces:

```javascript
// src/server.js (opcional, ya funciona así por defecto)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📖 Accesible desde: http://localhost:${PORT}`);
  console.log(`🌐 Accesible desde Docker: http://host.docker.internal:${PORT}`);
});
```

**Nota:** Express ya escucha en `0.0.0.0` por defecto, así que esto es opcional.

## 📝 Resumen

1. **Servidor Node.js**: Corre en tu máquina Windows en `localhost:3000`
2. **Acceso desde Jenkins**: Usa `host.docker.internal:3000`
3. **Cloudflare Tunnel**: Mejor ejecutarlo en Windows, no en Jenkins
4. **Pipeline**: Detecta automáticamente si el servidor está disponible

## ✅ Checklist para Ejecutar el Pipeline

- [ ] Servidor corriendo en Windows: `npm start`
- [ ] PostgreSQL corriendo (opcional, para tests que requieren DB)
- [ ] Cloudflare Tunnel corriendo en Windows (opcional, para acceso público)
- [ ] Ejecutar pipeline en Jenkins
- [ ] Verificar que los tests E2E y Artillery se ejecuten correctamente

