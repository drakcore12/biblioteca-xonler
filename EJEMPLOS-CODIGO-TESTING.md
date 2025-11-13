# Ejemplos de Código - Testing
## Biblioteca Xonler

---

## 1. Ejemplos de Tests Unitarios (Jest/JUnit)

### Ejemplo 1: Test de Controlador

```javascript
// tests/unit/controllers/auth.controller.test.js
const request = require('supertest');
const { createApp } = require('../../../src/app');
const db = require('../../../src/config/database');

describe('auth.controller', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  afterAll(async () => {
    await db.pool.end();
  });

  describe('POST /api/auth/register', () => {
    test('debe retornar 400 si faltan campos', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@test.com' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('debe registrar usuario exitosamente', async () => {
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

  describe('POST /api/auth/login', () => {
    test('debe hacer login exitoso', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('token');
    });
  });
});
```

### Ejemplo 2: Test de Ruta

```javascript
// tests/unit/routes/libros.routes.test.js
const request = require('supertest');
const { createApp } = require('../../../src/app');

describe('libros.routes', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  test('GET /api/libros debe retornar lista de libros', async () => {
    const response = await request(app)
      .get('/api/libros')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('GET /api/libros/:id debe retornar libro específico', async () => {
    const response = await request(app)
      .get('/api/libros/1')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id', 1);
  });
});
```

### Ejemplo 3: Test de Middleware

```javascript
// tests/unit/middleware/auth.test.js
const { auth } = require('../../../src/middleware/auth');
const jwt = require('jsonwebtoken');

describe('auth middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      cookies: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  test('debe retornar 401 si no hay token', () => {
    auth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('debe llamar next si el token es válido', () => {
    const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET);
    req.headers.authorization = `Bearer ${token}`;
    
    auth(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
```

---

## 2. Ejemplos de Tests E2E (Playwright)

### Ejemplo 1: Test de Navegación

```javascript
// tests/e2e/navegacion.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Navegación Principal', () => {
  test('debe cargar la página de inicio', async ({ page }) => {
    await page.goto('/');
    
    // Verificar título
    await expect(page).toHaveTitle(/Biblioteca/i);
    
    // Verificar elementos principales
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
  });

  test('debe navegar a página de libros', async ({ page }) => {
    await page.goto('/');
    
    // Click en enlace
    await page.click('a[href*="libros"]');
    
    // Verificar URL
    await expect(page).toHaveURL(/libros/);
    
    // Verificar contenido
    await expect(page.locator('h1')).toContainText('Libros');
  });
});
```

### Ejemplo 2: Test de Formulario

```javascript
// tests/e2e/login.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Login', () => {
  test('debe mostrar formulario de login', async ({ page }) => {
    await page.goto('/pages/guest/login.html');
    
    // Verificar campos
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('debe validar credenciales incorrectas', async ({ page }) => {
    await page.goto('/pages/guest/login.html');
    
    // Llenar formulario
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Verificar mensaje de error
    await expect(page.locator('.alert-danger')).toBeVisible();
    await expect(page.locator('.alert-danger')).toContainText('credenciales');
  });

  test('debe hacer login exitoso', async ({ page }) => {
    await page.goto('/pages/guest/login.html');
    
    // Login
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Esperar redirección
    await page.waitForURL(/user|admin/, { timeout: 5000 });
    
    // Verificar que está logueado
    const userMenu = page.locator('.user-menu, .navbar-user');
    await expect(userMenu).toBeVisible();
  });
});
```

### Ejemplo 3: Test de API desde Navegador

```javascript
// tests/e2e/api.spec.js
const { test, expect } = require('@playwright/test');

test.describe('API desde Navegador', () => {
  test('debe cargar libros desde API', async ({ page }) => {
    // Interceptar petición API
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/libros') && response.status() === 200
    );

    await page.goto('/pages/guest/libros.html');
    
    const response = await responsePromise;
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
});
```

---

## 3. Ejemplos de Configuración Artillery

### Ejemplo 1: Configuración Básica

```yaml
# tests/artillery-config.yml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Carga normal"
  plugins:
    expect: {}

scenarios:
  - name: "Página principal"
    flow:
      - get:
          url: "/"
          expect:
            - statusCode: 200
```

### Ejemplo 2: Configuración con Múltiples Escenarios

```yaml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 30
      arrivalRate: 2
      name: "Calentamiento"
    - duration: 60
      arrivalRate: 10
      name: "Carga alta"

scenarios:
  - name: "Navegación"
    weight: 50
    flow:
      - get: { url: "/" }
      - think: 2
      - get: { url: "/pages/guest/libros.html" }

  - name: "API Libros"
    weight: 30
    flow:
      - get:
          url: "/api/libros"
          expect:
            - statusCode: [200, 401]
            - contentType: json

  - name: "API Bibliotecas"
    weight: 20
    flow:
      - get:
          url: "/api/bibliotecas"
          expect:
            - statusCode: [200, 401]
```

