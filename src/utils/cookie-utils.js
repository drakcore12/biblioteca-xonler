// src/utils/cookie-utils.js
// Utilidades para manejo seguro de cookies

/**
 * Establece una cookie segura con todas las protecciones necesarias
 * @param {Object} res - Objeto response de Express
 * @param {string} name - Nombre de la cookie
 * @param {string} value - Valor de la cookie
 * @param {Object} options - Opciones adicionales para la cookie
 */
function setSecureCookie(res, name, value, options = {}) {
  const defaultOptions = {
    httpOnly: true,        // No accesible vía JavaScript (protección XSS)
    secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
    sameSite: 'strict',    // Protección CSRF (más estricto que 'lax')
    maxAge: 24 * 60 * 60 * 1000, // 24 horas por defecto
    path: '/',             // Disponible en toda la aplicación
    domain: process.env.COOKIE_DOMAIN || undefined // Dominio específico si se define
  };
  
  const cookieOptions = { ...defaultOptions, ...options };
  
  // Validar que el valor no sea demasiado largo
  if (value && value.length > 4096) {
    console.warn('⚠️ [COOKIE] Valor de cookie muy largo, truncando...');
    value = value.substring(0, 4096);
  }
  
  res.cookie(name, value, cookieOptions);
  
  console.log('🍪 [COOKIE] Cookie segura establecida:', {
    name,
    hasValue: !!value,
    valueLength: value ? value.length : 0,
    options: {
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      maxAge: cookieOptions.maxAge,
      path: cookieOptions.path
    }
  });
}

/**
 * Limpia una cookie segura
 * @param {Object} res - Objeto response de Express
 * @param {string} name - Nombre de la cookie a limpiar
 */
function clearSecureCookie(res, name) {
  const clearOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    domain: process.env.COOKIE_DOMAIN || undefined,
    maxAge: 0 // Expirar inmediatamente
  };
  
  res.clearCookie(name, clearOptions);
  
  console.log('🗑️ [COOKIE] Cookie limpiada:', {
    name,
    options: clearOptions
  });
}

/**
 * Establece múltiples cookies de autenticación de forma segura
 * @param {Object} res - Objeto response de Express
 * @param {Object} authData - Datos de autenticación
 * @param {boolean} remember - Si debe recordar la sesión por más tiempo
 */
function setAuthCookies(res, authData, remember = false) {
  const { token, user } = authData;
  
  if (!token) {
    console.error('❌ [COOKIE] No se puede establecer cookie de auth sin token');
    return false;
  }
  
  // Cookie principal con el JWT
  setSecureCookie(res, 'authToken', token, {
    maxAge: remember ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000 // 7 días o 1 día
  });
  
  // Cookie con información básica del usuario (sin datos sensibles)
  if (user) {
    const userInfo = {
      id: user.id,
      role: user.role || user.rol,
      name: user.nombre || user.name
    };
    
    setSecureCookie(res, 'userInfo', JSON.stringify(userInfo), {
      maxAge: remember ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
    });
  }
  
  console.log('🔐 [COOKIE] Cookies de autenticación establecidas:', {
    hasToken: !!token,
    hasUser: !!user,
    remember,
    tokenLength: token.length
  });
  
  return true;
}

/**
 * Limpia todas las cookies de autenticación
 * @param {Object} res - Objeto response de Express
 */
function clearAuthCookies(res) {
  clearSecureCookie(res, 'authToken');
  clearSecureCookie(res, 'userInfo');
  
  console.log('🧹 [COOKIE] Todas las cookies de autenticación limpiadas');
}

/**
 * Verifica si las cookies están configuradas correctamente
 * @param {Object} req - Objeto request de Express
 * @returns {Object} Estado de las cookies
 */
function checkCookieStatus(req) {
  const hasAuthToken = !!req.cookies?.authToken;
  const hasUserInfo = !!req.cookies?.userInfo;
  
  return {
    hasAuthToken,
    hasUserInfo,
    cookiesPresent: hasAuthToken || hasUserInfo,
    cookieCount: Object.keys(req.cookies || {}).length
  };
}

module.exports = {
  setSecureCookie,
  clearSecureCookie,
  setAuthCookies,
  clearAuthCookies,
  checkCookieStatus
};
