// Mock database
jest.mock('../../../src/config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn()
}));

const {
  obtenerUsuarios,
  obtenerUsuarioActual
} = require('../../../src/controllers/usuarios.controller');
const { pool } = require('../../../src/config/database');

describe('usuarios.controller - casos edge', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      query: {},
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

  describe('obtenerUsuarios', () => {
    it('debe filtrar por rol', async () => {
      mockReq.query = { rol: '1', limit: '10', offset: '0' };

      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, nombre: 'Juan', rol: 'usuario' }] });

      await obtenerUsuarios(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('debe filtrar por búsqueda', async () => {
      mockReq.query = { busqueda: 'juan', limit: '10', offset: '0' };

      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, nombre: 'Juan' }] });

      await obtenerUsuarios(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalled();
    });

    it('debe filtrar por rol y búsqueda', async () => {
      mockReq.query = { rol: '1', busqueda: 'juan', limit: '10', offset: '0' };

      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, nombre: 'Juan' }] });

      await obtenerUsuarios(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalled();
    });

    it('debe manejar errores', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await obtenerUsuarios(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('obtenerUsuarioActual', () => {
    it('debe obtener usuario actual exitosamente', async () => {
      mockReq.user = { id: 1 };
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          nombre: 'Juan',
          apellido: 'Pérez',
          email: 'juan@test.com',
          rol: 'usuario'
        }]
      });

      await obtenerUsuarioActual(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('debe retornar 401 si no está autenticado', async () => {
      mockReq.user = null;

      await obtenerUsuarioActual(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('debe retornar 404 si el usuario no existe', async () => {
      mockReq.user = { id: 999 };
      pool.query.mockResolvedValueOnce({ rows: [] });

      await obtenerUsuarioActual(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('debe manejar errores', async () => {
      mockReq.user = { id: 1 };
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await obtenerUsuarioActual(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});

