// Servicio para manejar el formulario de contacto
import { handleFormSubmit, showError, showSuccess, isValidEmail, validateRequired } from './common/form-handler.js';
import { post } from './common/api-client.js';

export function initContactoForm() {
  const contactForm = document.getElementById('contactForm');
  if (!contactForm) {
    console.warn('Formulario de contacto no encontrado');
    return;
  }

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    await handleFormSubmit(contactForm, async (formData) => {
      // Validar datos
      const errores = validarFormularioContacto(formData);
      if (errores.length > 0) {
        showError(contactForm, errores.join('<br>'));
        throw new Error('Errores de validación');
      }
      
      // Enviar formulario
      const result = await post('/api/contacto', formData, { requireAuth: false });
      showSuccess(contactForm, 'Mensaje enviado correctamente. Te responderemos pronto.');
      contactForm.reset();
      return result;
    }, {
      loadingText: 'Enviando...',
      validator: (data) => {
        const errores = validarFormularioContacto(data);
        return errores.length > 0 ? errores.join('<br>') : null;
      }
    });
  });
}

// Validar formulario de contacto
function validarFormularioContacto(formData) {
  const errores = [];
  
  const nombreError = validateRequired(formData.nombre, 'El nombre');
  if (nombreError) {
    errores.push(nombreError);
  } else if (formData.nombre.length < 2) {
    errores.push('El nombre debe tener al menos 2 caracteres');
  }
  
  const emailError = validateRequired(formData.email, 'El email');
  if (emailError) {
    errores.push(emailError);
  } else if (!isValidEmail(formData.email)) {
    errores.push('El email debe ser válido');
  }
  
  if (!formData.asunto || formData.asunto === '') {
    errores.push('Debes seleccionar un asunto');
  }
  
  const mensajeError = validateRequired(formData.mensaje, 'El mensaje');
  if (mensajeError) {
    errores.push(mensajeError);
  } else if (formData.mensaje.length < 10) {
    errores.push('El mensaje debe tener al menos 10 caracteres');
  }
  
  return errores;
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
