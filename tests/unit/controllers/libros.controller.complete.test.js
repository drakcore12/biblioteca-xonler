// Mock services
jest.mock('../../src/services/libros.service', () => ({
  searchLibros: jest.fn(),
  findLibroById: jest.fn(),
  createLibro: jest.fn(),
  updateLibro: jest.fn(),
  deleteLibro: jest.fn(),
  updateLibroImage: jest.fn(),
  obtenerRecomendaciones: jest.fn()
}));

// Mock AppError
jest.mock('../../src/utils/app-error', () => {
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
  eliminarLibro,
  subirImagenLibro,
  obtenerRecomendaciones
} = require('../../src/controllers/libros.controller');
const librosService = require('../../src/services/libros.service');
const AppError = require('../../src/utils/app-error');

describe('libros.controller - cobertura completa', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      params: {},
      query: {},
      body: {},
      file: null
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  describe('handleControllerError', () => {
    it('debe manejar AppError con details', async () => {
      const error = new AppError('Error test', 400, { field: 'test' });
      librosService.searchLibros.mockRejectedValueOnce(error);
      
      await obtenerLibros(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Error test',
          details: { field: 'test' }
        })
      );
    });

    it('debe manejar error 42P01 (tabla no encontrada)', async () => {
      const error = { code: '42P01' };
      librosService.searchLibros.mockRejectedValueOnce(error);
      
      await obtenerLibros(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Tabla libros no encontrada'
      });
    });

    it('debe manejar error 42703 (columna no encontrada)', async () => {
      const error = { code: '42703' };
      librosService.searchLibros.mockRejectedValueOnce(error);
      
      await obtenerLibros(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Columna no encontrada en tabla libros'
      });
    });
  });

  describe('obtenerLibros', () => {
    it('debe retornar resultado exitoso', async () => {
      librosService.searchLibros.mockResolvedValueOnce({ libros: [] });
      
      await obtenerLibros(mockReq, mockRes);
      
      expect(mockRes.json).toHaveBeenCalledWith({ libros: [] });
    });
  });

  describe('obtenerLibroPorId', () => {
    it('debe retornar 404 si libro no existe', async () => {
      librosService.findLibroById.mockResolvedValueOnce(null);
      
      await obtenerLibroPorId(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('subirImagenLibro', () => {
    it('debe retornar 400 si no hay archivo', async () => {
      await subirImagenLibro(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('debe actualizar imagen si hay archivo', async () => {
      mockReq.file = { filename: 'test.jpg' };
      mockReq.params.id = '1';
      librosService.updateLibroImage.mockResolvedValueOnce({ id: 1, imagen_url: '/uploads/libros/test.jpg' });
      
      await subirImagenLibro(mockReq, mockRes);
      
      expect(librosService.updateLibroImage).toHaveBeenCalledWith('1', '/uploads/libros/test.jpg');
      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe('obtenerRecomendaciones', () => {
    it('debe retornar recomendaciones exitosamente', async () => {
      mockReq.user = { id: 1 };
      librosService.obtenerRecomendaciones.mockResolvedValueOnce({
        recomendaciones: { porCategoria: [] }
      });
      
      await obtenerRecomendaciones(mockReq, mockRes);
      
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('debe manejar errores del servicio', async () => {
      mockReq.user = { id: 1 };
      const error = new AppError('Error servicio', 500);
      librosService.obtenerRecomendaciones.mockRejectedValueOnce(error);
      
      await obtenerRecomendaciones(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});

