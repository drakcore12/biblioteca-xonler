// Mock database
jest.mock('../../../src/config/database', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn()
  }
}));

const {
  obtenerPrestamosBiblioteca,
  marcarPrestamoDevuelto,
  crearLibro
} = require('../../../src/controllers/admin-biblioteca.controller');
const { pool } = require('../../../src/config/database');

describe('admin-biblioteca.controller - casos adicionales', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      user: { id: 1 },
      params: {},
      query: {},
      body: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  describe('obtenerPrestamosBiblioteca - casos edge', () => {
    it('debe filtrar por estado=activos', async () => {
      mockReq.query = { estado: 'activos', limit: '10', offset: '0' };
      
      pool.query
        .mockResolvedValueOnce({ rows: [{ biblioteca_id: 1 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: 0 }] });

      await obtenerPrestamosBiblioteca(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('fecha_devolucion IS NULL'),
        expect.any(Array)
      );
    });

    it('debe filtrar por estado=devueltos', async () => {
      mockReq.query = { estado: 'devueltos', limit: '10', offset: '0' };
      
      pool.query
        .mockResolvedValueOnce({ rows: [{ biblioteca_id: 1 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: 0 }] });

      await obtenerPrestamosBiblioteca(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('fecha_devolucion IS NOT NULL'),
        expect.any(Array)
      );
    });

    it('debe filtrar por estado=vencidos', async () => {
      mockReq.query = { estado: 'vencidos', limit: '10', offset: '0' };
      
      pool.query
        .mockResolvedValueOnce({ rows: [{ biblioteca_id: 1 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: 0 }] });

      await obtenerPrestamosBiblioteca(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('fecha_prestamo < CURRENT_DATE'),
        expect.any(Array)
      );
    });

    it('debe manejar estado desconocido', async () => {
      mockReq.query = { estado: 'desconocido', limit: '10', offset: '0' };
      
      pool.query
        .mockResolvedValueOnce({ rows: [{ biblioteca_id: 1 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: 0 }] });

      await obtenerPrestamosBiblioteca(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalled();
    });
  });

  describe('marcarPrestamoDevuelto - casos edge', () => {
    it('debe retornar 404 si no hay biblioteca asignada', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await marcarPrestamoDevuelto(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('debe retornar 400 si el préstamo ya fue devuelto', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ biblioteca_id: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, fecha_devolucion: '2024-01-01' }] });

      mockReq.params.prestamo_id = '1';

      await marcarPrestamoDevuelto(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('crearLibro - casos edge', () => {
    it('debe crear libro sin agregar a biblioteca si agregar_a_biblioteca=false', async () => {
      mockReq.body = {
        titulo: 'Libro',
        autor: 'Autor',
        categoria: 'Ficción',
        agregar_a_biblioteca: false
      };

      pool.query
        .mockResolvedValueOnce({ rows: [{ biblioteca_id: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, titulo: 'Libro' }] });

      await crearLibro(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('debe usar valores por defecto para campos opcionales', async () => {
      mockReq.body = {
        titulo: 'Libro',
        autor: 'Autor',
        categoria: 'Ficción'
      };

      pool.query
        .mockResolvedValueOnce({ rows: [{ biblioteca_id: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [] });

      await crearLibro(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO libros'),
        expect.arrayContaining([
          'Libro',
          'Autor',
          'Ficción',
          null, // isbn
          null, // editorial
          null, // ano_publicacion
          null, // paginas
          'Español', // idioma por defecto
          null, // descripcion
          null, // imagen_url
          true // disponibilidad
        ])
      );
    });
  });
});

