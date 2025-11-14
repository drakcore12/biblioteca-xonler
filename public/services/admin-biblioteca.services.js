const API_BASE_URL = 'http://localhost:3000/api';

class AdminBibliotecaService {
  constructor() {
    this.token = localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Si es error de autenticación, limpiar tokens y redirigir
        if (response.status === 401) {
          console.warn('🔐 Token inválido detectado, limpiando sesión...');
          localStorage.clear();
          sessionStorage.clear();
          alert('Sesión expirada. Serás redirigido al login.');
          globalThis?.location?.replace?.('/pages/guest/login.html');
          return;
        }
        throw new Error(data.error || 'Error en la petición');
      }

      return data;
    } catch (error) {
      console.error('Error en AdminBibliotecaService:', error);
      throw error;
    }
  }

  // ===== INFORMACIÓN DE BIBLIOTECA =====
  
  /**
   * Obtener información de la biblioteca asignada al administrador
   */
  async obtenerBibliotecaAsignada() {
    return this.makeRequest('/admin/biblioteca');
  }

  /**
   * Obtener estadísticas de la biblioteca
   */
  async obtenerEstadisticas() {
    return this.makeRequest('/admin/estadisticas');
  }

  // ===== GESTIÓN DE LIBROS =====

  /**
   * Obtener libros de la biblioteca con filtros
   * @param {Object} filtros - Filtros de búsqueda
   * @param {string} filtros.q - Término de búsqueda
   * @param {string} filtros.categoria - Categoría del libro
   * @param {string} filtros.disponibilidad - 'disponibles', 'prestados', o null
   * @param {number} filtros.limit - Límite de resultados
   * @param {number} filtros.offset - Offset para paginación
   */
  async obtenerLibros(filtros = {}) {
    const params = new URLSearchParams();
    
    for (const [key, value] of Object.entries(filtros)) {
      if (value === null || value === undefined || value === '') continue;
      params.append(key, value);
    }

    const queryString = params.toString();
    const queryPart = queryString ? `?${queryString}` : '';
    const endpoint = `/admin/libros${queryPart}`;
    
    return this.makeRequest(endpoint);
  }

  /**
   * Agregar libro a la biblioteca
   * @param {number} libro_id - ID del libro a agregar
   */
  async agregarLibro(libro_id) {
    return this.makeRequest('/admin/libros', {
      method: 'POST',
      body: JSON.stringify({ libro_id })
    });
  }

  /**
   * Remover libro de la biblioteca
   * @param {number} biblioteca_libro_id - ID de la relación biblioteca-libro
   */
  async removerLibro(biblioteca_libro_id) {
    return this.makeRequest(`/admin/libros/${biblioteca_libro_id}`, {
      method: 'DELETE'
    });
  }

  /**
   * Crear nuevo libro
   * @param {Object} datosLibro - Datos del libro a crear
   */
  async crearLibro(datosLibro) {
    return this.makeRequest('/admin/libros/crear', {
      method: 'POST',
      body: JSON.stringify(datosLibro)
    });
  }

  // ===== GESTIÓN DE PRÉSTAMOS =====

  /**
   * Obtener préstamos de la biblioteca
   * @param {Object} filtros - Filtros de búsqueda
   * @param {string} filtros.estado - 'todos', 'activos', 'devueltos', 'vencidos'
   * @param {number} filtros.limit - Límite de resultados
   * @param {number} filtros.offset - Offset para paginación
   */
  async obtenerPrestamos(filtros = {}) {
    const params = new URLSearchParams();
    
    for (const [key, value] of Object.entries(filtros)) {
      if (value === null || value === undefined || value === '') continue;
      params.append(key, value);
    }

    const queryString = params.toString();
    const queryPart = queryString ? `?${queryString}` : '';
    const endpoint = `/admin/prestamos${queryPart}`;
    
    return this.makeRequest(endpoint);
  }

  /**
   * Marcar préstamo como devuelto
   * @param {number} prestamo_id - ID del préstamo
   */
  async marcarPrestamoDevuelto(prestamo_id) {
    return this.makeRequest(`/admin/prestamos/${prestamo_id}/devolver`, {
      method: 'PATCH'
    });
  }

  // ===== MÉTODOS DE UTILIDAD =====

  /**
   * Obtener todos los libros disponibles para agregar a la biblioteca
   * @param {Object} filtros - Filtros de búsqueda
   */
  async obtenerTodosLosLibros(filtros = {}) {
    const params = new URLSearchParams();
    
    for (const [key, value] of Object.entries(filtros)) {
      if (value === null || value === undefined || value === '') continue;
      params.append(key, value);
    }

    const queryString = params.toString();
    const queryPart = queryString ? `?${queryString}` : '';
    const endpoint = `/libros${queryPart}`;
    
    return this.makeRequest(endpoint);
  }

  /**
   * Obtener categorías disponibles
   */
  async obtenerCategorias() {
    try {
      const response = await this.obtenerTodosLosLibros({ limit: 1000 });
      const categorias = [...new Set(response.data.map(libro => libro.categoria))];
      return categorias.sort((a, b) => (a || '').localeCompare(b || ''));
    } catch (error) {
      console.error('Error obteniendo categorías:', error);
      return [];
    }
  }

  /**
   * Formatear fecha para mostrar
   * @param {string} fecha - Fecha en formato ISO
   */
  formatearFecha(fecha) {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-ES');
  }

  /**
   * Obtener estado del préstamo con clase CSS
   * @param {Object} prestamo - Objeto préstamo
   */
  obtenerEstadoPrestamo(prestamo) {
    if (prestamo.fecha_devolucion) {
      return { texto: 'Devuelto', clase: 'success' };
    }
    
    const fechaPrestamo = new Date(prestamo.fecha_prestamo);
    const diasTranscurridos = Math.floor((Date.now() - fechaPrestamo.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diasTranscurridos > 15) {
      return { texto: 'Vencido', clase: 'danger' };
    } else if (diasTranscurridos > 10) {
      return { texto: 'Por vencer', clase: 'warning' };
    } else {
      return { texto: 'Activo', clase: 'success' };
    }
  }

  /**
   * Calcular días de retraso
   * @param {string} fechaPrestamo - Fecha del préstamo
   */
  calcularDiasRetraso(fechaPrestamo) {
    const fecha = new Date(fechaPrestamo);
    const diasTranscurridos = Math.floor((Date.now() - fecha.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diasTranscurridos - 15);
  }
}

// Hacer la clase disponible globalmente para tests
if (typeof globalThis !== 'undefined') {
  globalThis.AdminBibliotecaService = AdminBibliotecaService;
}

// Crear instancia global
globalThis.adminBibliotecaService = new AdminBibliotecaService();
