/**
 * Utilidades para validación de datos
 * Elimina duplicación de código de validación
 */

const { badRequest } = require('./http-response');

/**
 * Valida que un valor no sea null, undefined o string vacío
 */
function isEmpty(value) {
  return value === undefined || value === null || value === '';
}

/**
 * Función base para crear validadores con estructura común
 * Reduce duplicación en funciones de validación
 * @param {Function} validatorFn - Función que realiza la validación
 * @param {string} defaultErrorMessage - Mensaje de error por defecto
 * @returns {Function} - Función validadora que retorna {valid, error}
 */
function createValidator(validatorFn, defaultErrorMessage = 'Validación fallida') {
  return function(value, ...args) {
    try {
      const result = validatorFn(value, ...args);
      if (result === true || result === null || result === undefined) {
        return { valid: true };
      }
      if (result === false) {
        return { valid: false, error: defaultErrorMessage };
      }
      if (typeof result === 'object' && result.valid !== undefined) {
        return result;
      }
      return { valid: false, error: defaultErrorMessage };
    } catch (err) {
      return { valid: false, error: err.message || defaultErrorMessage };
    }
  };
}

/**
 * Valida que los campos requeridos estén presentes
 * @param {string[]} fields - Array de nombres de campos requeridos
 * @param {object} data - Objeto con los datos a validar
 * @returns {{valid: boolean, error?: string, missing?: string[]}}
 */
function validateRequired(fields, data) {
  if (!Array.isArray(fields) || fields.length === 0) {
    return { valid: false, error: 'Lista de campos requeridos inválida' };
  }
  
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Datos inválidos para validación' };
  }
  
  const missing = [];
  
  for (const field of fields) {
    if (typeof field !== 'string' || field.trim() === '') {
      continue; // Ignorar campos inválidos en la lista
    }
    if (isEmpty(data[field])) {
      missing.push(field);
    }
  }
  
  if (missing.length > 0) {
    return {
      valid: false,
      error: `Campos faltantes: ${missing.join(', ')}`,
      missing
    };
  }
  
  return { valid: true };
}

/**
 * Middleware para validar campos requeridos
 */
function requireFields(...fieldNames) {
  return (req, res, next) => {
    if (!req?.body) {
      return badRequest(res, 'Request body no disponible');
    }
    
    const validation = validateRequired(fieldNames, req.body);
    
    if (!validation.valid) {
      return badRequest(res, validation.error, {
        missing: validation.missing
      });
    }
    
    next();
  };
}

/**
 * Valida formato de email usando regex seguro (evita ReDoS)
 * Regex optimizado: límite de longitud y estructura simple
 */
function isValidEmail(email) {
  if (typeof email !== 'string') {
    return false;
  }
  
  // Limitar longitud para prevenir ReDoS (RFC 5321: máximo 320 caracteres)
  if (email.length > 320 || email.length < 3) {
    return false;
  }
  
  // Regex simple y seguro: local@domain
  // Evita grupos anidados complejos que pueden causar ReDoS
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  return emailRegex.test(email);
}

/**
 * Valida formato de email y retorna error si es inválido
 * @param {string} email - Email a validar
 * @param {object} res - Objeto response de Express
 * @returns {object|null} - null si es válido, respuesta HTTP si es inválido
 */
function validateEmail(email, res) {
  if (!res || typeof res.status !== 'function') {
    throw new TypeError('validateEmail requiere un objeto response válido');
  }
  
  if (!isValidEmail(email)) {
    return badRequest(res, 'Formato de email inválido');
  }
  return null;
}

/**
 * Valida que un valor esté en una lista de valores permitidos
 * @param {*} value - Valor a validar
 * @param {Array} allowedValues - Array de valores permitidos
 * @param {string} fieldName - Nombre del campo para mensajes de error
 * @returns {{valid: boolean, error?: string}}
 */
function validateEnum(value, allowedValues, fieldName = 'campo') {
  if (!Array.isArray(allowedValues) || allowedValues.length === 0) {
    return { valid: false, error: 'Lista de valores permitidos inválida' };
  }
  
  const normalizedFieldName = typeof fieldName === 'string' && fieldName.trim() !== ''
    ? fieldName.trim()
    : 'campo';
  
  if (!allowedValues.includes(value)) {
    return {
      valid: false,
      error: `${normalizedFieldName} debe ser uno de: ${allowedValues.join(', ')}`
    };
  }
  return { valid: true };
}

/**
 * Valida que un número esté en un rango
 * @param {number|string} value - Valor a validar
 * @param {number} min - Valor mínimo permitido
 * @param {number} max - Valor máximo permitido
 * @param {string} fieldName - Nombre del campo para mensajes de error
 * @returns {{valid: boolean, error?: string}}
 */
function validateRange(value, min, max, fieldName = 'campo') {
  if (typeof min !== 'number' || typeof max !== 'number' || min > max) {
    return { valid: false, error: 'Rango de validación inválido' };
  }
  
  const normalizedFieldName = typeof fieldName === 'string' && fieldName.trim() !== ''
    ? fieldName.trim()
    : 'campo';
  
  const num = typeof value === 'string' ? Number.parseInt(value, 10) : value;
  
  if (typeof num !== 'number' || Number.isNaN(num) || !Number.isFinite(num)) {
    return {
      valid: false,
      error: `${normalizedFieldName} debe ser un número válido`
    };
  }
  
  if (num < min || num > max) {
    return {
      valid: false,
      error: `${normalizedFieldName} debe estar entre ${min} y ${max}`
    };
  }
  
  return { valid: true };
}

/**
 * Valida que un ID sea un número válido
 * @param {string|number} id - ID a validar
 * @param {object} res - Objeto response de Express
 * @param {string} resourceName - Nombre del recurso para mensajes de error
 * @returns {object|null} - null si es válido, respuesta HTTP si es inválido
 */
function validateId(id, res, resourceName = 'ID') {
  if (!res || typeof res.status !== 'function') {
    throw new TypeError('validateId requiere un objeto response válido');
  }
  
  if (typeof resourceName !== 'string') {
    resourceName = 'ID';
  }
  
  if (id === undefined || id === null || id === '') {
    return badRequest(res, `${resourceName} no proporcionado`);
  }
  
  const numId = typeof id === 'string' ? Number.parseInt(id, 10) : id;
  
  if (typeof numId !== 'number' || Number.isNaN(numId) || !Number.isFinite(numId) || numId <= 0 || numId !== Math.floor(numId)) {
    return badRequest(res, `${resourceName} inválido`);
  }
  
  return null;
}

module.exports = {
  validateRequired,
  requireFields,
  isValidEmail,
  validateEmail,
  validateEnum,
  validateRange,
  validateId,
  createValidator
};

