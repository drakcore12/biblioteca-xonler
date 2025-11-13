// Mock libros.service
jest.mock('../../../src/services/libros.service', () => ({
  searchLibros: jest.fn(),
  findLibroById: jest.fn(),
  createLibro: jest.fn(),
  updateLibro: jest.fn(),
  deleteLibro: jest.fn(),
  updateLibroImage: jest.fn(),
  obtenerRecomendaciones: jest.fn()
}));

// Mock AppError
jest.mock('../../../src/utils/app-error', () => {
  return class AppError extends Error {
    constructor(message, statusCode, details) {
      super(message);
      this.statusCode = statusCode || 500;
      this.details = details;
    }
  };
});

const {
  obtenerLibros,
  obtenerLibroPorId,
  crearLibro,
  actualizarLibro,
  eliminarLibro
} = require('../../../src/controllers/libros.controller');
const librosService = require('../../../src/services/libros.service');
const AppError = require('../../../src/utils/app-error');

describe('libros.controller - casos adicionales', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      query: {},
      params: {},
      body: {},
      user: null
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  describe('handleControllerError - casos edge', () => {
    test('debe manejar AppError con details', async () => {
      const error = new AppError('Error específico', 400, { field: 'titulo' });
      librosService.searchLibros.mockRejectedValueOnce(error);

      await obtenerLibros(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Error específico',
        details: { field: 'titulo' }
      });
    });

    test('debe manejar error genérico en obtenerLibroPorId', async () => {
      const error = new Error('Database error');
      librosService.findLibroById.mockRejectedValueOnce(error);

      await obtenerLibroPorId(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Error obteniendo libro'
      });
    });

    test('debe manejar error 42P01 en crearLibro', async () => {
      const error = { code: '42P01', message: 'Table not found' };
      librosService.createLibro.mockRejectedValueOnce(error);

      await crearLibro(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Tabla libros no encontrada'
      });
    });

    test('debe manejar error 42703 en actualizarLibro', async () => {
      const error = { code: '42703', message: 'Column not found' };
      librosService.updateLibro.mockRejectedValueOnce(error);

      await actualizarLibro(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Columna no encontrada en tabla libros'
      });
    });

    test('debe manejar error genérico en eliminarLibro', async () => {
      const error = new Error('Database error');
      librosService.deleteLibro.mockRejectedValueOnce(error);

      await eliminarLibro(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      // El código usa 'Error interno del servidor' como fallbackMessage
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Error interno del servidor'
      });
    });
  });
});

