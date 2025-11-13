// Mock database
jest.mock('../../src/config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

const usuariosDb = require('../../src/db/usuarios.db');
const { pool } = require('../../src/config/database');

describe('usuarios.db', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  describe('getById', () => {
    it('debe obtener usuario por ID', async () => {
      const mockUser = {
        id: 1,
        email: 'test@test.com',
        password_hash: 'hash',
        rol_id: 1,
        preferencias: { tema: 'dark' },
        dobleautenticacion: false,
        nombre: 'Juan',
        apellido: 'Pérez'
      };
      
      pool.query.mockResolvedValueOnce({ rows: [mockUser] });
      
      const user = await usuariosDb.getById(1);
      
      expect(user).toEqual(mockUser);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1]
      );
    });

    it('debe retornar null si usuario no existe', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      
      const user = await usuariosDb.getById(999);
      
      expect(user).toBeNull();
    });

    it('debe inicializar preferencias como objeto vacío si es null', async () => {
      const mockUser = {
        id: 1,
        preferencias: null
      };
      
      pool.query.mockResolvedValueOnce({ rows: [mockUser] });
      
      const user = await usuariosDb.getById(1);
      
      expect(user.preferencias).toEqual({});
    });

    it('debe manejar errores', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));
      
      await expect(usuariosDb.getById(1)).rejects.toThrow('Database error');
    });
  });

  describe('getByEmail', () => {
    it('debe obtener usuario por email', async () => {
      const mockUser = {
        id: 1,
        email: 'test@test.com',
        rol: 'usuario'
      };
      
      pool.query.mockResolvedValueOnce({ rows: [mockUser] });
      
      const user = await usuariosDb.getByEmail('test@test.com');
      
      expect(user).toEqual(mockUser);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['test@test.com']
      );
    });

    it('debe retornar null si usuario no existe', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      
      const user = await usuariosDb.getByEmail('nonexistent@test.com');
      
      expect(user).toBeNull();
    });
  });

  describe('saveTwoFASecret', () => {
    it('debe guardar secreto 2FA', async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 1 });
      
      const result = await usuariosDb.saveTwoFASecret(1, 'ABC123');
      
      expect(result.rowCount).toBe(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        [1, 'ABC123']
      );
    });
  });

  describe('enableTwoFA', () => {
    it('debe activar 2FA para usuario', async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 1 });
      
      const result = await usuariosDb.enableTwoFA(1);
      
      expect(result.rowCount).toBe(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('dobleautenticacion = true'),
        [1]
      );
    });
  });

  describe('disableTwoFA', () => {
    it('debe desactivar 2FA para usuario', async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 1 });
      
      const result = await usuariosDb.disableTwoFA(1);
      
      expect(result.rowCount).toBe(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('dobleautenticacion = false'),
        [1]
      );
    });
  });
});

