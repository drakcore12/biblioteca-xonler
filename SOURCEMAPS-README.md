# 🗺️ Configuración de Source Maps

Este proyecto está configurado para usar **Source Maps** en todas las herramientas de desarrollo y testing.

## 📋 ¿Qué son los Source Maps?

Los **Source Maps** son archivos que mapean el código compilado/minificado de vuelta al código fuente original. Esto permite:

- ✅ **Mejor debugging:** Ver el código original en lugar del código transformado
- ✅ **Stack traces claros:** Los errores muestran la ubicación real en el código fuente
- ✅ **Debugging en navegador:** Ver y depurar el código original en DevTools
- ✅ **Mejor experiencia de desarrollo:** Identificar problemas más rápido

## 🔧 Configuración Implementada

### 1. Node.js (Backend)

Todos los scripts de Node.js están configurados con `--enable-source-maps`:

```json
{
  "scripts": {
    "start": "node --enable-source-maps src/server.js",
    "dev": "nodemon --exec \"node --enable-source-maps\" src/server.js",
    "test": "NODE_OPTIONS='--enable-source-maps' jest"
  }
}
```

**Beneficios:**
- Stack traces más claros en errores del servidor
- Mejor debugging con herramientas como VS Code debugger
- Errores muestran la línea exacta del código fuente

### 2. Jest (Pruebas Unitarias)

Jest está configurado para usar source maps automáticamente:

```javascript
// jest.config.js
module.exports = {
  // ... otras configuraciones
  // Source maps habilitados por defecto en Jest
  transform: {},
  errorOnDeprecated: false,
  testTimeout: 10000
};
```

**Beneficios:**
- Errores en pruebas muestran la ubicación real del código
- Mejor debugging de pruebas fallidas
- Stack traces más útiles

### 3. Playwright (Pruebas E2E)

Playwright está configurado para habilitar source maps en el navegador:

```javascript
// playwright.config.js
use: {
  launchOptions: {
    args: ['--enable-source-maps']
  }
}
```

**Beneficios:**
- Debugging en el navegador muestra código original
- Errores de JavaScript en el navegador son más claros
- Mejor integración con DevTools

### 4. Archivos de Configuración

Se han creado archivos adicionales:

- **`.node-options`**: Opciones de Node.js para source maps
- **`.nvmrc`**: Versión de Node.js recomendada (18+)

## 🚀 Uso

### Desarrollo Normal

Los source maps están habilitados automáticamente:

```bash
# Desarrollo con source maps
npm run dev

# Pruebas con source maps
npm test

# Pruebas E2E con source maps
npm run test:e2e
```

### Debugging

#### En VS Code

1. Abre el archivo `.vscode/launch.json` (si existe)
2. Agrega configuración de debug:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Server",
      "runtimeExecutable": "node",
      "runtimeArgs": ["--enable-source-maps"],
      "program": "${workspaceFolder}/src/server.js",
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

#### En el Navegador

1. Abre DevTools (F12)
2. Ve a la pestaña "Sources"
3. Los source maps se cargan automáticamente
4. Puedes poner breakpoints en el código original

## 📊 Verificación

### Verificar que Source Maps están activos

#### En Node.js:
```bash
# Ejecuta el servidor y verifica los stack traces
npm start
# Si hay un error, deberías ver rutas de archivos originales
```

#### En Jest:
```bash
# Ejecuta pruebas y verifica los errores
npm test
# Los errores deberían mostrar ubicaciones del código fuente
```

#### En Playwright:
```bash
# Ejecuta pruebas E2E
npm run test:e2e
# Si hay errores de JavaScript, deberían mostrar código original
```

## 🔍 Ejemplo de Beneficio

### Sin Source Maps:
```
Error: Cannot read property 'id' of undefined
    at Object.register (/Users/.../node_modules/.../compiled.js:123:45)
```

### Con Source Maps:
```
Error: Cannot read property 'id' of undefined
    at Object.register (/Users/.../src/controllers/auth.controller.js:45:12)
```

## ⚙️ Configuración Avanzada

### Variables de Entorno

Puedes forzar source maps con variables de entorno:

```bash
# Windows PowerShell
$env:NODE_OPTIONS="--enable-source-maps"
npm start

# Linux/Mac
NODE_OPTIONS="--enable-source-maps" npm start
```

### Para Producción

En producción, generalmente NO quieres source maps por seguridad y rendimiento. Puedes deshabilitarlos:

```bash
# Script sin source maps para producción
node src/server.js
```

O crear un script específico:

```json
{
  "scripts": {
    "start:prod": "node src/server.js"
  }
}
```

## 🐛 Solución de Problemas

### Source Maps no funcionan en Jest

**Problema:** Los errores aún muestran código compilado

**Solución:**
1. Verifica que `jest.config.js` no tenga `transform` configurado incorrectamente
2. Asegúrate de usar Node.js 18+ (soporte nativo de source maps)
3. Verifica que los archivos `.js` no estén minificados

### Source Maps no funcionan en Playwright

**Problema:** El navegador no muestra código original

**Solución:**
1. Verifica que `playwright.config.js` tenga `--enable-source-maps` en `launchOptions`
2. Asegúrate de que el código no esté minificado
3. Verifica que los archivos fuente estén accesibles

### Stack traces aún muestran código compilado

**Problema:** A pesar de la configuración, los errores no son claros

**Solución:**
1. Verifica la versión de Node.js: `node --version` (debe ser 18+)
2. Reinicia el servidor después de cambios
3. Limpia la caché: `npm cache clean --force`

## 📚 Recursos

- [Node.js Source Maps](https://nodejs.org/api/cli.html#--enable-source-maps)
- [Jest Source Maps](https://jestjs.io/docs/getting-started#using-babel)
- [Playwright Source Maps](https://playwright.dev/docs/debug#source-maps)
- [MDN: Source Maps](https://developer.mozilla.org/en-US/docs/Tools/Debugger/How_to/Use_a_source_map)

## ✅ Checklist

- [x] Source maps habilitados en Node.js
- [x] Source maps habilitados en Jest
- [x] Source maps habilitados en Playwright
- [x] Scripts de npm actualizados
- [x] Archivos de configuración creados
- [x] Documentación completa

---

**¡Source Maps configurados y listos para usar! 🗺️**

