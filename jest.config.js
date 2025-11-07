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
  }
};

