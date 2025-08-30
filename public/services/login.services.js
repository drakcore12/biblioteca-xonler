export function initLoginForm() {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  // --- util toast ---
  function showToastError(msg) {
    const el = document.getElementById('loginToast');
    const body = document.getElementById('loginToastBody');
    if (!el || !body || !window.bootstrap) return;
    body.textContent = msg || 'Ocurrió un error.';
    new bootstrap.Toast(el).show();
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const remember = document.getElementById('rememberMe')?.checked ?? false;

    const btn = loginForm.querySelector('button[type="submit"]');
    const prev = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Ingresando...';

    try {
      const res = await fetch('/api/usuarios/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // credentials: 'include', // si usas cookie httpOnly en el backend
        body: JSON.stringify({ email, password })
      });

      let data = {};
      try { data = await res.json(); } catch { /* puede no venir JSON en 401 */ }

      if (!res.ok || !data?.success) {
        showToastError(data?.error || 'Credenciales incorrectas');
        return;
      }

      // Normaliza rol y persiste sesión (modo storage)
      const role = (data.role || 'usuario').toLowerCase();
      const storage = remember ? localStorage : sessionStorage;

      // ✅ ARREGLADO: Solo usar token real del backend
      if (!data.token) {
        showToastError('Error: El servidor no devolvió un token válido');
        return;
      }
      
      storage.setItem('token', data.token);
      storage.setItem('role', role);
      if (data.userName) storage.setItem('userName', data.userName);
      if (data.userId) storage.setItem('userId', data.userId);

      // Redirección segura respetando ?next=
      const params = new URLSearchParams(window.location.search);
      const nextRaw = params.get('next');
      if (nextRaw) {
        try {
          const nextURL = new URL(nextRaw, window.location.origin);
          const isSameOrigin = nextURL.origin === window.location.origin;
          const isLogin = nextURL.pathname === '/pages/guest/login.html';
          if (isSameOrigin && !isLogin) {
            window.location.replace(nextURL.href);
            return;
          }
        } catch { /* ignore */ }
      }
      if (role === 'admin') return window.location.replace('/pages/admin/index.html');
      if (role === 'adminadvanced') return window.location.replace('/pages/adminAdvanced/index.html');
      window.location.replace('/pages/user/index.html');

    } catch (err) {
      console.error(err);
      showToastError('Error al conectar con el servidor.');
    } finally {
      btn.disabled = false;
      btn.textContent = prev;
    }
  });
}
