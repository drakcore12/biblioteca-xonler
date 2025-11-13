// Mock database
jest.mock('../../src/config/database', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn()
  }
}));

const {
  obtenerPrestamos,
  obtenerPrestamoPorId,
  crearPrestamo,
  marcarDevolucion,
  renovarPrestamo,
  obtenerPrestamosUsuarioActual
} = require('../../src/controllers/prestamos.controller');
const { pool } = require('../../src/config/database');

describe('prestamos.controller', () => {
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
    console.log = jest.fn();
    console.error = jest.fn();
  });

  describe('obtenerPrestamos', () => {
    it('debe obtener todos los préstamos sin filtros', async () => {
      const mockPrestamos = [
        { id: 1, fecha_prestamo: '2024-01-01', usuario_id: 1, titulo: 'Libro 1' },
        { id: 2, fecha_prestamo: '2024-01-02', usuario_id: 2, titulo: 'Libro 2' }
      ];

      pool.query
        .mockResolvedValueOnce({ rows: mockPrestamos })
        .mockResolvedValueOnce({ rows: [{ total: '2' }] });

      await obtenerPrestamos(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          prestamos: mockPrestamos,
          paginacion: expect.objectContaining({
            total: 2
          })
        })
      );
    });

    it('debe filtrar por usuario_id', async () => {
      mockReq.query = { usuario_id: '1' };

      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await obtenerPrestamos(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE p.usuario_id = $1'),
        expect.arrayContaining(['1'])
      );
    });

    it('debe filtrar por biblioteca_id', async () => {
      mockReq.query = { biblioteca_id: '1' };

      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await obtenerPrestamos(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('b.id = $'),
        expect.arrayContaining(['1'])
      );
    });

    it('debe filtrar por activo=true', async () => {
      mockReq.query = { activo: 'true' };

      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await obtenerPrestamos(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('fecha_devolucion IS NULL'),
        expect.any(Array)
      );
    });

    it('debe filtrar por activo=false', async () => {
      mockReq.query = { activo: 'false' };

      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await obtenerPrestamos(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('fecha_devolucion IS NOT NULL'),
        expect.any(Array)
      );
    });

    it('debe manejar paginación', async () => {
      mockReq.query = { limit: '10', offset: '20' };

      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await obtenerPrestamos(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        expect.arrayContaining([10, 20])
      );
    });

    it('debe manejar errores', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await obtenerPrestamos(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Error al obtener préstamos'
      });
    });
  });

  describe('obtenerPrestamoPorId', () => {
    it('debe obtener un préstamo por ID', async () => {
      mockReq.params.id = '1';
      const mockPrestamo = {
        id: 1,
        fecha_prestamo: '2024-01-01',
        usuario_id: 1,
        titulo: 'Libro 1'
      };

      pool.query.mockResolvedValueOnce({ rows: [mockPrestamo] });

      await obtenerPrestamoPorId(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE p.id = $1'),
        ['1']
      );
      expect(mockRes.json).toHaveBeenCalledWith(mockPrestamo);
    });

    it('debe retornar 404 si el préstamo no existe', async () => {
      mockReq.params.id = '999';
      pool.query.mockResolvedValueOnce({ rows: [] });

      await obtenerPrestamoPorId(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Préstamo no encontrado'
      });
    });

    it('debe manejar errores', async () => {
      mockReq.params.id = '1';
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await obtenerPrestamoPorId(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('crearPrestamo', () => {
    it('debe retornar 401 si no hay usuario autenticado', async () => {
      mockReq.body = { libro_id: 1 };

      await crearPrestamo(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Usuario no autenticado'
      });
    });

    it('debe retornar 400 si falta libro_id', async () => {
      mockReq.user = { id: 1 };
      mockReq.body = {};

      await crearPrestamo(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'libro_id es obligatorio'
      });
    });

    it('debe retornar 404 si el libro no existe', async () => {
      mockReq.user = { id: 1 };
      mockReq.body = { libro_id: 999 };

      pool.query.mockResolvedValueOnce({ rows: [] });

      await crearPrestamo(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Libro no encontrado'
      });
    });

    it('debe retornar 409 si el libro no está disponible', async () => {
      mockReq.user = { id: 1 };
      mockReq.body = { libro_id: 1 };

      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, titulo: 'Libro', disponibilidad: false }]
      });

      await crearPrestamo(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Este libro no está disponible actualmente'
      });
    });

    it('debe retornar 404 si no hay copias disponibles', async () => {
      mockReq.user = { id: 1 };
      mockReq.body = { libro_id: 1 };

      pool.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, titulo: 'Libro', disponibilidad: true }]
        })
        .mockResolvedValueOnce({ rows: [] });

      await crearPrestamo(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'No hay copias disponibles de este libro en ninguna biblioteca'
      });
    });

    it('debe retornar 409 si el usuario ya tiene un préstamo activo', async () => {
      mockReq.user = { id: 1 };
      mockReq.body = { libro_id: 1 };

      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };

      pool.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, titulo: 'Libro', disponibilidad: true }]
        })
        .mockResolvedValueOnce({
          rows: [{ biblioteca_libro_id: 1, biblioteca_nombre: 'Biblioteca' }]
        })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Préstamo activo existente

      pool.connect.mockResolvedValueOnce(mockClient);

      await crearPrestamo(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Ya tienes un préstamo activo de este libro'
      });
    });

    it('debe crear un préstamo exitosamente', async () => {
      mockReq.user = { id: 1 };
      mockReq.body = { libro_id: 1 };

      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [] }),
        release: jest.fn()
      };

      pool.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, titulo: 'Libro', disponibilidad: true }]
        })
        .mockResolvedValueOnce({
          rows: [{ biblioteca_libro_id: 1, biblioteca_nombre: 'Biblioteca' }]
        })
        .mockResolvedValueOnce({ rows: [] }) // No hay préstamo activo
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            usuario_id: 1,
            biblioteca_libro_id: 1,
            fecha_prestamo: '2024-01-01',
            fecha_devolucion: null
          }]
        });

      pool.connect.mockResolvedValueOnce(mockClient);

      await crearPrestamo(mockReq, mockRes);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE libros SET disponibilidad = false'),
        [1]
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO prestamos'),
        expect.any(Array)
      );
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('debe manejar errores en transacción', async () => {
      mockReq.user = { id: 1 };
      mockReq.body = { libro_id: 1 };

      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce(undefined) // BEGIN
          .mockRejectedValueOnce(new Error('Transaction error')),
        release: jest.fn()
      };

      pool.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, titulo: 'Libro', disponibilidad: true }]
        })
        .mockResolvedValueOnce({
          rows: [{ biblioteca_libro_id: 1, biblioteca_nombre: 'Biblioteca' }]
        })
        .mockResolvedValueOnce({ rows: [] });

      pool.connect.mockResolvedValueOnce(mockClient);

      await crearPrestamo(mockReq, mockRes);

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('marcarDevolucion', () => {
    it('debe retornar 404 si el préstamo no existe', async () => {
      mockReq.params.id = '999';
      mockReq.user = { id: 1 };

      pool.query.mockResolvedValueOnce({ rows: [] });

      await marcarDevolucion(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Préstamo no encontrado'
      });
    });

    it('debe retornar 400 si el préstamo ya fue devuelto', async () => {
      mockReq.params.id = '1';
      mockReq.user = { id: 1 };

      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, usuario_id: 1, fecha_devolucion: '2024-01-01' }]
      });

      await marcarDevolucion(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Este préstamo ya fue devuelto'
      });
    });

    it('debe retornar 403 si no tiene permisos', async () => {
      mockReq.params.id = '1';
      mockReq.user = { id: 2, rol: 'usuario' };

      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, usuario_id: 1, fecha_devolucion: null }]
      });

      await marcarDevolucion(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'No tienes permisos para devolver este préstamo'
      });
    });

    it('debe permitir a admin devolver cualquier préstamo', async () => {
      mockReq.params.id = '1';
      mockReq.user = { id: 999, rol: 'admin' };

      pool.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, usuario_id: 1, fecha_devolucion: null }]
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{ id: 1, fecha_devolucion: '2024-01-01' }]
        });

      await marcarDevolucion(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Devolución registrada exitosamente'
        })
      );
    });

    it('debe marcar devolución exitosamente', async () => {
      mockReq.params.id = '1';
      mockReq.user = { id: 1 };

      pool.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, usuario_id: 1, fecha_devolucion: null, fecha_prestamo: '2024-01-01', nombre: 'Juan', apellido: 'Pérez', titulo: 'Libro' }]
        })
        .mockResolvedValueOnce({ rows: [] }) // UPDATE query
        .mockResolvedValueOnce({
          rows: [{ id: 1, fecha_devolucion: '2024-01-01', activo: false }]
        });

      await marcarDevolucion(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledTimes(3);
      const updateCalls = pool.query.mock.calls.filter(call => 
        call[0] && typeof call[0] === 'string' && call[0].includes('UPDATE prestamos') && call[0].includes('fecha_devolucion')
      );
      expect(updateCalls.length).toBeGreaterThan(0);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Devolución registrada exitosamente'
        })
      );
    });

    it('debe manejar errores', async () => {
      mockReq.params.id = '1';
      mockReq.user = { id: 1 };
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await marcarDevolucion(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('renovarPrestamo', () => {
    it('debe retornar 404 si el préstamo no existe', async () => {
      mockReq.params.id = '999';
      mockReq.user = { id: 1 };

      pool.query.mockResolvedValueOnce({ rows: [] });

      await renovarPrestamo(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Préstamo no encontrado'
      });
    });

    it('debe retornar 400 si el préstamo ya fue devuelto', async () => {
      mockReq.params.id = '1';
      mockReq.user = { id: 1 };

      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, usuario_id: 1, fecha_devolucion: '2024-01-01', fecha_prestamo: '2024-01-01' }]
      });

      await renovarPrestamo(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Este préstamo ya fue devuelto'
      });
    });

    it('debe retornar 403 si no tiene permisos', async () => {
      mockReq.params.id = '1';
      mockReq.user = { id: 2 };

      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, usuario_id: 1, fecha_devolucion: null, fecha_prestamo: '2024-01-01' }]
      });

      await renovarPrestamo(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'No tienes permisos para renovar este préstamo'
      });
    });

    it('debe retornar 400 si el préstamo está vencido', async () => {
      mockReq.params.id = '1';
      mockReq.user = { id: 1 };

      const fechaVencida = new Date();
      fechaVencida.setDate(fechaVencida.getDate() - 20);
      const fechaPrestamoVencida = fechaVencida.toISOString().split('T')[0];

      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, usuario_id: 1, fecha_devolucion: null, fecha_prestamo: fechaPrestamoVencida }]
      });

      await renovarPrestamo(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'No se puede renovar un préstamo vencido'
      });
    });

    it('debe renovar préstamo exitosamente', async () => {
      mockReq.params.id = '1';
      mockReq.user = { id: 1 };

      const fechaReciente = new Date();
      fechaReciente.setDate(fechaReciente.getDate() - 5);
      const fechaPrestamoReciente = fechaReciente.toISOString().split('T')[0];

      pool.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, usuario_id: 1, fecha_devolucion: null, fecha_prestamo: fechaPrestamoReciente, nombre: 'Juan', apellido: 'Pérez', titulo: 'Libro' }]
        })
        .mockResolvedValueOnce({ rows: [] }) // UPDATE query
        .mockResolvedValueOnce({
          rows: [{ id: 1, fecha_prestamo: new Date().toISOString().split('T')[0], activo: true }]
        });

      await renovarPrestamo(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledTimes(3);
      const updateCalls = pool.query.mock.calls.filter(call => 
        call[0] && typeof call[0] === 'string' && call[0].includes('UPDATE prestamos') && call[0].includes('fecha_prestamo')
      );
      expect(updateCalls.length).toBeGreaterThan(0);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Préstamo renovado exitosamente'
        })
      );
    });

    it('debe manejar errores', async () => {
      mockReq.params.id = '1';
      mockReq.user = { id: 1 };
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await renovarPrestamo(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('obtenerPrestamosUsuarioActual', () => {
    it('debe manejar error si no hay usuario autenticado', async () => {
      await obtenerPrestamosUsuarioActual(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Error al obtener préstamos del usuario'
      });
    });

    it('debe obtener préstamos del usuario actual', async () => {
      mockReq.user = { id: 1 };
      const mockPrestamos = [
        { id: 1, fecha_prestamo: '2024-01-01', titulo: 'Libro 1' }
      ];

      pool.query.mockResolvedValueOnce({ rows: mockPrestamos });

      await obtenerPrestamosUsuarioActual(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE p.usuario_id = $1'),
        [1]
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        prestamos: mockPrestamos
      });
    });

    it('debe manejar errores', async () => {
      mockReq.user = { id: 1 };
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await obtenerPrestamosUsuarioActual(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});

