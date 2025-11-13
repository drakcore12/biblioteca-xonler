// Mock logger antes de cargar cualquier módulo que lo use
jest.mock('../../src/config/logger', () => ({
  logError: jest.fn(),
  logInfo: jest.fn(),
  logAudit: jest.fn(),
  logSecurity: jest.fn(),
  requestLogger: jest.fn((req, res, next) => next()),
  encryptedLogger: {
    getLogger: jest.fn(() => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    }))
  }
}));

// Mock simple-encryption que también usa logger
jest.mock('../../src/utils/simple-encryption', () => {
  const SimpleEncryption = jest.fn().mockImplementation(() => ({
    encrypt: jest.fn((data) => data),
    decrypt: jest.fn((data) => data)
  }));
  return SimpleEncryption;
});

const { registerRoutes } = require('../../src/bootstrap/register-routes');

describe('register-routes', () => {
  let mockApp;

  beforeEach(() => {
    mockApp = {
      get: jest.fn(),
      use: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('registerRoutes', () => {
    it('debe registrar rutas', () => {
      registerRoutes(mockApp);
      
      expect(mockApp.get).toHaveBeenCalled();
      expect(mockApp.use).toHaveBeenCalled();
    });
  });
});

