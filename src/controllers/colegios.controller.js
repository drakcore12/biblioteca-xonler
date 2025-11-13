const { pool } = require('../config/database');
const { asyncHandler, handleError } = require('../utils/error-handler');
const { success, notFound, badRequest, created, conflict, paginated } = require('../utils/http-response');
const { validateRequired } = require('../utils/validation-helpers');
const { QueryBuilder } = require('../utils/query-builder');
const { asInteger } = require('../utils/data-helpers');

// GET /colegios - Listar colegios con filtros
const obtenerColegios = asyncHandler(async (req, res) => {
  const { nombre, direccion, limit = 50, offset = 0 } = req.query;
  
  const builder = new QueryBuilder('SELECT id, nombre, direccion FROM colegios');
  
  if (nombre) {
    builder.where('nombre', nombre, 'ILIKE');
  }
  
  if (direccion) {
    builder.where('direccion', direccion, 'ILIKE');
  }
  
  builder.orderBy('nombre', 'ASC');
  builder.paginate(asInteger(limit, 50), asInteger(offset, 0));
  
  const { query, params } = builder.build();
  const result = await pool.query(query, params);
  
  // Obtener total para paginación
  const countBuilder = new QueryBuilder('SELECT COUNT(*) as total FROM colegios');
  if (nombre) countBuilder.where('nombre', nombre, 'ILIKE');
  if (direccion) countBuilder.where('direccion', direccion, 'ILIKE');
  
  const { query: countQuery, params: countParams } = countBuilder.build();
  const countResult = await pool.query(countQuery, countParams);
  
  return paginated(
    res,
    result.rows,
    Number.parseInt(countResult.rows[0].total, 10),
    asInteger(limit, 50),
    asInteger(offset, 0)
  );
}, 'Error al obtener colegios');

// GET /colegios/:id - Obtener colegio por ID
const obtenerColegioPorId = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await pool.query(`
    SELECT id, nombre, direccion
    FROM colegios
    WHERE id = $1
  `, [id]);

  if (result.rows.length === 0) {
    return notFound(res, 'Colegio');
  }

  return success(res, result.rows[0]);
}, 'Error al obtener el colegio');

// POST /colegios - Crear nuevo colegio (admin)
const crearColegio = asyncHandler(async (req, res) => {
  const { nombre, direccion } = req.body;

  const validation = validateRequired(['nombre', 'direccion'], req.body);
  if (!validation.valid) {
    return badRequest(res, validation.error);
  }

  const result = await pool.query(`
    INSERT INTO colegios (nombre, direccion)
    VALUES ($1, $2)
    RETURNING id, nombre, direccion
  `, [nombre, direccion]);

  return created(res, result.rows[0], 'Colegio creado exitosamente');
}, 'Error interno del servidor');

// PUT /colegios/:id - Actualizar colegio (admin)
const actualizarColegio = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nombre, direccion } = req.body;

  const validation = validateRequired(['nombre', 'direccion'], req.body);
  if (!validation.valid) {
    return badRequest(res, validation.error);
  }

  // Verificar si el colegio existe
  const existingColegio = await pool.query(
    'SELECT id FROM colegios WHERE id = $1',
    [id]
  );

  if (existingColegio.rows.length === 0) {
    return notFound(res, 'Colegio');
  }

  const result = await pool.query(`
    UPDATE colegios 
    SET nombre = $1, direccion = $2
    WHERE id = $3
    RETURNING id, nombre, direccion
  `, [nombre, direccion, id]);

  return success(res, result.rows[0], 'Colegio actualizado exitosamente');
}, 'Error interno del servidor');

// DELETE /colegios/:id - Eliminar colegio (admin, con protección)
const eliminarColegio = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verificar si el colegio existe
  const existingColegio = await pool.query(
    'SELECT id FROM colegios WHERE id = $1',
    [id]
  );

  if (existingColegio.rows.length === 0) {
    return notFound(res, 'Colegio');
  }

  // Verificar si hay bibliotecas vinculadas
  const bibliotecasVinculadas = await pool.query(
    'SELECT COUNT(*) as count FROM bibliotecas WHERE colegio_id = $1',
    [id]
  );

  if (Number.parseInt(bibliotecasVinculadas.rows[0].count, 10) > 0) {
    return conflict(res, 'No se puede eliminar el colegio porque tiene bibliotecas vinculadas');
  }

  // Eliminar el colegio
  await pool.query('DELETE FROM colegios WHERE id = $1', [id]);

  return success(res, null, 'Colegio eliminado exitosamente');
}, 'Error interno del servidor');

module.exports = {
  obtenerColegios,
  obtenerColegioPorId,
  crearColegio,
  actualizarColegio,
  eliminarColegio
};
