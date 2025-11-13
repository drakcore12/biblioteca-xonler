// Mock database
jest.mock('../../../src/config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

const {
  obtenerBibliotecaAsignada,
  obtenerEstadisticasBiblioteca,
  obtenerLibrosBiblioteca,
  agregarLibroABiblioteca,
  removerLibroDeBiblioteca,
  crearLibro,
  obtenerPrestamosBiblioteca,
  marcarPrestamoDevuelto
} = require('../../../src/controllers/admin-biblioteca.controller');
const { pool } = require('../../../src/config/database');

describe('admin-biblioteca.controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      query: {},
      params: {},
      body: {},
      user: { id: 1 }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  describe('obtenerBibliotecaAsignada', () => {
    it('debe obtener la biblioteca asignada', async () => {
      const mockBiblioteca = {
        id: 1,
        nombre: 'Biblioteca Central',
        direccion: 'Calle Principal',
        colegio_id: 1,
        colegio_nombre: 'Colegio Test'
      };

      pool.query.mockResolvedValueOnce({ rows: [mockBiblioteca] });

      await obtenerBibliotecaAsignada(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(mockBiblioteca);
    });

    it('debe retornar 404 si no hay biblioteca asignada', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await obtenerBibliotecaAsignada(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'No tienes una biblioteca asignada. Contacta al administrador del sistema.'
      });
    });

    it('debe manejar errores', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await obtenerBibliotecaAsignada(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('obtenerEstadisticasBiblioteca', () => {
    it('debe obtener estadísticas de la biblioteca', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ biblioteca_id: 1 }] })
        .mockResolvedValueOnce({
          rows: [{
            estadisticas: { total_libros: 100, prestamos_activos: 10 },
            prestamos_mensuales: [],
            libros_populares: []
          }]
        });

      await obtenerEstadisticasBiblioteca(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('debe retornar 404 si no hay biblioteca asignada', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await obtenerEstadisticasBiblioteca(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('debe manejar errores', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await obtenerEstadisticasBiblioteca(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('obtenerLibrosBiblioteca', () => {
    it('debe obtener libros de la biblioteca', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ biblioteca_id: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, titulo: 'Libro 1' }] })
        .mockResolvedValueOnce({ rows: [{ total: 1 }] });

      await obtenerLibrosBiblioteca(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledTimes(3);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Array),
          paginacion: expect.any(Object)
        })
      );
    });

    it('debe filtrar por término de búsqueda', async () => {
      mockReq.query = { q: 'test' };

      pool.query
        .mockResolvedValueOnce({ rows: [{ biblioteca_id: 1 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: 0 }] });

      await obtenerLibrosBiblioteca(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalled();
    });

    it('debe filtrar por categoría', async () => {
      mockReq.query = { categoria: 'Ficción' };

      pool.query
        .mockResolvedValueOnce({ rows: [{ biblioteca_id: 1 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: 0 }] });

      await obtenerLibrosBiblioteca(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalled();
    });

    it('debe retornar 404 si no hay biblioteca asignada', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await obtenerLibrosBiblioteca(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('debe manejar errores', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await obtenerLibrosBiblioteca(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('agregarLibroABiblioteca', () => {
    it('debe agregar libro a la biblioteca', async () => {
      mockReq.body = { libro_id: 1 };

      pool.query
        .mockResolvedValueOnce({ rows: [{ biblioteca_id: 1 }] }) // Obtener biblioteca
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Verificar libro existe
        .mockResolvedValueOnce({ rows: [] }) // Verificar que no esté ya en biblioteca
        .mockResolvedValueOnce({ rows: [{ id: 1, libro_id: 1, biblioteca_id: 1 }] }); // INSERT

      await agregarLibroABiblioteca(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('debe retornar 409 si el libro ya está en la biblioteca', async () => {
      mockReq.body = { libro_id: 1 };

      pool.query
        .mockResolvedValueOnce({ rows: [{ biblioteca_id: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Ya existe

      await agregarLibroABiblioteca(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
    });

    it('debe retornar 404 si el libro no existe', async () => {
      mockReq.body = { libro_id: 999 };

      pool.query
        .mockResolvedValueOnce({ rows: [{ biblioteca_id: 1 }] })
        .mockResolvedValueOnce({ rows: [] }); // Libro no existe

      await agregarLibroABiblioteca(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('debe retornar 400 si falta libro_id', async () => {
      mockReq.body = {};

      await agregarLibroABiblioteca(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('debe retornar 404 si no hay biblioteca asignada', async () => {
      mockReq.body = { libro_id: 1 };
      pool.query.mockResolvedValueOnce({ rows: [] });

      await agregarLibroABiblioteca(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('debe manejar errores', async () => {
      mockReq.body = { libro_id: 1 };
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await agregarLibroABiblioteca(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('removerLibroDeBiblioteca', () => {
    it('debe remover libro de la biblioteca', async () => {
      mockReq.params.biblioteca_libro_id = '1';

      pool.query
        .mockResolvedValueOnce({ rows: [{ biblioteca_id: 1 }] }) // Obtener biblioteca
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Verificar libro pertenece a biblioteca
        .mockResolvedValueOnce({ rows: [{ count: 0 }] }) // Verificar préstamos activos
        .mockResolvedValueOnce({ rows: [] }); // DELETE

      await removerLibroDeBiblioteca(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Libro removido exitosamente de la biblioteca'
      });
    });

    it('debe retornar 400 si tiene préstamos activos', async () => {
      mockReq.params.biblioteca_libro_id = '1';

      pool.query
        .mockResolvedValueOnce({ rows: [{ biblioteca_id: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [{ count: 1 }] }); // Tiene préstamos activos

      await removerLibroDeBiblioteca(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('debe retornar 404 si el libro no está en la biblioteca', async () => {
      mockReq.params.biblioteca_libro_id = '999';

      pool.query
        .mockResolvedValueOnce({ rows: [{ biblioteca_id: 1 }] })
        .mockResolvedValueOnce({ rows: [] }); // Libro no encontrado

      await removerLibroDeBiblioteca(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('debe retornar 404 si no hay biblioteca asignada', async () => {
      mockReq.params.id = '1';
      pool.query.mockResolvedValueOnce({ rows: [] });

      await removerLibroDeBiblioteca(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('debe manejar errores', async () => {
      mockReq.params.id = '1';
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await removerLibroDeBiblioteca(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('crearLibro', () => {
    it('debe crear un libro exitosamente', async () => {
      mockReq.body = {
        titulo: 'Nuevo Libro',
        autor: 'Autor',
        categoria: 'Ficción'
      };

      pool.query
        .mockResolvedValueOnce({ rows: [{ biblioteca_id: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, ...mockReq.body }] })
        .mockResolvedValueOnce({ rows: [] });

      await crearLibro(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('debe retornar 400 si faltan campos requeridos', async () => {
      mockReq.body = { titulo: 'Libro' };

      await crearLibro(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Título, autor y categoría son campos requeridos'
      });
    });

    it('debe retornar 404 si no hay biblioteca asignada', async () => {
      mockReq.body = {
        titulo: 'Libro',
        autor: 'Autor',
        categoria: 'Ficción'
      };
      pool.query.mockResolvedValueOnce({ rows: [] });

      await crearLibro(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('debe manejar errores', async () => {
      mockReq.body = {
        titulo: 'Libro',
        autor: 'Autor',
        categoria: 'Ficción'
      };
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await crearLibro(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('obtenerPrestamosBiblioteca', () => {
    it('debe obtener préstamos de la biblioteca', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ biblioteca_id: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, fecha_prestamo: '2024-01-01' }] })
        .mockResolvedValueOnce({ rows: [{ total: 1 }] });

      await obtenerPrestamosBiblioteca(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledTimes(3);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('debe retornar 404 si no hay biblioteca asignada', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await obtenerPrestamosBiblioteca(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('debe manejar errores', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await obtenerPrestamosBiblioteca(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('marcarPrestamoDevuelto', () => {
    it('debe marcar préstamo como devuelto', async () => {
      mockReq.params.prestamo_id = '1';

      pool.query
        .mockResolvedValueOnce({ rows: [{ biblioteca_id: 1 }] }) // Obtener biblioteca
        .mockResolvedValueOnce({ rows: [{ id: 1, fecha_devolucion: null }] }) // Verificar préstamo
        .mockResolvedValueOnce({ rows: [{ id: 1, fecha_devolucion: '2024-01-01' }] }); // UPDATE

      await marcarPrestamoDevuelto(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Préstamo marcado como devuelto exitosamente'
        })
      );
    });

    it('debe retornar 400 si el préstamo ya fue devuelto', async () => {
      mockReq.params.prestamo_id = '1';

      pool.query
        .mockResolvedValueOnce({ rows: [{ biblioteca_id: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, fecha_devolucion: '2024-01-01' }] }); // Ya devuelto

      await marcarPrestamoDevuelto(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('debe retornar 404 si no hay biblioteca asignada', async () => {
      mockReq.params.prestamo_id = '1';
      pool.query.mockResolvedValueOnce({ rows: [] });

      await marcarPrestamoDevuelto(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('debe retornar 404 si el préstamo no existe', async () => {
      mockReq.params.prestamo_id = '999';

      pool.query
        .mockResolvedValueOnce({ rows: [{ biblioteca_id: 1 }] })
        .mockResolvedValueOnce({ rows: [] });

      await marcarPrestamoDevuelto(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('debe manejar errores', async () => {
      mockReq.params.id = '1';
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await marcarPrestamoDevuelto(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});

