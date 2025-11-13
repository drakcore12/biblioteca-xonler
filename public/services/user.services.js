// Config sencillo: storage vs cookie
const AUTH_MODE = 'storage'; // 'storage' | 'cookie'

// --- headers/auth comunes ---
function authHeaders() {
  if (AUTH_MODE === 'cookie') return {}; // cookie httpOnly → no Bearer
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

function handleAuthFailure(res) {
  if (res.status === 401) {
    // sesión inválida/expirada → limpiar y volver a login
    for (const s of ['localStorage', 'sessionStorage']) {
      const st = globalThis?.[s];
      if (!st) continue;
      st.removeItem('token');
      st.removeItem('role');
      st.removeItem('userName');
      st.removeItem('userId');
    }
    const runtimeLocation = globalThis?.location;
    const current = `${runtimeLocation?.pathname ?? ''}${runtimeLocation?.search ?? ''}`;
    runtimeLocation?.replace?.(`/pages/guest/login.html?next=${encodeURIComponent(current)}`);
    return true;
  }
  return false;
}

// --- fetch con autenticación unificado ---
async function aFetch(input, init = {}) {
  const headers = new Headers(init.headers || {});
  // añade Authorization cuando toque
  const extra = authHeaders();
  for (const [k, v] of Object.entries(extra)) {
    headers.set(k, v);
  }
  // solo setea content-type en métodos con body
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const opts = { ...init, headers };
  if (AUTH_MODE === 'cookie') opts.credentials = 'include';

  const res = await fetch(input, opts);
  if (handleAuthFailure(res)) throw new Error('No autorizado');
  return res;
}

// --- userId: primero storage, luego JWT, nunca hardcode ---
function obtenerUserId() {
  // 1) guardado en login
  const stored = localStorage.getItem('userId') || sessionStorage.getItem('userId');
  if (stored) return stored;

  // 2) decodificar JWT (base64url)
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) return null;
  try {
    if (token.includes('.')) {
      const payloadPart = token.split('.')[1];
      const payload = JSON.parse(base64UrlDecode(payloadPart));
      return payload.user_id || payload.id || payload.sub || null;
    }
  } catch (e) {
    console.warn('⚠️ No se pudo decodificar JWT:', e);
  }
  return null; // ❌ no inventes "1"
}

// base64url → string
function base64UrlDecode(s) {
  s = s.replaceAll('-', '+').replaceAll('_', '/');
  const pad = s.length % 4; // pad =
  if (pad) s += '='.repeat(4 - pad);
  // NOSONAR S1874: escape() es necesario para decodificar correctamente caracteres especiales en base64
  // decodeURIComponent requiere que escape() convierta caracteres especiales primero
  // Alternativa moderna no funciona igual para todos los casos de base64
  return decodeURIComponent(escape(atob(s))); // NOSONAR
}

