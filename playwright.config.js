// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Configuración de Playwright para pruebas E2E
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests/e2e',
  /* Ejecutar tests en paralelo */
  fullyParallel: true,
  /* Fallar el build en CI si accidentalmente dejaste test.only en el código */
  forbidOnly: !!process.env.CI,
  /* Reintentar en CI solo */
  retries: process.env.CI ? 2 : 0,
  /* Opciones para ejecutar en paralelo */
  workers: process.env.CI ? 1 : undefined,
  /* Configuración del reporter */
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  /* Configuración compartida para todos los proyectos */
          use: {
            /* URL base para usar en navegación */
            /* Si Jenkins está en Docker, usa host.docker.internal para acceder al host */
            baseURL: process.env.BASE_URL || (process.env.JENKINS_DOCKER ? 'http://host.docker.internal:3000' : 'http://localhost:3000'),
    /* Recopilar trace cuando se reintenta el test fallido */
    trace: 'on-first-retry',
    /* Captura de pantalla en fallos */
    screenshot: 'only-on-failure',
    /* Video en fallos */
    video: 'retain-on-failure',
    /* Habilitar source maps para mejor debugging */
    launchOptions: {
      args: ['--enable-source-maps']
    },
  },

  /* Configurar proyectos para diferentes navegadores */
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

  /* Ejecutar servidor de desarrollo local antes de los tests */
  /* En CI, reutilizamos el servidor que Jenkins ya arrancó */
  webServer: process.env.CI ? {
    command: 'node -e "console.log(\'reuse\')"', // Comando inofensivo en CI
    url: process.env.BASE_URL || 'http://127.0.0.1:3000',
    reuseExistingServer: true,  // Clave: no intenta arrancar si ya existe
    timeout: 60 * 1000,
  } : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});

