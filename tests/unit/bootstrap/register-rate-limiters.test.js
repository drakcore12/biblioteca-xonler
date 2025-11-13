const { registerRateLimiters } = require('../../src/bootstrap/register-rate-limiters');

describe('register-rate-limiters', () => {
  let mockApp;

  beforeEach(() => {
    mockApp = {
      use: jest.fn()
    };
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
  });

  describe('registerRateLimiters', () => {
    it('debe registrar rate limiters', () => {
      registerRateLimiters(mockApp);
      
      expect(mockApp.use).toHaveBeenCalled();
    });
  });
});

