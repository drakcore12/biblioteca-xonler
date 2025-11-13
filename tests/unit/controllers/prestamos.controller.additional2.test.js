// Mock database
jest.mock('../../../src/config/database', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn()
  }
}));

const {
  crearPrestamo,
  marcarDevolucion,
  renovarPrestamo
} = require('../../../src/controllers/prestamos.controller');
const { pool } = require('../../../src/config/database');

describe('prestamos.controller - casos adicionales 2', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      user: null,
      body: {},
      params: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  describe('crearPrestamo - casos edge', () => {
    it('debe retornar 401 si no está autenticado', async () => {
      await crearPrestamo(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('debe retornar 404 si el libro no existe', async () => {
      mockReq.user = { id: 1 };
      mockReq.body = { libro_id: 999 };
      
      pool.query.mockResolvedValueOnce({ rows: [] });

      await crearPrestamo(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('debe retornar 409 si el libro no está disponible', async () => {
      mockReq.user = { id: 1 };
      mockReq.body = { libro_id: 1 };
      
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, titulo: 'Libro', disponibilidad: false }]
      });

      await crearPrestamo(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
    });

    it('debe retornar 409 si ya tiene préstamo activo del mismo libro', async () => {
      mockReq.user = { id: 1 };
      mockReq.body = { libro_id: 1 };
      
      pool.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, titulo: 'Libro', disponibilidad: true }]
        })
        .mockResolvedValueOnce({
          rows: [{ biblioteca_libro_id: 1, biblioteca_nombre: 'Biblioteca' }]
        })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] });

      await crearPrestamo(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
    });

    it('debe usar fecha_prestamo del body si se proporciona', async () => {
      mockReq.user = { id: 1 };
      mockReq.body = { libro_id: 1, fecha_prestamo: '2024-01-01' };
      
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      pool.connect.mockResolvedValueOnce(mockClient);
      
      pool.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, titulo: 'Libro', disponibilidad: true }]
        })
        .mockResolvedValueOnce({
          rows: [{ biblioteca_libro_id: 1 }]
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{ id: 1 }]
        });

      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({
          rows: [{ id: 1 }]
        })
        .mockResolvedValueOnce({});

      await crearPrestamo(mockReq, mockRes);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO prestamos'),
        expect.arrayContaining(['2024-01-01'])
      );
    });

    it('debe hacer rollback en caso de error', async () => {
      mockReq.user = { id: 1 };
      mockReq.body = { libro_id: 1 };
      
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      pool.connect.mockResolvedValueOnce(mockClient);
      
      pool.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, titulo: 'Libro', disponibilidad: true }]
        })
        .mockResolvedValueOnce({
          rows: [{ biblioteca_libro_id: 1 }]
        })
        .mockResolvedValueOnce({ rows: [] });

      mockClient.query
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('Transaction error'));

      await crearPrestamo(mockReq, mockRes);

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('marcarDevolucion - casos edge', () => {
    it('debe retornar 403 si no es el propietario ni admin', async () => {
      mockReq.user = { id: 1, rol: 'usuario' };
      mockReq.params.id = '1';
      
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          usuario_id: 999,
          fecha_devolucion: null
        }]
      });

      await marcarDevolucion(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('debe permitir a admin devolver cualquier préstamo', async () => {
      mockReq.user = { id: 1, rol: 'admin' };
      mockReq.params.id = '1';
      
      pool.query
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            usuario_id: 999,
            fecha_devolucion: null
          }]
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            fecha_devolucion: '2024-01-01'
          }]
        });

      await marcarDevolucion(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe('renovarPrestamo - casos edge', () => {
    it('debe retornar 403 si no es el propietario', async () => {
      mockReq.user = { id: 1 };
      mockReq.params.id = '1';
      
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          usuario_id: 999,
          fecha_devolucion: null,
          fecha_prestamo: '2024-01-01'
        }]
      });

      await renovarPrestamo(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('debe retornar 400 si el préstamo está vencido', async () => {
      mockReq.user = { id: 1 };
      mockReq.params.id = '1';
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 20);
      
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          usuario_id: 1,
          fecha_devolucion: null,
          fecha_prestamo: oldDate.toISOString().split('T')[0]
        }]
      });

      await renovarPrestamo(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });
});

