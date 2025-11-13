/**
 * Helpers comunes para manejo de formularios
 * Proporciona funciones reutilizables para validación, envío y manejo de errores
 */

/**
 * Configurar botón de submit con estados de carga
 * @param {HTMLButtonElement} button - Botón de submit
 * @param {string} loadingText - Texto a mostrar durante la carga
 * @returns {Function} Función para restaurar el botón
 */
export function setupSubmitButton(button, loadingText = 'Enviando...') {
  if (!button) return () => {};
  
  const originalText = button.textContent;
  const originalDisabled = button.disabled;
  
  button.disabled = true;
  button.textContent = loadingText;
  
  return () => {
    button.disabled = originalDisabled;
    button.textContent = originalText;
  };
}

/**
 * Extrae el valor de un elemento de formulario
 * @param {HTMLElement} element - Elemento del formulario
 * @param {string} name - Nombre del campo
 * @param {HTMLFormElement} form - Formulario (para radio buttons)
 * @returns {*} Valor del campo
 */
function extractFieldValue(element, name, form) {
  if (element.type === 'checkbox') {
    return element.checked;
  }
  if (element.type === 'radio') {
    const checked = form.querySelector(`[name="${name}"]:checked`);
    return checked ? checked.value : null;
  }
  // Protección: verificar que value existe antes de hacer trim
  if (element.value == null || element.value === undefined) {
    return null;
  }
  return String(element.value).trim();
}

/**
 * Obtener datos de un formulario
 * @param {HTMLFormElement} form - Formulario
 * @param {Array<string>} fieldNames - Nombres de campos a extraer
 * @returns {Object} Objeto con los datos del formulario
 */
/**
 * Procesa campos específicos del formulario
 * @param {HTMLFormElement} form - Formulario
 * @param {Array<string>} fieldNames - Nombres de campos
 * @param {Object} data - Objeto donde almacenar los datos
 */
function processSpecificFields(form, fieldNames, data) {
  for (const name of fieldNames) {
    const element = form.querySelector(`[name="${name}"]`) || form.querySelector(`#${name}`);
    if (element) {
      data[name] = extractFieldValue(element, name, form);
    }
  }
}

/**
 * Procesa todos los campos del formulario
 * @param {HTMLFormElement} form - Formulario
 * @param {Object} data - Objeto donde almacenar los datos
 */
function processAllFields(form, data) {
  // Solo procesar elementos de formulario válidos
  const validInputTypes = ['input', 'select', 'textarea'];
  
  for (const element of form.querySelectorAll('[name], [id]')) {
    const name = element.name || element.id;
    if (!name || name.startsWith('_')) {
      continue;
    }
    
    // Saltar elementos que no son inputs válidos (divs, spans, labels, etc.)
    const tagName = element.tagName.toLowerCase();
    if (!validInputTypes.includes(tagName) && 
        element.type !== 'checkbox' && 
        element.type !== 'radio') {
      continue;
    }
    
    // Verificar que tenga value o checked antes de procesar
    if (element.type !== 'checkbox' && 
        element.type !== 'radio' && 
        (element.value === undefined || element.value === null)) {
      continue;
    }
    
    if (element.type === 'radio' && data[name]) {
      // Ya procesado este radio button
      continue;
    }
    data[name] = extractFieldValue(element, name, form);
  }
}

/**
 * Obtener datos de un formulario
 * @param {HTMLFormElement} form - Formulario
 * @param {Array<string>} fieldNames - Nombres de campos a extraer
 * @returns {Object} Objeto con los datos del formulario
 */
export function getFormData(form, fieldNames = null) {
  if (!form) return {};
  
  const data = {};
  
  if (fieldNames) {
    processSpecificFields(form, fieldNames, data);
  } else {
    processAllFields(form, data);
  }
  
  return data;
}

