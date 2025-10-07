// Servicio para Super Administrador
class SupAdminService {
  constructor() {
    this.baseURL = '/api';
  }

  // Headers de autenticación
  getAuthHeaders() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    console.log('🔍 [SUPADMIN SERVICE] Obteniendo headers de autenticación:', {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      tokenStart: token ? token.substring(0, 20) + '...' : 'none'
    });
    
    if (!token) {
      console.warn('⚠️ No se encontró token de autenticación');
      // Redirigir al login si no hay token
      window.location.replace('/pages/guest/login.html');
      return {};
    }
    
    return { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // ===== GESTIÓN DE USUARIOS =====

  // Obtener todos los usuarios del sistema
  async obtenerUsuarios(filtros = {}) {
    try {
      const params = new URLSearchParams();
      if (filtros.rol) params.append('rol', filtros.rol);
      if (filtros.busqueda) params.append('busqueda', filtros.busqueda);
      if (filtros.limit) params.append('limit', filtros.limit);
      if (filtros.offset) params.append('offset', filtros.offset);

      const response = await fetch(`${this.baseURL}/usuarios?${params}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      throw error;
    }
  }

  // Obtener usuario por ID
  async obtenerUsuarioPorId(id) {
    try {
      const response = await fetch(`${this.baseURL}/usuarios/${id}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      throw error;
    }
  }

  // Crear nuevo usuario
  async crearUsuario(datos) {
    try {
      const response = await fetch(`${this.baseURL}/usuarios`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(datos)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Error ${response.status}: ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creando usuario:', error);
      throw error;
    }
  }

  // Actualizar usuario existente
  async actualizarUsuario(id, datos) {
    try {
      const response = await fetch(`${this.baseURL}/usuarios/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(datos)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Error ${response.status}: ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      throw error;
    }
  }

  // Eliminar usuario
  async eliminarUsuario(id) {
    try {
      const response = await fetch(`${this.baseURL}/usuarios/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Error ${response.status}: ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      throw error;
    }
  }

  // Obtener roles disponibles
  async obtenerRoles() {
    try {
      const response = await fetch(`${this.baseURL}/roles`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo roles:', error);
      throw error;
    }
  }

  // ===== GESTIÓN DE BIBLIOTECAS =====

  // Obtener todas las bibliotecas del sistema
  async obtenerBibliotecas(filtros = {}) {
    try {
      const params = new URLSearchParams();
      if (filtros.colegio) params.append('colegio', filtros.colegio);
      if (filtros.busqueda) params.append('busqueda', filtros.busqueda);
      if (filtros.limit) params.append('limit', filtros.limit);
      if (filtros.offset) params.append('offset', filtros.offset);

      const response = await fetch(`${this.baseURL}/bibliotecas?${params}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo bibliotecas:', error);
      throw error;
    }
  }

  // Obtener biblioteca por ID
  async obtenerBibliotecaPorId(id) {
    try {
      const response = await fetch(`${this.baseURL}/bibliotecas/${id}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo biblioteca:', error);
      throw error;
    }
  }

  // Crear nueva biblioteca
  async crearBiblioteca(datos) {
    try {
      const response = await fetch(`${this.baseURL}/bibliotecas`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(datos)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Error ${response.status}: ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creando biblioteca:', error);
      throw error;
    }
  }

  // Actualizar biblioteca existente
  async actualizarBiblioteca(id, datos) {
    try {
      const response = await fetch(`${this.baseURL}/bibliotecas/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(datos)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Error ${response.status}: ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error actualizando biblioteca:', error);
      throw error;
    }
  }

  // Eliminar biblioteca
  async eliminarBiblioteca(id) {
    try {
      const response = await fetch(`${this.baseURL}/bibliotecas/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Error ${response.status}: ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error eliminando biblioteca:', error);
      throw error;
    }
  }

  // Obtener colegios disponibles
  async obtenerColegios() {
    try {
      const response = await fetch(`${this.baseURL}/colegios`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo colegios:', error);
      throw error;
    }
  }

  // Cambiar rol de usuario
  async cambiarRolUsuario(id, nuevoRolId) {
    try {
      const response = await fetch(`${this.baseURL}/usuarios/${id}/rol`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ rol_id: nuevoRolId })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error cambiando rol de usuario:', error);
      throw error;
    }
  }

  // ===== GESTIÓN DE BIBLIOTECAS =====

  // Obtener todas las bibliotecas
  async obtenerBibliotecas(filtros = {}) {
    try {
      const params = new URLSearchParams();
      if (filtros.busqueda) params.append('busqueda', filtros.busqueda);
      if (filtros.colegio_id) params.append('colegio_id', filtros.colegio_id);
      if (filtros.limit) params.append('limit', filtros.limit);
      if (filtros.offset) params.append('offset', filtros.offset);

      const response = await fetch(`${this.baseURL}/bibliotecas?${params}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo bibliotecas:', error);
      throw error;
    }
  }

  // Obtener biblioteca por ID
  async obtenerBibliotecaPorId(id) {
    try {
      const response = await fetch(`${this.baseURL}/bibliotecas/${id}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo biblioteca:', error);
      throw error;
    }
  }

  // Crear nueva biblioteca
  async crearBiblioteca(datosBiblioteca) {
    try {
      const response = await fetch(`${this.baseURL}/bibliotecas`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(datosBiblioteca)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creando biblioteca:', error);
      throw error;
    }
  }

  // Actualizar biblioteca
  async actualizarBiblioteca(id, datosBiblioteca) {
    try {
      const response = await fetch(`${this.baseURL}/bibliotecas/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(datosBiblioteca)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error actualizando biblioteca:', error);
      throw error;
    }
  }

  // Eliminar biblioteca
  async eliminarBiblioteca(id) {
    try {
      const response = await fetch(`${this.baseURL}/bibliotecas/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error eliminando biblioteca:', error);
      throw error;
    }
  }

  // Asignar administrador a biblioteca
  async asignarAdminBiblioteca(usuarioId, bibliotecaId) {
    try {
      const response = await fetch(`${this.baseURL}/admin-bibliotecas`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          usuario_id: usuarioId,
          biblioteca_id: bibliotecaId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error asignando admin a biblioteca:', error);
      throw error;
    }
  }

  // Remover administrador de biblioteca
  async removerAdminBiblioteca(usuarioId, bibliotecaId) {
    try {
      const response = await fetch(`${this.baseURL}/admin-bibliotecas/${usuarioId}/${bibliotecaId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error removiendo admin de biblioteca:', error);
      throw error;
    }
  }

  // ===== GESTIÓN DE COLEGIOS =====

  // Obtener todos los colegios
  async obtenerColegios() {
    try {
      const response = await fetch(`${this.baseURL}/colegios`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo colegios:', error);
      throw error;
    }
  }

  // Crear nuevo colegio
  async crearColegio(datosColegio) {
    try {
      const response = await fetch(`${this.baseURL}/colegios`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(datosColegio)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creando colegio:', error);
      throw error;
    }
  }

  // ===== ROLES =====

  // Obtener todos los roles
  async obtenerRoles() {
    try {
      const response = await fetch(`${this.baseURL}/roles`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo roles:', error);
      throw error;
    }
  }

  // ===== ESTADÍSTICAS GLOBALES =====

  // Obtener estadísticas globales del sistema
  async obtenerEstadisticasGlobales() {
    try {
      const headers = this.getAuthHeaders();
      console.log('🔍 [SUPADMIN SERVICE] Haciendo petición a estadísticas:', {
        url: `${this.baseURL}/supadmin/estadisticas`,
        headers: headers
      });
      
      const response = await fetch(`${this.baseURL}/supadmin/estadisticas`, {
        headers: headers
      });
      
      console.log('🔍 [SUPADMIN SERVICE] Respuesta recibida:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [SUPADMIN SERVICE] Error en respuesta:', errorData);
        throw new Error(`Error ${response.status}: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ [SUPADMIN SERVICE] Datos recibidos:', data);
      return data;
    } catch (error) {
      console.error('Error obteniendo estadísticas globales:', error);
      throw error;
    }
  }

  // Obtener actividad reciente del sistema
  async obtenerActividadReciente(filtros = {}) {
    try {
      const params = new URLSearchParams();
      if (filtros.limit) params.append('limit', filtros.limit);
      if (filtros.tipo) params.append('tipo', filtros.tipo);

      const response = await fetch(`${this.baseURL}/supadmin/actividad?${params}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo actividad reciente:', error);
      throw error;
    }
  }

  // ===== LOGS Y AUDITORÍA =====

  // Obtener logs del sistema
  async obtenerLogs(filtros = {}) {
    try {
      const params = new URLSearchParams();
      if (filtros.tipo) params.append('tipo', filtros.tipo);
      if (filtros.nivel) params.append('nivel', filtros.nivel);
      if (filtros.fecha_desde) params.append('fecha_desde', filtros.fecha_desde);
      if (filtros.fecha_hasta) params.append('fecha_hasta', filtros.fecha_hasta);
      if (filtros.limit) params.append('limit', filtros.limit);
      if (filtros.offset) params.append('offset', filtros.offset);

      const response = await fetch(`${this.baseURL}/supadmin/logs?${params}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo logs:', error);
      throw error;
    }
  }

  // ===== MONITOREO DE SEGURIDAD =====

  // Obtener métricas de seguridad
  async obtenerMetricasSeguridad() {
    try {
      const response = await fetch(`${this.baseURL}/security/monitoring/simple`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo métricas de seguridad:', error);
      throw error;
    }
  }

  // Ejecutar backup del sistema
  async ejecutarBackup() {
    try {
      const response = await fetch(`${this.baseURL}/security/backup`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error ejecutando backup:', error);
      throw error;
    }
  }

  // Rotar claves JWT
  async rotarClavesJWT() {
    try {
      const response = await fetch(`${this.baseURL}/security/rotate-jwt`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error rotando claves JWT:', error);
      throw error;
    }
  }
}

// Instancia singleton del servicio
const supadminService = new SupAdminService();

// Hacer disponible globalmente
window.supadminService = supadminService;
