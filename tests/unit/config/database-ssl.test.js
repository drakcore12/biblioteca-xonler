const { createSecurePool, getSSLConfig, validateSSLConfig } = require('../../src/config/database-ssl');

describe('database-ssl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  describe('createSecurePool', () => {
    it('debe crear pool con SSL en producción', () => {
      process.env.NODE_ENV = 'production';
      process.env.DB_SSL_CA = 'ca-cert';
      process.env.DB_SSL_CERT = 'client-cert';
      process.env.DB_SSL_KEY = 'client-key';
      
      const result = createSecurePool();
      
      expect(result).toHaveProperty('pool');
      expect(result).toHaveProperty('testConnection');
      expect(result).toHaveProperty('getPoolStats');
      expect(result).toHaveProperty('closePool');
    });

    it('debe crear pool sin SSL en desarrollo', () => {
      process.env.NODE_ENV = 'development';
      
      const result = createSecurePool();
      
      expect(result).toHaveProperty('pool');
    });
  });

  describe('getSSLConfig', () => {
    it('debe retornar configuración para development', () => {
      const config = getSSLConfig('development');
      
      expect(config).toHaveProperty('ssl');
    });

    it('debe retornar configuración para production', () => {
      process.env.DB_SSL_CA = 'ca-cert';
      process.env.DB_SSL_CERT = 'client-cert';
      process.env.DB_SSL_KEY = 'client-key';
      
      const config = getSSLConfig('production');
      
      expect(config).toHaveProperty('ssl');
      expect(config.ssl).toHaveProperty('rejectUnauthorized');
    });
  });

  describe('validateSSLConfig', () => {
    it('debe validar configuración SSL', () => {
      process.env.DB_USER = 'user';
      process.env.DB_HOST = 'host';
      process.env.DB_NAME = 'db';
      process.env.DB_PASSWORD = 'pass';
      
      const result = validateSSLConfig();
      
      expect(result).toBe(true);
    });

    it('debe retornar false si faltan variables SSL en producción', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.DB_SSL_CA;
      
      const result = validateSSLConfig();
      
      expect(result).toBe(false);
    });
  });
});

