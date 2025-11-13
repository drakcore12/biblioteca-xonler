const AppError = require('../../../src/utils/app-error');

describe('app-error', () => {
  describe('constructor', () => {
    test('debe crear instancia con mensaje y statusCode', () => {
      const error = new AppError('Test error', 400);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('AppError');
      expect(error.isOperational).toBe(true);
    });

    test('debe crear instancia con details', () => {
      const error = new AppError('Test error', 400, { field: 'email' });
      
      expect(error.details).toEqual({ field: 'email' });
    });

    test('debe crear instancia sin details', () => {
      const error = new AppError('Test error', 400);
      
      expect(error.details).toBeNull();
    });

    test('debe tener stack trace', () => {
      const error = new AppError('Test error', 400);
      
      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });
  });
});

