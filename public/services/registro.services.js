// Servicio para manejar el registro de usuarios
export function initRegistroForm() {
  const registerForm = document.getElementById('registerForm');
  if (!registerForm) {
    console.warn('Formulario de registro no encontrado');
    return;
  }

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = registerForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
      // Deshabilitar botón y mostrar estado de carga
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creando cuenta...';
      
      // Obtener datos del formulario
      const formData = {
        nombre: document.getElementById('registerName').value.trim(),
        apellido: document.getElementById('registerApellido').value.trim(),
        email: document.getElementById('registerEmail').value.trim(),
        password: document.getElementById('registerPassword').value,
        confirmPassword: document.getElementById('confirmPassword').value,
        acceptTerms: document.getElementById('acceptTerms').checked
      };
      
      // Validar datos
      const errores = validarFormularioRegistro(formData);
      if (errores.length > 0) {
        mostrarError(errores.join('<br>'));
        return;
      }
      
      // Enviar registro
      console.log('📤 [REGISTER] Enviando datos:', {
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        password: formData.password ? '***' : 'undefined'
      });

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          apellido: formData.apellido,
          email: formData.email,
          password: formData.password
        })
      });
      
      console.log('📥 [REGISTER] Respuesta recibida:', {
        status: response.status,
        ok: response.ok
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📋 [REGISTER] Datos completos recibidos:', data);
        mostrarExito('Cuenta creada correctamente. Redirigiendo...');
        
        // Limpiar formulario
        registerForm.reset();
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
          const userRole = data.user?.rol || data.role;
          console.log('🔄 [REGISTER] Redirigiendo por rol:', userRole);
          console.log('🔄 [REGISTER] Datos completos del usuario:', data.user);
          console.log('🔄 [REGISTER] Rol extraído:', userRole);
          
          switch (userRole?.toLowerCase()) {
            case 'admin':
            case 'adminadvanced':
              console.log('🔄 [REGISTER] Redirigiendo a admin');
              window.location.replace('/pages/admin/index.html');
              break;
            case 'usuario':
            default:
              console.log('🔄 [REGISTER] Redirigiendo a usuario');
              window.location.replace('/pages/user/index.html');
              break;
          }
        }, 2000);
        
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
    } catch (error) {
      console.error('Error en registro:', error);
      mostrarError('Error al crear la cuenta. Intenta nuevamente.');
    } finally {
      // Restaurar botón
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

// Validar formulario de registro
function validarFormularioRegistro(formData) {
  const errores = [];
  
  if (!formData.nombre || formData.nombre.length < 2) {
    errores.push('El nombre debe tener al menos 2 caracteres');
  }
  
  if (!formData.apellido || formData.apellido.length < 2) {
    errores.push('El apellido debe tener al menos 2 caracteres');
  }
  
  if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
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

// Mostrar mensaje de éxito
function mostrarExito(mensaje) {
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-success alert-dismissible fade show';
  alertDiv.innerHTML = `
    <i class="bi bi-check-circle me-2"></i>
    ${mensaje}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  // Insertar antes del formulario
  const form = document.getElementById('registerForm');
  if (form) {
    form.parentNode.insertBefore(alertDiv, form);
  }
  
  // Auto-remover después de 5 segundos
  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.remove();
    }
  }, 5000);
}

// Mostrar mensaje de error
function mostrarError(mensaje) {
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-danger alert-dismissible fade show';
  alertDiv.innerHTML = `
    <i class="bi bi-exclamation-triangle me-2"></i>
    ${mensaje}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  // Insertar antes del formulario
  const form = document.getElementById('registerForm');
  if (form) {
    form.parentNode.insertBefore(alertDiv, form);
  }
  
  // Auto-remover después de 8 segundos
  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.remove();
    }
  }, 8000);
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
  if (/[0-9]/.test(password)) score++;
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
  
  existingIndicator.innerHTML = `
    <small class="text-${color}">
      <i class="bi bi-shield-${fortaleza === 'fuerte' ? 'check' : fortaleza === 'media' ? 'exclamation' : 'x'}"></i>
      Fortaleza: ${fortaleza}
    </small>
  `;
}
