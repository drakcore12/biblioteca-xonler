// /js/common/guard.js - Sistema de autenticación y navegación mejorado

const SESSION_TIMEOUT_MS   = 30 * 60 * 1000; // 30 min
const WARNING_BEFORE_MS    = 60 * 1000;      // aviso 1 min antes
const LAST_ACTIVITY_KEY    = 'lastActivity';
const LOGOUT_REASON_KEY    = 'logoutReason';
const TOKEN_KEYS           = ['token'];
const ROLE_KEYS            = ['role'];
const CLOCK_SKEW_S         = 30; // 30 segundos de tolerancia para exp

// Helper para obtener runtime de forma segura
function getRuntime() {
  if (typeof globalThis === 'undefined') {
    return {};
  }
  return globalThis;
}
const runtime = getRuntime();
const runtimeLocation = runtime?.location;

const ROUTES = {
  login: '/pages/guest/login.html',
  user: '/pages/user/index.html',
  admin: '/pages/admin/index.html',
};

let warningTimer = null;
let logoutTimer  = null;
let setupDone    = false;

function now() { return Date.now(); }

function pickStorage() {
  return localStorage.getItem('token') ? localStorage : sessionStorage;
}

function hasToken() {
  return TOKEN_KEYS.some(k => localStorage.getItem(k) || sessionStorage.getItem(k));
}

function readLastActivity() {
  return Number.parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || sessionStorage.getItem(LAST_ACTIVITY_KEY) || '0', 10);
}

function writeLastActivity(ts = now()) {
  const s = pickStorage();
  s.setItem(LAST_ACTIVITY_KEY, String(ts));
}

function minutes(ms) { return Math.max(0, Math.floor(ms / 60000)); }

function isProbablyJwt(t) { return typeof t === 'string' && t.split('.').length === 3; }

function b64urlDecode(str) {
  try {
    const pad = s => s + '='.repeat((4 - (s.length % 4)) % 4);
    const base64 = pad(str.replaceAll('-', '+').replaceAll('_', '/'));
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, c => c.codePointAt(0));
    return new TextDecoder('utf-8').decode(bytes);
  } catch { return null; }
}

function decodeJwt(t) {
  try {
    const p = t.split('.');
    if (p.length !== 3) return null;
    const payload = b64urlDecode(p[1]);
    return payload ? JSON.parse(payload) : null;
  } catch { return null; }
}

function jwtExpired() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token || !isProbablyJwt(token)) return false;
  const payload = decodeJwt(token);
  if (!payload || typeof payload.exp !== 'number') return false;
  // Aplicar clock skew para tolerar desfases de reloj
  return Math.floor(now() / 1000) >= (payload.exp - CLOCK_SKEW_S);
}

function clearSession(reason = 'inactivity') {
  for (const store of [localStorage, sessionStorage]) {
    for (const k of TOKEN_KEYS.concat(ROLE_KEYS, [LAST_ACTIVITY_KEY])) {
      store.removeItem(k);
    }
  }
  try { 
    localStorage.setItem(LOGOUT_REASON_KEY, reason); 
  } catch (error) {
    // Ignorar errores de localStorage (puede estar bloqueado)
    console.warn('No se pudo guardar razón de logout:', error);
  }
}

function redirectToLogin() {
  if (runtimeLocation?.replace) {
    runtimeLocation.replace(ROUTES.login);
  }
}

function scheduleTimers() {
  // Limpia timers previos
  if (warningTimer) clearTimeout(warningTimer);
  if (logoutTimer)  clearTimeout(logoutTimer);

  const last = readLastActivity();
  if (!last) {
    writeLastActivity();
    console.log('📝 [GUARD] Inicializando lastActivity');
  }

  const elapsed = now() - readLastActivity();
  const remaining = SESSION_TIMEOUT_MS - elapsed;

  // Si ya se venció
  if (remaining <= 0 || jwtExpired()) {
    console.warn('⚠️ [GUARD] Sesión expirada:', {
      remaining: remaining,
      jwtExpired: jwtExpired(),
      reason: jwtExpired() ? 'jwt_expired' : 'inactivity'
    });
    clearSession(jwtExpired() ? 'jwt_expired' : 'inactivity');
    redirectToLogin();
    return;
  }

  // Aviso previo (opcional)
  if (WARNING_BEFORE_MS > 0 && remaining > WARNING_BEFORE_MS) {
    warningTimer = setTimeout(() => {
      console.warn('⚠️ Tu sesión está por expirar por inactividad en ~1 minuto.');
    }, remaining - WARNING_BEFORE_MS);
  }

  // Logout al vencer
  logoutTimer = setTimeout(() => {
    if (jwtExpired()) {
      clearSession('jwt_expired');
    } else {
      clearSession('inactivity');
    }
    redirectToLogin();
  }, remaining);
}

function recordActivity() {
  if (!hasToken()) return;
  writeLastActivity();
  scheduleTimers();
}

