/**
 * @jest-environment jsdom
 */

// ============================================================================
// CONFIGURAR TODOS LOS MOCKS GLOBALES ANTES de cargar el módulo
// ============================================================================

// Mock de fetch
global.fetch = jest.fn();

// Mock de Storage
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

// Asignar usando Object.defineProperty
Object.defineProperty(global, 'localStorage', { 
  value: mockLocalStorage, 
  configurable: true
});

Object.defineProperty(global, 'sessionStorage', { 
  value: mockSessionStorage, 
  configurable: true
});

Object.defineProperty(globalThis, 'localStorage', { 
  value: mockLocalStorage, 
  configurable: true
});

Object.defineProperty(globalThis, 'sessionStorage', { 
  value: mockSessionStorage, 
  configurable: true
});

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    configurable: true
  });
  
  Object.defineProperty(window, 'sessionStorage', {
    value: mockSessionStorage,
    configurable: true
  });
}

// Mock de console
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

// Mock de location para evitar error de navegación en jsdom
// Se debe hacer ANTES de cargar el módulo porque el servicio usa this.runtime.location
const mockLocation = {
  replace: jest.fn(),
  href: '',
  pathname: '',
  search: '',
  hash: '',
};
Object.defineProperty(global, 'location', {
  value: mockLocation,
  configurable: true,
  writable: true,
});
if (typeof globalThis !== 'undefined') {
  Object.defineProperty(globalThis, 'location', {
    value: mockLocation,
    configurable: true,
    writable: true,
  });
}
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'location', {
    value: mockLocation,
    configurable: true,
    writable: true,
  });
}

// ============================================================================
// IMPORTAR MÓDULO
// ============================================================================

// El módulo no exporta la clase directamente, crea una instancia singleton
// Necesitamos cargar el módulo para que cree la instancia en globalThis
// Babel transformará el ES module a CommonJS
// Usar jest.resetModules() para asegurar que el módulo se carga limpio
jest.resetModules();
require('../../../../public/services/auth.services.js');

// La clase AuthService está definida en el módulo pero no exportada
// El módulo crea una instancia en globalThis.authService
// Para los tests, usaremos esa instancia o crearemos una nueva

// ============================================================================
// TESTS
// ============================================================================

