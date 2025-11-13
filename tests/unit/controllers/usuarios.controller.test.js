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

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn()
}));

const {
  obtenerUsuarios,
  obtenerUsuarioActual,
  obtenerUsuarioPorId,
  crearUsuario,
  loginUsuario
} = require('../../../src/controllers/usuarios.controller');
const { pool } = require('../../../src/config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

describe('usuarios.controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      query: {},
      params: {},
      body: {},
      user: null,
      userId: null
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
    it('debe obtener todos los usuarios sin filtros', async () => {
      const mockUsers = [
        { id: 1, nombre: 'Juan', email: 'juan@test.com', rol: 'usuario' },
        { id: 2, nombre: 'María', email: 'maria@test.com', rol: 'admin' }
      ];

      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '2' }] }) // Count query
        .mockResolvedValueOnce({ rows: mockUsers }); // Data query

      await obtenerUsuarios(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockUsers,
          total: 2
        })
      );
    });

    it('debe filtrar por rol', async () => {
      mockReq.query = { rol: '1' };
      
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, nombre: 'Juan', rol: 'usuario' }] });

      await obtenerUsuarios(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('u.rol_id = $1'),
        expect.arrayContaining(['1'])
      );
    });

    it('debe buscar por texto', async () => {
      mockReq.query = { busqueda: 'Juan' };
      
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, nombre: 'Juan' }] });

      await obtenerUsuarios(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        expect.arrayContaining([expect.stringContaining('Juan')])
      );
    });

    it('debe manejar paginación', async () => {
      mockReq.query = { limit: '5', offset: '10' };
      
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '20' }] })
        .mockResolvedValueOnce({ rows: [] });

      await obtenerUsuarios(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        expect.arrayContaining(['5', '10'])
      );
    });

    it('debe manejar errores', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await obtenerUsuarios(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Error al obtener usuarios'
      });
    });
  });

  describe('obtenerUsuarioActual', () => {
    it('debe retornar error 401 si no hay usuario autenticado', async () => {
      await obtenerUsuarioActual(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Usuario no autenticado'
      });
    });

    it('debe obtener el usuario actual desde req.user', async () => {
      mockReq.user = { id: 1 };
      
      const mockUser = {
        id: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'test@test.com',
        rol: 'usuario'
      };

      pool.query.mockResolvedValueOnce({ rows: [mockUser] });

      await obtenerUsuarioActual(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(mockUser);
    });

    it('debe obtener el usuario actual desde req.userId', async () => {
      mockReq.userId = 1;
      
      const mockUser = {
        id: 1,
        nombre: 'Juan',
        email: 'test@test.com'
      };

      pool.query.mockResolvedValueOnce({ rows: [mockUser] });

      await obtenerUsuarioActual(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalled();
    });

    it('debe manejar errores', async () => {
      mockReq.user = { id: 1 };
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await obtenerUsuarioActual(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('obtenerUsuarioPorId', () => {
    it('debe obtener un usuario por ID', async () => {
      mockReq.params.id = '1';
      
      const mockUser = {
        id: 1,
        nombre: 'Juan',
        email: 'test@test.com',
        rol: 'usuario'
      };

      pool.query.mockResolvedValueOnce({ rows: [mockUser] });

      await obtenerUsuarioPorId(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE u.id = $1'),
        ['1']
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockUser
        })
      );
    });

    it('debe retornar 404 si el usuario no existe', async () => {
      mockReq.params.id = '999';
      pool.query.mockResolvedValueOnce({ rows: [] });

      await obtenerUsuarioPorId(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Usuario no encontrado'
      });
    });

    it('debe manejar errores', async () => {
      mockReq.params.id = '1';
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await obtenerUsuarioPorId(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('crearUsuario', () => {
    it('debe retornar error 400 si faltan campos obligatorios', async () => {
      mockReq.body = { nombre: 'Juan' };

      await crearUsuario(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Faltan campos requeridos: nombre, email, password, rol_id'
      });
    });

    it('debe retornar error 400 si el email ya existe', async () => {
      mockReq.body = {
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'test@test.com',
        password: 'password123',
        rol_id: 1
      };

      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      await crearUsuario(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'El email ya está registrado'
      });
    });

    it('debe crear un usuario exitosamente', async () => {
      mockReq.body = {
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'test@test.com',
        password: 'password123',
        rol_id: 1
      };

      const mockUser = {
        id: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'test@test.com',
        rol_id: 1,
        created_at: new Date()
      };

      pool.query
        .mockResolvedValueOnce({ rows: [] }) // Email no existe
        .mockResolvedValueOnce({ rows: [mockUser] }); // Insert usuario

      bcrypt.hash.mockResolvedValue('hashed-password');

      await crearUsuario(mockReq, mockRes);

      expect(bcrypt.hash).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Usuario creado exitosamente',
        data: mockUser
      });
    });

    it('debe manejar errores', async () => {
      mockReq.body = {
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'test@test.com',
        password: 'password123',
        rol_id: 1
      };

      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await crearUsuario(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('loginUsuario', () => {
    it('debe retornar error 400 si faltan datos', async () => {
      mockReq.body = { email: 'test@test.com' };

      await loginUsuario(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Faltan datos requeridos'
      });
    });

    it('debe retornar error 401 si las credenciales son incorrectas', async () => {
      mockReq.body = {
        email: 'test@test.com',
        password: 'wrongpassword'
      };

      pool.query.mockResolvedValueOnce({ rows: [] });

      await loginUsuario(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Credenciales incorrectas'
      });
    });

    it('debe retornar error 401 si la contraseña es incorrecta', async () => {
      mockReq.body = {
        email: 'test@test.com',
        password: 'wrongpassword'
      };

      const mockUser = {
        id: 1,
        nombre: 'Juan',
        email: 'test@test.com',
        password_hash: 'hashed-password',
        rol: 'usuario',
        rol_id: 1
      };

      pool.query.mockResolvedValueOnce({ rows: [mockUser] });
      bcrypt.compare.mockResolvedValueOnce(false);

      await loginUsuario(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Credenciales incorrectas'
      });
    });

    it('debe hacer login exitoso y generar token', async () => {
      mockReq.body = {
        email: 'test@test.com',
        password: 'password123'
      };

      const mockUser = {
        id: 1,
        nombre: 'Juan',
        email: 'test@test.com',
        password_hash: 'hashed-password',
        rol: 'usuario',
        rol_id: 1
      };

      const mockToken = 'jwt-token';

      pool.query.mockResolvedValueOnce({ rows: [mockUser] });
      bcrypt.compare.mockResolvedValueOnce(true);
      jwt.sign.mockReturnValue(mockToken);

      await loginUsuario(mockReq, mockRes);

      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(jwt.sign).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        token: mockToken,
        role: 'usuario',
        userName: 'Juan',
        userId: 1
      });
    });

    it('debe manejar errores', async () => {
      mockReq.body = {
        email: 'test@test.com',
        password: 'password123'
      };

      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await loginUsuario(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});