function setupActivityMonitoring() {
  if (setupDone) return;
  setupDone = true;

  const events = ['mousedown','mousemove','keypress','scroll','touchstart','click','visibilitychange'];
  const handler = () => {
    if (document.visibilityState === 'visible') recordActivity();
  };
  for (const ev of events) {
    document.addEventListener(ev, handler, { passive: true });
  }

  // Sincroniza multi-pestaña
  if (typeof runtime.addEventListener === 'function') {
    runtime.addEventListener('storage', (e) => {
      if (e.key === LAST_ACTIVITY_KEY) scheduleTimers();
      if (e.key === LOGOUT_REASON_KEY) {
        redirectToLogin();
      }
    });
  }

  // Arranque: si hay token, arma timers
  if (hasToken()) {
    if (!readLastActivity()) writeLastActivity();
    scheduleTimers();
  }
}

// ====== API para guards ======

// Para páginas públicas (login, inicio) - rebota si ya está autenticado
export async function requireAnon() {
  // Si no hay token → puede ver login
  if (!hasToken()) return;
  
  // Si token vencido, limpia y deja ver login
  if (jwtExpired()) {
    clearSession('jwt_expired');
    return;
  }

  // Solo redirigir si estás en una página pública (login, inicio)
  // NO redirigir si ya estás en páginas de usuario o admin
  const currentPath = runtimeLocation?.pathname ?? '';
  const isPublicPage = currentPath.includes('/pages/guest/') || currentPath === '/' || currentPath === '/index.html';
  
  if (!isPublicPage) {
    // Si ya estás en una página protegida, no hacer nada
    return;
  }

  // Prefiere rol del token sobre localStorage
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const payload = decodeJwt(token) || {};
  const role = (payload.role || localStorage.getItem('role') || sessionStorage.getItem('role') || 'usuario').toLowerCase();

  const dest = (role === 'admin' || role === 'adminadvanced') ? ROUTES.admin : ROUTES.user;
  console.log('🔄 Usuario ya autenticado en página pública, redirigiendo a:', dest);
  if (runtimeLocation?.replace) {
    runtimeLocation.replace(dest);
  }
}

// Para páginas protegidas - requiere autenticación
export async function requireAuth() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const hasTokenResult = hasToken();
  const expired = jwtExpired();
  
  console.log('🔒 [GUARD] requireAuth verificación:', {
    pathname: runtimeLocation?.pathname ?? '',
    hasToken: hasTokenResult,
    tokenExists: !!token,
    tokenLength: token?.length,
    tokenPreview: token ? `${token.substring(0, 30)}...` : 'null',
    jwtExpired: expired,
    localStorageToken: !!localStorage.getItem('token'),
    sessionStorageToken: !!sessionStorage.getItem('token'),
    localStorageRole: localStorage.getItem('role'),
    sessionStorageRole: sessionStorage.getItem('role')
  });
  
  if (!hasTokenResult) {
    console.warn('⚠️ [GUARD] No se encontró token, redirigiendo a login');
    const pathname = runtimeLocation?.pathname ?? '';
    if (pathname !== ROUTES.login) {
      const current = pathname + (runtimeLocation?.search ?? '');
      if (runtimeLocation?.replace) {
        runtimeLocation.replace(`${ROUTES.login}?next=${encodeURIComponent(current)}`);
      }
    }
    return;
  }
  if (expired) {
    console.warn('⚠️ [GUARD] Token expirado, limpiando sesión y redirigiendo');
    clearSession('jwt_expired');
    redirectToLogin();
    return;
  }
  // Re-armar timers por si llegaste directo aquí
  scheduleTimers();
  console.log('✅ [GUARD] Autenticación exitosa');
}

// Para páginas con rol específico
export async function requireRole(expected) {
  await requireAuth();
  if (!hasToken()) return;
  
  // Prefiere rol del token
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const payload = decodeJwt(token) || {};
  const role = (payload.role || localStorage.getItem('role') || sessionStorage.getItem('role') || 'usuario').toLowerCase();
  
  console.log('🔍 [ROLE CHECK] Verificando rol:', {
    expected: expected.toLowerCase(),
    actual: role,
    currentPath: runtimeLocation?.pathname ?? '',
    tokenRole: payload.role,
    localStorageRole: localStorage.getItem('role'),
    sessionStorageRole: sessionStorage.getItem('role'),
    token: token ? `${token.substring(0, 50)}...` : 'No encontrado',
    payload: payload
  });
  
  if (role !== expected.toLowerCase()) {
    const dest = (role === 'admin' || role === 'adminadvanced') ? ROUTES.admin : ROUTES.user;
    if ((runtimeLocation?.pathname ?? '') !== dest) {
      console.log('🔄 Rol incorrecto, redirigiendo a:', dest);
      if (runtimeLocation?.replace) {
        runtimeLocation.replace(dest);
      }
    }
  }
}

// Función para logout limpio
export function doLogout() {
  console.log('🚪 Cerrando sesión...');
  clearSession('manual_logout');
  if (runtimeLocation?.replace) {
    runtimeLocation.replace(ROUTES.login); // replace para que atrás no vuelva a la protegida
  }
}

// ====== bootstrap ======
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupActivityMonitoring, { once: true });
  } else {
    setupActivityMonitoring();
  }
}