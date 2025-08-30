export function initLoginForm() {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  // ✅ NUEVO: Inicializar validación de contraseña en tiempo real
  initPasswordValidation();

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

      console.log('📋 [LOGIN] Respuesta del backend:', data);

      if (!res.ok) {
        showToastError(data?.error || 'Credenciales incorrectas');
        return;
      }

      // Normaliza rol y persiste sesión (modo storage)
      const role = (data.user?.rol || data.role || 'usuario').toLowerCase();
      const storage = remember ? localStorage : sessionStorage;

      // ✅ ARREGLADO: Solo usar token real del backend
      if (!data.token) {
        showToastError('Error: El servidor no devolvió un token válido');
        return;
      }
      
      storage.setItem('token', data.token);
      storage.setItem('role', role);
      if (data.user?.nombre) storage.setItem('userName', data.user.nombre);
      if (data.user?.id) storage.setItem('userId', data.user.id);

      console.log('🔐 [LOGIN] Datos de sesión guardados:', {
        role: role,
        userName: data.user?.nombre,
        userId: data.user?.id
      });

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
      
      // Redirección por rol
      console.log('🔄 [LOGIN] Redirigiendo por rol:', role);
      switch (role) {
        case 'admin':
        case 'adminadvanced':
          window.location.replace('/pages/admin/index.html');
          break;
        case 'usuario':
        default:
          window.location.replace('/pages/user/index.html');
          break;
      }

    } catch (err) {
      console.error(err);
      showToastError('Error al conectar con el servidor.');
    } finally {
      btn.disabled = false;
      btn.textContent = prev;
    }
  });
}

// ✅ NUEVO: Función para validar contraseña en tiempo real
function initPasswordValidation() {
  const passwordInput = document.getElementById('loginPassword');
  if (!passwordInput) return;
  
  // Mostrar/ocultar contraseña
  const togglePassword = document.createElement('button');
  togglePassword.type = 'button';
  togglePassword.className = 'btn btn-outline-secondary btn-sm position-absolute end-0 top-0';
  togglePassword.style.cssText = 'border: none; background: none; z-index: 10; margin-top: 2px; margin-right: 2px;';
  togglePassword.innerHTML = '<i class="bi bi-eye"></i>';
  
  // Posicionar el botón
  const passwordContainer = passwordInput.parentNode;
  passwordContainer.style.position = 'relative';
  passwordContainer.appendChild(togglePassword);
  
  // Funcionalidad de mostrar/ocultar
  togglePassword.addEventListener('click', () => {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    togglePassword.innerHTML = type === 'password' ? '<i class="bi bi-eye"></i>' : '<i class="bi bi-eye-slash"></i>';
  });
}
