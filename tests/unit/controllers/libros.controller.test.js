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
  eliminarLibro,
  subirImagenLibro,
  obtenerRecomendaciones
} = require('../../../src/controllers/libros.controller');
const librosService = require('../../../src/services/libros.service');
const AppError = require('../../../src/utils/app-error');

describe('libros.controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      query: {},
      params: {},
      body: {},
      user: null,
      file: null
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  describe('obtenerLibros', () => {
    it('debe obtener lista de libros', async () => {
      const mockResultado = {
        libros: [{ id: 1, titulo: 'Libro 1' }],
        total: 1
      };

      librosService.searchLibros.mockResolvedValueOnce(mockResultado);

      await obtenerLibros(mockReq, mockRes);

      expect(librosService.searchLibros).toHaveBeenCalledWith(mockReq.query);
      expect(mockRes.json).toHaveBeenCalledWith(mockResultado);
    });

    it('debe manejar errores de AppError', async () => {
      const error = new AppError('Error específico', 400);
      librosService.searchLibros.mockRejectedValueOnce(error);

      await obtenerLibros(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Error específico'
      });
    });

    it('debe manejar errores de PostgreSQL 42P01', async () => {
      const error = { code: '42P01', message: 'Table not found' };
      librosService.searchLibros.mockRejectedValueOnce(error);

      await obtenerLibros(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Tabla libros no encontrada'
      });
    });

    it('debe manejar errores de PostgreSQL 42703', async () => {
      const error = { code: '42703', message: 'Column not found' };
      librosService.searchLibros.mockRejectedValueOnce(error);

      await obtenerLibros(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Columna no encontrada en tabla libros'
      });
    });

    it('debe manejar errores genéricos', async () => {
      librosService.searchLibros.mockRejectedValueOnce(new Error('Generic error'));

      await obtenerLibros(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Error listando libros'
      });
    });
  });

  describe('obtenerLibroPorId', () => {
    it('debe obtener un libro por ID', async () => {
      mockReq.params.id = '1';
      const mockLibro = { id: 1, titulo: 'Libro 1', autor: 'Autor 1' };

      librosService.findLibroById.mockResolvedValueOnce(mockLibro);

      await obtenerLibroPorId(mockReq, mockRes);

      expect(librosService.findLibroById).toHaveBeenCalledWith('1');
      expect(mockRes.json).toHaveBeenCalledWith(mockLibro);
    });

    it('debe retornar 404 si el libro no existe', async () => {
      mockReq.params.id = '999';
      librosService.findLibroById.mockResolvedValueOnce(null);

      await obtenerLibroPorId(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Libro no encontrado'
      });
    });

    it('debe manejar errores', async () => {
      mockReq.params.id = '1';
      librosService.findLibroById.mockRejectedValueOnce(new Error('Database error'));

      await obtenerLibroPorId(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('crearLibro', () => {
    it('debe crear un libro exitosamente', async () => {
      mockReq.body = {
        titulo: 'Nuevo Libro',
        autor: 'Autor',
        isbn: '1234567890'
      };
      const mockLibro = { id: 1, ...mockReq.body };

      librosService.createLibro.mockResolvedValueOnce(mockLibro);

      await crearLibro(mockReq, mockRes);

      expect(librosService.createLibro).toHaveBeenCalledWith(mockReq.body);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Libro creado exitosamente',
        libro: mockLibro
      });
    });

    it('debe manejar errores de AppError', async () => {
      mockReq.body = { titulo: 'Libro' };
      const error = new AppError('Error de validación', 400);
      librosService.createLibro.mockRejectedValueOnce(error);

      await crearLibro(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('debe manejar errores genéricos', async () => {
      mockReq.body = { titulo: 'Libro' };
      librosService.createLibro.mockRejectedValueOnce(new Error('Database error'));

      await crearLibro(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('actualizarLibro', () => {
    it('debe actualizar un libro exitosamente', async () => {
      mockReq.params.id = '1';
      mockReq.body = { titulo: 'Libro Actualizado' };
      const mockLibro = { id: 1, titulo: 'Libro Actualizado' };

      librosService.updateLibro.mockResolvedValueOnce(mockLibro);

      await actualizarLibro(mockReq, mockRes);

      expect(librosService.updateLibro).toHaveBeenCalledWith('1', mockReq.body);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Libro actualizado exitosamente',
        libro: mockLibro
      });
    });

    it('debe manejar errores', async () => {
      mockReq.params.id = '1';
      mockReq.body = { titulo: 'Libro' };
      librosService.updateLibro.mockRejectedValueOnce(new Error('Database error'));

      await actualizarLibro(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('eliminarLibro', () => {
    it('debe eliminar un libro exitosamente', async () => {
      mockReq.params.id = '1';
      librosService.deleteLibro.mockResolvedValueOnce(undefined);

      await eliminarLibro(mockReq, mockRes);

      expect(librosService.deleteLibro).toHaveBeenCalledWith('1');
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Libro eliminado exitosamente'
      });
    });

    it('debe manejar errores', async () => {
      mockReq.params.id = '1';
      librosService.deleteLibro.mockRejectedValueOnce(new Error('Database error'));

      await eliminarLibro(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('subirImagenLibro', () => {
    it('debe retornar 400 si no hay archivo', async () => {
      mockReq.params.id = '1';
      mockReq.file = null;

      await subirImagenLibro(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'No se proporcionó ninguna imagen'
      });
    });

    it('debe subir imagen exitosamente', async () => {
      mockReq.params.id = '1';
      mockReq.file = { filename: 'imagen.jpg' };
      const mockLibro = { id: 1, imagen_url: '/uploads/libros/imagen.jpg' };

      librosService.updateLibroImage.mockResolvedValueOnce(mockLibro);

      await subirImagenLibro(mockReq, mockRes);

      expect(librosService.updateLibroImage).toHaveBeenCalledWith('1', '/uploads/libros/imagen.jpg');
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Imagen del libro actualizada exitosamente',
        libro: mockLibro
      });
    });

    it('debe manejar errores', async () => {
      mockReq.params.id = '1';
      mockReq.file = { filename: 'imagen.jpg' };
      librosService.updateLibroImage.mockRejectedValueOnce(new Error('Database error'));

      await subirImagenLibro(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('obtenerRecomendaciones', () => {
    it('debe obtener recomendaciones para usuario autenticado', async () => {
      mockReq.user = { id: 1 };
      const mockRecomendaciones = {
        recomendaciones: [{ id: 1, titulo: 'Libro Recomendado' }]
      };

      librosService.obtenerRecomendaciones.mockResolvedValueOnce(mockRecomendaciones);

      await obtenerRecomendaciones(mockReq, mockRes);

      expect(librosService.obtenerRecomendaciones).toHaveBeenCalledWith(1);
      expect(mockRes.json).toHaveBeenCalledWith(mockRecomendaciones);
    });

    it('debe obtener recomendaciones sin usuario', async () => {
      mockReq.user = null;
      const mockRecomendaciones = {
        recomendaciones: []
      };

      librosService.obtenerRecomendaciones.mockResolvedValueOnce(mockRecomendaciones);

      await obtenerRecomendaciones(mockReq, mockRes);

      expect(librosService.obtenerRecomendaciones).toHaveBeenCalledWith(undefined);
    });

    it('debe manejar errores', async () => {
      mockReq.user = { id: 1 };
      librosService.obtenerRecomendaciones.mockRejectedValueOnce(new Error('Database error'));

      await obtenerRecomendaciones(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});

