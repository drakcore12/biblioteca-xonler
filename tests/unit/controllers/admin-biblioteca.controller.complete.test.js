// Mock database
jest.mock('../../../src/config/database', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn()
  }
}));

const {
  obtenerBibliotecaAsignada,
  obtenerEstadisticasBiblioteca,
  obtenerLibrosBiblioteca,
  agregarLibroABiblioteca,
  removerLibroDeBiblioteca,
  obtenerPrestamosBiblioteca,
  marcarPrestamoDevuelto,
  crearLibro
} = require('../../../src/controllers/admin-biblioteca.controller');
const { pool } = require('../../../src/config/database');

describe('admin-biblioteca.controller - cobertura completa', () => {
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

  describe('obtenerBibliotecaAsignada - casos edge', () => {
    it('debe manejar error de base de datos', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await obtenerBibliotecaAsignada(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('obtenerEstadisticasBiblioteca - casos edge', () => {
    it('debe manejar error de base de datos', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ biblioteca_id: 1 }] })
        .mockRejectedValueOnce(new Error('Database error'));

      await obtenerEstadisticasBiblioteca(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('obtenerLibrosBiblioteca - casos edge', () => {
    it('debe manejar error de base de datos', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ biblioteca_id: 1 }] })
        .mockRejectedValueOnce(new Error('Database error'));

      await obtenerLibrosBiblioteca(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('agregarLibroABiblioteca - casos edge', () => {
    it('debe manejar error de base de datos', async () => {
      mockReq.body = { libro_id: 1 };
      
      pool.query
        .mockResolvedValueOnce({ rows: [{ biblioteca_id: 1 }] })
        .mockRejectedValueOnce(new Error('Database error'));

      await agregarLibroABiblioteca(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('removerLibroDeBiblioteca - casos edge', () => {
    it('debe manejar error de base de datos', async () => {
      mockReq.params = { libro_id: '1' };
      
      pool.query
        .mockResolvedValueOnce({ rows: [{ biblioteca_id: 1 }] })
        .mockRejectedValueOnce(new Error('Database error'));

      await removerLibroDeBiblioteca(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('crearLibro - casos edge', () => {
    it('debe manejar error de base de datos', async () => {
      mockReq.body = {
        titulo: 'Libro',
        autor: 'Autor',
        categoria: 'Ficción'
      };
      
      pool.query
        .mockResolvedValueOnce({ rows: [{ biblioteca_id: 1 }] })
        .mockRejectedValueOnce(new Error('Database error'));

      await crearLibro(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});

