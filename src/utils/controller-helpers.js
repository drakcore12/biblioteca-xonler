/**
 * Utilidades comunes para controladores
 * Elimina duplicación en controladores CRUD simples
 */

const { pool } = require('../config/database');
const { success, notFound, error: errorResponse } = require('./http-response');
const { asyncHandler } = require('./error-handler');

/**
 * Obtiene todos los registros de una tabla
 * @param {string} tableName - Nombre de la tabla
 * @param {string} selectFields - Campos a seleccionar (default: '*')
 * @param {string} orderBy - Campo para ordenar (default: 'id')
 * @returns {Function} - Controlador async
 */
function getAllRecords(tableName, selectFields = '*', orderBy = 'id') {
  return asyncHandler(async (req, res) => {
    const query = `SELECT ${selectFields} FROM ${tableName} ORDER BY ${orderBy}`;
    const result = await pool.query(query);
    return success(res, result.rows);
  });
}

/**
 * Obtiene un registro por ID
 * @param {string} tableName - Nombre de la tabla
 * @param {string} selectFields - Campos a seleccionar (default: '*')
 * @param {string} idField - Nombre del campo ID (default: 'id')
 * @returns {Function} - Controlador async
 */
function getRecordById(tableName, selectFields = '*', idField = 'id') {
  return asyncHandler(async (req, res) => {
    const { id } = req.params;
    const query = `SELECT ${selectFields} FROM ${tableName} WHERE ${idField} = $1`;
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return notFound(res, `${tableName} no encontrado`);
    }
    
    return success(res, result.rows[0]);
  });
}

/**
 * Crea un helper para controladores CRUD simples
 * @param {string} tableName - Nombre de la tabla
 * @param {object} options - Opciones de configuración
 * @returns {object} - Objeto con funciones CRUD
 */
function createCrudController(tableName, options = {}) {
  const {
    selectFields = '*',
    orderBy = 'id',
    idField = 'id'
  } = options;
  
  return {
    getAll: getAllRecords(tableName, selectFields, orderBy),
    getById: getRecordById(tableName, selectFields, idField)
  };
}

module.exports = {
  getAllRecords,
  getRecordById,
  createCrudController
};

