const { registerBaseMiddleware } = require('../../src/bootstrap/register-base-middleware');

describe('register-base-middleware', () => {
  let mockApp;

  beforeEach(() => {
    mockApp = {
      use: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('registerBaseMiddleware', () => {
    it('debe registrar middleware base', () => {
      registerBaseMiddleware(mockApp);
      
      expect(mockApp.use).toHaveBeenCalled();
    });
  });
});

