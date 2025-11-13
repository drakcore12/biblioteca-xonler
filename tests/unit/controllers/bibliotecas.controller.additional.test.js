// Mock database
jest.mock('../../../src/config/database', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn()
  }
}));

const {
  actualizarBiblioteca,
  eliminarBiblioteca
} = require('../../../src/controllers/bibliotecas.controller');
const { pool } = require('../../../src/config/database');

describe('bibliotecas.controller - casos adicionales', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      params: {},
      body: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      end: jest.fn()
    };
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  describe('actualizarBiblioteca - casos edge', () => {
    it('debe manejar error de foreign key', async () => {
      mockReq.params.id = '1';
      mockReq.body = { nombre: 'Biblioteca', direccion: 'Dirección', colegio_id: '999' };
      
      pool.query.mockRejectedValueOnce({ code: '23503' });

      await actualizarBiblioteca(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'colegio_id no existe'
      });
    });

    it('debe manejar colegio_id null', async () => {
      mockReq.params.id = '1';
      mockReq.body = { nombre: 'Biblioteca', direccion: 'Dirección', colegio_id: null };
      
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      await actualizarBiblioteca(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalled();
    });
  });

  describe('eliminarBiblioteca - casos edge', () => {
    it('debe retornar 409 si tiene libros asociados', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      pool.connect.mockResolvedValueOnce(mockClient);

      mockReq.params.id = '1';
      mockClient.query.mockResolvedValueOnce({ rowCount: 1 });

      await eliminarBiblioteca(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('debe retornar 404 si la biblioteca no existe', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      pool.connect.mockResolvedValueOnce(mockClient);

      mockReq.params.id = '999';
      mockClient.query
        .mockResolvedValueOnce({ rowCount: 0 })
        .mockResolvedValueOnce({ rowCount: 0 });

      await eliminarBiblioteca(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('debe manejar errores en transacción', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      pool.connect.mockResolvedValueOnce(mockClient);

      mockReq.params.id = '1';
      mockClient.query.mockRejectedValueOnce(new Error('Database error'));

      await eliminarBiblioteca(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});
