// Servicio unificado de autenticación
export class AuthService {
  constructor() {
    this.baseURL = '/api';
    this.tokenKey = 'token';
    this.roleKey = 'role';
    this.userIdKey = 'userId';
    this.userNameKey = 'userName';
  }

  // Obtener token de autenticación
  getToken() {
    return localStorage.getItem(this.tokenKey) || sessionStorage.getItem(this.tokenKey);
  }

  // Obtener rol del usuario
  getRole() {
    return localStorage.getItem(this.roleKey) || sessionStorage.getItem(this.roleKey);
  }

  // Obtener ID del usuario
  getUserId() {
    return localStorage.getItem(this.userIdKey) || sessionStorage.getItem(this.userIdKey);
  }

  // Obtener nombre del usuario
  getUserName() {
    return localStorage.getItem(this.userNameKey) || sessionStorage.getItem(this.userNameKey);
  }

  // Verificar si el usuario está autenticado
  isAuthenticated() {
    return !!this.getToken();
  }

  // Verificar si el usuario tiene un rol específico
  hasRole(role) {
    const userRole = this.getRole();
    return userRole === role || userRole === 'admin';
  }

  // Verificar si el usuario es admin
  isAdmin() {
    return this.hasRole('admin');
  }

  // Headers de autenticación para las peticiones
  getAuthHeaders() {
    const token = this.getToken();
    if (!token) {
      console.warn('⚠️ No se encontró token de autenticación');
      return {};
    }
    
    return { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Iniciar sesión
  async login(email, password, remember = false) {
    try {
      const response = await fetch(`${this.baseURL}/usuarios/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error en la autenticación');
      }

      // Guardar datos de sesión
      this.saveSession(data, remember);
      
      return { success: true, data };
      
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, error: error.message };
    }
  }

  // Registrar usuario
  async register(userData) {
    try {
      const response = await fetch(`${this.baseURL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error en el registro');
      }

      // Guardar datos de sesión si el registro incluye login automático
      if (data.token) {
        this.saveSession(data, false);
      }
      
      return { success: true, data };
      
    } catch (error) {
      console.error('Error en registro:', error);
      return { success: false, error: error.message };
    }
  }

  // Cerrar sesión
  logout() {
    // Limpiar almacenamiento local y de sesión
    [localStorage, sessionStorage].forEach(storage => {
      storage.removeItem(this.tokenKey);
      storage.removeItem(this.roleKey);
      storage.removeItem(this.userIdKey);
      storage.removeItem(this.userNameKey);
    });
    
    // Redirigir al login
    window.location.href = '/pages/guest/login.html';
  }

  // Guardar datos de sesión
  saveSession(data, remember = false) {
    const storage = remember ? localStorage : sessionStorage;
    
    if (data.token) {
      storage.setItem(this.tokenKey, data.token);
    }
    
    if (data.role) {
      storage.setItem(this.roleKey, data.role.toLowerCase());
    }
    
    if (data.userId) {
      storage.setItem(this.userIdKey, data.userId);
    }
    
    if (data.userName) {
      storage.setItem(this.userNameKey, data.userName);
    }
    
    console.log('🔐 Sesión guardada:', {
      role: data.role,
      userId: data.userId,
      userName: data.userName,
      storage: remember ? 'localStorage' : 'sessionStorage'
    });
  }

  // Refrescar token
  async refreshToken() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No hay token para refrescar');
      }

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.token) {
        // Actualizar token en el mismo storage donde estaba
        const storage = localStorage.getItem(this.tokenKey) ? localStorage : sessionStorage;
        storage.setItem(this.tokenKey, data.token);
        console.log('🔄 Token refrescado');
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('Error refrescando token:', error);
      // Si falla el refresh, cerrar sesión
      this.logout();
      return false;
    }
  }

  // Obtener perfil del usuario actual
  async getCurrentUser() {
    try {
      const response = await fetch(`${this.baseURL}/usuarios/me`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expirado, intentar refresh
          const refreshed = await this.refreshToken();
          if (refreshed) {
            // Reintentar con el nuevo token
            return this.getCurrentUser();
          }
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
      
    } catch (error) {
      console.error('Error obteniendo usuario actual:', error);
      return null;
    }
  }

  // Verificar si el token está expirado
  isTokenExpired() {
    const token = this.getToken();
    if (!token) return true;
    
    try {
      // Decodificar JWT para verificar expiración
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      return payload.exp < currentTime;
    } catch (error) {
      console.warn('Error decodificando token:', error);
      return true;
    }
  }

  // Auto-refresh del token si es necesario
  async ensureValidToken() {
    if (this.isTokenExpired()) {
      console.log('🔄 Token expirado, intentando refresh...');
      return await this.refreshToken();
    }
    return true;
  }

  // Debug de autenticación
  debugAuth() {
    const token = this.getToken();
    const role = this.getRole();
    const userId = this.getUserId();
    const userName = this.getUserName();
    
    console.log('🔍 Debug de autenticación:', {
      token: token ? `${token.substring(0, 20)}...` : 'No encontrado',
      role: role || 'No encontrado',
      userId: userId || 'No encontrado',
      userName: userName || 'No encontrado',
      isAuthenticated: this.isAuthenticated(),
      isAdmin: this.isAdmin(),
      storage: {
        local: !!localStorage.getItem(this.tokenKey),
        session: !!sessionStorage.getItem(this.tokenKey)
      }
    });
    
    return { token, role, userId, userName };
  }
}

// Instancia singleton del servicio
export const authService = new AuthService();

// Funciones de conveniencia para uso directo
export const {
  login,
  register,
  logout,
  isAuthenticated,
  hasRole,
  isAdmin,
  getCurrentUser,
  getAuthHeaders,
  debugAuth
} = authService;
