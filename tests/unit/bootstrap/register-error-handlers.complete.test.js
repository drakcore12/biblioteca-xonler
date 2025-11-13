const { registerErrorHandlers } = require('../../src/bootstrap/register-error-handlers');

describe('register-error-handlers - cobertura completa', () => {
  let mockApp, mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockApp = {
      use: jest.fn()
    };
    mockReq = {
      method: 'GET',
      url: '/test'
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      headersSent: false
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  it('debe registrar middleware de errores', () => {
    registerErrorHandlers(mockApp);
    
    expect(mockApp.use).toHaveBeenCalledTimes(2);
  });

  describe('Error handler middleware', () => {
    let errorHandler;

    beforeEach(() => {
      registerErrorHandlers(mockApp);
      errorHandler = mockApp.use.mock.calls[0][0];
    });

    it('debe manejar SyntaxError de JSON', () => {
      const error = new SyntaxError('Unexpected token');
      error.status = 400;
      error.body = {};
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'JSON inválido en el body' });
    });

    it('debe manejar error 23505 (unique constraint)', () => {
      const error = { code: '23505' };
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Conflicto: el recurso ya existe' });
    });

    it('debe manejar error 23503 (foreign key)', () => {
      const error = { code: '23503' };
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Referencia inválida' });
    });

    it('debe manejar error genérico', () => {
      const error = new Error('Generic error');
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
    });

    it('debe llamar next si headers ya fueron enviados', () => {
      mockRes.headersSent = true;
      const error = new Error('Test error');
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('404 handler middleware', () => {
    it('debe retornar 404 para rutas no encontradas', () => {
      registerErrorHandlers(mockApp);
      const notFoundHandler = mockApp.use.mock.calls[1][0];
      
      notFoundHandler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'No encontrado' });
    });
  });
});

