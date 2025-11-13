/**
 * Utilidades para respuestas HTTP estandarizadas
 * Elimina duplicación de código en controladores
 */

/**
 * Valida que res sea un objeto response válido de Express
 */
function validateResponse(res) {
  if (!res || typeof res.status !== 'function' || typeof res.json !== 'function') {
    throw new TypeError('Se requiere un objeto response válido de Express');
  }
}

/**
 * Valida que statusCode sea un código HTTP válido
 */
function validateStatusCode(statusCode) {
  if (typeof statusCode !== 'number' || statusCode < 100 || statusCode > 599) {
    return 500; // Default a 500 si es inválido
  }
  return statusCode;
}

/**
 * Valida que message sea un string válido
 */
function validateMessage(message, defaultValue = 'Error') {
  if (typeof message !== 'string' || message.trim() === '') {
    return defaultValue;
  }
  return message.trim();
}

/**
 * Función base para crear respuestas HTTP con estructura común
 * Reduce duplicación en funciones de respuesta
 * @param {object} res - Objeto response de Express
 * @param {number} statusCode - Código de estado HTTP
 * @param {object} responseData - Datos de la respuesta
 * @returns {object} - Respuesta HTTP
 */
function createResponse(res, statusCode, responseData) {
  validateResponse(res);
  const validStatusCode = validateStatusCode(statusCode);
  
  return res.status(validStatusCode).json(responseData);
}

/**
 * Respuesta exitosa estándar
 * @param {object} res - Objeto response de Express
 * @param {*} data - Datos a enviar (opcional)
 * @param {string} message - Mensaje opcional
 * @param {number} statusCode - Código de estado HTTP (default: 200)
 * @returns {object} - Respuesta HTTP
 */
function success(res, data = null, message = null, statusCode = 200) {
  const response = { success: true };
  
  if (message && typeof message === 'string' && message.trim() !== '') {
    response.message = message.trim();
  }
  
  if (data !== null && data !== undefined) {
    response.data = data;
  }
  
  return createResponse(res, statusCode, response);
}

/**
 * Respuesta de error estándar
 * @param {object} res - Objeto response de Express
 * @param {string} message - Mensaje de error
 * @param {number} statusCode - Código de estado HTTP (default: 500)
 * @param {*} details - Detalles adicionales del error (opcional)
 * @returns {object} - Respuesta HTTP
 */
function error(res, message, statusCode = 500, details = null) {
  const normalizedMessage = validateMessage(message, 'Error interno del servidor');
  
  const response = { error: normalizedMessage };
  
  if (details !== null && details !== undefined) {
    response.details = details;
  }
  
  return createResponse(res, statusCode, response);
}

/**
 * Respuesta 400 - Bad Request
 * @param {object} res - Objeto response de Express
 * @param {string} message - Mensaje de error
 * @param {*} details - Detalles adicionales (opcional)
 * @returns {object} - Respuesta HTTP
 */
function badRequest(res, message, details = null) {
  return error(res, message, 400, details);
}

/**
 * Respuesta 401 - Unauthorized
 * @param {object} res - Objeto response de Express
 * @param {string} message - Mensaje de error (default: 'No autenticado')
 * @returns {object} - Respuesta HTTP
 */
function unauthorized(res, message = 'No autenticado') {
  return error(res, message, 401);
}

/**
 * Respuesta 403 - Forbidden
 * @param {object} res - Objeto response de Express
 * @param {string} message - Mensaje de error (default: 'No tienes permisos para realizar esta acción')
 * @returns {object} - Respuesta HTTP
 */
function forbidden(res, message = 'No tienes permisos para realizar esta acción') {
  return error(res, message, 403);
}

/**
 * Respuesta 404 - Not Found
 * @param {object} res - Objeto response de Express
 * @param {string} resource - Nombre del recurso (default: 'Recurso')
 * @returns {object} - Respuesta HTTP
 */
function notFound(res, resource = 'Recurso') {
  const resourceName = typeof resource === 'string' && resource.trim() !== '' 
    ? resource.trim() 
    : 'Recurso';
  return error(res, `${resourceName} no encontrado`, 404);
}

/**
 * Respuesta 409 - Conflict
 * @param {object} res - Objeto response de Express
 * @param {string} message - Mensaje de error
 * @returns {object} - Respuesta HTTP
 */
function conflict(res, message) {
  return error(res, message, 409);
}

/**
 * Respuesta 201 - Created
 * @param {object} res - Objeto response de Express
 * @param {*} data - Datos creados (opcional)
 * @param {string} message - Mensaje opcional
 * @returns {object} - Respuesta HTTP
 */
function created(res, data = null, message = null) {
  return success(res, data, message, 201);
}

/**
 * Respuesta 204 - No Content
 * @param {object} res - Objeto response de Express
 * @returns {object} - Respuesta HTTP
 */
function noContent(res) {
  validateResponse(res);
  return res.status(204).end();
}

/**
 * Respuesta con paginación
 * @param {object} res - Objeto response de Express
 * @param {Array} data - Array de datos
 * @param {number} total - Total de registros
 * @param {number} limit - Límite de registros por página
 * @param {number} offset - Offset de registros
 * @param {number} statusCode - Código de estado HTTP (default: 200)
 * @returns {object} - Respuesta HTTP
 */
function paginated(res, data, total, limit, offset, statusCode = 200) {
  validateResponse(res);
  statusCode = validateStatusCode(statusCode);
  
  // Validar y normalizar parámetros de paginación
  const totalNum = typeof total === 'number' && total >= 0 ? total : 0;
  const limitNum = typeof limit === 'number' && limit > 0 ? limit : 0;
  const offsetNum = typeof offset === 'number' && offset >= 0 ? offset : 0;
  
  // Validar que data sea un array
  const dataArray = Array.isArray(data) ? data : [];
  
  return res.status(statusCode).json({
    success: true,
    data: dataArray,
    paginacion: {
      total: Math.floor(totalNum),
      limit: Math.floor(limitNum),
      offset: Math.floor(offsetNum)
    }
  });
}

/**
 * Respuesta con formato alternativo (para compatibilidad)
 * @param {object} res - Objeto response de Express
 * @param {*} data - Datos a enviar
 * @param {number} statusCode - Código de estado HTTP (default: 200)
 * @returns {object} - Respuesta HTTP
 */
function json(res, data, statusCode = 200) {
  validateResponse(res);
  statusCode = validateStatusCode(statusCode);
  return res.status(statusCode).json(data);
}

module.exports = {
  success,
  error,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  created,
  noContent,
  paginated,
  json,
  createResponse,
  validateResponse,
  validateStatusCode,
  validateMessage
};