/**
 * Validar email de forma segura (evita ReDoS)
 * Usa validación en dos pasos para prevenir backtracking catastrófico
 * @param {string} email - Email a validar
 * @returns {boolean} True si es válido
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  // Limitar longitud para prevenir ReDoS (RFC 5321: máximo práctico 254 caracteres)
  const trimmedEmail = email.trim();
  if (trimmedEmail.length > 254 || trimmedEmail.length < 3) {
    return false;
  }
  
  // Validación en dos pasos para evitar backtracking catastrófico
  // Paso 1: Verificar estructura básica (split es O(n), no tiene backtracking)
  const parts = trimmedEmail.split('@');
  if (parts.length !== 2) {
    return false;
  }
  
  const [localPart, domainPart] = parts;
  
  // Validar que las partes no estén vacías
  if (!localPart || localPart.length === 0 || localPart.length > 64) {
    return false;
  }
  
  if (!domainPart || domainPart.length === 0 || domainPart.length > 253) {
    return false;
  }
  
  // Paso 2: Validar formato con regex simple y seguro (sin grupos anidados complejos)
  // Regex optimizado: evita backtracking catastrófico usando límites explícitos
  // Local part: caracteres permitidos, sin espacios
  const localRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
  if (!localRegex.test(localPart)) {
    return false;
  }
  
  // Domain part: debe tener al menos un punto y caracteres válidos
  // Usar regex simple sin grupos anidados complejos
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  return domainRegex.test(domainPart);
}

/**
 * Validar que un campo no esté vacío
 * @param {string} value - Valor a validar
 * @param {string} fieldName - Nombre del campo (para mensajes de error)
 * @returns {string|null} Mensaje de error o null si es válido
 */
export function validateRequired(value, fieldName) {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} es requerido`;
  }
  return null;
}

/**
 * Mostrar mensaje de error
 * @param {HTMLElement|string} container - Contenedor o selector donde mostrar el error
 * @param {string} message - Mensaje de error
 */
export function showError(container, message) {
  if (typeof container === 'string') {
    container = document.querySelector(container) || document.getElementById(container);
  }
  
  if (!container) {
    console.error('Error:', message);
    return;
  }
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'alert alert-danger alert-dismissible fade show';
  errorDiv.innerHTML = `
    <strong>Error:</strong> ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  container.insertBefore(errorDiv, container.firstChild);
  
  // Auto-remover después de 5 segundos
  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}

/**
 * Mostrar mensaje de éxito
 * @param {HTMLElement|string} container - Contenedor o selector donde mostrar el mensaje
 * @param {string} message - Mensaje de éxito
 */
export function showSuccess(container, message) {
  if (typeof container === 'string') {
    container = document.querySelector(container) || document.getElementById(container);
  }
  
  if (!container) {
    console.log('Éxito:', message);
    return;
  }
  
  const successDiv = document.createElement('div');
  successDiv.className = 'alert alert-success alert-dismissible fade show';
  successDiv.innerHTML = `
    <strong>Éxito:</strong> ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  container.insertBefore(successDiv, container.firstChild);
  
  // Auto-remover después de 5 segundos
  setTimeout(() => {
    successDiv.remove();
  }, 5000);
}

/**
 * Manejar envío de formulario con validación y estados de carga
 * @param {HTMLFormElement} form - Formulario
 * @param {Function} onSubmit - Función async que recibe los datos del formulario
 * @param {Object} options - Opciones de configuración
 * @param {Function} options.validator - Función de validación personalizada
 * @param {string} options.loadingText - Texto de carga
 * @param {Function} options.onSuccess - Callback de éxito
 * @param {Function} options.onError - Callback de error
 */
export async function handleFormSubmit(form, onSubmit, options = {}) {
  if (!form) {
    console.warn('Formulario no encontrado');
    return;
  }
  
  const {
    validator = null,
    loadingText = 'Enviando...',
    onSuccess = null,
    onError = null
  } = options;
  
  const submitButton = form.querySelector('button[type="submit"]');
  const restoreButton = setupSubmitButton(submitButton, loadingText);
  
  try {
    const formData = getFormData(form);
    
    // Validación personalizada si se proporciona
    if (validator) {
      const validationError = validator(formData);
      if (validationError) {
        showError(form, validationError);
        return;
      }
    }
    
    // Ejecutar función de envío
    const result = await onSubmit(formData);
    
    // Éxito
    if (onSuccess) {
      onSuccess(result, form);
    } else {
      showSuccess(form, 'Operación completada exitosamente');
      form.reset();
    }
    
  } catch (error) {
    console.error('Error en formulario:', error);
    const errorMessage = error.message || 'Error al procesar el formulario';
    
    if (onError) {
      onError(error, form);
    } else {
      showError(form, errorMessage);
    }
  } finally {
    restoreButton();
  }
}

