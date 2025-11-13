const { registerErrorHandlers } = require('../../src/bootstrap/register-error-handlers');

describe('register-error-handlers', () => {
  let mockApp;

  beforeEach(() => {
    mockApp = {
      use: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('registerErrorHandlers', () => {
    it('debe registrar manejadores de error', () => {
      registerErrorHandlers(mockApp);
      
      expect(mockApp.use).toHaveBeenCalled();
    });
  });
});

