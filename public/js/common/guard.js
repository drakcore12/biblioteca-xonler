// /js/common/guard.js

// 🔧 Cambia a 'cookie' cuando tu backend exponga /api/session
const AUTH_MODE = 'storage'; // 'storage' | 'cookie'

const ROUTES = {
  login: '/pages/guest/login.html',
  user: '/pages/user/index.html',
  admin: '/pages/admin/index.html',
  adminAdvanced: '/pages/adminAdvanced/index.html',
};

// ---- Lectura de sesión (storage) ----
function getStorageSession() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const roleRaw = localStorage.getItem('role') || sessionStorage.getItem('role');
  const role = roleRaw ? roleRaw.toLowerCase() : null;
  
  // 👈 Acepta sesión si hay token O rol (más flexible)
  const authenticated = !!(token || role);
  
  return { authenticated, role };
}

// ---- Lectura de sesión (cookie httpOnly) ----
async function getServerSession() {
  try {
    const r = await fetch('/api/session', { credentials: 'include' });
    if (!r.ok) return { authenticated: false, role: null }; // 404/401/etc → sin sesión
    const j = await r.json(); // { authenticated:boolean, role?:string }
    return j.authenticated
      ? { authenticated: true, role: (j.role || 'usuario').toLowerCase() }
      : { authenticated: false, role: null };
  } catch {
    return { authenticated: false, role: null };
  }
}

// ---- Selector de modo ----
async function getSession() {
  if (AUTH_MODE === 'storage') return getStorageSession();
  // cookie
  const s = await getServerSession();
  // Si falla el endpoint en dev, NO hagas ruido; trata como anónimo
  return s;
}

// ---- Guards ----
export async function requireAnon() {
  const s = await getSession();
  if (!s.authenticated) return; // anónimo: puede ver login

  const dest = s.role === 'admin' ? ROUTES.admin
             : s.role === 'adminadvanced' ? ROUTES.adminAdvanced
             : ROUTES.user;

  if (window.location.pathname !== dest) window.location.replace(dest);
}

export async function requireAuth() {
  const s = await getSession();
  if (s.authenticated) return;

  if (window.location.pathname === ROUTES.login) return; // evita loop
  const current = window.location.pathname + window.location.search;
  window.location.replace(`${ROUTES.login}?next=${encodeURIComponent(current)}`);
}

export async function requireRole(expected) {
  const s = await getSession();
  if (!s.authenticated) return; // requireAuth redirige
  if (s.role === expected.toLowerCase()) return;

  const dest = s.role === 'admin' ? ROUTES.admin
             : s.role === 'adminadvanced' ? ROUTES.adminAdvanced
             : ROUTES.user;
  if (window.location.pathname !== dest) window.location.replace(dest);
}
