/**
 * @jest-environment jsdom
 */

// ============================================================================
// CONFIGURAR MOCKS GLOBALES
// ============================================================================

global.fetch = jest.fn();

const mockLocalStorage = {
  getItem: jest.fn().mockReturnValue(null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

const mockSessionStorage = {
  getItem: jest.fn().mockReturnValue(null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(global, 'localStorage', { value: mockLocalStorage, configurable: true });
Object.defineProperty(global, 'sessionStorage', { value: mockSessionStorage, configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: mockSessionStorage, configurable: true });

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', { value: mockLocalStorage, configurable: true });
  Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage, configurable: true });
}

global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

// ============================================================================
// IMPORTAR MÓDULO
// ============================================================================

jest.resetModules();
const apiClient = require('../../../../../public/services/common/api-client.js');

// ============================================================================
// TESTS
// ============================================================================

describe('api-client.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockSessionStorage.getItem.mockReturnValue(null);
  });

  describe('getAuthHeaders', () => {
    it('debe retornar headers con token', () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      const headers = apiClient.getAuthHeaders();
      
      expect(headers).toEqual({
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      });
    });

    it('debe retornar solo Content-Type si no hay token y includeContentType es true', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const headers = apiClient.getAuthHeaders({ includeContentType: true });
      
      expect(headers).toEqual({
        'Content-Type': 'application/json'
      });
    });

    it('debe retornar objeto vacío si no hay token y includeContentType es false', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const headers = apiClient.getAuthHeaders({ includeContentType: false });
      
      expect(headers).toEqual({});
    });

    it('debe retornar headers sin Content-Type si includeContentType es false', () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      const headers = apiClient.getAuthHeaders({ includeContentType: false });
      
      expect(headers).toEqual({
        'Authorization': 'Bearer test-token'
      });
    });
  });

  describe('handleApiError', () => {
    it('debe manejar error 401 limpiando storage y redirigiendo', async () => {
      const mockResponse = {
        status: 401,
        json: async () => ({ error: 'Unauthorized' })
      };

      await expect(apiClient.handleApiError(mockResponse, 'test')).rejects.toThrow('No autorizado');
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('role');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('userName');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('userId');
    });

    it('debe manejar otros errores HTTP', async () => {
      const mockResponse = {
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' })
      };

      const error = await apiClient.handleApiError(mockResponse, 'test');
      
      expect(error.status).toBe(500);
      expect(error.statusText).toBe('Internal Server Error');
      expect(error.message).toBe('Server error');
    });
  });

  describe('get', () => {
    it('debe hacer petición GET exitosa', async () => {
      const mockData = { id: 1, name: 'Test' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      mockLocalStorage.getItem.mockReturnValue('test-token');

      const result = await apiClient.get('/api/test');

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      );
    });
  });

  describe('post', () => {
    it('debe hacer petición POST exitosa', async () => {
      const mockData = { success: true };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      mockLocalStorage.getItem.mockReturnValue('test-token');

      const result = await apiClient.post('/api/test', { name: 'Test' });

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ name: 'Test' })
        })
      );
    });
  });

  describe('put', () => {
    it('debe hacer petición PUT exitosa', async () => {
      const mockData = { success: true };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      mockLocalStorage.getItem.mockReturnValue('test-token');

      const result = await apiClient.put('/api/test/1', { name: 'Updated' });

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test/1',
        expect.objectContaining({
          method: 'PUT'
        })
      );
    });
  });

  describe('delete', () => {
    it('debe hacer petición DELETE exitosa', async () => {
      const mockData = { success: true };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      mockLocalStorage.getItem.mockReturnValue('test-token');

      const result = await apiClient.del('/api/test/1');

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test/1',
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });
  });

  describe('fetchWithAuth', () => {
    it('debe hacer petición con autenticación', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      mockLocalStorage.getItem.mockReturnValue('test-token');

      const response = await apiClient.fetchWithAuth('/api/test', {
        method: 'GET',
        requireAuth: true
      });

      expect(response.ok).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      );
    });

    it('debe serializar body automáticamente si es objeto', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      mockLocalStorage.getItem.mockReturnValue('test-token');

      await apiClient.fetchWithAuth('/api/test', {
        method: 'POST',
        body: { name: 'Test' }
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Test' })
        })
      );
    });
  });
});

