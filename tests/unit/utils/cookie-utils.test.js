// Mock console
global.console = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

const {
  setSecureCookie,
  clearSecureCookie,
  setAuthCookies,
  clearAuthCookies,
  checkCookieStatus
} = require('../../../src/utils/cookie-utils');

describe('cookie-utils', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      cookie: jest.fn(),
      clearCookie: jest.fn()
    };
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
    delete process.env.COOKIE_DOMAIN;
  });

  describe('setSecureCookie', () => {
    it('debe establecer cookie con opciones por defecto', () => {
      setSecureCookie(mockRes, 'testCookie', 'testValue');

      expect(mockRes.cookie).toHaveBeenCalledWith(
        'testCookie',
        'testValue',
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'strict',
          maxAge: 24 * 60 * 60 * 1000,
          path: '/'
        })
      );
    });

    it('debe establecer cookie en producción con secure=true', () => {
      process.env.NODE_ENV = 'production';
      setSecureCookie(mockRes, 'testCookie', 'testValue');

      expect(mockRes.cookie).toHaveBeenCalledWith(
        'testCookie',
        'testValue',
        expect.objectContaining({
          secure: true
        })
      );
    });

    it('debe usar dominio si está configurado', () => {
      process.env.COOKIE_DOMAIN = 'example.com';
      setSecureCookie(mockRes, 'testCookie', 'testValue');

      expect(mockRes.cookie).toHaveBeenCalledWith(
        'testCookie',
        'testValue',
        expect.objectContaining({
          domain: 'example.com'
        })
      );
    });

    it('debe sobrescribir opciones por defecto', () => {
      setSecureCookie(mockRes, 'testCookie', 'testValue', {
        maxAge: 1000,
        path: '/custom'
      });

      expect(mockRes.cookie).toHaveBeenCalledWith(
        'testCookie',
        'testValue',
        expect.objectContaining({
          maxAge: 1000,
          path: '/custom'
        })
      );
    });

    it('debe truncar valores muy largos', () => {
      const longValue = 'a'.repeat(5000);
      setSecureCookie(mockRes, 'testCookie', longValue);

      expect(console.warn).toHaveBeenCalled();
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'testCookie',
        expect.stringMatching(/^a{4096}$/),
        expect.any(Object)
      );
    });

    it('debe manejar valores null o undefined', () => {
      setSecureCookie(mockRes, 'testCookie', null);
      expect(mockRes.cookie).toHaveBeenCalled();
    });
  });

  describe('clearSecureCookie', () => {
    it('debe limpiar cookie con opciones correctas', () => {
      clearSecureCookie(mockRes, 'testCookie');

      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        'testCookie',
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'strict',
          path: '/',
          maxAge: 0
        })
      );
    });

    it('debe usar dominio si está configurado', () => {
      process.env.COOKIE_DOMAIN = 'example.com';
      clearSecureCookie(mockRes, 'testCookie');

      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        'testCookie',
        expect.objectContaining({
          domain: 'example.com'
        })
      );
    });
  });

  describe('setAuthCookies', () => {
    it('debe establecer cookies de autenticación', () => {
      const authData = {
        token: 'jwt-token',
        user: {
          id: 1,
          role: 'usuario',
          nombre: 'Juan'
        }
      };

      const result = setAuthCookies(mockRes, authData);

      expect(result).toBe(true);
      expect(mockRes.cookie).toHaveBeenCalledTimes(2);
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'authToken',
        'jwt-token',
        expect.any(Object)
      );
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'userInfo',
        expect.stringContaining('"id":1'),
        expect.any(Object)
      );
    });

    it('debe retornar false si no hay token', () => {
      const authData = { user: { id: 1 } };
      const result = setAuthCookies(mockRes, authData);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
      expect(mockRes.cookie).not.toHaveBeenCalled();
    });

    it('debe usar remember para extender duración', () => {
      const authData = { token: 'jwt-token', user: { id: 1 } };
      setAuthCookies(mockRes, authData, true);

      expect(mockRes.cookie).toHaveBeenCalledWith(
        'authToken',
        'jwt-token',
        expect.objectContaining({
          maxAge: 7 * 24 * 60 * 60 * 1000
        })
      );
    });

    it('debe manejar user con rol o role', () => {
      const authData1 = { token: 'jwt-token', user: { id: 1, rol: 'admin' } };
      setAuthCookies(mockRes, authData1);
      expect(mockRes.cookie).toHaveBeenCalled();

      jest.clearAllMocks();
      const authData2 = { token: 'jwt-token', user: { id: 1, role: 'admin' } };
      setAuthCookies(mockRes, authData2);
      expect(mockRes.cookie).toHaveBeenCalled();
    });

    it('debe manejar user con nombre o name', () => {
      const authData1 = { token: 'jwt-token', user: { id: 1, nombre: 'Juan' } };
      setAuthCookies(mockRes, authData1);
      expect(mockRes.cookie).toHaveBeenCalled();

      jest.clearAllMocks();
      const authData2 = { token: 'jwt-token', user: { id: 1, name: 'Juan' } };
      setAuthCookies(mockRes, authData2);
      expect(mockRes.cookie).toHaveBeenCalled();
    });

    it('debe establecer solo token si no hay user', () => {
      const authData = { token: 'jwt-token' };
      setAuthCookies(mockRes, authData);

      expect(mockRes.cookie).toHaveBeenCalledTimes(1);
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'authToken',
        'jwt-token',
        expect.any(Object)
      );
    });
  });

  describe('clearAuthCookies', () => {
    it('debe limpiar todas las cookies de autenticación', () => {
      clearAuthCookies(mockRes);

      expect(mockRes.clearCookie).toHaveBeenCalledTimes(2);
      expect(mockRes.clearCookie).toHaveBeenCalledWith('authToken', expect.any(Object));
      expect(mockRes.clearCookie).toHaveBeenCalledWith('userInfo', expect.any(Object));
    });
  });

  describe('checkCookieStatus', () => {
    it('debe verificar estado de cookies cuando existen', () => {
      const mockReq = {
        cookies: {
          authToken: 'token',
          userInfo: 'info',
          otherCookie: 'value'
        }
      };

      const status = checkCookieStatus(mockReq);

      expect(status).toEqual({
        hasAuthToken: true,
        hasUserInfo: true,
        cookiesPresent: true,
        cookieCount: 3
      });
    });

    it('debe verificar estado cuando no hay cookies', () => {
      const mockReq = { cookies: {} };

      const status = checkCookieStatus(mockReq);

      expect(status).toEqual({
        hasAuthToken: false,
        hasUserInfo: false,
        cookiesPresent: false,
        cookieCount: 0
      });
    });

    it('debe manejar req sin cookies', () => {
      const mockReq = {};

      const status = checkCookieStatus(mockReq);

      expect(status).toEqual({
        hasAuthToken: false,
        hasUserInfo: false,
        cookiesPresent: false,
        cookieCount: 0
      });
    });

    it('debe verificar estado parcial', () => {
      const mockReq = {
        cookies: {
          authToken: 'token'
        }
      };

      const status = checkCookieStatus(mockReq);

      expect(status).toEqual({
        hasAuthToken: true,
        hasUserInfo: false,
        cookiesPresent: true,
        cookieCount: 1
      });
    });
  });
});

