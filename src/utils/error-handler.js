/**
 * Manejo centralizado de errores
 * Elimina duplicación de try-catch en controladores
 */

const AppError = require('./app-error');
const { error } = require('./http-response');
const { logError } = require('../config/logger');

/**
 * Mapeo de códigos de error de PostgreSQL a mensajes amigables y códigos HTTP
 */
const POSTGRES_ERROR_MESSAGES = {
  '42P01': { message: 'Tabla no encontrada', statusCode: 500 },
  '42703': { message: 'Columna no encontrada', statusCode: 500 },
  '23503': { message: 'Violación de clave foránea', statusCode: 400 },
  '23505': { message: 'Violación de restricción única', statusCode: 409 },
  '23502': { message: 'Violación de restricción NOT NULL', statusCode: 400 },
  '23514': { message: 'Violación de restricción CHECK', statusCode: 400 },
  '08003': { message: 'Conexión no existe', statusCode: 503 },
  '08006': { message: 'Error de conexión', statusCode: 503 },
  '08001': { message: 'No se puede establecer conexión', statusCode: 503 },
  '08004': { message: 'Conexión rechazada', statusCode: 503 },
  '08007': { message: 'Transacción abortada', statusCode: 500 },
  '25P02': { message: 'Transacción en progreso', statusCode: 409 },
  '25P03': { message: 'Transacción no iniciada', statusCode: 500 }
};

/**
 * Obtiene un mensaje amigable para un código de error de PostgreSQL
 * @param {string} code - Código de error de PostgreSQL
 * @returns {string} - Mensaje amigable
 */
function getPostgresErrorMessage(code) {
  if (typeof code !== 'string' || code === '') {
    return 'Error de base de datos';
  }
  return POSTGRES_ERROR_MESSAGES[code]?.message || 'Error de base de datos';
}

/**
 * Obtiene el código HTTP apropiado para un error de PostgreSQL
 * @param {string} code - Código de error de PostgreSQL
 * @returns {number} - Código HTTP
 */
function getPostgresErrorStatusCode(code) {
  if (typeof code !== 'string' || code === '') {
    return 500;
  }
  return POSTGRES_ERROR_MESSAGES[code]?.statusCode || 500;
}

/**
 * Valida que res sea un objeto response válido
 */
function validateResponse(res) {
  if (!res || typeof res.status !== 'function' || typeof res.json !== 'function') {
    throw new TypeError('handleError requiere un objeto response válido de Express');
  }
}

/**
 * Valida que err sea un objeto Error
 */
function validateError(err) {
  if (!err) {
    return new Error('Error desconocido');
  }
  return err;
}

/**
 * Maneja errores de forma centralizada
 * @param {object} res - Objeto response de Express
 * @param {Error} err - Error a manejar
 * @param {string} fallbackMessage - Mensaje por defecto si no se puede determinar
 * @param {string} context - Contexto adicional para logging
 * @returns {object} - Respuesta HTTP
 */
function handleError(res, err, fallbackMessage = 'Error interno del servidor', context = '') {
  validateResponse(res);
  err = validateError(err);
  
  // Validar y normalizar mensaje por defecto
  const message = typeof fallbackMessage === 'string' && fallbackMessage.trim() !== ''
    ? fallbackMessage.trim()
    : 'Error interno del servidor';
  
  // Validar y normalizar contexto
  const errorContext = typeof context === 'string' ? context.trim() : '';
  const logContext = errorContext ? `${errorContext}: ` : '';
  
  // Log del error
  logError(`${logContext}${message}`, err);

  // Si es un AppError, devolver directamente
  if (err instanceof AppError) {
    const statusCode = typeof err.statusCode === 'number' && err.statusCode >= 100 && err.statusCode <= 599
      ? err.statusCode
      : 500;
    
    const payload = { error: err.message || message };
    if (err.details !== null && err.details !== undefined) {
      payload.details = err.details;
    }
    return res.status(statusCode).json(payload);
  }

  // Si es un error de PostgreSQL, devolver mensaje amigable con código HTTP apropiado
  if (err.code && typeof err.code === 'string' && POSTGRES_ERROR_MESSAGES[err.code]) {
    const pgMessage = getPostgresErrorMessage(err.code);
    const pgStatusCode = getPostgresErrorStatusCode(err.code);
    return error(res, pgMessage, pgStatusCode);
  }

  // Error genérico
  return error(res, message, 500);
}

/**
 * Wrapper para controladores async que maneja errores automáticamente
 * @param {Function} fn - Función async del controlador
 * @param {string} errorMessage - Mensaje de error por defecto
 * @returns {Function} - Middleware de Express
 */
function asyncHandler(fn, errorMessage = 'Error en la operación') {
  if (typeof fn !== 'function') {
    throw new TypeError('asyncHandler requiere una función');
  }
  
  const defaultMessage = typeof errorMessage === 'string' && errorMessage.trim() !== ''
    ? errorMessage.trim()
    : 'Error en la operación';
  
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      const handlerName = fn.name || 'handler';
      handleError(res, err, defaultMessage, handlerName);
    }
  };
}

/**
 * Wrapper para funciones que retornan promesas
 * @param {Promise} promise - Promesa a manejar
 * @param {string} errorMessage - Mensaje de error por defecto
 * @returns {Promise} - Promesa con manejo de errores
 */
function promiseHandler(promise, errorMessage = 'Error en la operación') {
  if (promise === null || promise === undefined || typeof promise.then !== 'function') {
    throw new TypeError('promiseHandler requiere una Promise');
  }
  
  const defaultMessage = typeof errorMessage === 'string' && errorMessage.trim() !== ''
    ? errorMessage.trim()
    : 'Error en la operación';
  
  return promise
    .catch(err => {
      if (err instanceof AppError) {
        throw err;
      }
      const errMessage = err?.message;
      throw new AppError(defaultMessage, 500, errMessage);
    });
}

module.exports = {
  handleError,
  asyncHandler,
  promiseHandler,
  getPostgresErrorMessage,
  getPostgresErrorStatusCode,
  validateResponse,
  validateError,
  POSTGRES_ERROR_MESSAGES
};

