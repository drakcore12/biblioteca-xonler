// Servicio para manejar el registro de usuarios
import { handleFormSubmit, showError, showSuccess, isValidEmail, validateRequired } from './common/form-handler.js';
import { post } from './common/api-client.js';

export function initRegistroForm() {
  const registerForm = document.getElementById('registerForm');
  if (!registerForm) {
    console.warn('Formulario de registro no encontrado');
    return;
  }

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    await handleFormSubmit(registerForm, async (formData) => {
      // Validar datos
      const errores = validarFormularioRegistro(formData);
      if (errores.length > 0) {
        showError(registerForm, errores.join('<br>'));
        throw new Error('Errores de validación');
      }
      
      // Enviar registro
      console.log('📤 [REGISTER] Enviando datos:', {
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        password: formData.password ? '***' : 'undefined'
      });

      const data = await post('/api/auth/register', {
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        password: formData.password
      }, { requireAuth: false });
      
      console.log('📋 [REGISTER] Datos completos recibidos:', data);
      
      // ✅ CRÍTICO: Guardar token y datos de sesión
      if (!data.token) {
        console.warn('⚠️ [REGISTER] No se recibió token en la respuesta');
        showError(registerForm, 'Error: No se recibió token de autenticación');
        return;
      }
      
      // Guardar sesión (usar sessionStorage por defecto, no "remember me")
      const storage = sessionStorage;
      const role = (data.user?.rol || data.role || 'usuario').toLowerCase();
      
      // Guardar TODOS los datos ANTES de cualquier redirección
      storage.setItem('token', data.token);
      storage.setItem('role', role);
      
      // Inicializar lastActivity para el guard (importante para evitar expiración inmediata)
      const now = Date.now();
      storage.setItem('lastActivity', String(now));
      
      if (data.user?.id) {
        storage.setItem('userId', String(data.user.id));
      }
      if (data.user?.nombre) {
        storage.setItem('userName', data.user.nombre);
      }
      
      // Verificar que se guardó correctamente
      const tokenGuardado = storage.getItem('token');
      const roleGuardado = storage.getItem('role');
      
      console.log('🔐 [REGISTER] Sesión guardada y verificada:', {
        role: role,
        roleGuardado: roleGuardado,
        userId: data.user?.id,
        userName: data.user?.nombre,
        hasToken: !!data.token,
        tokenGuardado: !!tokenGuardado,
        tokenLength: data.token?.length,
        tokenPreview: data.token ? `${data.token.substring(0, 20)}...` : 'null'
      });
      
      // Verificar que el token se guardó correctamente antes de continuar
      if (!tokenGuardado || tokenGuardado !== data.token) {
        console.error('❌ [REGISTER] Error: Token no se guardó correctamente');
        showError(registerForm, 'Error al guardar sesión. Intenta nuevamente.');
        return;
      }
      
      showSuccess(registerForm, 'Cuenta creada correctamente. Redirigiendo...');
      
      // Limpiar formulario
      registerForm.reset();
      
      // Redirigir después de 1 segundo (reducido para mejor UX)
      // IMPORTANTE: El token ya está guardado, así que el guard debería encontrarlo
      setTimeout(() => {
        const userRole = data.user?.rol || data.role || 'usuario';
        const tokenVerificacion = storage.getItem('token');
        
        console.log('🔄 [REGISTER] Verificación antes de redirigir:', {
          userRole: userRole,
          tokenExiste: !!tokenVerificacion,
          tokenCoincide: tokenVerificacion === data.token,
          storageKeys: Object.keys(storage)
        });
        
        if (!tokenVerificacion) {
          console.error('❌ [REGISTER] Token perdido antes de redirigir!');
          showError(registerForm, 'Error: Sesión perdida. Por favor, inicia sesión.');
          return;
        }
        
        console.log('🔄 [REGISTER] Redirigiendo por rol:', userRole);
        
        const runtimeLocation = globalThis?.location;
        switch (userRole.toLowerCase()) {
          case 'admin':
          case 'adminadvanced':
            runtimeLocation?.replace?.('/pages/admin/index.html');
            break;
          case 'usuario':
          default:
            runtimeLocation?.replace?.('/pages/user/index.html');
            break;
        }
      }, 1000);
      
      return data;
    }, {
      loadingText: 'Creando cuenta...',
      validator: (data) => {
        const errores = validarFormularioRegistro(data);
        return errores.length > 0 ? errores.join('<br>') : null;
      }
    });
  });
}

// Validar formulario de registro
function validarFormularioRegistro(formData) {
  const errores = [];
  
  const nombreError = validateRequired(formData.nombre, 'El nombre');
  if (nombreError) {
    errores.push(nombreError);
  } else if (formData.nombre.length < 2) {
    errores.push('El nombre debe tener al menos 2 caracteres');
  }
  
  const apellidoError = validateRequired(formData.apellido, 'El apellido');
  if (apellidoError) {
    errores.push(apellidoError);
  } else if (formData.apellido.length < 2) {
    errores.push('El apellido debe tener al menos 2 caracteres');
  }
  
  const emailError = validateRequired(formData.email, 'El email');
  if (emailError) {
    errores.push(emailError);
  } else if (!isValidEmail(formData.email)) {
    errores.push('El email debe ser válido');
  }
  
  if (!formData.password || formData.password.length < 8) {
    errores.push('La contraseña debe tener al menos 8 caracteres');
  }
  
  if (formData.password !== formData.confirmPassword) {
    errores.push('Las contraseñas no coinciden');
  }
  
  if (!formData.acceptTerms) {
    errores.push('Debes aceptar los términos y condiciones');
  }
  
  return errores;
}

// Función para validar contraseña en tiempo real
export function initPasswordValidation() {
  const passwordInput = document.getElementById('registerPassword');
  const confirmInput = document.getElementById('confirmPassword');
  
  if (!passwordInput || !confirmInput) return;
  
  // Validar contraseña en tiempo real
  passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    const strength = calcularFortalezaPassword(password);
    mostrarFortalezaPassword(strength);
  });
  
  // Validar confirmación en tiempo real
  confirmInput.addEventListener('input', () => {
    const password = passwordInput.value;
    const confirm = confirmInput.value;
    
    if (confirm && password !== confirm) {
      confirmInput.setCustomValidity('Las contraseñas no coinciden');
    } else {
      confirmInput.setCustomValidity('');
    }
  });
}

// Calcular fortaleza de la contraseña
function calcularFortalezaPassword(password) {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  
  if (score <= 2) return 'débil';
  if (score <= 4) return 'media';
  return 'fuerte';
}

// Mostrar indicador de fortaleza de contraseña
function mostrarFortalezaPassword(fortaleza) {
  let existingIndicator = document.getElementById('passwordStrength');
  
  if (!existingIndicator) {
    existingIndicator = document.createElement('div');
    existingIndicator.id = 'passwordStrength';
    existingIndicator.className = 'mt-2';
    
    const passwordInput = document.getElementById('registerPassword');
    if (passwordInput) {
      passwordInput.parentNode.appendChild(existingIndicator);
    }
  }
  
  const colors = {
    débil: 'danger',
    media: 'warning',
    fuerte: 'success'
  };
  
  const color = colors[fortaleza] || 'secondary';
  
  let shieldIcon = 'x';
  if (fortaleza === 'fuerte') {
    shieldIcon = 'check';
  } else if (fortaleza === 'media') {
    shieldIcon = 'exclamation';
  }
  
  existingIndicator.innerHTML = `
    <small class="text-${color}">
      <i class="bi bi-shield-${shieldIcon}"></i>
      Fortaleza: ${fortaleza}
    </small>
  `;
}
