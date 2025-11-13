// Mock pg
jest.mock('pg', () => ({
  Pool: jest.fn()
}));

const { createSecurePool, getSSLConfig, validateSSLConfig } = require('../../src/config/database-ssl');
const { Pool } = require('pg');

describe('database-ssl - cobertura completa', () => {
  let mockPool;

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
    
    mockPool = {
      on: jest.fn(),
      connect: jest.fn(),
      end: jest.fn(),
      totalCount: 0,
      idleCount: 0,
      waitingCount: 0
    };
    
    Pool.mockImplementation(() => mockPool);
    
    delete process.env.NODE_ENV;
    delete process.env.DB_SSL_CA;
    delete process.env.DB_SSL_CERT;
    delete process.env.DB_SSL_KEY;
  });

  describe('createSecurePool', () => {
    it('debe crear pool sin SSL en desarrollo', () => {
      process.env.NODE_ENV = 'development';
      
      const result = createSecurePool();
      
      expect(Pool).toHaveBeenCalled();
      expect(result).toHaveProperty('pool');
      expect(result).toHaveProperty('testConnection');
      expect(result).toHaveProperty('getPoolStats');
      expect(result).toHaveProperty('closePool');
    });

    it('debe crear pool con SSL en producción', () => {
      process.env.NODE_ENV = 'production';
      process.env.DB_SSL_CA = 'ca-cert';
      process.env.DB_SSL_CERT = 'client-cert';
      process.env.DB_SSL_KEY = 'client-key';
      
      const result = createSecurePool();
      
      expect(Pool).toHaveBeenCalled();
      const poolConfig = Pool.mock.calls[0][0];
      expect(poolConfig.ssl).toBeDefined();
      expect(poolConfig.ssl.rejectUnauthorized).toBe(true);
    });

    it('debe crear pool con SSL opcional en desarrollo', () => {
      process.env.NODE_ENV = 'development';
      
      const result = createSecurePool();
      
      const poolConfig = Pool.mock.calls[0][0];
      expect(poolConfig.ssl).toBeDefined();
      expect(poolConfig.ssl.rejectUnauthorized).toBe(false);
    });

    it('debe registrar event handlers', () => {
      process.env.NODE_ENV = 'development';
      
      createSecurePool();
      
      expect(mockPool.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('debe probar conexión exitosamente', async () => {
      process.env.NODE_ENV = 'development';
      const mockClient = {
        query: jest.fn().mockResolvedValueOnce({
          rows: [{
            current_time: new Date(),
            db_version: 'PostgreSQL 15.0'
          }]
        }),
        release: jest.fn()
      };
      mockPool.connect.mockResolvedValueOnce(mockClient);
      
      const result = createSecurePool();
      const connectionResult = await result.testConnection();
      
      expect(connectionResult).toBe(true);
      expect(mockClient.query).toHaveBeenCalled();
    });

    it('debe manejar error en testConnection', async () => {
      process.env.NODE_ENV = 'development';
      mockPool.connect.mockRejectedValueOnce(new Error('Connection failed'));
      
      const result = createSecurePool();
      const connectionResult = await result.testConnection();
      
      expect(connectionResult).toBe(false);
    });

    it('debe retornar estadísticas del pool', () => {
      process.env.NODE_ENV = 'development';
      mockPool.totalCount = 5;
      mockPool.idleCount = 2;
      mockPool.waitingCount = 1;
      
      const result = createSecurePool();
      const stats = result.getPoolStats();
      
      expect(stats).toEqual({
        totalCount: 5,
        idleCount: 2,
        waitingCount: 1
      });
    });

    it('debe cerrar pool correctamente', async () => {
      process.env.NODE_ENV = 'development';
      mockPool.end.mockResolvedValueOnce();
      
      const result = createSecurePool();
      await result.closePool();
      
      expect(mockPool.end).toHaveBeenCalled();
    });

    it('debe manejar error al cerrar pool', async () => {
      process.env.NODE_ENV = 'development';
      mockPool.end.mockRejectedValueOnce(new Error('Close error'));
      
      const result = createSecurePool();
      await result.closePool();
      
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getSSLConfig', () => {
    it('debe retornar configuración para development', () => {
      const config = getSSLConfig('development');
      
      expect(config.ssl).toBe(false);
      expect(config.sslmode).toBe('prefer');
    });

    it('debe retornar configuración para staging', () => {
      const config = getSSLConfig('staging');
      
      expect(config.ssl).toBeDefined();
      expect(config.ssl.rejectUnauthorized).toBe(false);
    });

    it('debe retornar configuración para production', () => {
      process.env.DB_SSL_CA = 'ca-cert';
      process.env.DB_SSL_CERT = 'client-cert';
      process.env.DB_SSL_KEY = 'client-key';
      process.env.DB_HOST = 'db.example.com';
      
      const config = getSSLConfig('production');
      
      expect(config.ssl).toBeDefined();
      expect(config.ssl.rejectUnauthorized).toBe(true);
      expect(config.ssl.ca).toBe('ca-cert');
      expect(config.ssl.cert).toBe('client-cert');
      expect(config.ssl.key).toBe('client-key');
    });

    it('debe usar development como default', () => {
      const config = getSSLConfig('unknown');
      
      expect(config.ssl).toBe(false);
    });
  });

  describe('validateSSLConfig', () => {
    it('debe validar configuración básica', () => {
      process.env.DB_USER = 'user';
      process.env.DB_HOST = 'host';
      process.env.DB_NAME = 'db';
      process.env.DB_PASSWORD = 'pass';
      
      const result = validateSSLConfig();
      
      expect(result).toBe(true);
    });

    it('debe advertir sobre variables faltantes', () => {
      delete process.env.DB_USER;
      
      const result = validateSSLConfig();
      
      expect(console.warn).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('debe requerir SSL vars en producción', () => {
      process.env.NODE_ENV = 'production';
      process.env.DB_USER = 'user';
      process.env.DB_HOST = 'host';
      process.env.DB_NAME = 'db';
      process.env.DB_PASSWORD = 'pass';
      delete process.env.DB_SSL_CA;
      
      const result = validateSSLConfig();
      
      expect(console.error).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('debe validar SSL vars en producción', () => {
      process.env.NODE_ENV = 'production';
      process.env.DB_USER = 'user';
      process.env.DB_HOST = 'host';
      process.env.DB_NAME = 'db';
      process.env.DB_PASSWORD = 'pass';
      process.env.DB_SSL_CA = 'ca';
      process.env.DB_SSL_CERT = 'cert';
      process.env.DB_SSL_KEY = 'key';
      
      const result = validateSSLConfig();
      
      expect(result).toBe(true);
    });
  });
});

