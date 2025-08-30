// /js/common/guard.js (versión solo por inactividad)

const SESSION_TIMEOUT_MS   = 30 * 60 * 1000; // 30 min (ajusta)
const WARNING_BEFORE_MS    = 60 * 1000;      // aviso 1 min antes (0 = sin aviso)
const LAST_ACTIVITY_KEY    = 'lastActivity';
const LOGOUT_REASON_KEY    = 'logoutReason';
const TOKEN_KEYS           = ['token'];      // agrega más si usas sessionStorage
const ROLE_KEYS            = ['role'];

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
  // Si tienes token en localStorage úsalo; si no, sessionStorage
  return localStorage.getItem('token') ? localStorage : sessionStorage;
}

function hasToken() {
  return TOKEN_KEYS.some(k => localStorage.getItem(k) || sessionStorage.getItem(k));
}

function readLastActivity() {
  return parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || sessionStorage.getItem(LAST_ACTIVITY_KEY) || '0', 10);
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
    const base64 = pad(str.replace(/-/g, '+').replace(/_/g, '/'));
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
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
  return Math.floor(now() / 1000) >= payload.exp;
}

function clearSession(reason = 'inactivity') {
  [localStorage, sessionStorage].forEach(store => {
    TOKEN_KEYS.concat(ROLE_KEYS, [LAST_ACTIVITY_KEY]).forEach(k => store.removeItem(k));
  });
  try { localStorage.setItem(LOGOUT_REASON_KEY, reason); } catch {}
}

function redirectToLogin() {
  window.location.replace(ROUTES.login);
}

function scheduleTimers() {
  // Limpia timers previos
  if (warningTimer) clearTimeout(warningTimer);
  if (logoutTimer)  clearTimeout(logoutTimer);

  const last = readLastActivity();
  if (!last) {
    // Si no hay actividad almacenada, inicializa ahora
    writeLastActivity();
  }

  const elapsed = now() - readLastActivity();
  const remaining = SESSION_TIMEOUT_MS - elapsed;

  // Si ya se venció
  if (remaining <= 0 || jwtExpired()) {
    clearSession(jwtExpired() ? 'jwt_expired' : 'inactivity');
    redirectToLogin();
    return;
  }

  // Aviso previo (opcional)
  if (WARNING_BEFORE_MS > 0 && remaining > WARNING_BEFORE_MS) {
    warningTimer = setTimeout(() => {
      console.warn('⚠️ Tu sesión está por expirar por inactividad en ~1 minuto.');
      // Aquí puedes disparar un modal/Toast para que el usuario haga clic y renueve actividad.
      // Ej.: mostrarToast('Tu sesión está por expirar...')
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
  if (!hasToken()) return; // no hay sesión
  writeLastActivity();
  scheduleTimers();
}

function setupActivityMonitoring() {
  if (setupDone) return;
  setupDone = true;

  const events = ['mousedown','mousemove','keypress','scroll','touchstart','click','visibilitychange'];
  const handler = () => {
    // Solo contar actividad si el documento está visible (evita "ticks" en segundo plano)
    if (document.visibilityState === 'visible') recordActivity();
  };
  events.forEach(ev => document.addEventListener(ev, handler, { passive: true }));

  // Sincroniza multi-pestaña: si otra pestaña actualiza lastActivity, recalculamos
  window.addEventListener('storage', (e) => {
    if (e.key === LAST_ACTIVITY_KEY) scheduleTimers();
    if (e.key === LOGOUT_REASON_KEY) {
      // Si otra pestaña hizo logout, esta también redirige
      redirectToLogin();
    }
  });

  // Arranque: si hay token, arma timers; si no, no hace nada
  if (hasToken()) {
    if (!readLastActivity()) writeLastActivity();
    scheduleTimers();
  }
}

// ====== API para guards ======
export async function requireAnon() {
  // Si no hay token → puede ver login
  if (!hasToken()) return;
  // Hay token: si expira por JWT o inactividad, forzar salida
  if (jwtExpired()) {
    clearSession('jwt_expired');
    return; // permitirá que la página actual muestre login si corresponde
  }
  // Redirige según rol almacenado (si gustas)
  const role = (localStorage.getItem('role') || sessionStorage.getItem('role') || 'usuario').toLowerCase();
  const dest = (role === 'admin' || role === 'adminadvanced') ? ROUTES.admin : ROUTES.user;
  if (window.location.pathname !== dest) window.location.replace(dest);
}

export async function requireAuth() {
  if (!hasToken()) {
    if (window.location.pathname !== ROUTES.login) {
      const current = window.location.pathname + window.location.search;
      window.location.replace(`${ROUTES.login}?next=${encodeURIComponent(current)}`);
    }
    return;
  }
  if (jwtExpired()) {
    clearSession('jwt_expired');
    redirectToLogin();
    return;
  }
  // Re-armar timers por si llegaste directo aquí
  scheduleTimers();
}

export async function requireRole(expected) {
  await requireAuth();
  if (!hasToken()) return;
  const role = (localStorage.getItem('role') || sessionStorage.getItem('role') || 'usuario').toLowerCase();
  if (role !== expected.toLowerCase()) {
    const dest = (role === 'admin' || role === 'adminadvanced') ? ROUTES.admin : ROUTES.user;
    if (window.location.pathname !== dest) window.location.replace(dest);
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
