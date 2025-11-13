const { registerSecurityHeaders } = require('../../../src/bootstrap/register-security-headers');

describe('register-security-headers - cobertura completa', () => {
  let mockApp, mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockApp = {
      use: jest.fn()
    };
    mockReq = {
      method: 'GET',
      url: '/test'
    };
    mockRes = {
      setHeader: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('debe registrar middleware de security headers', () => {
    registerSecurityHeaders(mockApp);
    
    expect(mockApp.use).toHaveBeenCalledTimes(1);
  });

  describe('Security headers middleware', () => {
    let middleware;

    beforeEach(() => {
      registerSecurityHeaders(mockApp);
      middleware = mockApp.use.mock.calls[0][0];
    });

    it('debe establecer X-Content-Type-Options', () => {
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    });

    it('debe establecer X-Frame-Options', () => {
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
    });

    it('debe establecer X-XSS-Protection', () => {
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
    });

    it('debe establecer Referrer-Policy', () => {
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin');
    });

    it('debe establecer Permissions-Policy', () => {
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.setHeader).toHaveBeenCalledWith('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    });

    it('debe establecer Content-Security-Policy', () => {
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Security-Policy', expect.stringContaining("default-src 'self'"));
    });

    it('debe llamar next', () => {
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('buildContentSecurityPolicy', () => {
    it('debe construir CSP con todas las directivas', () => {
      registerSecurityHeaders(mockApp);
      const middleware = mockApp.use.mock.calls[0][0];
      
      middleware(mockReq, mockRes, mockNext);
      
      const cspCall = mockRes.setHeader.mock.calls.find(call => call[0] === 'Content-Security-Policy');
      const csp = cspCall[1];
      
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src");
      expect(csp).toContain("style-src");
      expect(csp).toContain("font-src");
      expect(csp).toContain("img-src");
      expect(csp).toContain("connect-src");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("base-uri 'self'");
      expect(csp).toContain("form-action 'self'");
    });
  });
});

