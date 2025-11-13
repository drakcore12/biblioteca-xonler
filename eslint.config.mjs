// ESLint v9+ flat config format (ESM)
export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/playwright-report/**',
      '**/coverage/**',
      '**/test-results/**',
      '**/logs/**',
      '**/*.min.js',
      '**/dist/**',
      '**/build/**'
    ]
  },
  {
    languageOptions: {
      ecmaVersion: 2022, // Soporte para class fields
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        console: 'readonly',
        globalThis: 'readonly',
        // Node globals
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        global: 'readonly',
        // Jest globals
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly'
      }
    },
    rules: {
      // Prevenir catch vacíos
      'no-empty': ['error', { allowEmptyCatch: false }],
      
      // Prevenir returns inútiles
      'no-useless-return': 'warn',
      
      // Prevenir constructores inútiles
      'no-useless-constructor': 'warn',
      
      // Prevenir ternarios anidados
      'no-nested-ternary': 'warn',
      
      // Preferir const/let sobre var
      'no-var': 'error',
      'prefer-const': 'warn',
      
      // Prevenir console en producción (solo warning)
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      
      // Prevenir uso antes de definir
      'no-use-before-define': ['error', { functions: false, classes: true, variables: true }],
      
      // Reglas personalizadas usando no-restricted-syntax
      'no-restricted-syntax': [
        'warn',
        {
          selector: "CallExpression[callee.property.name='forEach']",
          message: 'Usa for…of en lugar de forEach para mejor control de flujo (await, break, continue).'
        },
        {
          selector: "Identifier[name='window']",
          message: 'Usa globalThis en lugar de window para mejor portabilidad.'
        }
      ]
    }
  },
  {
    // Reglas específicas para archivos de test
    files: ['**/*.test.js', '**/__tests__/**/*.js'],
    rules: {
      'no-console': 'off'
    }
  },
  {
    // Reglas específicas para scripts (permitir console.log)
    files: ['scripts/**/*.js'],
    rules: {
      'no-console': 'off',
      'no-use-before-define': 'off'
    }
  }
];

