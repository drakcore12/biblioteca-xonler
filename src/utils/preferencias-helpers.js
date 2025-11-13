/**
 * Utilidades para manejo de preferencias de usuario
 * Elimina duplicación en preferencias.controller.js
 */

const { pool } = require('../config/database');
const { badRequest, success, notFound, error: errorResponse } = require('./http-response');
const { asyncHandler } = require('./error-handler');

/**
 * Valores por defecto de preferencias
 */
const DEFAULT_PREFERENCES = {
  idioma: 'es',
  tema: 'auto',
  tamanoFuente: 'medium',
  maxResultados: '20',
  categoriasFavoritas: ['ficcion', 'ciencia'],
  emailPrestamos: true,
  emailNuevosLibros: true,
  emailEventos: false,
  appPrestamos: true,
  appRecomendaciones: true,
  appMantenimiento: false
};

/**
 * Valida las preferencias del usuario
 * @param {object} preferencias - Objeto con preferencias a validar
 * @returns {{valid: boolean, error?: string}} - Resultado de la validación
 */
function validatePreferences(preferencias) {
  if (preferencias.idioma && !['es', 'en', 'fr'].includes(preferencias.idioma)) {
    return { valid: false, error: 'Idioma no válido' };
  }
  
  if (preferencias.tema && !['auto', 'light', 'dark'].includes(preferencias.tema)) {
    return { valid: false, error: 'Tema no válido' };
  }
  
  if (preferencias.tamanoFuente && !['small', 'medium', 'large'].includes(preferencias.tamanoFuente)) {
    return { valid: false, error: 'Tamaño de fuente no válido' };
  }
  
  if (preferencias.maxResultados && !['10', '20', '50', '100'].includes(preferencias.maxResultados)) {
    return { valid: false, error: 'Máximo de resultados no válido' };
  }
  
  return { valid: true };
}

/**
 * Obtiene preferencias de un usuario
 * @param {number} userId - ID del usuario
 * @returns {Promise<object|null>} - Preferencias o null si no existen
 */
async function getPreferencesByUserId(userId) {
  const query = `
    SELECT p.* 
    FROM preferencias p 
    WHERE p.usuario_id = $1
  `;
  const result = await pool.query(query, [userId]);
  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Crea preferencias por defecto para un usuario
 * @param {number} userId - ID del usuario
 * @returns {Promise<object>} - Preferencias creadas
 */
async function createDefaultPreferences(userId) {
  const insertQuery = `
    INSERT INTO preferencias (usuario_id, idioma, tema, tamano_fuente, max_resultados, 
                            categorias_favoritas, email_prestamos, email_nuevos_libros, 
                            email_eventos, app_prestamos, app_recomendaciones, app_mantenimiento)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `;
  
  const result = await pool.query(insertQuery, [
    userId,
    DEFAULT_PREFERENCES.idioma,
    DEFAULT_PREFERENCES.tema,
    DEFAULT_PREFERENCES.tamanoFuente,
    DEFAULT_PREFERENCES.maxResultados,
    DEFAULT_PREFERENCES.categoriasFavoritas,
    DEFAULT_PREFERENCES.emailPrestamos,
    DEFAULT_PREFERENCES.emailNuevosLibros,
    DEFAULT_PREFERENCES.emailEventos,
    DEFAULT_PREFERENCES.appPrestamos,
    DEFAULT_PREFERENCES.appRecomendaciones,
    DEFAULT_PREFERENCES.appMantenimiento
  ]);
  
  return result.rows[0];
}

/**
 * Inserta o actualiza preferencias (upsert)
 * @param {number} userId - ID del usuario
 * @param {object} preferencias - Preferencias a guardar
 * @returns {Promise<object>} - Preferencias guardadas
 */
async function upsertPreferences(userId, preferencias) {
  // Verificar si ya existen preferencias
  const checkQuery = 'SELECT id FROM preferencias WHERE usuario_id = $1';
  const checkResult = await pool.query(checkQuery, [userId]);
  
  const {
    idioma,
    tema,
    tamanoFuente,
    maxResultados,
    categoriasFavoritas,
    emailPrestamos,
    emailNuevosLibros,
    emailEventos,
    appPrestamos,
    appRecomendaciones,
    appMantenimiento
  } = preferencias;
  
  if (checkResult.rows.length === 0) {
    // Crear nuevas preferencias
    const insertQuery = `
      INSERT INTO preferencias (usuario_id, idioma, tema, tamano_fuente, max_resultados, 
                              categorias_favoritas, email_prestamos, email_nuevos_libros, 
                              email_eventos, app_prestamos, app_recomendaciones, app_mantenimiento)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    
    const result = await pool.query(insertQuery, [
      userId,
      idioma || DEFAULT_PREFERENCES.idioma,
      tema || DEFAULT_PREFERENCES.tema,
      tamanoFuente || DEFAULT_PREFERENCES.tamanoFuente,
      maxResultados || DEFAULT_PREFERENCES.maxResultados,
      categoriasFavoritas || DEFAULT_PREFERENCES.categoriasFavoritas,
      emailPrestamos ?? DEFAULT_PREFERENCES.emailPrestamos,
      emailNuevosLibros ?? DEFAULT_PREFERENCES.emailNuevosLibros,
      emailEventos ?? DEFAULT_PREFERENCES.emailEventos,
      appPrestamos ?? DEFAULT_PREFERENCES.appPrestamos,
      appRecomendaciones ?? DEFAULT_PREFERENCES.appRecomendaciones,
      appMantenimiento ?? DEFAULT_PREFERENCES.appMantenimiento
    ]);
    
    return result.rows[0];
  } else {
    // Actualizar preferencias existentes
    const updateQuery = `
      UPDATE preferencias 
      SET idioma = COALESCE($2, idioma),
          tema = COALESCE($3, tema),
          tamano_fuente = COALESCE($4, tamano_fuente),
          max_resultados = COALESCE($5, max_resultados),
          categorias_favoritas = COALESCE($6, categorias_favoritas),
          email_prestamos = COALESCE($7, email_prestamos),
          email_nuevos_libros = COALESCE($8, email_nuevos_libros),
          email_eventos = COALESCE($9, email_eventos),
          app_prestamos = COALESCE($10, app_prestamos),
          app_recomendaciones = COALESCE($11, app_recomendaciones),
          app_mantenimiento = COALESCE($12, app_mantenimiento),
          updated_at = CURRENT_TIMESTAMP
      WHERE usuario_id = $1
      RETURNING *
    `;
    
    const result = await pool.query(updateQuery, [
      userId,
      idioma,
      tema,
      tamanoFuente,
      maxResultados,
      categoriasFavoritas,
      emailPrestamos,
      emailNuevosLibros,
      emailEventos,
      appPrestamos,
      appRecomendaciones,
      appMantenimiento
    ]);
    
    return result.rows[0];
  }
}

module.exports = {
  DEFAULT_PREFERENCES,
  validatePreferences,
  getPreferencesByUserId,
  createDefaultPreferences,
  upsertPreferences
};

