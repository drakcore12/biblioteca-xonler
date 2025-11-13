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

describe('error-handler', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('getPostgresErrorMessage', () => {
    test('debe retornar mensaje para código conocido', () => {
      expect(getPostgresErrorMessage('23505')).toBe('Violación de restricción única');
      expect(getPostgresErrorMessage('23503')).toBe('Violación de clave foránea');
    });

    test('debe retornar mensaje por defecto para código desconocido', () => {
      expect(getPostgresErrorMessage('99999')).toBe('Error de base de datos');
    });

    test('debe retornar mensaje por defecto para código inválido', () => {
      expect(getPostgresErrorMessage('')).toBe('Error de base de datos');
      expect(getPostgresErrorMessage(null)).toBe('Error de base de datos');
    });
  });

  describe('getPostgresErrorStatusCode', () => {
    test('debe retornar código HTTP para código conocido', () => {
      expect(getPostgresErrorStatusCode('23505')).toBe(409);
      expect(getPostgresErrorStatusCode('23503')).toBe(400);
    });

    test('debe retornar 500 para código desconocido', () => {
      expect(getPostgresErrorStatusCode('99999')).toBe(500);
    });
  });

  describe('validateResponse', () => {
    test('debe lanzar error si res no es válido', () => {
      expect(() => validateResponse(null)).toThrow();
      expect(() => validateResponse({})).toThrow();
    });

    test('no debe lanzar error si res es válido', () => {
      expect(() => validateResponse(mockRes)).not.toThrow();
    });
  });

  describe('validateError', () => {
    test('debe retornar el error si existe', () => {
      const err = new Error('Test error');
      expect(validateError(err)).toBe(err);
    });

    test('debe retornar nuevo error si no existe', () => {
      const result = validateError(null);
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('Error desconocido');
    });
  });

  describe('handleError', () => {
    test('debe manejar errores de PostgreSQL', () => {
      const pgError = new Error('Database error');
      pgError.code = '23505';
      
      handleError(mockRes, pgError);
      
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalled();
    });

    test('debe manejar errores genéricos', () => {
      const err = new Error('Generic error');
      handleError(mockRes, err, 'Fallback message');
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalled();
    });

    test('debe usar mensaje por defecto si no hay mensaje', () => {
      const err = new Error();
      handleError(mockRes, err);
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String)
        })
      );
    });
  });

  describe('asyncHandler', () => {
    test('debe envolver función async y manejar errores', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Test error'));
      const handler = asyncHandler(fn, 'Error custom');
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await handler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
    });

    test('debe ejecutar función exitosamente', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const handler = asyncHandler(fn);
      const req = {};
      const res = {};
      const next = jest.fn();

      await handler(req, res, next);

      expect(fn).toHaveBeenCalled();
    });
  });

  describe('promiseHandler', () => {
    test('debe manejar promesa exitosa', async () => {
      const promise = Promise.resolve('success');
      const result = await promiseHandler(promise);
      expect(result).toBe('success');
    });

    test('debe manejar promesa rechazada', async () => {
      const promise = Promise.reject(new Error('Test error'));
      await expect(promiseHandler(promise, 'Error custom')).rejects.toThrow();
    });

    test('debe lanzar error si no es promesa', () => {
      expect(() => promiseHandler(null)).toThrow();
      expect(() => promiseHandler({})).toThrow();
    });
  });
});

