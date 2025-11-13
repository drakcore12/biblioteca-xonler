// Mock database
jest.mock('../../src/config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

jest.mock('../../src/config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

const supAdminController = require('../../src/controllers/supadmin.controller');
const { pool } = require('../../src/config/database');

describe('supadmin.controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      query: {},
      params: {},
      body: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  describe('obtenerEstadisticasGlobales', () => {
    it('debe obtener estadísticas globales exitosamente', async () => {
      // Mock todas las consultas con fechas como objetos Date
      const mockDate = new Date('2024-01-01');
      pool.query
        .mockResolvedValueOnce({ rows: [{ total: '100' }] }) // totalUsuarios
        .mockResolvedValueOnce({ rows: [{ total: '10' }] }) // totalBibliotecas
        .mockResolvedValueOnce({ rows: [{ total: '500' }] }) // totalLibros
        .mockResolvedValueOnce({ rows: [{ total: '25' }] }) // prestamosActivos
        .mockResolvedValueOnce({ rows: [{ rol: 'usuario', total: '80' }] }) // usuariosPorRol
        .mockResolvedValueOnce({ rows: [{ nombre: 'Colegio 1', total: '5' }] }) // bibliotecasPorColegio
        .mockResolvedValueOnce({ rows: [{ fecha: mockDate, nuevos_usuarios: '10' }] }) // actividad30Dias
        .mockResolvedValueOnce({ rows: [{ categoria: 'Ficción', total: '15' }] }) // prestamosPorCategoria
        .mockResolvedValueOnce({ rows: [{ titulo: 'Libro 1', autor: 'Autor 1', total_prestamos: '20' }] }) // topLibros
        .mockResolvedValueOnce({ rows: [{ nombre: 'Juan', apellido: 'Pérez', email: 'juan@test.com', total_prestamos: '10' }] }); // topUsuarios

      await supAdminController.obtenerEstadisticasGlobales(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledTimes(10);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            total_usuarios: 100,
            total_bibliotecas: 10,
            total_libros: 500
          })
        })
      );
    });

    it('debe manejar errores', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await supAdminController.obtenerEstadisticasGlobales(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Error interno del servidor'
        })
      );
    });
  });

  describe('obtenerLogs', () => {
    it('debe obtener logs de aplicación', async () => {
      mockReq.query = { tipo: 'application', limit: '10', offset: '0' };

      // Mock processApplicationLogs - necesita retornar logs con estructura correcta
      pool.query.mockResolvedValue({ rows: [] });

      await supAdminController.obtenerLogs(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });

    it('debe obtener logs de seguridad', async () => {
      mockReq.query = { tipo: 'security' };

      pool.query.mockResolvedValue({ rows: [] });

      await supAdminController.obtenerLogs(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });

    it('debe obtener logs de auditoría', async () => {
      mockReq.query = { tipo: 'audit' };

      pool.query.mockResolvedValue({ rows: [] });

      await supAdminController.obtenerLogs(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });

    it('debe obtener logs de error', async () => {
      mockReq.query = { tipo: 'error' };

      await supAdminController.obtenerLogs(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });

    it('debe filtrar logs por nivel', async () => {
      mockReq.query = { tipo: 'application', nivel: 'error' };

      pool.query.mockResolvedValue({ rows: [] });

      await supAdminController.obtenerLogs(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });

    it('debe aplicar paginación', async () => {
      mockReq.query = { tipo: 'application', limit: '20', offset: '10' };

      pool.query.mockResolvedValue({ rows: [] });

      await supAdminController.obtenerLogs(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 20,
          offset: 10
        })
      );
    });

    it('debe manejar errores', async () => {
      mockReq.query = { tipo: 'application' };
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await supAdminController.obtenerLogs(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('obtenerActividadReciente', () => {
    it('debe obtener actividad reciente exitosamente', async () => {
      mockReq.query = { limit: '10' };
      const mockDate = new Date();

      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1, nombre: 'Juan', apellido: 'Pérez', email: 'juan@test.com', created_at: mockDate, rol: 'usuario' }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, fecha_prestamo: mockDate, fecha_devolucion: null, nombre: 'Juan', apellido: 'Pérez', email: 'juan@test.com', titulo: 'Libro 1', autor: 'Autor 1', biblioteca_nombre: 'Biblioteca 1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, titulo: 'Libro 1', autor: 'Autor 1', categoria: 'Ficción' }] });

      await supAdminController.obtenerActividadReciente(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });

    it('debe filtrar por tipo', async () => {
      mockReq.query = { limit: '10', tipo: 'usuario_registrado' };
      const mockDate = new Date();

      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1, nombre: 'Juan', apellido: 'Pérez', email: 'juan@test.com', created_at: mockDate, rol: 'usuario' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await supAdminController.obtenerActividadReciente(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });

    it('debe manejar errores', async () => {
      mockReq.query = { limit: '10' };
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await supAdminController.obtenerActividadReciente(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});

