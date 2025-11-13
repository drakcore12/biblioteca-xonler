// Mock logger antes de importar error-handler
jest.mock('../../src/config/logger', () => ({
  logError: jest.fn()
}));

const {
  getPostgresErrorMessage,
  getPostgresErrorStatusCode,
  validateResponse,
  validateError,
  handleError,
  asyncHandler,
  promiseHandler
} = require('../../src/utils/error-handler');

const AppError = require('../../src/utils/app-error');

describe('error-handler - casos adicionales', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('handleError - casos edge', () => {
    test('debe manejar AppError con statusCode inválido', () => {
      const appError = new AppError('Test error', 999);
      handleError(mockRes, appError);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    test('debe manejar AppError con details', () => {
      const appError = new AppError('Test error', 400);
      appError.details = { field: 'email' };
      handleError(mockRes, appError);
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: { field: 'email' }
        })
      );
    });

    test('debe manejar AppError sin message', () => {
      const appError = new AppError('', 400);
      handleError(mockRes, appError, 'Fallback');
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Fallback'
        })
      );
    });

    test('debe manejar todos los códigos de error de PostgreSQL', () => {
      const codes = ['42P01', '42703', '23503', '23505', '23502', '23514', 
                     '08003', '08006', '08001', '08004', '08007', '25P02', '25P03'];
      
      codes.forEach(code => {
        const pgError = new Error('Database error');
        pgError.code = code;
        handleError(mockRes, pgError);
        expect(mockRes.status).toHaveBeenCalled();
        jest.clearAllMocks();
      });
    });

    test('debe manejar error con código no string', () => {
      const pgError = new Error('Database error');
      pgError.code = 12345;
      handleError(mockRes, pgError);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    test('debe manejar fallbackMessage vacío', () => {
      const err = new Error('Test error');
      handleError(mockRes, err, '');
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Error interno del servidor'
        })
      );
    });

    test('debe manejar context no string', () => {
      const err = new Error('Test error');
      handleError(mockRes, err, 'Error', 123);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('asyncHandler - casos edge', () => {
    test('debe lanzar error si fn no es función', () => {
      expect(() => asyncHandler(null)).toThrow();
      expect(() => asyncHandler({})).toThrow();
    });

    test('debe manejar errorMessage vacío', () => {
      const fn = jest.fn().mockRejectedValue(new Error('Test error'));
      const handler = asyncHandler(fn, '');
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      return handler(req, res, next).then(() => {
        expect(res.status).toHaveBeenCalledWith(500);
      });
    });

    test('debe usar nombre de función si está disponible', () => {
      function testHandler() {}
      const handler = asyncHandler(testHandler);
      expect(handler).toBeDefined();
    });
  });

  describe('promiseHandler - casos edge', () => {
    test('debe manejar AppError en promesa', async () => {
      const promise = Promise.reject(new AppError('App error', 400));
      
      await expect(promiseHandler(promise)).rejects.toThrow(AppError);
    });

    test('debe manejar errorMessage vacío', async () => {
      const promise = Promise.reject(new Error('Test error'));
      
      await expect(promiseHandler(promise, '')).rejects.toThrow(AppError);
    });

    test('debe lanzar error si promise es null', () => {
      expect(() => promiseHandler(null)).toThrow();
    });

    test('debe lanzar error si promise es undefined', () => {
      expect(() => promiseHandler(undefined)).toThrow();
    });

    test('debe lanzar error si no es promesa', () => {
      expect(() => promiseHandler({})).toThrow();
    });
  });
});

