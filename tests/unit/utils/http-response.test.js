const {
  success,
  error,
  badRequest,
  notFound,
  unauthorized,
  forbidden,
  conflict,
  created,
  noContent,
  paginated,
  json,
  createResponse,
  validateResponse,
  validateStatusCode,
  validateMessage
} = require('../../src/utils/http-response');

describe('http-response', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
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

  describe('validateStatusCode', () => {
    test('debe retornar el código si es válido', () => {
      expect(validateStatusCode(200)).toBe(200);
      expect(validateStatusCode(404)).toBe(404);
    });

    test('debe retornar 500 para códigos inválidos', () => {
      expect(validateStatusCode(99)).toBe(500);
      expect(validateStatusCode(600)).toBe(500);
      expect(validateStatusCode('invalid')).toBe(500);
    });
  });

  describe('validateMessage', () => {
    test('debe retornar el mensaje si es válido', () => {
      expect(validateMessage('Test message')).toBe('Test message');
    });

    test('debe retornar valor por defecto para mensajes inválidos', () => {
      expect(validateMessage('', 'Default')).toBe('Default');
      expect(validateMessage(null, 'Default')).toBe('Default');
    });
  });

  describe('success', () => {
    test('debe retornar respuesta exitosa con datos', () => {
      success(mockRes, { id: 1 }, 'Operación exitosa', 200);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Operación exitosa',
        data: { id: 1 }
      });
    });

    test('debe retornar respuesta exitosa sin mensaje', () => {
      success(mockRes, { id: 1 });
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 1 }
      });
    });
  });

  describe('error', () => {
    test('debe retornar respuesta de error', () => {
      error(mockRes, 'Error message', 500, { details: 'info' });
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      const callArgs = mockRes.json.mock.calls[0][0];
      expect(callArgs.error).toBe('Error message');
      expect(callArgs.details).toEqual({ details: 'info' });
    });

    test('debe usar código 500 por defecto', () => {
      error(mockRes, 'Error message');
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('badRequest', () => {
    test('debe retornar 400', () => {
      badRequest(mockRes, 'Bad request');
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('notFound', () => {
    test('debe retornar 404', () => {
      notFound(mockRes, 'Not found');
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('unauthorized', () => {
    test('debe retornar 401', () => {
      unauthorized(mockRes, 'Unauthorized');
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('forbidden', () => {
    test('debe retornar 403', () => {
      forbidden(mockRes, 'Forbidden');
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe('conflict', () => {
    test('debe retornar 409', () => {
      conflict(mockRes, 'Conflict');
      expect(mockRes.status).toHaveBeenCalledWith(409);
    });
  });

  describe('created', () => {
    test('debe retornar 201', () => {
      created(mockRes, { id: 1 });
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe('noContent', () => {
    test('debe retornar 204', () => {
      mockRes.end = jest.fn();
      noContent(mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.end).toHaveBeenCalled();
    });
  });

  describe('paginated', () => {
    test('debe retornar respuesta paginada', () => {
      paginated(mockRes, [1, 2, 3], 100, 10, 0);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      const callArgs = mockRes.json.mock.calls[0][0];
      expect(callArgs.data).toEqual([1, 2, 3]);
      expect(callArgs.paginacion).toBeDefined();
      expect(callArgs.paginacion.total).toBe(100);
      expect(callArgs.paginacion.limit).toBe(10);
      expect(callArgs.paginacion.offset).toBe(0);
    });
  });

  describe('json', () => {
    test('debe retornar JSON directo', () => {
      json(mockRes, { test: 'data' }, 200);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ test: 'data' });
    });
  });

  describe('createResponse', () => {
    test('debe crear respuesta con statusCode y datos', () => {
      createResponse(mockRes, 200, { success: true });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });
  });
});

