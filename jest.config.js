module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/**',
    '!**/node_modules/**'
  ],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  // Excluir tests de Playwright (E2E)
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/e2e/',
    '/playwright-report/'
  ],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  // Configuración de Source Maps
  collectCoverage: false, // Se puede activar con --coverage
  // Habilitar source maps para mejor debugging
  transform: {},
  // Mejorar stack traces con source maps
  errorOnDeprecated: false,
  // Configuración para mejor debugging
  testTimeout: 10000,
  // Mostrar ubicaciones originales en errores
  displayName: {
    name: 'Biblioteca Xonler',
    color: 'blue'
  },
  // Configuración de reportes
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

