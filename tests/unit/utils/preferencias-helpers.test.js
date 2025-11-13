// Mock database ANTES de importar el módulo
jest.mock('../../../src/config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

// Mock logger para evitar dependencia circular con simple-encryption
jest.mock('../../../src/config/logger', () => ({
  logError: jest.fn(),
  logInfo: jest.fn(),
  logWarning: jest.fn(),
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

const {
  DEFAULT_PREFERENCES,
  validatePreferences,
  getPreferencesByUserId,
  createDefaultPreferences,
  upsertPreferences
} = require('../../../src/utils/preferencias-helpers');
const { pool } = require('../../../src/config/database');

describe('preferencias-helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('DEFAULT_PREFERENCES', () => {
    it('debe tener valores por defecto correctos', () => {
      expect(DEFAULT_PREFERENCES).toHaveProperty('idioma', 'es');
      expect(DEFAULT_PREFERENCES).toHaveProperty('tema', 'auto');
      expect(DEFAULT_PREFERENCES).toHaveProperty('tamanoFuente', 'medium');
      expect(DEFAULT_PREFERENCES).toHaveProperty('emailPrestamos', true);
    });
  });

  describe('validatePreferences', () => {
    it('debe validar preferencias válidas', () => {
      const result = validatePreferences({
        idioma: 'es',
        tema: 'light',
        tamanoFuente: 'medium',
        maxResultados: '20'
      });
      expect(result.valid).toBe(true);
    });

    it('debe rechazar idioma inválido', () => {
      const result = validatePreferences({ idioma: 'invalid' });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Idioma no válido');
    });

    it('debe rechazar tema inválido', () => {
      const result = validatePreferences({ tema: 'invalid' });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Tema no válido');
    });

    it('debe rechazar tamaño de fuente inválido', () => {
      const result = validatePreferences({ tamanoFuente: 'invalid' });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Tamaño de fuente no válido');
    });

    it('debe rechazar máximo de resultados inválido', () => {
      const result = validatePreferences({ maxResultados: '200' });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Máximo de resultados no válido');
    });

    it('debe aceptar preferencias parciales', () => {
      const result = validatePreferences({ idioma: 'en' });
      expect(result.valid).toBe(true);
    });
  });

  describe('getPreferencesByUserId', () => {
    it('debe retornar preferencias si existen', async () => {
      const mockPreferences = {
        id: 1,
        usuario_id: 1,
        idioma: 'es',
        tema: 'light'
      };
      pool.query.mockResolvedValue({ rows: [mockPreferences] });

      const result = await getPreferencesByUserId(1);
      expect(result).toEqual(mockPreferences);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT p.*'),
        [1]
      );
    });

    it('debe retornar null si no existen preferencias', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await getPreferencesByUserId(999);
      expect(result).toBeNull();
    });
  });

  describe('createDefaultPreferences', () => {
    it('debe crear preferencias por defecto', async () => {
      const mockPreferences = {
        id: 1,
        usuario_id: 1,
        idioma: 'es',
        tema: 'auto'
      };
      pool.query.mockResolvedValue({ rows: [mockPreferences] });

      const result = await createDefaultPreferences(1);
      expect(result).toEqual(mockPreferences);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO preferencias'),
        expect.arrayContaining([1, 'es', 'auto', 'medium', '20'])
      );
    });
  });

  describe('upsertPreferences', () => {
    it('debe crear nuevas preferencias si no existen', async () => {
      pool.query
        .mockImplementationOnce(() => Promise.resolve({ rows: [] })) // checkQuery
        .mockImplementationOnce(() => Promise.resolve({ rows: [{ id: 1, usuario_id: 1, idioma: 'en' }] })); // insertQuery

      const preferencias = { idioma: 'en', tema: 'dark' };
      const result = await upsertPreferences(1, preferencias);

      expect(result).toHaveProperty('id', 1);
      expect(pool.query).toHaveBeenCalledTimes(2);
    });

    it('debe actualizar preferencias existentes', async () => {
      pool.query
        .mockImplementationOnce(() => Promise.resolve({ rows: [{ id: 1 }] })) // checkQuery
        .mockImplementationOnce(() => Promise.resolve({ rows: [{ id: 1, usuario_id: 1, idioma: 'en' }] })); // updateQuery

      const preferencias = { idioma: 'en' };
      const result = await upsertPreferences(1, preferencias);

      expect(result).toHaveProperty('id', 1);
      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(pool.query).toHaveBeenLastCalledWith(
        expect.stringContaining('UPDATE preferencias'),
        expect.arrayContaining([1, 'en'])
      );
    });

    it('debe usar valores por defecto con nullish coalescing', async () => {
      pool.query
        .mockImplementationOnce(() => Promise.resolve({ rows: [] }))
        .mockImplementationOnce(() => Promise.resolve({ rows: [{ id: 1 }] }));

      const preferencias = {
        emailPrestamos: false,
        emailNuevosLibros: null,
        emailEventos: undefined
      };
      await upsertPreferences(1, preferencias);

      const insertCall = pool.query.mock.calls[1];
      expect(insertCall[1]).toContain(false); // emailPrestamos: false
      expect(insertCall[1]).toContain(DEFAULT_PREFERENCES.emailNuevosLibros); // null -> default
      expect(insertCall[1]).toContain(DEFAULT_PREFERENCES.emailEventos); // undefined -> default
    });
  });
});

