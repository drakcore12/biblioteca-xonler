const {
  success,
  error,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  created,
  noContent,
  paginated,
  json,
  createResponse,
  validateResponse,
  validateStatusCode,
  validateMessage
} = require('../../../src/utils/http-response');

describe('http-response - casos adicionales', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      end: jest.fn()
    };
  });

  describe('success - casos edge', () => {
    test('debe manejar data null', () => {
      success(mockRes, null, 'Mensaje');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Mensaje'
      });
    });

    test('debe manejar message vacío', () => {
      success(mockRes, { id: 1 }, '');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 1 }
      });
    });

    test('debe manejar message con espacios', () => {
      success(mockRes, { id: 1 }, '  Mensaje  ');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Mensaje',
        data: { id: 1 }
      });
    });

    test('debe manejar statusCode personalizado', () => {
      success(mockRes, { id: 1 }, 'Mensaje', 201);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe('error - casos edge', () => {
    test('debe manejar details null', () => {
      error(mockRes, 'Error', 500, null);
      const callArgs = mockRes.json.mock.calls[0][0];
      expect(callArgs).not.toHaveProperty('details');
    });

    test('debe manejar details undefined', () => {
      error(mockRes, 'Error', 500, undefined);
      const callArgs = mockRes.json.mock.calls[0][0];
      expect(callArgs).not.toHaveProperty('details');
    });
  });

  describe('notFound - casos edge', () => {
    test('debe manejar resource vacío', () => {
      notFound(mockRes, '');
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Recurso no encontrado'
        })
      );
    });

    test('debe manejar resource con espacios', () => {
      notFound(mockRes, '  Libro  ');
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Libro no encontrado'
        })
      );
    });
  });

  describe('paginated - casos edge', () => {
    test('debe manejar data no array', () => {
      paginated(mockRes, 'not array', 10, 5, 0);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: []
        })
      );
    });

    test('debe manejar total negativo', () => {
      paginated(mockRes, [1, 2], -5, 10, 0);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          paginacion: expect.objectContaining({
            total: 0
          })
        })
      );
    });

    test('debe manejar limit negativo', () => {
      paginated(mockRes, [1, 2], 10, -5, 0);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          paginacion: expect.objectContaining({
            limit: 0
          })
        })
      );
    });

    test('debe manejar offset negativo', () => {
      paginated(mockRes, [1, 2], 10, 5, -5);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          paginacion: expect.objectContaining({
            offset: 0
          })
        })
      );
    });

    test('debe manejar valores decimales', () => {
      paginated(mockRes, [1, 2], 10.7, 5.3, 2.9);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          paginacion: expect.objectContaining({
            total: 10,
            limit: 5,
            offset: 2
          })
        })
      );
    });

    test('debe manejar statusCode personalizado', () => {
      paginated(mockRes, [1, 2], 10, 5, 0, 201);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe('validateMessage - casos edge', () => {
    test('debe manejar mensaje con solo espacios', () => {
      expect(validateMessage('   ', 'Default')).toBe('Default');
    });

    test('debe manejar mensaje undefined', () => {
      expect(validateMessage(undefined, 'Default')).toBe('Default');
    });
  });

  describe('validateStatusCode - casos edge', () => {
    test('debe manejar códigos en límites', () => {
      expect(validateStatusCode(100)).toBe(100);
      expect(validateStatusCode(599)).toBe(599);
    });

    test('debe manejar códigos fuera de límites', () => {
      expect(validateStatusCode(99)).toBe(500);
      expect(validateStatusCode(600)).toBe(500);
    });
  });
});

