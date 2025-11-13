// Mock helpers
jest.mock('../../../src/utils/preferencias-helpers', () => ({
  getPreferencesByUserId: jest.fn(),
  createDefaultPreferences: jest.fn(),
  upsertPreferences: jest.fn(),
  validatePreferences: jest.fn()
}));

// Mock http-response
jest.mock('../../../src/utils/http-response', () => ({
  success: jest.fn((res, data, message) => {
    res.json({ data, message });
    return res;
  }),
  notFound: jest.fn((res, message) => {
    res.status(404).json({ error: message });
    return res;
  }),
  badRequest: jest.fn((res, message) => {
    res.status(400).json({ error: message });
    return res;
  }),
  forbidden: jest.fn((res, message) => {
    res.status(403).json({ error: message });
    return res;
  })
}));

// Mock error-handler
jest.mock('../../../src/utils/error-handler', () => ({
  asyncHandler: jest.fn((fn) => async (req, res) => {
    try {
      return await fn(req, res);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  })
}));

const {
  getPreferenciasMe,
  putPreferenciasMe,
  getPreferenciasById,
  putPreferenciasById
} = require('../../../src/controllers/preferencias.controller');
const {
  getPreferencesByUserId,
  createDefaultPreferences,
  upsertPreferences,
  validatePreferences
} = require('../../../src/utils/preferencias-helpers');

describe('preferencias.controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      user: { id: 1, role: 'usuario' },
      params: {},
      body: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getPreferenciasMe', () => {
    it('debe obtener preferencias del usuario actual', async () => {
      const mockPreferencias = { idioma: 'es', tamanoFuente: 'medium' };
      getPreferencesByUserId.mockResolvedValueOnce(mockPreferencias);
      const { success } = require('../../../src/utils/http-response');

      await getPreferenciasMe(mockReq, mockRes);

      expect(getPreferencesByUserId).toHaveBeenCalledWith(1);
      expect(success).toHaveBeenCalledWith(mockRes, mockPreferencias);
    });

    it('debe crear preferencias por defecto si no existen', async () => {
      const mockDefaultPrefs = { idioma: 'es', tamanoFuente: 'medium' };
      getPreferencesByUserId.mockResolvedValueOnce(null);
      createDefaultPreferences.mockResolvedValueOnce(mockDefaultPrefs);
      const { success } = require('../../../src/utils/http-response');

      await getPreferenciasMe(mockReq, mockRes);

      expect(createDefaultPreferences).toHaveBeenCalledWith(1);
      expect(success).toHaveBeenCalledWith(mockRes, mockDefaultPrefs);
    });
  });

  describe('putPreferenciasMe', () => {
    it('debe actualizar preferencias del usuario actual', async () => {
      mockReq.body = { idioma: 'en', tamanoFuente: 'large' };
      validatePreferences.mockReturnValueOnce({ valid: true });
      upsertPreferences.mockResolvedValueOnce(mockReq.body);
      const { success } = require('../../../src/utils/http-response');

      await putPreferenciasMe(mockReq, mockRes);

      expect(validatePreferences).toHaveBeenCalledWith(mockReq.body);
      expect(upsertPreferences).toHaveBeenCalledWith(1, mockReq.body);
      expect(success).toHaveBeenCalledWith(mockRes, mockReq.body, 'Preferencias actualizadas correctamente');
    });

    it('debe retornar error si la validación falla', async () => {
      mockReq.body = { invalid: 'data' };
      validatePreferences.mockReturnValueOnce({ valid: false, error: 'Datos inválidos' });
      const { badRequest } = require('../../../src/utils/http-response');

      await putPreferenciasMe(mockReq, mockRes);

      expect(badRequest).toHaveBeenCalledWith(mockRes, 'Datos inválidos');
    });
  });

  describe('getPreferenciasById', () => {
    it('debe obtener preferencias por ID si es admin', async () => {
      mockReq.user.role = 'admin';
      mockReq.params.id = '2';
      const mockPreferencias = { idioma: 'en' };
      getPreferencesByUserId.mockResolvedValueOnce(mockPreferencias);
      const { success } = require('../../../src/utils/http-response');

      await getPreferenciasById(mockReq, mockRes);

      expect(getPreferencesByUserId).toHaveBeenCalledWith(2);
      expect(success).toHaveBeenCalledWith(mockRes, mockPreferencias);
    });

    it('debe permitir al usuario ver sus propias preferencias', async () => {
      mockReq.user.role = 'usuario';
      mockReq.params.id = '1';
      const mockPreferencias = { idioma: 'es' };
      getPreferencesByUserId.mockResolvedValueOnce(mockPreferencias);
      const { success } = require('../../../src/utils/http-response');

      await getPreferenciasById(mockReq, mockRes);

      expect(getPreferencesByUserId).toHaveBeenCalledWith(1);
      expect(success).toHaveBeenCalledWith(mockRes, mockPreferencias);
    });

    it('debe retornar 403 si no tiene permisos', async () => {
      mockReq.user.role = 'usuario';
      mockReq.params.id = '2';
      const { forbidden } = require('../../../src/utils/http-response');

      await getPreferenciasById(mockReq, mockRes);

      expect(forbidden).toHaveBeenCalledWith(mockRes, 'No tienes permisos para ver estas preferencias');
    });

    it('debe retornar 404 si las preferencias no existen', async () => {
      mockReq.user.role = 'admin';
      mockReq.params.id = '999';
      getPreferencesByUserId.mockResolvedValueOnce(null);
      const { notFound } = require('../../../src/utils/http-response');

      await getPreferenciasById(mockReq, mockRes);

      expect(notFound).toHaveBeenCalledWith(mockRes, 'Preferencias no encontradas');
    });
  });

  describe('putPreferenciasById', () => {
    it('debe actualizar preferencias por ID si es admin', async () => {
      mockReq.user.role = 'admin';
      mockReq.params.id = '2';
      mockReq.body = { idioma: 'en' };
      validatePreferences.mockReturnValueOnce({ valid: true });
      upsertPreferences.mockResolvedValueOnce(mockReq.body);
      const { success } = require('../../../src/utils/http-response');

      await putPreferenciasById(mockReq, mockRes);

      expect(upsertPreferences).toHaveBeenCalledWith(2, mockReq.body);
      expect(success).toHaveBeenCalledWith(mockRes, mockReq.body, 'Preferencias actualizadas correctamente');
    });

    it('debe retornar 403 si no tiene permisos', async () => {
      mockReq.user.role = 'usuario';
      mockReq.params.id = '2';
      mockReq.body = { idioma: 'en' };
      const { forbidden } = require('../../../src/utils/http-response');

      await putPreferenciasById(mockReq, mockRes);

      expect(forbidden).toHaveBeenCalledWith(mockRes, 'No tienes permisos para modificar estas preferencias');
    });
  });
});