### Ejemplo 3: Configuración Avanzada con Variables

```yaml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 120
      arrivalRate: 1
      rampTo: 20
      name: "Rampa gradual"
  plugins:
    expect: {}
    metrics-by-endpoint:
      stripQueryString: true

scenarios:
  - name: "Flujo completo"
    flow:
      - get:
          url: "/api/libros"
          capture:
            - json: "$.data[0].id"
              as: "libroId"
      - get:
          url: "/api/libros/{{ libroId }}"
      - think: 3
```

---

## 4. Ejemplos de Jenkinsfile

### Ejemplo 1: Pipeline Básico

```groovy
pipeline {
  agent any
  
  stages {
    stage('Instalar') {
      steps {
        sh 'npm ci'
      }
    }
    
    stage('Tests') {
      steps {
        sh 'npm test'
      }
      post {
        always {
          junit 'test-results/junit.xml'
        }
      }
    }
  }
}
```

### Ejemplo 2: Pipeline Completo (Como en el proyecto)

```groovy
pipeline {
  agent any

  environment {
    SONAR_HOST_URL = 'http://localhost:9000'
    PORT = '3000'
  }

  stages {
    stage('Instalar dependencias') {
      steps {
        sh 'npm ci || npm install'
      }
    }

    stage('Iniciar contenedores') {
      steps {
        sh '''
          docker compose up -d db app sonarqube
          sleep 10
        '''
      }
    }

    stage('Verificar salud') {
      steps {
        sh '''
          MAX_WAIT=300
          ELAPSED=0
          while ! docker inspect --format="{{.State.Health.Status}}" pg-main | grep -q healthy; do
            if [ $ELAPSED -ge $MAX_WAIT ]; then
              echo "❌ TIMEOUT"
              exit 1
            fi
            sleep 5
            ELAPSED=$((ELAPSED + 5))
          done
        '''
      }
    }

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
        }
      }
    }

    stage('Tests E2E') {
      steps {
        sh 'npm run test:e2e || true'
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

    stage('Tests de Carga') {
      steps {
        sh 'npm run test:load || true'
      }
    }

    stage('SonarQube') {
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
      archiveArtifacts 'test-results/**/*,playwright-report/**/*'
    }
  }
}
```

---

## 5. Scripts de Instalación Completa

### Script para Windows (PowerShell)

```powershell
# install-testing.ps1
Write-Host "Instalando dependencias..." -ForegroundColor Green
npm install

Write-Host "Instalando navegadores de Playwright..." -ForegroundColor Green
npx playwright install

Write-Host "Iniciando servicios Docker..." -ForegroundColor Green
docker compose up -d

Write-Host "Esperando servicios..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host "Verificando servicios..." -ForegroundColor Green
curl http://localhost:3000/api/health
curl http://localhost:9000/api/system/status

Write-Host "✅ Instalación completada!" -ForegroundColor Green
```

### Script para Linux/Mac (Bash)

```bash
#!/bin/bash
# install-testing.sh

echo "📦 Instalando dependencias..."
npm install

echo "🌐 Instalando navegadores de Playwright..."
npx playwright install

echo "🐳 Iniciando servicios Docker..."
docker compose up -d

echo "⏳ Esperando servicios..."
sleep 30

echo "🔍 Verificando servicios..."
curl -f http://localhost:3000/api/health || echo "❌ App no responde"
curl -f http://localhost:9000/api/system/status || echo "❌ SonarQube no responde"

echo "✅ Instalación completada!"
```

---

## 6. Comandos de Verificación

### Verificar Instalación Completa

```bash
# 1. Verificar Node.js
node --version        # Debe ser v20 o superior
npm --version

# 2. Verificar dependencias
npm list jest
npm list @playwright/test
npm list artillery

# 3. Verificar Playwright
npx playwright --version
npx playwright install --dry-run

# 4. Verificar Docker
docker --version
docker compose version

# 5. Verificar servicios
docker compose ps
curl http://localhost:3000/api/health
curl http://localhost:9000/api/system/status
```

### Ejecutar Todos los Tests

```bash
# Script completo
#!/bin/bash
echo "🧪 Ejecutando tests unitarios..."
npm test

echo "🎭 Ejecutando tests E2E..."
npm run test:e2e

echo "⚡ Ejecutando tests de carga..."
npm run test:load

echo "✅ Todos los tests completados!"
```

---

## 7. Estructura de Archivos Generados

```
proyecto/
├── test-results/
│   ├── junit.xml              # Reporte JUnit (Jest)
│   ├── results.json            # Resultados Playwright
│   ├── screenshot-*.png        # Screenshots de fallos
│   └── video-*.webm            # Videos de fallos
├── playwright-report/
│   └── index.html              # Reporte HTML Playwright
├── coverage/
│   ├── lcov.info               # Cobertura para SonarQube
│   └── index.html              # Reporte HTML de cobertura
└── .scannerwork/               # Archivos de SonarQube
```

---

**Fin de Ejemplos de Código**