// --- endpoints de usuario ---
// ✅ ARREGLADO: Mejor manejo de errores para /me y fallback
async function fetchUsuarioActual() {
  // Preferir /me si existe:
  try {
    const r = await aFetch('/api/usuarios/me');
    if (r.ok) return await r.json();
    
    // ✅ ARREGLADO: Si no es 401 y falla, probamos fallback por id
    if (r.status !== 401) {
      console.warn(`⚠️ /api/usuarios/me falló con status ${r.status}, usando fallback`);
      throw new Error(`HTTP ${r.status}`);
    }
  } catch (e) { 
    // ✅ ARREGLADO: Solo fallback si no es error de autenticación
    if (e.message?.includes('No autorizado')) {
      throw e; // Re-lanzar errores de auth
    }
    console.log('🔄 Usando fallback por ID de usuario');
  }

  const userId = obtenerUserId();
  if (!userId) {
    console.warn('⚠️ No se pudo obtener userId para fallback');
    return null;
  }

  console.log(`🔄 Intentando fallback con /api/usuarios/${userId}`);
  const res = await aFetch(`/api/usuarios/${userId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

// === Reemplaza tus funciones usando aFetch y el userId correcto ===
export async function cargarDatosUsuario() {
  try {
    const usuario = await fetchUsuarioActual();
    console.log('📚 Usuario cargado:', usuario);
    return usuario;
  } catch (e) {
    console.error('❌ Error cargando datos del usuario:', e);
    return null;
  }
}

// ✅ ARREGLADO: Función para mostrar alertas
export function mostrarAlerta(tipo, mensaje, duracion = 5000) {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${tipo} alert-dismissible fade show`;
  alertDiv.innerHTML = `
    ${mensaje}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  // Insertar antes del primer card
  const firstCard = document.querySelector('.card');
  if (firstCard) {
    firstCard.parentNode.insertBefore(alertDiv, firstCard);
  } else {
    // Fallback: insertar en el body
    document.body.insertBefore(alertDiv, document.body.firstChild);
  }
  
  // Auto-remover después del tiempo especificado
  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.remove();
    }
  }, duracion);
  
  return alertDiv;
}

/**
 * Valida el formato de email
 * @param {string} email - Email a validar
 * @returns {boolean} True si es válido
 */
function validateEmailFormat(email) {
  const trimmedEmail = email.trim();
  if (trimmedEmail.length > 254 || trimmedEmail.length < 3) {
    return false;
  }
  const parts = trimmedEmail.split('@');
  if (parts.length !== 2) {
    return false;
  }
  const [localPart, domainPart] = parts;
  if (!localPart || localPart.length === 0 || localPart.length > 64 ||
      !domainPart || domainPart.length === 0 || domainPart.length > 253) {
    return false;
  }
  const localRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  return localRegex.test(localPart) && domainRegex.test(domainPart);
}

/**
 * Valida el formato de teléfono
 * @param {string} phone - Teléfono a validar
 * @returns {boolean} True si es válido
 */
function validatePhoneFormat(phone) {
  const trimmedPhone = phone.trim();
  if (trimmedPhone.length > 20 || trimmedPhone.length < 8) {
    return false;
  }
  const phoneRegex = /^\+?\d[\d\s\-()]{6,19}$/;
  return phoneRegex.test(trimmedPhone);
}

/**
 * Valida el nombre
 * @param {string} nombre - Nombre a validar
 * @returns {boolean} True si es válido
 */
function validateNombre(nombre) {
  return nombre && nombre.trim().length >= 2;
}

// ✅ ARREGLADO: Función para validar formularios
export function validarFormularioPerfil(formData) {
  const errores = [];
  
  if (!validateNombre(formData.nombre)) {
    errores.push('El nombre debe tener al menos 2 caracteres');
  }
  
  // Validación segura de email (evita ReDoS)
  if (!formData.email || typeof formData.email !== 'string' || !validateEmailFormat(formData.email)) {
    errores.push('El email debe ser válido');
  }
  
  // Validación segura de teléfono (evita ReDoS)
  if (formData.telefono && typeof formData.telefono === 'string') {
    if (!validatePhoneFormat(formData.telefono)) {
      errores.push('El teléfono debe ser válido');
    }
  }
  
  return errores;
}

// ✅ ARREGLADO: Función para validar cambio de contraseña
export function validarCambioPassword(formData) {
  const errores = [];
  
  if (!formData.passwordActual) {
    errores.push('La contraseña actual es requerida');
  }
  
  if (!formData.passwordNueva || formData.passwordNueva.length < 8) {
    errores.push('La nueva contraseña debe tener al menos 8 caracteres');
  }
  
  if (formData.passwordNueva !== formData.passwordConfirmar) {
    errores.push('Las contraseñas no coinciden');
  }
  
  return errores;
}

// ✅ ARREGLADO: Función para limpiar formularios
export function limpiarFormularios() {
  const forms = ['perfilForm', 'passwordForm', 'notificacionesForm', 'preferenciasForm'];
  
  for (const formId of forms) {
    const form = document.getElementById(formId);
    if (form) {
      form.reset();
    }
  }
  
  console.log('🧹 Formularios limpiados');
}

export async function cargarPerfilCompleto() {
  try {
    const usuario = await fetchUsuarioActual();
    if (!usuario) return null;
    return {
      ...usuario,
      // ✅ ARREGLADO: Usar TODOS los campos disponibles en la base de datos
      apellido: usuario.apellido || '',
      telefono: usuario.telefono || '',
      fechaNacimiento: usuario.fecha_nacimiento || '',
      genero: usuario.genero || '',
      direccion: usuario.direccion || '',
      ciudad: usuario.ciudad || '',
      codigoPostal: usuario.codigo_postal || '',
      // ✅ ARREGLADO: Usar preferencias reales de la base de datos
      idioma: usuario.preferencias?.idioma || 'es',
      tema: usuario.preferencias?.tema || 'auto',
      tamanoFuente: usuario.preferencias?.tamanoFuente || 'medium',
      maxResultados: usuario.preferencias?.maxResultados || '20',
      categoriasFavoritas: usuario.preferencias?.categoriasFavoritas || ['ficcion','ciencia'],
      emailPrestamos: usuario.preferencias?.emailPrestamos ?? true,
      emailNuevosLibros: usuario.preferencias?.emailNuevosLibros ?? true,
      emailEventos: usuario.preferencias?.emailEventos ?? false,
      appPrestamos: usuario.preferencias?.appPrestamos ?? true,
      appRecomendaciones: usuario.preferencias?.appRecomendaciones ?? true,
      appMantenimiento: usuario.preferencias?.appMantenimiento ?? false
    };
  } catch (e) {
    console.error('❌ Error cargando perfil completo:', e);
    return null;
  }
}

export async function actualizarPerfil(datosPerfil) {
  try {
    // ✅ ARREGLADO: Enviar TODOS los campos disponibles en la base de datos
    const perfilData = {
      nombre: datosPerfil.nombre,
      apellido: datosPerfil.apellido || null,
      email: datosPerfil.email,
      telefono: datosPerfil.telefono || null,
      fecha_nacimiento: datosPerfil.fechaNacimiento || null,
      genero: datosPerfil.genero || null,
      direccion: datosPerfil.direccion || null,
      ciudad: datosPerfil.ciudad || null,
      codigo_postal: datosPerfil.codigoPostal || null
    };

    // usa /me si existe
    let res = await aFetch('/api/usuarios/me', { 
      method: 'PUT', 
      body: JSON.stringify(perfilData)
    });
    
    if (res.status === 404) {
      const id = obtenerUserId(); 
      if (!id) throw new Error('Sin userId');
      res = await aFetch(`/api/usuarios/${id}`, { 
        method: 'PUT', 
        body: JSON.stringify(perfilData)
      });
    }
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { success: true, data: await res.json() };
  } catch (e) {
    console.error('❌ Error actualizando perfil:', e);
    return { success: false, error: e.message };
  }
}

export async function cambiarContraseña(datosPassword) {
  try {
    // endpoint moderno
    let res = await aFetch('/api/usuarios/me/password', {
      method: 'PUT',
      body: JSON.stringify({
        password_actual: datosPassword.passwordActual,
        password_nueva: datosPassword.passwordNueva
      })
    });
    if (res.status === 404) {
      const id = obtenerUserId(); if (!id) throw new Error('Sin userId');
      res = await aFetch(`/api/usuarios/${id}/password`, {
        method: 'PUT',
        body: JSON.stringify({
          password_actual: datosPassword.passwordActual,
          password_nueva: datosPassword.passwordNueva
        })
      });
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return { success: true, data: await res.json() };
  } catch (e) {
    console.error('❌ Error cambiando contraseña:', e);
    return { success: false, error: e.message };
  }
}

export async function guardarPreferencias(preferencias) {
  try {
    console.log('🔍 Guardando preferencias:', preferencias);
    const res = await aFetch('/api/usuarios/me/preferencias', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ preferencias })
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${res.status}`);
    }
    
    const data = await res.json();
    console.log('✅ Preferencias guardadas:', data);
    return { success: true, data };
  } catch (e) {
    console.error('❌ Error guardando preferencias:', e);
    return { success: false, error: e.message };
  }
}
