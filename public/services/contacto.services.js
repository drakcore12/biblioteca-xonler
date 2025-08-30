// Servicio para manejar el formulario de contacto
export function initContactoForm() {
  const contactForm = document.getElementById('contactForm');
  if (!contactForm) {
    console.warn('Formulario de contacto no encontrado');
    return;
  }

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
      // Deshabilitar botón y mostrar estado de carga
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';
      
      // Obtener datos del formulario
      const formData = {
        nombre: document.getElementById('nombre').value.trim(),
        email: document.getElementById('email').value.trim(),
        asunto: document.getElementById('asunto').value,
        mensaje: document.getElementById('mensaje').value.trim()
      };
      
      // Validar datos
      const errores = validarFormularioContacto(formData);
      if (errores.length > 0) {
        mostrarError(errores.join('<br>'));
        return;
      }
      
      // Enviar formulario
      const response = await fetch('/api/contacto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        mostrarExito('Mensaje enviado correctamente. Te responderemos pronto.');
        contactForm.reset();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
    } catch (error) {
      console.error('Error enviando formulario de contacto:', error);
      mostrarError('Error al enviar el mensaje. Intenta nuevamente.');
    } finally {
      // Restaurar botón
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

// Validar formulario de contacto
function validarFormularioContacto(formData) {
  const errores = [];
  
  if (!formData.nombre || formData.nombre.length < 2) {
    errores.push('El nombre debe tener al menos 2 caracteres');
  }
  
  if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errores.push('El email debe ser válido');
  }
  
  if (!formData.asunto || formData.asunto === '') {
    errores.push('Debes seleccionar un asunto');
  }
  
  if (!formData.mensaje || formData.mensaje.length < 10) {
    errores.push('El mensaje debe tener al menos 10 caracteres');
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
  const form = document.getElementById('contactForm');
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
  const form = document.getElementById('contactForm');
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

// Función para simular envío (cuando no hay backend de contacto)
export function simularEnvioContacto(formData) {
  return new Promise((resolve) => {
    // Simular delay de red
    setTimeout(() => {
      console.log('📧 Simulando envío de contacto:', formData);
      resolve({ success: true, message: 'Mensaje enviado correctamente' });
    }, 1000);
  });
}
