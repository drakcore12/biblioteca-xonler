// Mock express-rate-limit
jest.mock('express-rate-limit', () => {
  return jest.fn((options) => {
    return jest.fn((req, res, next) => {
      next();
    });
  });
});

// Mock helmet
jest.mock('helmet', () => {
  return jest.fn((options) => {
    return jest.fn((req, res, next) => {
      next();
    });
  });
});

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const {
  authRateLimit,
  apiRateLimit,
  sensitiveRateLimit,
  helmetConfig,
  securityLogger,
  inputValidator
} = require('../../../src/middleware/security');

describe('middleware/security', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      ip: '127.0.0.1',
      url: '/test',
      method: 'GET',
      path: '/test',
      body: {},
      query: {},
      get: jest.fn()
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
    console.log = jest.fn();
    console.warn = jest.fn();
  });

  describe('authRateLimit', () => {
    it('debe crear un rate limiter para autenticación', () => {
      expect(authRateLimit).toBeDefined();
      expect(typeof authRateLimit).toBe('function');
    });
  });

  describe('apiRateLimit', () => {
    it('debe crear un rate limiter para API general', () => {
      expect(apiRateLimit).toBeDefined();
      expect(typeof apiRateLimit).toBe('function');
    });
  });

  describe('sensitiveRateLimit', () => {
    it('debe crear un rate limiter para endpoints sensibles', () => {
      expect(sensitiveRateLimit).toBeDefined();
      expect(typeof sensitiveRateLimit).toBe('function');
    });
  });

  describe('helmetConfig', () => {
    it('debe configurar helmet con opciones de seguridad', () => {
      expect(helmetConfig).toBeDefined();
      expect(typeof helmetConfig).toBe('function');
    });
  });

  describe('securityLogger', () => {
    it('debe continuar sin problemas para requests normales', () => {
      securityLogger(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('debe detectar path traversal', () => {
      mockReq.url = '/test/../../../etc/passwd';
      mockReq.body = {};

      securityLogger(mockReq, mockRes, mockNext);

      expect(console.warn).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('debe detectar intentos de XSS', () => {
      mockReq.url = '/test';
      mockReq.body = { input: '<script>alert("xss")</script>' };

      securityLogger(mockReq, mockRes, mockNext);

      expect(console.warn).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('debe detectar SQL injection', () => {
      mockReq.url = '/test';
      mockReq.query = { search: "test' UNION SELECT * FROM users--" };

      securityLogger(mockReq, mockRes, mockNext);

      expect(console.warn).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('debe detectar JavaScript injection', () => {
      mockReq.url = '/test';
      mockReq.body = { url: 'javascript:alert(1)' };

      securityLogger(mockReq, mockRes, mockNext);

      expect(console.warn).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('debe loggear requests de autenticación', () => {
      mockReq.path = '/auth/login';

      securityLogger(mockReq, mockRes, mockNext);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[AUTH]'),
        expect.any(Object)
      );
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('inputValidator', () => {
    it('debe sanitizar strings en el body', () => {
      mockReq.body = {
        name: '<script>alert("xss")</script>',
        email: 'test@test.com',
        url: 'javascript:void(0)'
      };

      inputValidator(mockReq, mockRes, mockNext);

      expect(mockReq.body.name).not.toContain('<script>');
      expect(mockReq.body.email).toBe('test@test.com');
      expect(mockReq.body.url).not.toContain('javascript:');
      expect(mockNext).toHaveBeenCalled();
    });

    it('debe sanitizar strings en el query', () => {
      mockReq.query = {
        search: '<b>test</b>',
        filter: 'onclick=alert(1)'
      };

      inputValidator(mockReq, mockRes, mockNext);

      expect(mockReq.query.search).not.toContain('<');
      expect(mockReq.query.filter).not.toContain('onclick=');
      expect(mockNext).toHaveBeenCalled();
    });

    it('debe manejar valores no string sin modificar', () => {
      mockReq.body = {
        number: 123,
        boolean: true,
        object: { key: 'value' },
        array: [1, 2, 3]
      };

      inputValidator(mockReq, mockRes, mockNext);

      expect(mockReq.body.number).toBe(123);
      expect(mockReq.body.boolean).toBe(true);
      expect(mockReq.body.object).toEqual({ key: 'value' });
      expect(mockReq.body.array).toEqual([1, 2, 3]);
      expect(mockNext).toHaveBeenCalled();
    });

    it('debe hacer trim de espacios', () => {
      mockReq.body = {
        name: '  test  ',
        email: '  test@test.com  '
      };

      inputValidator(mockReq, mockRes, mockNext);

      expect(mockReq.body.name).toBe('test');
      expect(mockReq.body.email).toBe('test@test.com');
      expect(mockNext).toHaveBeenCalled();
    });

    it('debe manejar body y query vacíos', () => {
      mockReq.body = {};
      mockReq.query = {};

      inputValidator(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});

