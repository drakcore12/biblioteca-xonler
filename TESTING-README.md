# 🧪 Guía de Testing - Biblioteca Xonler

Esta guía explica cómo ejecutar las diferentes pruebas implementadas para el examen final de Pruebas de Software.

## 📋 Índice

1. [Pruebas Unitarias (Jest)](#pruebas-unitarias-jest)
2. [Pruebas Funcionales (Playwright)](#pruebas-funcionales-playwright)
3. [Pruebas de Rendimiento (Artillery)](#pruebas-de-rendimiento-artillery)
4. [Integración Continua](#integración-continua)
5. [Pruebas de Seguridad (OWASP ZAP)](#pruebas-de-seguridad-owasp-zap)

---

## 🧪 Pruebas Unitarias (Jest)

### Instalación

```bash
npm install --save-dev jest
```

### Ejecutar Pruebas

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar en modo watch (se re-ejecutan al cambiar archivos)
npm run test:watch

# Ejecutar con cobertura de código
npm run test:coverage
```

### Estructura de Pruebas

Las pruebas unitarias se encuentran en la carpeta `__tests__/`:

```
__tests__/
├── utils/
│   ├── simple-jwt.test.js    # Pruebas del módulo JWT
│   └── helpers.test.js       # Pruebas de funciones helper
```

### Ejemplo de Prueba

```javascript
const SimpleJWT = require('../../src/utils/simple-jwt');

describe('SimpleJWT', () => {
  test('debe generar un token JWT válido', () => {
    const jwt = new SimpleJWT();
    const payload = { id: 1, email: 'test@example.com' };
    const token = jwt.generateToken(payload);
    
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });
});
```

---

## 🎭 Pruebas Funcionales (Playwright)

### Instalación

```bash
npm init playwright@latest
```

Esto instalará Playwright y los navegadores necesarios.

### Ejecutar Pruebas

```bash
# Ejecutar todas las pruebas E2E
npm run test:e2e

# Ejecutar en modo UI (interfaz gráfica)
npm run test:e2e:ui

# Ejecutar en un navegador específico
npx playwright test --project=chromium

# Ejecutar con modo debug
npx playwright test --debug
```

### Estructura de Pruebas

Las pruebas E2E se encuentran en `tests/e2e/`:

```
tests/
└── e2e/
    ├── login.test.js      # Pruebas de login
    └── libros.test.js     # Pruebas de gestión de libros
```

### Configuración

El archivo `playwright.config.js` contiene la configuración para ejecutar pruebas en múltiples navegadores (Chromium, Firefox, WebKit).

### Ejemplo de Prueba

```javascript
const { test, expect } = require('@playwright/test');

test('debe mostrar la página de login', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/login|index/);
  
  const usuarioInput = page.locator('input[name="usuario"]').first();
  await expect(usuarioInput).toBeVisible();
});
```

### ⚠️ Importante

Antes de ejecutar las pruebas E2E, asegúrate de que el servidor esté corriendo:

```bash
# En una terminal
npm run dev
```

Playwright intentará iniciar el servidor automáticamente si está configurado en `playwright.config.js`.

---

## 🚀 Pruebas de Rendimiento (Artillery)

### Instalación

```bash
npm install -g artillery
```

### Ejecutar Pruebas de Carga

```bash
# Ejecutar pruebas de carga
npm run test:load

# O directamente
artillery run artillery-config.yml

# Generar reporte HTML
artillery run artillery-config.yml --output report.json
artillery report report.json
```

### Configuración

El archivo `artillery-config.yml` define:

- **Fases de carga:** Calentamiento, carga normal, pico de carga
- **Escenarios:** Navegación, APIs, páginas estáticas
- **Métricas:** Tiempo de respuesta, errores, throughput

### Ejemplo de Configuración

```yaml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 30
      arrivalRate: 2
      name: "Fase de calentamiento"
    - duration: 60
      arrivalRate: 5
      name: "Carga normal"

scenarios:
  - name: "Navegación principal"
    flow:
      - get:
          url: "/"
          expect:
            - statusCode: [200, 301, 302]
```

### ⚠️ Importante

Asegúrate de que el servidor esté corriendo antes de ejecutar las pruebas de carga:

```bash
npm run dev
```

---

## 🔄 Integración Continua

### GitHub Actions

El pipeline de CI/CD está configurado en `.github/workflows/ci.yml`.

Se ejecuta automáticamente en:
- Push a las ramas `main` o `develop`
- Pull requests a `main` o `develop`

**Etapas del pipeline:**
1. Setup de Node.js
2. Instalación de dependencias
3. Pruebas unitarias (Jest)
4. Pruebas E2E (Playwright)
5. Subida de reportes y artefactos

### Jenkins

Para usar Jenkins localmente:

1. **Instalar Jenkins:**
   - Descargar desde: https://www.jenkins.io/download/
   - Seguir el asistente de instalación

2. **Configurar el Pipeline:**
   - Crear un nuevo "Pipeline" job
   - Seleccionar "Pipeline script from SCM"
   - Especificar el repositorio Git
   - El `Jenkinsfile` se detectará automáticamente

3. **Ejecutar el Pipeline:**
   - Clic en "Build Now"
   - Ver el progreso en la consola

### Ejecutar Localmente (Simulando CI)

```bash
# Instalar todas las dependencias
npm ci

# Ejecutar todas las pruebas en secuencia
npm test && npm run test:e2e && npm run test:load
```

---

## 🔒 Pruebas de Seguridad (OWASP ZAP)

### Instalación

1. **Descargar OWASP ZAP:**
   - Visitar: https://www.zaproxy.org/download/
   - Descargar la versión para Windows
   - Ejecutar el instalador

### Uso Básico

1. **Iniciar OWASP ZAP**

2. **Configurar el análisis:**
   - Menú: **Quick Start** → **Attack Mode**
   - URL objetivo: `http://localhost:3000`

3. **Ejecutar el análisis:**
   - Clic en "Attack"
   - Esperar a que termine el análisis

4. **Revisar resultados:**
   - Ver vulnerabilidades en la pestaña "Alerts"
   - Generar reporte: **Report** → **Generate HTML Report**

### ⚠️ Importante

Asegúrate de que el servidor esté corriendo:

```bash
npm run dev
```

### Reporte

El reporte HTML generado incluye:
- Lista de vulnerabilidades encontradas
- Severidad (Alta, Media, Baja, Informativa)
- Recomendaciones de corrección
- Detalles técnicos

---

## 📊 Resumen de Comandos

```bash
# Pruebas unitarias
npm test                    # Ejecutar todas
npm run test:watch         # Modo watch
npm run test:coverage      # Con cobertura

# Pruebas E2E
npm run test:e2e           # Ejecutar todas
npm run test:e2e:ui        # Modo UI

# Pruebas de carga
npm run test:load          # Ejecutar Artillery

# Todo en secuencia (simulando CI)
npm test && npm run test:e2e && npm run test:load
```

---

## 🎥 Para el Video del Examen

### Estructura Sugerida (2-5 minutos):

1. **Introducción (30s):**
   - Presentar el proyecto Biblioteca Xonler
   - Mencionar el stack tecnológico

2. **Pruebas Unitarias (1min):**
   - Mostrar ejecución de `npm test`
   - Mostrar resultados en consola
   - Mostrar cobertura de código

3. **Pruebas Funcionales (1min):**
   - Mostrar Playwright ejecutando pruebas
   - Mostrar el navegador automatizado
   - Mostrar resultados

4. **Pruebas de Carga (1min):**
   - Mostrar Artillery ejecutándose
   - Mostrar métricas en tiempo real
   - Mostrar reporte final

5. **CI/CD o Seguridad (1min):**
   - Mostrar pipeline de GitHub Actions o Jenkins
   - O mostrar análisis de OWASP ZAP

6. **Conclusión (30s):**
   - Resumen de resultados
   - Tiempo promedio de respuesta
   - Estado general del sistema

---

## 📝 Notas Importantes

1. **Orden de ejecución recomendado:**
   - Primero: Pruebas unitarias (más rápidas)
   - Segundo: Pruebas E2E (requieren servidor)
   - Tercero: Pruebas de carga (requieren servidor estable)
   - Cuarto: Análisis de seguridad (puede ser independiente)

2. **Servidor en desarrollo:**
   - Usa `npm run dev` para desarrollo con hot-reload
   - Usa `npm start` para producción

3. **Variables de entorno:**
   - Asegúrate de tener un archivo `.env` configurado
   - Para pruebas, puedes usar valores de test

4. **Base de datos:**
   - Las pruebas E2E pueden requerir una base de datos de test
   - Considera usar una base de datos separada para pruebas

---

## 🆘 Solución de Problemas

### Error: "Cannot find module 'jest'"
```bash
npm install --save-dev jest
```

### Error: "Playwright browsers not installed"
```bash
npx playwright install
```

### Error: "Artillery not found"
```bash
npm install -g artillery
```

### Error: "Server not running"
Asegúrate de ejecutar `npm run dev` en una terminal separada antes de ejecutar pruebas E2E o de carga.

---

## 📚 Recursos Adicionales

- [Documentación de Jest](https://jestjs.io/docs/getting-started)
- [Documentación de Playwright](https://playwright.dev/docs/intro)
- [Documentación de Artillery](https://www.artillery.io/docs)
- [Documentación de OWASP ZAP](https://www.zaproxy.org/docs/)

---

**¡Buena suerte con tu examen! 🚀**