describe('auth.services.js', () => {
  let authService;

  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    
    // Resetear valores por defecto
    mockLocalStorage.getItem.mockReturnValue(null);
    mockSessionStorage.getItem.mockReturnValue(null);
    
    // El módulo crea una instancia singleton en globalThis.authService
    // Usar esa instancia para los tests
    authService = globalThis.authService;
    
    // Si no existe, el módulo debería haberla creado al cargar
    if (!authService) {
      throw new Error('authService no está disponible en globalThis');
    }
  });

  describe('getToken', () => {
    it('debe retornar token de localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('test-token-123');
      const token = authService.getToken();
      expect(token).toBe('test-token-123');
    });

    it('debe retornar token de sessionStorage si no hay en localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockSessionStorage.getItem.mockReturnValue('session-token-456');
      const token = authService.getToken();
      expect(token).toBe('session-token-456');
    });

    it('debe retornar null si no hay token', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockSessionStorage.getItem.mockReturnValue(null);
      const token = authService.getToken();
      expect(token).toBeNull();
    });
  });

  describe('getRole', () => {
    it('debe retornar role de localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('admin');
      const role = authService.getRole();
      expect(role).toBe('admin');
    });

    it('debe retornar role de sessionStorage si no hay en localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockSessionStorage.getItem.mockReturnValue('user');
      const role = authService.getRole();
      expect(role).toBe('user');
    });
  });

  describe('getUserId', () => {
    it('debe retornar userId de localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('123');
      const userId = authService.getUserId();
      expect(userId).toBe('123');
    });
  });

  describe('getUserName', () => {
    it('debe retornar userName de localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('John Doe');
      const userName = authService.getUserName();
      expect(userName).toBe('John Doe');
    });
  });

  describe('isAuthenticated', () => {
    it('debe retornar true si hay token', () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('debe retornar false si no hay token', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockSessionStorage.getItem.mockReturnValue(null);
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('debe retornar true si el usuario tiene el rol especificado', () => {
      mockLocalStorage.getItem.mockReturnValue('admin');
      expect(authService.hasRole('admin')).toBe(true);
    });

    it('debe retornar true si el usuario es admin (tiene acceso a todo)', () => {
      mockLocalStorage.getItem.mockReturnValue('admin');
      expect(authService.hasRole('user')).toBe(true);
    });

    it('debe retornar false si el usuario no tiene el rol', () => {
      mockLocalStorage.getItem.mockReturnValue('user');
      expect(authService.hasRole('admin')).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('debe retornar true si el usuario es admin', () => {
      mockLocalStorage.getItem.mockReturnValue('admin');
      expect(authService.isAdmin()).toBe(true);
    });

    it('debe retornar false si el usuario no es admin', () => {
      mockLocalStorage.getItem.mockReturnValue('user');
      expect(authService.isAdmin()).toBe(false);
    });
  });

  describe('logout', () => {
    it('debe limpiar todos los datos de autenticación', () => {
      // Nota: location.replace ya está mockeado globalmente antes de cargar el módulo
      // El test verifica que se limpian los datos de storage, que es la funcionalidad principal
      // La redirección se probará en tests de integración/E2E
      
      authService.logout();
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('role');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('userId');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('userName');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('role');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('userId');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('userName');
    });
  });

  describe('getRuntime', () => {
    it('debe retornar globalThis si está disponible', () => {
      const runtime = authService.getRuntime();
      expect(runtime).toBeDefined();
    });
  });

  describe('getAuthHeaders', () => {
    it('debe retornar headers con token', () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      const headers = authService.getAuthHeaders();
      expect(headers).toEqual({
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      });
    });

    it('debe retornar objeto vacío si no hay token', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockSessionStorage.getItem.mockReturnValue(null);
      const headers = authService.getAuthHeaders();
      expect(headers).toEqual({});
    });
  });

  describe('isSupAdmin', () => {
    it('debe retornar true si el usuario es supadmin', () => {
      mockLocalStorage.getItem.mockReturnValue('supadmin');
      expect(authService.isSupAdmin()).toBe(true);
    });

    it('debe retornar false si el usuario no es supadmin', () => {
      mockLocalStorage.getItem.mockReturnValue('user');
      expect(authService.isSupAdmin()).toBe(false);
    });
  });

  describe('login', () => {
    it('debe hacer login exitosamente', async () => {
      const mockResponse = {
        success: true,
        token: 'new-token',
        role: 'user',
        userId: '123',
        userName: 'Test User'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await authService.login('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
        })
      );
    });

    it('debe manejar error en login', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: 'Credenciales inválidas' })
      });

      const result = await authService.login('test@example.com', 'wrong-password');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('register', () => {
    it('debe registrar usuario exitosamente', async () => {
      const mockResponse = {
        success: true,
        token: 'new-token',
        role: 'user',
        userId: '123',
        userName: 'Test User'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const userData = {
        nombre: 'Test',
        apellido: 'User',
        email: 'test@example.com',
        password: 'password123'
      };

      const result = await authService.register(userData);

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/register',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        })
      );
    });
  });

  describe('saveSession', () => {
    it('debe guardar sesión en localStorage si remember es true', () => {
      const data = {
        token: 'test-token',
        role: 'admin',
        userId: '123',
        userName: 'Test User'
      };

      authService.saveSession(data, true);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'test-token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('role', 'admin');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('userId', '123');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('userName', 'Test User');
    });

    it('debe guardar sesión en sessionStorage si remember es false', () => {
      const data = {
        token: 'test-token',
        role: 'user',
        userId: '456',
        userName: 'Another User'
      };

      authService.saveSession(data, false);

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('token', 'test-token');
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('role', 'user');
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('userId', '456');
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('userName', 'Another User');
    });
  });

  describe('debugAuth', () => {
    it('debe retornar información de autenticación', () => {
      mockLocalStorage.getItem
        .mockReturnValueOnce('test-token')
        .mockReturnValueOnce('admin')
        .mockReturnValueOnce('123')
        .mockReturnValueOnce('Test User')
        .mockReturnValueOnce('test-token'); // Para la verificación de storage

      const result = authService.debugAuth();

      expect(result.token).toBe('test-token');
      expect(result.role).toBe('admin');
      expect(result.userId).toBe('123');
      expect(result.userName).toBe('Test User');
    });
  });

  describe('refreshToken', () => {
    it('debe refrescar token exitosamente', async () => {
      mockLocalStorage.getItem.mockReturnValue('old-token');
      const mockResponse = {
        token: 'new-token'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await authService.refreshToken();

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/refresh',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer old-token'
          })
        })
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'new-token');
    });

    it('debe manejar error al refrescar token', async () => {
      mockLocalStorage.getItem.mockReturnValue('old-token');

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      const result = await authService.refreshToken();

      expect(result).toBe(false);
      expect(mockLocalStorage.removeItem).toHaveBeenCalled(); // logout fue llamado
    });

    it('debe retornar false si no hay token', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = await authService.refreshToken();

      expect(result).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('debe obtener usuario actual exitosamente', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      const mockUser = { id: 1, nombre: 'Test User' };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      });

      const result = await authService.getCurrentUser();

      expect(result).toEqual(mockUser);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/me',
        expect.objectContaining({
          headers: expect.any(Object)
        })
      );
    });

    it('debe intentar refrescar token si recibe 401', async () => {
      mockLocalStorage.getItem.mockReturnValue('expired-token');
      
      // Primera llamada: 401
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });
      
      // Refresh token exitoso
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'new-token' })
      });
      
      // Segunda llamada a getCurrentUser con nuevo token
      const mockUser = { id: 1, nombre: 'Test User' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      });

      const result = await authService.getCurrentUser();

      expect(result).toEqual(mockUser);
      expect(global.fetch).toHaveBeenCalledTimes(3); // 401 + refresh + getCurrentUser
    });

    it('debe retornar null en caso de error', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const result = await authService.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('debe retornar true si no hay token', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      expect(authService.isTokenExpired()).toBe(true);
    });

    it('debe retornar true si el token está expirado', () => {
      // Crear un token JWT expirado (exp en el pasado)
      const expiredPayload = { exp: Math.floor(Date.now() / 1000) - 3600 }; // 1 hora atrás
      const expiredToken = 'header.' + btoa(JSON.stringify(expiredPayload)) + '.signature';
      
      mockLocalStorage.getItem.mockReturnValue(expiredToken);
      expect(authService.isTokenExpired()).toBe(true);
    });

    it('debe retornar false si el token no está expirado', () => {
      // Crear un token JWT válido (exp en el futuro)
      const validPayload = { exp: Math.floor(Date.now() / 1000) + 3600 }; // 1 hora adelante
      const validToken = 'header.' + btoa(JSON.stringify(validPayload)) + '.signature';
      
      mockLocalStorage.getItem.mockReturnValue(validToken);
      expect(authService.isTokenExpired()).toBe(false);
    });

    it('debe retornar true si el token es inválido', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-token');
      expect(authService.isTokenExpired()).toBe(true);
    });
  });

  describe('ensureValidToken', () => {
    it('debe refrescar token si está expirado', async () => {
      // Token expirado
      const expiredPayload = { exp: Math.floor(Date.now() / 1000) - 3600 };
      const expiredToken = 'header.' + btoa(JSON.stringify(expiredPayload)) + '.signature';
      
      mockLocalStorage.getItem
        .mockReturnValueOnce(expiredToken) // Para isTokenExpired
        .mockReturnValueOnce(expiredToken); // Para refreshToken

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'new-token' })
      });

      const result = await authService.ensureValidToken();

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('debe retornar true si el token es válido', async () => {
      // Token válido
      const validPayload = { exp: Math.floor(Date.now() / 1000) + 3600 };
      const validToken = 'header.' + btoa(JSON.stringify(validPayload)) + '.signature';
      
      mockLocalStorage.getItem.mockReturnValue(validToken);

      const result = await authService.ensureValidToken();

      expect(result).toBe(true);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});

