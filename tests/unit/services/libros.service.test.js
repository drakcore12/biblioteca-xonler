// Mock database
jest.mock('../../src/config/database', () => ({
  pool: {
    query: jest.fn()
  }
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

const librosService = require('../../src/services/libros.service');
const { pool } = require('../../src/config/database');
const AppError = require('../../src/utils/app-error');

describe('libros.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  describe('searchLibros', () => {
    it('debe buscar libros sin filtros', async () => {
      const mockLibros = [
        { id: 1, titulo: 'Libro 1', autor: 'Autor 1' },
        { id: 2, titulo: 'Libro 2', autor: 'Autor 2' }
      ];

      pool.query
        .mockResolvedValueOnce({ rows: mockLibros })
        .mockResolvedValueOnce({ rows: [{ count: '2' }] });

      const resultado = await librosService.searchLibros({});

      expect(pool.query).toHaveBeenCalled();
      expect(resultado).toHaveProperty('data');
      expect(resultado).toHaveProperty('paginacion');
    });

    it('debe buscar libros con término de búsqueda', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: 0 }] });

      await librosService.searchLibros({ q: 'test' });

      expect(pool.query).toHaveBeenCalled();
      const callArgs = pool.query.mock.calls[0];
      expect(callArgs[0]).toContain('ILIKE');
      expect(callArgs[1]).toContain('test');
    });

    it('debe filtrar por categorías', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] });

      await librosService.searchLibros({ categorias: ['ficcion', 'drama'] });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('lower(l.categoria) = lower'),
        expect.any(Array)
      );
    });

    it('debe filtrar por disponibilidad', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] });

      await librosService.searchLibros({ disponibilidad: 'disponibles' });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('disponibilidad ='),
        expect.arrayContaining([true])
      );
    });

    it('debe filtrar por biblioteca_id (incluyendo 0 como valor válido)', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: 0 }] });

      await librosService.searchLibros({ biblioteca_id: 0 });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('biblioteca_id ='),
        expect.arrayContaining([0])
      );
    });

    it('debe filtrar por biblioteca_id como string "0"', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: 0 }] });

      await librosService.searchLibros({ biblioteca_id: '0' });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('biblioteca_id ='),
        expect.arrayContaining([0])
      );
    });

    it('debe ignorar biblioteca_id cuando es "todas"', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: 0 }] });

      await librosService.searchLibros({ biblioteca_id: 'todas' });

      const callArgs = pool.query.mock.calls[0];
      expect(callArgs[0]).not.toContain('biblioteca_id =');
    });

    it('debe manejar paginación', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] });

      await librosService.searchLibros({ limit: '10', offset: '20' });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        expect.arrayContaining([10, 20])
      );
    });

    it('debe manejar errores', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(librosService.searchLibros({})).rejects.toThrow();
    });
  });

  describe('findLibroById', () => {
    it('debe encontrar un libro por ID', async () => {
      const mockLibro = { id: 1, titulo: 'Libro 1', autor: 'Autor 1' };

      pool.query.mockResolvedValueOnce({ rows: [mockLibro] });

      const resultado = await librosService.findLibroById('1');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE l.id = $1'),
        ['1']
      );
      expect(resultado).toEqual(mockLibro);
    });

    it('debe retornar null si el libro no existe', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const resultado = await librosService.findLibroById('999');

      expect(resultado).toBeNull();
    });

    it('debe manejar errores', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(librosService.findLibroById('1')).rejects.toThrow();
    });
  });

  describe('createLibro', () => {
    it('debe crear un libro exitosamente', async () => {
      const libroData = {
        titulo: 'Nuevo Libro',
        autor: 'Autor',
        isbn: '1234567890'
      };
      const mockLibro = { id: 1, ...libroData, disponibilidad: true };

      pool.query
        .mockResolvedValueOnce({ rowCount: 0 }) // ensureIsbnUnique
        .mockResolvedValueOnce({ rows: [mockLibro] }); // INSERT

      const resultado = await librosService.createLibro(libroData);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO public.libros'),
        expect.any(Array)
      );
      expect(resultado).toEqual(mockLibro);
    });

    it('debe lanzar error si falta título o autor', async () => {
      await expect(librosService.createLibro({})).rejects.toThrow(AppError);
    });

    it('debe manejar errores', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(librosService.createLibro({})).rejects.toThrow();
    });
  });

  describe('updateLibro', () => {
    it('debe actualizar un libro exitosamente', async () => {
      const updateData = { titulo: 'Libro Actualizado', autor: 'Autor', isbn: '123', categoria: 'Ficción', disponibilidad: true };
      const mockLibro = { id: 1, ...updateData, imagen_url: null, descripcion: null };

      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1, titulo: 'Libro', autor: 'Autor' }] }) // ensureLibroExists - findLibroById
        .mockResolvedValueOnce({ rowCount: 0 }) // ensureIsbnUnique
        .mockResolvedValueOnce({ rows: [mockLibro] }); // UPDATE

      const resultado = await librosService.updateLibro('1', updateData);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE public.libros'),
        expect.any(Array)
      );
      expect(resultado).toEqual(mockLibro);
    });

    it('debe lanzar AppError si el libro no existe', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await expect(librosService.updateLibro('999', {})).rejects.toThrow(AppError);
    });

    it('debe manejar errores', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(librosService.updateLibro('1', {})).rejects.toThrow();
    });
  });

  describe('deleteLibro', () => {
    it('debe eliminar un libro exitosamente', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // ensureLibroExists
        .mockResolvedValueOnce({ rows: [{ count: 0 }] }) // Verificar préstamos
        .mockResolvedValueOnce({ rows: [] }) // DELETE biblioteca_libros
        .mockResolvedValueOnce({ rows: [] }); // DELETE libros

      await librosService.deleteLibro('1');

      const deleteCalls = pool.query.mock.calls.filter(call => 
        call && call[0] && typeof call[0] === 'string' && call[0].includes('DELETE FROM') && call[0].includes('libros')
      );
      expect(deleteCalls.length).toBeGreaterThan(0);
    });

    it('debe lanzar AppError si el libro no existe', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] }); // ensureLibroExists

      await expect(librosService.deleteLibro('999')).rejects.toThrow(AppError);
    });

    it('debe lanzar AppError si tiene préstamos asociados', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // ensureLibroExists
        .mockResolvedValueOnce({ rows: [{ count: 1 }] }); // Tiene préstamos

      await expect(librosService.deleteLibro('1')).rejects.toThrow(AppError);
    });

    it('debe manejar errores', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(librosService.deleteLibro('1')).rejects.toThrow();
    });
  });

  describe('updateLibroImage', () => {
    it('debe actualizar la imagen de un libro', async () => {
      const imagenUrl = '/uploads/libros/imagen.jpg';
      const mockLibro = { id: 1, titulo: 'Libro', imagen_url: imagenUrl };

      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // ensureLibroExists
        .mockResolvedValueOnce({ rows: [mockLibro] }); // UPDATE

      const resultado = await librosService.updateLibroImage('1', imagenUrl);

      const updateCalls = pool.query.mock.calls.filter(call => 
        call[0] && typeof call[0] === 'string' && call[0].includes('UPDATE public.libros') && call[0].includes('imagen_url')
      );
      expect(updateCalls.length).toBeGreaterThan(0);
      expect(updateCalls[0][1]).toContain(imagenUrl);
      expect(updateCalls[0][1]).toContain('1');
      expect(resultado).toEqual(mockLibro);
    });

    it('debe lanzar AppError si el libro no existe', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] }); // ensureLibroExists

      await expect(librosService.updateLibroImage('999', '/path')).rejects.toThrow(AppError);
    });
  });

  describe('obtenerRecomendaciones', () => {
    it('debe obtener recomendaciones para usuario', async () => {
      pool.query
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ preferencias: { categoriasFavoritas: ['ficcion'] } }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, titulo: 'Libro Recomendado' }] })
        .mockResolvedValueOnce({ rows: [{ id: 2, titulo: 'Nuevo Libro' }] });

      const resultado = await librosService.obtenerRecomendaciones(1);

      expect(pool.query).toHaveBeenCalled();
      expect(resultado).toHaveProperty('recomendaciones');
      expect(resultado).toHaveProperty('preferencias');
      expect(resultado.recomendaciones).toHaveProperty('porCategoria');
      expect(resultado.recomendaciones).toHaveProperty('nuevosLanzamientos');
    });

    it('debe manejar usuario sin preferencias', async () => {
      pool.query
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ preferencias: null }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 1, titulo: 'Descubrimiento' }] });

      const resultado = await librosService.obtenerRecomendaciones(1);

      expect(resultado.preferencias.categorias).toEqual([]);
    });

    it('debe filtrar categorías inválidas', async () => {
      pool.query
        .mockResolvedValueOnce({ 
          rowCount: 1, 
          rows: [{ 
            preferencias: { 
              categoriasFavoritas: ['ficcion', '', '  ', null, 'terror'] 
            } 
          }] 
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const resultado = await librosService.obtenerRecomendaciones(1);

      expect(resultado.preferencias.categorias).toEqual(['ficcion', 'terror']);
    });

    it('debe lanzar error si no hay usuario', async () => {
      await expect(librosService.obtenerRecomendaciones(null)).rejects.toThrow(AppError);
    });

    it('debe lanzar error si el usuario no existe', async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 0 });

      await expect(librosService.obtenerRecomendaciones(999)).rejects.toThrow(AppError);
    });

    it('debe manejar errores', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(librosService.obtenerRecomendaciones(1)).rejects.toThrow();
    });
  });

  describe('normalizeLibroFilters - casos edge', () => {
    it('searchLibros debe normalizar límite máximo', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: 0 }] });

      await librosService.searchLibros({ limit: 200 });

      const params = pool.query.mock.calls[0][1];
      expect(params[params.length - 2]).toBe(100); // limit normalizado
    });

    it('searchLibros debe normalizar offset negativo', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: 0 }] });

      await librosService.searchLibros({ offset: -10 });

      const params = pool.query.mock.calls[0][1];
      expect(params[params.length - 1]).toBe(0); // offset normalizado
    });

    it('searchLibros debe parsear categorías como string', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: 0 }] });

      await librosService.searchLibros({ categorias: 'ficcion,terror,drama' });

      const sql = pool.query.mock.calls[0][0];
      expect(sql).toContain('lower(l.categoria) = lower');
    });

    it('searchLibros debe filtrar por biblioteca_id', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: 0 }] });

      await librosService.searchLibros({ biblioteca_id: '1' });

      const sql = pool.query.mock.calls[0][0];
      expect(sql).toContain('biblioteca_id');
    });
  });
});

