const { registerSecurityHeaders } = require('../../src/bootstrap/register-security-headers');

describe('register-security-headers', () => {
  let mockApp;

  beforeEach(() => {
    mockApp = {
      use: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('registerSecurityHeaders', () => {
    it('debe registrar headers de seguridad', () => {
      registerSecurityHeaders(mockApp);
      
      expect(mockApp.use).toHaveBeenCalled();
    });
  });
});

