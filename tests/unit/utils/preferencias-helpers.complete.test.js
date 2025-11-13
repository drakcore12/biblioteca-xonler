// Mock database
jest.mock('../../../src/config/database', () => ({
  pool: {
    query: jest.fn()
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

describe('preferencias-helpers - cobertura completa', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validatePreferences - casos edge', () => {
    it('debe validar todos los campos opcionales', () => {
      const prefs = {
        idioma: 'es',
        tema: 'light',
        tamanoFuente: 'medium',
        maxResultados: '20'
      };
      
      const result = validatePreferences(prefs);
      
      expect(result.valid).toBe(true);
    });

    it('debe retornar error para valores inválidos', () => {
      expect(validatePreferences({ idioma: 'invalid' }).valid).toBe(false);
      expect(validatePreferences({ tema: 'invalid' }).valid).toBe(false);
      expect(validatePreferences({ tamanoFuente: 'invalid' }).valid).toBe(false);
      expect(validatePreferences({ maxResultados: 'invalid' }).valid).toBe(false);
    });
  });

  describe('upsertPreferences - casos edge', () => {
    it('debe usar nullish coalescing para booleanos correctamente', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] });
      
      await upsertPreferences(1, {
        emailPrestamos: false,
        emailNuevosLibros: undefined,
        emailEventos: null
      });
      
      expect(pool.query).toHaveBeenCalled();
    });

    it('debe actualizar preferencias existentes con valores parciales', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, idioma: 'en' }] });
      
      const result = await upsertPreferences(1, { idioma: 'en' });
      
      expect(result).toBeDefined();
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE preferencias'),
        expect.any(Array)
      );
    });
  });
});

