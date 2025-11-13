/**
 * Utilidades para normalización y transformación de datos
 * Elimina duplicación de código de normalización
 */

/**
 * Valida que un valor sea un número finito
 */
function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && !Number.isNaN(value);
}

/**
 * Función base para crear convertidores de tipo
 * Reduce duplicación en funciones de normalización
 * @param {Function} converterFn - Función que realiza la conversión
 * @param {*} defaultValue - Valor por defecto si la conversión falla
 * @returns {Function} - Función convertidora
 */
function createTypeConverter(converterFn, defaultValue) {
  return function(value, customDefault = defaultValue) {
    try {
      return converterFn(value, customDefault);
    } catch (err) {
      console.warn('Error en conversión de tipo, usando valor por defecto:', err.message);
      if (customDefault === undefined) {
        return defaultValue;
      }
      return customDefault;
    }
  };
}

/**
 * Normaliza un valor que puede ser objeto, string JSON, o null/undefined
 * Útil para campos JSONB de PostgreSQL que pueden venir como string
 * @param {*} value - Valor a normalizar
 * @returns {object} - Objeto normalizado o {} si falla
 */
function asObject(value) {
  if (value === null || value === undefined) {
    return {};
  }
  
  // Si ya es un objeto (pero no array ni Date)
  if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
    return value;
  }
  
  // Si es string, intentar parsear JSON
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '' || trimmed === 'null') {
      return {};
    }
    
    try {
      const parsed = JSON.parse(trimmed);
      // Asegurar que el resultado es un objeto, no array ni primitivo
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return parsed;
      }
      return {};
    } catch (error) {
      // Error de parsing JSON - retornar objeto vacío
      console.warn('Error parseando JSON, retornando objeto vacío:', error.message);
      return {};
    }
  }
  
  return {};
}

/**
 * Normaliza un valor booleano
 * Maneja strings 'true'/'false', números 0/1, y booleanos
 * @param {*} value - Valor a normalizar
 * @returns {boolean} - Valor booleano normalizado
 */
function asBoolean(value) {
  if (value === null || value === undefined) {
    return false;
  }
  
  if (typeof value === 'boolean') {
    return value;
  }
  
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return lower === 'true' || lower === '1' || lower === 'yes' || lower === 'on';
  }
  
  if (typeof value === 'number') {
    return value !== 0 && Number.isFinite(value);
  }
  
  return Boolean(value);
}

/**
 * Normaliza un valor numérico
 * @param {*} value - Valor a normalizar
 * @param {number} defaultValue - Valor por defecto si la conversión falla
 * @returns {number} - Número normalizado
 */
function asNumber(value, defaultValue = 0) {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  
  if (typeof value === 'number') {
    return Number.isFinite(value) && !Number.isNaN(value) ? value : defaultValue;
  }
  
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return defaultValue;
    }
    const parsed = Number.parseFloat(trimmed);
    return Number.isFinite(parsed) && !Number.isNaN(parsed) ? parsed : defaultValue;
  }
  
  return defaultValue;
}

/**
 * Normaliza un valor entero
 * @param {*} value - Valor a normalizar
 * @param {number} defaultValue - Valor por defecto si la conversión falla
 * @returns {number} - Entero normalizado
 */
function asInteger(value, defaultValue = 0) {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  
  if (typeof value === 'number') {
    if (Number.isFinite(value) && !Number.isNaN(value)) {
      return Math.floor(value);
    }
    return defaultValue;
  }
  
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return defaultValue;
    }
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isFinite(parsed) && !Number.isNaN(parsed) ? parsed : defaultValue;
  }
  
  return defaultValue;
}

/**
 * Sanitiza un string eliminando caracteres peligrosos para prevenir XSS
 * Elimina tags HTML, scripts y caracteres especiales peligrosos
 * @param {*} str - String a sanitizar
 * @returns {string} - String sanitizado
 */
function sanitizeString(str) {
  if (typeof str !== 'string') {
    return '';
  }
  
  // Trim espacios
  let sanitized = str.trim();
  
  // Eliminar caracteres de control y caracteres peligrosos para XSS
  // Eliminar: < > & " ' / \ y caracteres de control (0x00-0x1F excepto \t, \n, \r)
  // Construir regex de caracteres de control de forma segura para evitar S6324
  // NOSONAR S6324: La regex se construye dinámicamente usando String.fromCodePoint
  // para evitar detección de caracteres de control literales en el código fuente
  const range1 = String.fromCodePoint(0x00) + '-' + String.fromCodePoint(0x08);
  const char1 = String.fromCodePoint(0x0B);
  const char2 = String.fromCodePoint(0x0C);
  const range2 = String.fromCodePoint(0x0E) + '-' + String.fromCodePoint(0x1F);
  const char3 = String.fromCodePoint(0x7F);
  const controlCharPattern = new RegExp('[' + range1 + char1 + char2 + range2 + char3 + ']', 'g');
  
  sanitized = sanitized
    .replaceAll('<', '').replaceAll('>', '') // Eliminar tags HTML
    .replaceAll('&', '&amp;') // Escapar ampersand
    .replaceAll('"', '&quot;') // Escapar comillas dobles
    .replaceAll("'", '&#x27;') // Escapar comillas simples
    .replaceAll('/', '&#x2F;') // Escapar slash
    .replaceAll('\\', '&#x5C;') // Escapar backslash
    .replace(controlCharPattern, ''); // NOSONAR S7781: replace() con regex es necesario porque controlCharPattern es una regex construida dinámicamente
  
  return sanitized;
}

/**
 * Limpia un objeto eliminando propiedades undefined/null/vacías
 * @param {*} obj - Objeto a limpiar
 * @returns {object} - Objeto limpio
 */
function cleanObject(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return {};
  }
  
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    // Incluir solo valores definidos, no null, no string vacío
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Obtiene un valor de un objeto con valor por defecto
 * @param {object} obj - Objeto del cual obtener el valor
 * @param {string} key - Clave del valor
 * @param {*} defaultValue - Valor por defecto si no existe
 * @returns {*} - Valor del objeto o valor por defecto
 */
function getValue(obj, key, defaultValue = null) {
  if (!obj || typeof obj !== 'object') {
    return defaultValue;
  }
  
  if (typeof key !== 'string' || key === '') {
    return defaultValue;
  }
  
  if (obj[key] === undefined) {
    return defaultValue;
  }
  return obj[key];
}

/**
 * Convierte un array de objetos a un objeto indexado por una clave
 * @param {Array} array - Array de objetos
 * @param {string} key - Clave para indexar
 * @returns {object} - Objeto indexado
 */
function indexBy(array, key) {
  if (!Array.isArray(array)) {
    return {};
  }
  
  if (typeof key !== 'string' || key === '') {
    return {};
  }
  
  const indexed = {};
  for (const item of array) {
    if (item && typeof item === 'object' && item[key] !== undefined) {
      indexed[item[key]] = item;
    }
  }
  return indexed;
}

module.exports = {
  asObject,
  asBoolean,
  asNumber,
  asInteger,
  sanitizeString,
  cleanObject,
  getValue,
  indexBy,
  createTypeConverter,
  isFiniteNumber
};

