module.exports = {
  testEnvironment: 'node', // Por defecto node, los tests del frontend usan @jest-environment jsdom
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    'public/services/**/*.js',
    'public/js/**/*.js',
    '!src/server.js',
    '!**/node_modules/**',
    '!**/*.cjs', // Excluir archivos temporales CommonJS
    '!**/*.test.cjs' // Excluir archivos temporales de test
  ],
  // Mapear archivos temporales a los originales para cobertura
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '\\.test\\.cjs$' // Ignorar archivos temporales de test
  ],
  roots: ['<rootDir>/tests/unit'],
  testMatch: [
    '**/?(*.)+(spec|test).js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/unit/jest.setup.js'],
  // Excluir tests de Playwright (E2E)
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/e2e/',
    '/playwright-report/',
    '/tests/unit/jest.setup.js',
    '/tests/unit/setup.js'
  ],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  // Configuración de Source Maps
  collectCoverage: false, // Se puede activar con --coverage
  // Asegurar que jest-junit genere el XML
  testResultsProcessor: undefined,
  // Habilitar source maps para mejor debugging
  transform: {
    '^.+\\.js$': 'babel-jest' // Transformar ES modules a CommonJS con Babel
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(bootstrap)/)' // Transformar bootstrap si es necesario
  ],
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

