// --- util toast ---
function showToastError(msg) {
  const el = document.getElementById('loginToast');
  const body = document.getElementById('loginToastBody');
  if (!el || !body || !window.bootstrap) return;
  body.textContent = msg || 'Ocurrió un error.';
  new bootstrap.Toast(el).show();
}

export function initLoginForm() {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  // ✅ NUEVO: Inicializar validación de contraseña en tiempo real
  initPasswordValidation();

  loginForm.addEventListener('submit', onSubmit);
}

async function onSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const remember = document.getElementById('rememberMe')?.checked ?? false;

  const btn = e.currentTarget.querySelector('button[type="submit"]');
  const prevText = btn.textContent;
  btn.disabled = true; 
  btn.textContent = 'Ingresando...';

  try {
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await r.json().catch(() => ({}));
    
    console.log('📋 [LOGIN] Respuesta del backend:', data);
    
    if (!r.ok) {
      showToastError(data?.error || 'Credenciales incorrectas');
      return;
    }

    // 🟡 Si el backend indica 2FA requerida:
    if (data.pending2faToken) {
      console.log('🔐 [LOGIN] Se requiere 2FA, mostrando modal...');
      openTwoFAModal(async (code) => {
        const r2 = await fetch('/api/usuarios/login/2fa', {
          method: 'POST',
          headers: { 'Content-Type':'application/json' },
          body: JSON.stringify({ pending2faToken: data.pending2faToken, code })
        });
        const d2 = await r2.json().catch(() => ({}));
        if (!r2.ok || !d2.token) {
          showToastError(d2?.error || '2FA inválido');
          return;
        }
        persistSessionAndGo(d2, remember);
      });
      return; // <- clave: no continúes ni guardes token aquí
    }

    // ✅ Sin 2FA
    persistSessionAndGo(data, remember);

  } catch (err) {
    console.error(err);
    showToastError('Error de red');
  } finally {
    btn.disabled = false; 
    btn.textContent = prevText;
  }
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

// ===== FUNCIONES 2FA =====

function persistSessionAndGo(payload, remember) {
  const storage = remember ? localStorage : sessionStorage;
  const role = (payload.user?.rol || payload.role || 'usuario').toLowerCase();

  if (!payload.token) { 
    showToastError('Servidor no devolvió token'); 
    return; 
  }

  storage.setItem('token', payload.token);
  storage.setItem('role', role);
  if (payload.user?.nombre) storage.setItem('userName', payload.user.nombre);
  if (payload.user?.id) storage.setItem('userId', payload.user.id);

  console.log('🔐 [LOGIN] Datos de sesión guardados:', {
    role: role,
    userName: payload.user?.nombre,
    userId: payload.user?.id
  });

  // Redirección por rol
  console.log('🔄 [LOGIN] Redirigiendo por rol:', role);
  switch (role) {
    case 'supadmin':
      window.location.replace('/pages/supadmin/index.html');
      break;
    case 'admin':
    case 'adminadvanced':
      window.location.replace('/pages/admin/index.html');
      break;
    case 'usuario':
    default:
      window.location.replace('/pages/user/index.html');
      break;
  }
}

// Modal super simple (Bootstrap-agnóstico)
function openTwoFAModal(onOk) {
  const id = 'twofa-modal';
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('div');
    el.id = id;
    el.innerHTML = `
      <div class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
           style="background:rgba(0,0,0,0.5);z-index:1050">
        <div class="bg-white p-4 rounded shadow" style="min-width:320px">
          <h5 class="mb-3">Código de verificación</h5>
          <input id="twofaCode" class="form-control mb-3" maxlength="6" inputmode="numeric" placeholder="000000">
          <div class="d-flex gap-2 justify-content-end">
            <button id="twofaCancel" class="btn btn-outline-secondary">Cancelar</button>
            <button id="twofaOk" class="btn btn-primary">Verificar</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(el);
  }
  el.style.display = 'block';
  const input = el.querySelector('#twofaCode');
  setTimeout(() => input?.focus(), 50);

  el.querySelector('#twofaOk').onclick = () => {
    const code = input.value.trim();
    if (!/^[0-9]{6}$/.test(code)) return input.focus();
    el.style.display = 'none';
    onOk(code);
  };
  el.querySelector('#twofaCancel').onclick = () => {
    el.style.display = 'none';
  };
}
