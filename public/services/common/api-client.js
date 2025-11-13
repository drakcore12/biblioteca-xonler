/**
 * Cliente API común para servicios
 * Proporciona funciones reutilizables para hacer peticiones HTTP autenticadas
 */

/**
 * Obtener headers de autenticación
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.requireAuth - Si es true, redirige al login si no hay token
 * @param {boolean} options.includeContentType - Si es true, incluye Content-Type
 * @returns {Object} Headers de autenticación
 */
export function getAuthHeaders(options = {}) {
  const { requireAuth = false, includeContentType = true } = options;
  
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  if (!token) {
    if (requireAuth) {
      console.warn('⚠️ No se encontró token de autenticación - redirigiendo al login');
      globalThis?.location?.replace?.('/pages/guest/login.html');
      return {};
    }
    return includeContentType ? { 'Content-Type': 'application/json' } : {};
  }
  
  const headers = {
    'Authorization': `Bearer ${token}`
  };
  
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
}

/**
 * Manejar errores de respuesta de API
 * @param {Response} response - Respuesta de fetch
 * @param {string} context - Contexto del error (para logging)
 * @returns {Promise<Object>} Datos de error parseados
 */
export async function handleApiError(response, context = 'api-call') {
  if (response.status === 401) {
    // Sesión inválida/expirada - limpiar y redirigir
    for (const storage of ['localStorage', 'sessionStorage']) {
      const st = globalThis?.[storage];
      if (!st) continue;
      st.removeItem('token');
      st.removeItem('role');
      st.removeItem('userName');
      st.removeItem('userId');
    }
    const current = `${globalThis?.location?.pathname ?? ''}${globalThis?.location?.search ?? ''}`;
    globalThis?.location?.replace?.(`/pages/guest/login.html?next=${encodeURIComponent(current)}`);
    throw new Error('No autorizado');
  }
  
  try {
    const errorData = await response.json().catch(() => ({}));
    return {
      status: response.status,
      statusText: response.statusText,
      message: errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`,
      data: errorData
    };
  } catch (error) {
    console.error(`[${context}] Error parsing API response:`, error);
    return {
      status: response.status,
      statusText: response.statusText,
      message: `Error ${response.status}: ${response.statusText}`,
      data: {}
    };
  }
}

/**
 * Realizar petición fetch con autenticación automática
 * @param {string} url - URL de la petición
 * @param {Object} options - Opciones de fetch
 * @param {boolean} options.requireAuth - Si es true, requiere autenticación
 * @param {Object} options.body - Cuerpo de la petición (se serializa automáticamente)
 * @returns {Promise<Response>} Respuesta de fetch
 */
export async function fetchWithAuth(url, options = {}) {
  const { requireAuth = true, body, ...fetchOptions } = options;
  
  const headers = getAuthHeaders({ requireAuth, includeContentType: !!body });
  
  const config = {
    ...fetchOptions,
    headers: {
      ...headers,
      ...fetchOptions.headers
    }
  };
  
  if (body && typeof body === 'object') {
    config.body = JSON.stringify(body);
  } else if (body) {
    config.body = body;
  }
  
  const response = await fetch(url, config);
  
  if (!response.ok) {
    const error = await handleApiError(response, 'fetchWithAuth');
    throw new Error(error.message);
  }
  
  return response;
}

/**
 * Realizar petición GET con autenticación
 * @param {string} url - URL de la petición
 * @param {Object} params - Parámetros de consulta
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Object>} Datos parseados de la respuesta
 */
export async function get(url, params = {}, options = {}) {
  const queryString = new URLSearchParams(params).toString();
  const fullUrl = queryString ? `${url}?${queryString}` : url;
  
  const response = await fetchWithAuth(fullUrl, {
    method: 'GET',
    requireAuth: options.requireAuth !== false,
    ...options
  });
  
  return await response.json();
}

/**
 * Realizar petición POST con autenticación
 * @param {string} url - URL de la petición
 * @param {Object} data - Datos a enviar
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Object>} Datos parseados de la respuesta
 */
export async function post(url, data = {}, options = {}) {
  const response = await fetchWithAuth(url, {
    method: 'POST',
    body: data,
    requireAuth: options.requireAuth !== false,
    ...options
  });
  
  return await response.json();
}

/**
 * Realizar petición PUT con autenticación
 * @param {string} url - URL de la petición
 * @param {Object} data - Datos a enviar
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Object>} Datos parseados de la respuesta
 */
export async function put(url, data = {}, options = {}) {
  const response = await fetchWithAuth(url, {
    method: 'PUT',
    body: data,
    requireAuth: options.requireAuth !== false,
    ...options
  });
  
  return await response.json();
}

/**
 * Realizar petición DELETE con autenticación
 * @param {string} url - URL de la petición
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Object>} Datos parseados de la respuesta
 */
export async function del(url, options = {}) {
  const response = await fetchWithAuth(url, {
    method: 'DELETE',
    requireAuth: options.requireAuth !== false,
    ...options
  });
  
  return await response.json();
}

