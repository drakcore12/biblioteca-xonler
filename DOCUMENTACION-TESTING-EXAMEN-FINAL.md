# Documentación de Testing - Examen Final
## Sistema de Gestión de Bibliotecas Escolares

**Autor:** [Tu Nombre]  
**Fecha:** 2025  
**Proyecto:** Biblioteca Xonler

---

## Índice

1. [JUnit - Tests Unitarios con Jest](#1-junit---tests-unitarios-con-jest)
2. [Playwright - Tests End-to-End (E2E)](#2-playwright---tests-end-to-end-e2e)
3. [Artillery - Tests de Carga](#3-artillery---tests-de-carga)
4. [Jenkins - Pipeline CI/CD](#4-jenkins---pipeline-cicd)
5. [Instalación y Configuración Completa](#5-instalación-y-configuración-completa)

---

## 1. JUnit - Tests Unitarios con Jest

### 1.1 ¿Qué es JUnit en este proyecto?

JUnit es un formato de reporte XML estándar que Jest genera automáticamente usando el plugin `jest-junit`. Este formato permite que Jenkins y otras herramientas CI/CD visualicen los resultados de los tests de forma estructurada.

### 1.2 Archivos Involucrados

- **`jest.config.js`**: Configuración de Jest
- **`tests/unit/`**: Directorio con todos los tests unitarios
- **`junit.xml`**: Archivo XML generado automáticamente con los resultados

### 1.3 Configuración: `jest.config.js`

```javascript
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    'public/services/**/*.js',
    'public/js/**/*.js',
    '!src/server.js',
    '!**/node_modules/**',
  ],
  roots: ['<rootDir>/tests/unit'],
  testMatch: ['**/?(*.)+(spec|test).js'],
  setupFilesAfterEnv: ['<rootDir>/tests/unit/jest.setup.js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/e2e/',
    '/playwright-report/',
  ],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  // Configuración de reportes JUnit
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'junit.xml',
      suiteName: 'Biblioteca Xonler Tests',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      usePathForSuiteName: 'true'
    }]
  ]
};
```

**Explicación de la configuración:**
- `testEnvironment: 'node'`: Ejecuta tests en entorno Node.js
- `roots: ['<rootDir>/tests/unit']`: Busca tests en `tests/unit/`
- `reporters`: Configura Jest para generar reporte JUnit XML
- `outputDirectory: 'test-results'`: Guarda `junit.xml` en `test-results/`

### 1.4 Estructura de Tests Unitarios

```
tests/unit/
├── app.test.js                    # Tests de la aplicación principal
├── jest.setup.js                  # Configuración global de tests
├── bootstrap/                     # Tests de inicialización
│   ├── register-base-middleware.test.js
│   ├── register-error-handlers.test.js
│   └── ...
├── controllers/                   # Tests de controladores
│   ├── auth.controller.test.js
│   ├── libros.controller.test.js
│   └── ...
├── routes/                        # Tests de rutas
│   ├── auth.routes.test.js
│   └── ...
├── services/                      # Tests de servicios
├── middleware/                    # Tests de middleware
└── utils/                         # Tests de utilidades
```

### 1.5 Ejemplo de Test Unitario

**Archivo: `tests/unit/controllers/auth.controller.test.js`**

```javascript
const request = require('supertest');
const { createApp } = require('../../../src/app');
const db = require('../../../src/config/database');

describe('auth.controller', () => {
  let app;

  beforeAll(async () => {
    app = createApp();
    // Configuración inicial
  });

  afterAll(async () => {
    await db.pool.end();
  });

  describe('register', () => {
    test('debe retornar error 400 si faltan campos obligatorios', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@test.com' }); // Falta password

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('debe registrar un usuario exitosamente', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'nuevo@test.com',
          password: 'password123',
          nombre: 'Test User'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
    });
  });
});
```

### 1.6 Ejecución de Tests Unitarios

#### Instalación de dependencias:

```bash
npm install
```

#### Ejecutar tests:

```bash
# Ejecutar todos los tests unitarios
npm test

# Ejecutar con cobertura
npm run test:coverage

# Ejecutar en modo watch (desarrollo)
npm run test:watch
```

#### Salida esperada:

```
PASS  tests/unit/controllers/auth.controller.test.js
  auth.controller
    register
      ✓ debe retornar error 400 si faltan campos obligatorios (45ms)
      ✓ debe registrar un usuario exitosamente (123ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Time:        2.5s
```

### 1.7 Archivo `junit.xml` Generado

Después de ejecutar los tests, se genera automáticamente `test-results/junit.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="jest tests" tests="1034" failures="0" errors="0" time="45.069">
  <testsuite name="auth.controller" errors="0" failures="0" skipped="0" time="9.589" tests="4">
    <testcase classname="auth.controller register" name="debe retornar error 400 si faltan campos" time="0.07">
    </testcase>
    <testcase classname="auth.controller register" name="debe registrar un usuario exitosamente" time="0.12">
    </testcase>
  </testsuite>
</testsuites>
```

**Estructura del XML:**
- `<testsuites>`: Contenedor principal con estadísticas globales
- `<testsuite>`: Grupo de tests (archivo de test)
- `<testcase>`: Test individual con tiempo de ejecución

### 1.8 Integración con Jenkins

Jenkins lee automáticamente el archivo `junit.xml` y muestra:
- ✅ Tests pasados
- ❌ Tests fallidos
- ⏱️ Tiempo de ejecución
- 📊 Gráficos de tendencias

---

## 2. Playwright - Tests End-to-End (E2E)

### 2.1 ¿Qué es Playwright?

Playwright es un framework de testing E2E que permite automatizar navegadores (Chrome, Firefox, Safari) para probar la aplicación completa desde la perspectiva del usuario.

### 2.2 Archivos Involucrados

- **`playwright.config.js`**: Configuración de Playwright
- **`tests/e2e/`**: Directorio con tests E2E
- **`test-results/`**: Reportes y resultados generados

### 2.3 Configuración: `playwright.config.js`

```javascript
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  
  // Ejecutar tests en paralelo
  fullyParallel: true,
  
  // Fallar el build en CI si hay test.only
  forbidOnly: !!process.env.CI,
  
  // Reintentar en CI solo
  retries: process.env.CI ? 2 : 0,
  
  // Workers en CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporters
  reporter: [
    ['html'],                    // Reporte HTML interactivo
    ['list'],                    // Lista en consola
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  
  // Configuración compartida
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',     // Traces para debugging
    screenshot: 'only-on-failure', // Screenshots en fallos
    video: 'retain-on-failure',   // Videos en fallos
  },

  // Proyectos para diferentes navegadores
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // Servidor de desarrollo
  webServer: process.env.CI ? {
    command: 'node -e "console.log(\'reuse\')"',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: true,
  } : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
```

**Explicación:**
- `testDir`: Ubicación de los tests E2E
- `projects`: Configuración para múltiples navegadores
- `webServer`: Inicia el servidor antes de los tests
- `reporter`: Formatos de reporte (HTML, JSON, lista)

### 2.4 Estructura de Tests E2E

```
tests/e2e/
└── smoke.spec.js    # Tests de smoke (verificación básica)
```

### 2.5 Ejemplo de Test E2E

**Archivo: `tests/e2e/smoke.spec.js`**

```javascript
const { test, expect } = require('@playwright/test');

test.describe('Smoke Tests - Verificación Básica', () => {
  
  test('debe cargar la página principal', async ({ page }) => {
    await page.goto('/');
    
    // Verificar que la página carga
    await expect(page).toHaveTitle(/Biblioteca/i);
    
    // Verificar elementos clave
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('debe navegar a la página de libros', async ({ page }) => {
    await page.goto('/');
    
    // Click en enlace de libros
    await page.click('text=Libros');
    
    // Verificar que se cargó la página de libros
    await expect(page).toHaveURL(/libros/);
    await expect(page.locator('h1')).toContainText('Libros');
  });

  test('debe mostrar formulario de login', async ({ page }) => {
    await page.goto('/pages/guest/login.html');
    
    // Verificar elementos del formulario
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('debe validar login con credenciales inválidas', async ({ page }) => {
    await page.goto('/pages/guest/login.html');
    
    // Llenar formulario
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Verificar mensaje de error
    await expect(page.locator('.alert-danger')).toBeVisible();
  });
});
```

### 2.6 Ejecución de Tests E2E

#### Instalación:

```bash
# Playwright se instala con npm install
# Pero necesitas instalar los navegadores
npx playwright install
```

#### Ejecutar tests:

```bash
# Ejecutar todos los tests E2E
npm run test:e2e

# Ejecutar con UI interactiva
npm run test:e2e:ui

# Ejecutar en un navegador específico
npx playwright test --project=chromium

# Ejecutar con modo debug
npx playwright test --debug
```

#### Salida esperada:

```
Running 4 tests using 1 worker

  ✓ tests/e2e/smoke.spec.js:5:3 › debe cargar la página principal (2.1s)
  ✓ tests/e2e/smoke.spec.js:12:3 › debe navegar a la página de libros (1.8s)
  ✓ tests/e2e/smoke.spec.js:20:3 › debe mostrar formulario de login (1.2s)
  ✓ tests/e2e/smoke.spec.js:28:3 › debe validar login con credenciales inválidas (1.5s)

  4 passed (6.6s)
```

### 2.7 Reportes de Playwright

Después de ejecutar, se generan:

1. **Reporte HTML**: `playwright-report/index.html`
   - Abrir con: `npx playwright show-report`

2. **Resultados JSON**: `test-results/results.json`
   - Para integración con herramientas externas

3. **Screenshots**: En `test-results/` cuando fallan tests

4. **Videos**: En `test-results/` cuando fallan tests

---

## 3. Artillery - Tests de Carga

### 3.1 ¿Qué es Artillery?

Artillery es una herramienta de testing de carga y rendimiento para APIs y aplicaciones web. Permite simular múltiples usuarios concurrentes y medir el rendimiento del sistema.

### 3.2 Archivos Involucrados

- **`tests/artillery-config.yml`**: Configuración de Artillery
- **`package.json`**: Script para ejecutar Artillery

### 3.3 Configuración: `tests/artillery-config.yml`

```yaml
config:
  target: "http://127.0.0.1:3000"
  phases:
    # Fase 1: Rampa de carga gradual
    - duration: 30
      arrivalRate: 2
      name: "Fase de calentamiento"
    # Fase 2: Carga sostenida
    - duration: 60
      arrivalRate: 5
      name: "Carga normal"
    # Fase 3: Pico de carga
    - duration: 30
      arrivalRate: 10
      name: "Pico de carga"
  plugins:
    expect: {}

scenarios:
  # Escenario 1: Navegación básica
  - name: "Navegación principal"
    weight: 40
    flow:
      - get:
          url: "/"
          expect:
            - statusCode: [200, 301, 302]
      - think: 2
      - get:
          url: "/pages/guest/libros.html"
          expect:
            - statusCode: [200, 301, 302]

  # Escenario 2: API de libros
  - name: "API de libros"
    weight: 30
    flow:
      - get:
          url: "/api/libros"
          expect:
            - statusCode: [200, 401]
            - contentType: json
      - think: 1

  # Escenario 3: API de bibliotecas
  - name: "API de bibliotecas"
    weight: 20
    flow:
      - get:
          url: "/api/bibliotecas"
          expect:
            - statusCode: [200, 401]
      - think: 1

  # Escenario 4: Página de contacto
  - name: "Página de contacto"
    weight: 10
    flow:
      - get:
          url: "/pages/guest/contacto.html"
          expect:
            - statusCode: [200, 301, 302]
```

**Explicación de la configuración:**

- **`target`**: URL base de la aplicación
- **`phases`**: Fases de carga con diferentes intensidades
  - `duration`: Duración en segundos
  - `arrivalRate`: Usuarios nuevos por segundo
- **`scenarios`**: Escenarios de prueba
  - `weight`: Probabilidad de ejecución (40% = más frecuente)
  - `flow`: Secuencia de peticiones HTTP
  - `think`: Pausa entre peticiones (simula tiempo de usuario)

### 3.4 Instalación de Artillery

```bash
# Artillery se instala como dependencia de desarrollo
npm install --save-dev artillery

# O globalmente
npm install -g artillery
```

### 3.5 Ejecución de Tests de Carga

#### Ejecutar tests:

```bash
# Ejecutar tests de carga
npm run test:load

# O directamente
artillery run tests/artillery-config.yml

# Con reporte HTML
artillery run --output report.json tests/artillery-config.yml
artillery report report.json
```

#### Salida esperada:

```
Started phase 0 (Fase de calentamiento), duration: 30s @ 14:30:00(+0000) 2025-11-13
Started phase 1 (Carga normal), duration: 60s @ 14:30:30(+0000) 2025-11-13
Started phase 2 (Pico de carga), duration: 30s @ 14:31:30(+0000) 2025-11-13

Summary report @ 14:32:00(+0000) 2025-11-13
  Scenarios launched:  450
  Scenarios completed: 450
  Requests completed:  900
  Mean response time:  45ms
  p95:                 120ms
  p99:                 250ms
  Request failure rate: 0%

Scenarios:
  Navegación principal: 180 ████████████████████
  API de libros:        135 ██████████████
  API de bibliotecas:    90 █████████
  Página de contacto:    45 █████
```

### 3.6 Métricas Importantes

- **Mean response time**: Tiempo promedio de respuesta
- **p95/p99**: Percentiles (95% o 99% de requests responden en este tiempo)
- **Request failure rate**: Porcentaje de requests fallidos
- **Scenarios completed**: Escenarios ejecutados exitosamente

---

## 4. Jenkins - Pipeline CI/CD

### 4.1 ¿Qué es Jenkins?

Jenkins es una herramienta de automatización CI/CD que ejecuta el pipeline completo: instala dependencias, ejecuta tests, y genera reportes automáticamente.

### 4.2 Archivo: `Jenkinsfile`

El `Jenkinsfile` define todo el proceso de CI/CD en código. Aquí está la estructura completa:

```groovy
pipeline {
  agent any

  environment {
    SONAR_HOST_URL = 'http://localhost:9000'
    DB_NAME = "${env.DB_NAME ?: 'xonler'}"
    DB_USER = "${env.DB_USER ?: 'postgres'}"
    DB_PASSWORD = "${env.DB_PASSWORD ?: 'postgres'}"
    PORT = "${env.PORT ?: '3000'}"
  }

  stages {
    // Stage 1: Instalar dependencias
    stage('Instalar dependencias') {
      steps {
        sh 'npm ci || npm install'
      }
    }

    // Stage 2: Iniciar contenedores
    stage('Iniciar contenedores') {
      steps {
        sh '''
          docker compose up -d db app sonarqube db-init-sonar
          sleep 10
        '''
      }
    }

    // Stage 3: Verificar salud de contenedores
    stage('Verificar salud de contenedores') {
      steps {
        sh '''
          # Esperar hasta que los contenedores estén healthy
          timeout 300 bash -c 'until docker inspect --format="{{.State.Health.Status}}" pg-main | grep -q healthy; do sleep 5; done'
          timeout 300 bash -c 'until docker inspect --format="{{.State.Health.Status}}" web-app | grep -q healthy; do sleep 5; done'
          timeout 300 bash -c 'until docker inspect --format="{{.State.Health.Status}}" sonarqube | grep -q healthy; do sleep 5; done'
        '''
      }
    }

    // Stage 4: Tests Unitarios (JUnit)
    stage('Tests Unitarios') {
      steps {
        sh '''
          mkdir -p test-results
          npm test || true
        '''
      }
      post {
        always {
          junit 'test-results/junit.xml'
          archiveArtifacts 'test-results/junit.xml'
        }
      }
    }

    // Stage 5: Tests E2E (Playwright)
    stage('Tests E2E') {
      steps {
        sh '''
          mkdir -p test-results playwright-report
          npm run test:e2e || true
        '''
      }
      post {
        always {
          publishHTML([
            reportDir: 'playwright-report',
            reportFiles: 'index.html',
            reportName: 'Playwright Report'
          ])
        }
      }
    }

    // Stage 6: Tests de Carga (Artillery)
    stage('Tests de Carga') {
      steps {
        sh '''
          npm run test:load || true
        '''
      }
    }

    // Stage 7: Análisis SonarQube
    stage('Análisis SonarQube') {
      steps {
        sh '''
          npm run test:coverage || true
          npm run sonar:local || true
        '''
      }
    }
  }

  post {
    always {
      archiveArtifacts 'test-results/**/*,playwright-report/**/*,coverage/**/*'
    }
  }
}
```

### 4.3 Instalación de Jenkins

#### Opción 1: Docker (Recomendado)

```bash
# Usar docker-compose.yml que ya incluye Jenkins
docker compose up -d jenkins

# Acceder a Jenkins
# URL: http://localhost:18080
# Contraseña inicial: Ver logs del contenedor
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

#### Opción 2: Instalación Local

```bash
# Windows (con Chocolatey)
choco install jenkins

# O descargar desde https://www.jenkins.io/download/
```

### 4.4 Configuración del Pipeline en Jenkins

#### Paso 1: Crear nuevo Job

1. Ir a Jenkins → "New Item"
2. Nombre: `biblioteca-xonler-pipeline`
3. Tipo: "Pipeline"
4. Click "OK"

#### Paso 2: Configurar Pipeline

1. En "Pipeline Definition", seleccionar "Pipeline script from SCM"
2. SCM: Git
3. Repository URL: URL de tu repositorio
4. Branch: `main` o `master`
5. Script Path: `Jenkinsfile`
6. Click "Save"

#### Paso 3: Ejecutar Pipeline

1. Click en el job creado
2. Click "Build Now"
3. Ver progreso en "Build History"

### 4.5 Visualización de Resultados en Jenkins

Después de ejecutar el pipeline, Jenkins muestra:

1. **Tests Unitarios (JUnit)**:
   - Gráfico de tendencias
   - Lista de tests pasados/fallidos
   - Tiempo de ejecución

2. **Tests E2E (Playwright)**:
   - Reporte HTML interactivo
   - Screenshots de fallos
   - Videos de ejecución

3. **Tests de Carga (Artillery)**:
   - Métricas de rendimiento
   - Tasa de errores
   - Tiempos de respuesta

---

## 5. Instalación y Configuración Completa

### 5.1 Requisitos Previos

```bash
# Node.js (v20 o superior)
node --version

# Docker y Docker Compose
docker --version
docker compose version

# Git
git --version
```

### 5.2 Instalación Paso a Paso

#### Paso 1: Clonar Repositorio

```bash
git clone https://github.com/tu-usuario/biblioteca-xonler.git
cd biblioteca-xonler
```

#### Paso 2: Instalar Dependencias de Node.js

```bash
npm install
```

Esto instala:
- Jest y jest-junit (tests unitarios)
- Playwright (tests E2E)
- Artillery (tests de carga)
- Todas las demás dependencias

#### Paso 3: Instalar Navegadores de Playwright

```bash
npx playwright install
```

#### Paso 4: Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp env.example .env

# Editar .env con tus configuraciones
# Variables importantes:
# - DB_NAME, DB_USER, DB_PASSWORD
# - PORT, JWT_SECRET
# - SONAR_HOST_URL (para SonarQube)
```

#### Paso 5: Iniciar Servicios con Docker

```bash
# Iniciar todos los servicios
docker compose up -d

# Verificar que están corriendo
docker compose ps

# Ver logs
docker compose logs -f
```

#### Paso 6: Verificar Instalación

```bash
# 1. Verificar que la aplicación responde
curl http://localhost:3000/api/health

# 2. Ejecutar tests unitarios
npm test

# 3. Ejecutar tests E2E
npm run test:e2e

# 4. Ejecutar tests de carga
npm run test:load
```

### 5.3 Estructura Completa del Proyecto

```
biblioteca-xonler/
├── src/                          # Código fuente de la aplicación
├── public/                       # Archivos estáticos
├── tests/                        # Todos los tests
│   ├── unit/                    # Tests unitarios (Jest)
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── ...
│   ├── e2e/                     # Tests E2E (Playwright)
│   │   └── smoke.spec.js
│   └── artillery-config.yml     # Configuración Artillery
├── jest.config.js               # Configuración Jest/JUnit
├── playwright.config.js        # Configuración Playwright
├── Jenkinsfile                  # Pipeline CI/CD
├── docker-compose.yml           # Servicios Docker
├── Dockerfile                   # Imagen de la aplicación
├── package.json                 # Dependencias y scripts
└── junit.xml                    # Reporte JUnit (generado)
```

### 5.4 Scripts Disponibles en `package.json`

```json
{
  "scripts": {
    "test": "jest --ci --reporters=default --reporters=jest-junit",
    "test:unit": "jest --coverage --ci --reporters=default --reporters=jest-junit",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:load": "artillery run tests/artillery-config.yml",
    "sonar:local": "cross-env SONAR_HOST_URL=http://localhost:9000 npx sonarqube-scanner"
  }
}
```

### 5.5 Comandos de Uso Rápido

```bash
# Desarrollo
npm run dev                    # Iniciar servidor en modo desarrollo

# Testing
npm test                      # Tests unitarios (genera junit.xml)
npm run test:coverage         # Tests con cobertura
npm run test:e2e              # Tests E2E con Playwright
npm run test:load              # Tests de carga con Artillery

# CI/CD
docker compose up -d          # Iniciar servicios
npm test && npm run test:e2e  # Ejecutar todos los tests
```

---

## 6. Flujo Completo del Pipeline

### 6.1 Diagrama de Flujo

```
┌─────────────────────┐
│  Git Push/Trigger   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Instalar Dependencias│
│    npm ci           │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Iniciar Contenedores│
│ docker compose up   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Verificar Salud     │
│ (Health Checks)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Tests Unitarios     │
│ Jest → junit.xml    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Tests E2E           │
│ Playwright          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Tests de Carga      │
│ Artillery           │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Análisis SonarQube  │
│ Code Quality        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Archivar Resultados │
│ (Artifacts)         │
└─────────────────────┘
```

### 6.2 Tiempos Estimados

- Instalación de dependencias: ~2-3 minutos
- Inicio de contenedores: ~1-2 minutos
- Verificación de salud: ~30 segundos - 5 minutos
- Tests unitarios: ~45-60 segundos (1034 tests)
- Tests E2E: ~10-30 segundos
- Tests de carga: ~2 minutos (120 segundos de ejecución)
- Análisis SonarQube: ~1-2 minutos

**Total estimado: ~10-15 minutos**

---

## 7. Troubleshooting (Solución de Problemas)

### 7.1 Tests Unitarios No Generan `junit.xml`

**Problema:** El archivo `junit.xml` no se genera después de ejecutar tests.

**Solución:**
```bash
# Verificar que jest-junit está instalado
npm list jest-junit

# Verificar configuración en jest.config.js
# Asegurar que outputDirectory existe
mkdir -p test-results

# Ejecutar tests nuevamente
npm test
```

### 7.2 Playwright No Encuentra Navegadores

**Problema:** Error "Executable doesn't exist"

**Solución:**
```bash
# Instalar navegadores
npx playwright install

# O instalar solo Chrome
npx playwright install chromium
```

### 7.3 Artillery No Puede Conectar

**Problema:** Error de conexión al ejecutar Artillery

**Solución:**
```bash
# Verificar que la aplicación está corriendo
curl http://localhost:3000/api/health

# Verificar la URL en artillery-config.yml
# Asegurar que target apunta a la URL correcta
```

### 7.4 Jenkins No Ejecuta el Pipeline

**Problema:** Pipeline falla en Jenkins

**Solución:**
1. Verificar logs del build en Jenkins
2. Verificar que Docker está disponible en Jenkins
3. Verificar permisos del usuario de Jenkins
4. Verificar que todas las dependencias están instaladas

---

## 8. Ejemplos de Código Completos

### 8.1 Test Unitario Completo

```javascript
// tests/unit/controllers/libros.controller.test.js
const request = require('supertest');
const { createApp } = require('../../../src/app');
const db = require('../../../src/config/database');

describe('libros.controller', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  afterAll(async () => {
    await db.pool.end();
  });

  describe('obtenerLibros', () => {
    test('debe obtener lista de libros', async () => {
      const response = await request(app)
        .get('/api/libros')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('debe filtrar libros por categoría', async () => {
      const response = await request(app)
        .get('/api/libros?categoria=Ficción')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(libro => {
        expect(libro.categoria).toBe('Ficción');
      });
    });
  });
});
```

### 8.2 Test E2E Completo

```javascript
// tests/e2e/login.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Flujo de Login', () => {
  test('login exitoso', async ({ page }) => {
    await page.goto('/pages/guest/login.html');
    
    // Llenar formulario
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Esperar redirección
    await page.waitForURL(/user|admin/);
    
    // Verificar que está logueado
    const userMenu = page.locator('.user-menu');
    await expect(userMenu).toBeVisible();
  });
});
```

### 8.3 Configuración Artillery Avanzada

```yaml
# tests/artillery-config.yml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 1
      rampTo: 10
      name: "Rampa gradual"
    - duration: 120
      arrivalRate: 10
      name: "Carga sostenida"
  plugins:
    expect: {}
    metrics-by-endpoint:
      stripQueryString: true

scenarios:
  - name: "Flujo completo de usuario"
    weight: 50
    flow:
      - get:
          url: "/"
      - think: 3
      - get:
          url: "/api/libros"
          capture:
            - json: "$.data[0].id"
              as: "libroId"
      - get:
          url: "/api/libros/{{ libroId }}"
      - think: 2
```

---

## 9. Métricas y Reportes

### 9.1 Métricas de Tests Unitarios

- **Total de tests**: 1034
- **Tests pasados**: Ver en `junit.xml`
- **Cobertura de código**: Ejecutar `npm run test:coverage`
- **Tiempo de ejecución**: ~45 segundos

### 9.2 Métricas de Tests E2E

- **Tests ejecutados**: Ver en `playwright-report/`
- **Tasa de éxito**: Ver en reporte HTML
- **Screenshots**: En `test-results/` cuando fallan

### 9.3 Métricas de Tests de Carga

- **Requests por segundo**: Configurado en `arrivalRate`
- **Tiempo de respuesta promedio**: Ver en salida de Artillery
- **Tasa de errores**: Debe ser < 1%

---

## 10. Conclusión

Este proyecto implementa un sistema completo de testing con:

1. ✅ **JUnit** (Jest): 1034 tests unitarios con reportes XML
2. ✅ **Playwright**: Tests E2E en múltiples navegadores
3. ✅ **Artillery**: Tests de carga y rendimiento
4. ✅ **Jenkins**: Pipeline CI/CD automatizado

Todos los componentes están integrados y funcionando correctamente, generando reportes y métricas que permiten mantener la calidad del código.

---

## Anexos

### Anexo A: Comandos de Docker

```bash
# Ver estado de contenedores
docker compose ps

# Ver logs
docker compose logs -f app
docker compose logs -f db
docker compose logs -f sonarqube

# Reiniciar servicios
docker compose restart

# Detener servicios
docker compose down

# Reconstruir imágenes
docker compose build --no-cache
```

### Anexo B: URLs de Acceso

- **Aplicación**: http://localhost:3000
- **Jenkins**: http://localhost:18080
- **SonarQube**: http://localhost:9000
- **Grafana**: http://localhost:3001
- **Prometheus**: http://localhost:9090
- **pgAdmin**: http://localhost:30978

### Anexo C: Credenciales por Defecto

- **Jenkins**: admin / [ver en logs]
- **SonarQube**: admin / admin
- **pgAdmin**: admin@biblioteca-xonler.com / admin
- **PostgreSQL**: postgres / postgres

---

**Fin de la Documentación**

