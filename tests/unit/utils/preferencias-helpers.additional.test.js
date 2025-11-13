// Mock database
jest.mock('../../src/config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

jest.mock('../../src/utils/http-response', () => ({
  badRequest: jest.fn((res, message) => res.status(400).json({ error: message })),
  success: jest.fn((res, data) => res.json({ data })),
  notFound: jest.fn((res, message) => res.status(404).json({ error: message })),
  error: jest.fn((res, message) => res.status(500).json({ error: message }))
}));

jest.mock('../../src/utils/error-handler', () => ({
  asyncHandler: jest.fn((fn) => fn)
}));

const {
  DEFAULT_PREFERENCES,
  validatePreferences,
  getPreferencesByUserId,
  createDefaultPreferences,
  upsertPreferences
} = require('../../src/utils/preferencias-helpers');
const { pool } = require('../../src/config/database');

describe('preferencias-helpers - casos adicionales', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validatePreferences - casos edge', () => {
    it('debe validar todos los idiomas permitidos', () => {
      expect(validatePreferences({ idioma: 'es' }).valid).toBe(true);
      expect(validatePreferences({ idioma: 'en' }).valid).toBe(true);
      expect(validatePreferences({ idioma: 'fr' }).valid).toBe(true);
    });

    it('debe validar todos los temas permitidos', () => {
      expect(validatePreferences({ tema: 'auto' }).valid).toBe(true);
      expect(validatePreferences({ tema: 'light' }).valid).toBe(true);
      expect(validatePreferences({ tema: 'dark' }).valid).toBe(true);
    });

    it('debe validar todos los tamaños de fuente permitidos', () => {
      expect(validatePreferences({ tamanoFuente: 'small' }).valid).toBe(true);
      expect(validatePreferences({ tamanoFuente: 'medium' }).valid).toBe(true);
      expect(validatePreferences({ tamanoFuente: 'large' }).valid).toBe(true);
    });

    it('debe validar todos los maxResultados permitidos', () => {
      expect(validatePreferences({ maxResultados: '10' }).valid).toBe(true);
      expect(validatePreferences({ maxResultados: '20' }).valid).toBe(true);
      expect(validatePreferences({ maxResultados: '50' }).valid).toBe(true);
      expect(validatePreferences({ maxResultados: '100' }).valid).toBe(true);
    });

    it('debe retornar valid: true si no hay preferencias', () => {
      expect(validatePreferences({})).toEqual({ valid: true });
    });
  });

  describe('getPreferencesByUserId', () => {
    it('debe retornar null si no hay preferencias', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      
      const result = await getPreferencesByUserId(1);
      
      expect(result).toBeNull();
    });

    it('debe retornar preferencias si existen', async () => {
      const mockPreferences = { id: 1, usuario_id: 1, idioma: 'es' };
      pool.query.mockResolvedValueOnce({ rows: [mockPreferences] });
      
      const result = await getPreferencesByUserId(1);
      
      expect(result).toEqual(mockPreferences);
    });
  });

  describe('createDefaultPreferences', () => {
    it('debe crear preferencias con valores por defecto', async () => {
      const mockPreferences = {
        id: 1,
        usuario_id: 1,
        idioma: 'es',
        tema: 'auto'
      };
      pool.query.mockResolvedValueOnce({ rows: [mockPreferences] });
      
      const result = await createDefaultPreferences(1);
      
      expect(result).toEqual(mockPreferences);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO preferencias'),
        expect.arrayContaining([
          1,
          DEFAULT_PREFERENCES.idioma,
          DEFAULT_PREFERENCES.tema,
          DEFAULT_PREFERENCES.tamanoFuente,
          DEFAULT_PREFERENCES.maxResultados
        ])
      );
    });
  });

  describe('upsertPreferences - casos edge', () => {
    it('debe crear preferencias si no existen', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] }) // checkQuery
        .mockResolvedValueOnce({ rows: [{ id: 1, usuario_id: 1 }] }); // insertQuery
      
      const preferencias = { idioma: 'en' };
      const result = await upsertPreferences(1, preferencias);
      
      expect(result).toBeDefined();
      expect(pool.query).toHaveBeenCalledTimes(2);
    });

    it('debe actualizar preferencias si existen', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // checkQuery
        .mockResolvedValueOnce({ rows: [{ id: 1, usuario_id: 1, idioma: 'en' }] }); // updateQuery
      
      const preferencias = { idioma: 'en' };
      const result = await upsertPreferences(1, preferencias);
      
      expect(result).toBeDefined();
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE preferencias'),
        expect.any(Array)
      );
    });

    it('debe usar valores por defecto para campos faltantes en insert', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] });
      
      await upsertPreferences(1, {});
      
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO preferencias'),
        expect.arrayContaining([
          1,
          DEFAULT_PREFERENCES.idioma,
          DEFAULT_PREFERENCES.tema
        ])
      );
    });

    it('debe usar nullish coalescing para booleanos', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] });
      
      await upsertPreferences(1, {
        emailPrestamos: false,
        emailNuevosLibros: undefined
      });
      
      expect(pool.query).toHaveBeenCalled();
    });
  });
});

