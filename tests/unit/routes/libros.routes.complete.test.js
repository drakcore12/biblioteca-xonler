// Mock express - create a real router-like object with stack
const createMockRouter = () => {
  const stack = [];
  const router = {
    stack,
    get: jest.fn((path, ...handlers) => {
      stack.push({
        route: { path, stack: handlers.map(h => ({ handle: h })) },
        path
      });
      return router;
    }),
    post: jest.fn((path, ...handlers) => {
      stack.push({
        route: { path, stack: handlers.map(h => ({ handle: h })) },
        path
      });
      return router;
    }),
    use: jest.fn(() => router)
  };
  return router;
};

jest.mock('express', () => ({
  Router: jest.fn(() => createMockRouter())
}));

// Mock database
jest.mock('../../src/config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

// Mock controllers
jest.mock('../../src/controllers/libros.controller', () => ({
  obtenerRecomendaciones: jest.fn((req, res) => res.json({ recomendaciones: [] }))
}));

// Mock middleware
jest.mock('../../src/middleware/hybrid-auth', () => ({
  hybridAuth: jest.fn((req, res, next) => next())
}));

const router = require('../../src/routes/libros.routes');
const { pool } = require('../../src/config/database');
const express = require('express');

describe('libros.routes - cobertura completa', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      params: {},
      query: {},
      body: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  describe('GET /test-db', () => {
    it('debe retornar timestamp de base de datos', async () => {
      const route = router.stack.find(r => r.route?.path === '/test-db');
      expect(route).toBeDefined();
      
      pool.query.mockResolvedValueOnce({
        rows: [{ now: new Date() }]
      });
      
      await route.route.stack[0].handle(mockReq, mockRes);
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: true,
          timestamp: expect.any(Date)
        })
      );
    });

    it('debe manejar error de conexión', async () => {
      const route = router.stack.find(r => r.route?.path === '/test-db');
      pool.query.mockRejectedValueOnce(new Error('Connection error'));
      
      await route.route.stack[0].handle(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('GET /test-table', () => {
    it('debe retornar información de tabla', async () => {
      const route = router.stack.find(r => r.route?.path === '/test-table');
      expect(route).toBeDefined();
      
      pool.query.mockResolvedValueOnce({
        rows: [{ total: '10', columns: 'id, titulo, autor' }]
      });
      
      await route.route.stack[0].handle(mockReq, mockRes);
      
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('debe manejar error al verificar tabla', async () => {
      const route = router.stack.find(r => r.route?.path === '/test-table');
      pool.query.mockRejectedValueOnce(new Error('Table error'));
      
      await route.route.stack[0].handle(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('GET /', () => {
    it('debe retornar lista de libros', async () => {
      const route = router.stack.find(r => r.route?.path === '/');
      expect(route).toBeDefined();
      
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          titulo: 'Libro',
          autor: 'Autor',
          isbn: '123',
          imagen_url: '/img.jpg',
          descripcion: 'Desc',
          categoria: 'Ficción',
          disponibilidad: true
        }]
      });
      
      await route.route.stack[0].handle(mockReq, mockRes);
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              id: 1,
              titulo: 'Libro',
              imagenUrl: '/img.jpg',
              disponible: true
            })
          ])
        })
      );
    });

    it('debe manejar error al obtener libros', async () => {
      const route = router.stack.find(r => r.route?.path === '/');
      pool.query.mockRejectedValueOnce(new Error('Query error'));
      
      await route.route.stack[0].handle(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('GET /:id', () => {
    it('debe retornar libro por ID', async () => {
      const route = router.stack.find(r => r.route?.path === '/:id');
      expect(route).toBeDefined();
      
      mockReq.params.id = '1';
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          titulo: 'Libro',
          autor: 'Autor'
        }]
      });
      
      await route.route.stack[0].handle(mockReq, mockRes);
      
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('debe retornar 400 si ID es inválido', async () => {
      const route = router.stack.find(r => r.route?.path === '/:id');
      
      mockReq.params.id = 'invalid';
      await route.route.stack[0].handle(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('debe retornar 400 si ID es negativo', async () => {
      const route = router.stack.find(r => r.route?.path === '/:id');
      
      mockReq.params.id = '-1';
      await route.route.stack[0].handle(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('debe retornar 404 si libro no existe', async () => {
      const route = router.stack.find(r => r.route?.path === '/:id');
      
      mockReq.params.id = '999';
      pool.query.mockResolvedValueOnce({ rows: [] });
      
      await route.route.stack[0].handle(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('debe manejar error al obtener libro', async () => {
      const route = router.stack.find(r => r.route?.path === '/:id');
      
      mockReq.params.id = '1';
      pool.query.mockRejectedValueOnce(new Error('Query error'));
      
      await route.route.stack[0].handle(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});

