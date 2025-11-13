# Guía Rápida de Testing - Examen Final
## Biblioteca Xonler - Sistema de Testing Completo

---

## 📋 Índice Rápido

1. [Grupo 1: JUnit (Tests Unitarios)](#grupo-1-junit-tests-unitarios)
2. [Grupo 2: Playwright (Tests E2E)](#grupo-2-playwright-tests-e2e)
3. [Grupo 3: Artillery (Tests de Carga)](#grupo-3-artillery-tests-de-carga)
4. [Grupo 4: Jenkins (CI/CD)](#grupo-4-jenkins-cicd)

---

## Grupo 1: JUnit (Tests Unitarios)

### 🎯 ¿Qué es?
JUnit es un formato XML estándar para reportar resultados de tests. En este proyecto, Jest genera automáticamente reportes en formato JUnit.

### 📁 Archivos Clave

#### 1. `jest.config.js`
```javascript
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/unit'],
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'junit.xml',
      suiteName: 'Biblioteca Xonler Tests'
    }]
  ]
};
```

#### 2. `tests/unit/` - Estructura
```
tests/unit/
├── controllers/     # Tests de controladores
├── routes/          # Tests de rutas
├── services/        # Tests de servicios
├── middleware/      # Tests de middleware
└── utils/           # Tests de utilidades
```

#### 3. `junit.xml` (Generado automáticamente)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="jest tests" tests="1034" failures="0">
  <testsuite name="auth.controller" tests="15">
    <testcase name="debe registrar usuario" time="0.12"/>
  </testsuite>
</testsuites>
```

### ⚙️ Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Verificar instalación
npm list jest jest-junit
```

### 🚀 Uso

```bash
# Ejecutar tests unitarios
npm test

# Con cobertura
npm run test:coverage

# Modo watch (desarrollo)
npm run test:watch
```

### ✅ Verificación

```bash
# Verificar que se generó junit.xml
ls test-results/junit.xml

# Ver contenido
cat test-results/junit.xml | head -20
```

### 📊 Resultados

- **Total de tests**: 1034
- **Archivo generado**: `test-results/junit.xml`
- **Tiempo promedio**: ~45 segundos

---

## Grupo 2: Playwright (Tests E2E)

### 🎯 ¿Qué es?
Playwright automatiza navegadores (Chrome, Firefox, Safari) para probar la aplicación completa desde la perspectiva del usuario.

### 📁 Archivos Clave

#### 1. `playwright.config.js`
```javascript
module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ]
});
```

#### 2. `tests/e2e/smoke.spec.js`
```javascript
const { test, expect } = require('@playwright/test');

test('debe cargar página principal', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Biblioteca/i);
});
```

### ⚙️ Instalación

```bash
# 1. Instalar dependencias (ya incluido en npm install)
npm install

# 2. Instalar navegadores
npx playwright install

# 3. Verificar instalación
npx playwright --version
```

### 🚀 Uso

```bash
# Ejecutar todos los tests E2E
npm run test:e2e

# Con UI interactiva
npm run test:e2e:ui

# Solo Chrome
npx playwright test --project=chromium

# Modo debug
npx playwright test --debug
```

### ✅ Verificación

```bash
# Ver reporte HTML
npx playwright show-report

# Ver resultados JSON
cat test-results/results.json
```

### 📊 Resultados

- **Reporte HTML**: `playwright-report/index.html`
- **Screenshots**: `test-results/` (solo en fallos)
- **Videos**: `test-results/` (solo en fallos)

---

## Grupo 3: Artillery (Tests de Carga)

### 🎯 ¿Qué es?
Artillery simula múltiples usuarios concurrentes para medir el rendimiento y capacidad de la aplicación bajo carga.

### 📁 Archivos Clave

#### 1. `tests/artillery-config.yml`
```yaml
config:
  target: "http://127.0.0.1:3000"
  phases:
    - duration: 30
      arrivalRate: 2
      name: "Fase de calentamiento"
    - duration: 60
      arrivalRate: 5
      name: "Carga normal"
    - duration: 30
      arrivalRate: 10
      name: "Pico de carga"

scenarios:
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
```

### ⚙️ Instalación

```bash
# Artillery se instala con npm install
# Verificar instalación
npm list artillery

# O instalar globalmente
npm install -g artillery
```

### 🚀 Uso

```bash
# Ejecutar tests de carga
npm run test:load

# O directamente
artillery run tests/artillery-config.yml

# Con reporte HTML
artillery run --output report.json tests/artillery-config.yml
artillery report report.json
```

### ✅ Verificación

```bash
# Verificar que la app está corriendo
curl http://localhost:3000/api/health

# Ejecutar test rápido
artillery quick --count 10 --num 2 http://localhost:3000
```

### 📊 Métricas Importantes

- **Mean response time**: Tiempo promedio
- **p95/p99**: Percentiles de tiempo
- **Request failure rate**: Debe ser < 1%
- **Scenarios completed**: Escenarios exitosos

---

## Grupo 4: Jenkins (CI/CD)

### 🎯 ¿Qué es?
Jenkins automatiza todo el proceso: instala dependencias, ejecuta tests y genera reportes automáticamente cuando hay cambios en el código.

### 📁 Archivos Clave

#### 1. `Jenkinsfile` (Pipeline Completo)
```groovy
pipeline {
  agent any
  
  stages {
    stage('Instalar dependencias') {
      steps { sh 'npm ci' }
    }
    
    stage('Iniciar contenedores') {
      steps { sh 'docker compose up -d db app sonarqube' }
    }
    
    stage('Verificar salud') {
      steps {
        sh '''
          timeout 300 bash -c 'until docker inspect pg-main | grep healthy; do sleep 5; done'
        '''
      }
    }
    
    stage('Tests Unitarios') {
      steps { sh 'npm test' }
      post {
        always { junit 'test-results/junit.xml' }
      }
    }
    
    stage('Tests E2E') {
      steps { sh 'npm run test:e2e' }
      post {
        always {
          publishHTML([
            reportDir: 'playwright-report',
            reportFiles: 'index.html'
          ])
        }
      }
    }
    
    stage('Tests de Carga') {
      steps { sh 'npm run test:load' }
    }
    
    stage('Análisis SonarQube') {
      steps { sh 'npm run sonar:local' }
    }
  }
}
```

### ⚙️ Instalación

#### Opción 1: Docker (Recomendado)
```bash
# Usar docker-compose.yml
docker compose up -d jenkins

# Obtener contraseña inicial
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword

# Acceder a http://localhost:18080
```

#### Opción 2: Manual
```bash
# Windows
choco install jenkins

# O descargar desde jenkins.io
```

### 🚀 Configuración en Jenkins

#### Paso 1: Crear Pipeline
1. Jenkins → "New Item"
2. Nombre: `biblioteca-xonler`
3. Tipo: "Pipeline"
4. OK

#### Paso 2: Configurar
1. "Pipeline script from SCM"
2. SCM: Git
3. Repository: URL de tu repo
4. Branch: `main`
5. Script Path: `Jenkinsfile`
6. Save

#### Paso 3: Ejecutar
1. Click "Build Now"
2. Ver progreso en consola

### ✅ Verificación

```bash
# Ver estado de contenedores
docker compose ps

# Ver logs de Jenkins
docker compose logs jenkins

# Verificar que Jenkins responde
curl http://localhost:18080
```

### 📊 Resultados en Jenkins

- **Tests Unitarios**: Gráfico de tendencias JUnit
- **Tests E2E**: Reporte HTML de Playwright
- **Tests de Carga**: Métricas de Artillery
- **SonarQube**: Análisis de calidad de código

---

## 🔄 Flujo Completo Paso a Paso

### Paso 1: Preparación del Entorno

```bash
# 1. Clonar repositorio
git clone https://github.com/tu-usuario/biblioteca-xonler.git
cd biblioteca-xonler

# 2. Instalar dependencias
npm install

# 3. Instalar navegadores de Playwright
npx playwright install
```

### Paso 2: Configurar Variables

```bash
# Copiar archivo de ejemplo
cp env.example .env

# Editar .env con tus configuraciones
# Variables importantes:
# - DB_NAME=xonler
# - DB_USER=postgres
# - DB_PASSWORD=postgres
# - PORT=3000
# - JWT_SECRET=tu-secret
```

### Paso 3: Iniciar Servicios

```bash
# Iniciar todos los servicios
docker compose up -d

# Verificar estado
docker compose ps

# Ver logs
docker compose logs -f
```

### Paso 4: Ejecutar Tests Manualmente

```bash
# Tests unitarios (genera junit.xml)
npm test

# Tests E2E
npm run test:e2e

# Tests de carga
npm run test:load

# Ver reportes
npx playwright show-report
```

### Paso 5: Configurar Jenkins

```bash
# 1. Acceder a Jenkins
# URL: http://localhost:18080

# 2. Obtener contraseña inicial
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword

# 3. Crear pipeline (ver sección anterior)

# 4. Ejecutar pipeline
# Click "Build Now" en Jenkins
```

---

## 📝 Comandos de Referencia Rápida

### Testing
```bash
npm test              # Tests unitarios (JUnit)
npm run test:coverage # Con cobertura
npm run test:e2e      # Tests E2E (Playwright)
npm run test:load     # Tests de carga (Artillery)
```

### Docker
```bash
docker compose up -d           # Iniciar servicios
docker compose ps            # Ver estado
docker compose logs -f app     # Ver logs
docker compose down            # Detener servicios
```

### Jenkins
```bash
docker compose up -d jenkins                    # Iniciar Jenkins
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword  # Contraseña
```

### Verificación
```bash
curl http://localhost:3000/api/health      # App
curl http://localhost:9000/api/system/status  # SonarQube
curl http://localhost:18080                 # Jenkins
```

---

## 🎓 Preguntas Frecuentes para el Examen

### ¿Qué genera JUnit?
- Jest ejecuta los tests unitarios
- `jest-junit` genera `test-results/junit.xml`
- Jenkins lee este XML y muestra resultados

### ¿Qué hace Playwright?
- Automatiza navegadores reales
- Prueba la aplicación completa
- Genera reportes HTML con screenshots

### ¿Qué hace Artillery?
- Simula usuarios concurrentes
- Mide rendimiento bajo carga
- Genera métricas de tiempo de respuesta

### ¿Qué hace Jenkins?
- Automatiza todo el proceso
- Ejecuta tests automáticamente
- Genera reportes consolidados

---

## 📚 Recursos Adicionales

- **Jest**: https://jestjs.io/
- **Playwright**: https://playwright.dev/
- **Artillery**: https://www.artillery.io/
- **Jenkins**: https://www.jenkins.io/

---

**Documentación creada para Examen Final - 2025**

