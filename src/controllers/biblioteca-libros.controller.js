const { pool } = require('../config/database');
const { QueryBuilder, getDisponibilidadSQL } = require('../utils/query-builder');
const { success, notFound, badRequest, conflict, created, error: errorResponse } = require('../utils/http-response');
const { asyncHandler } = require('../utils/error-handler');
const { paginated } = require('../utils/http-response');

// GET /biblioteca-libros - Listar ejemplares con filtros
const obtenerBibliotecaLibros = asyncHandler(async (req, res) => {
  const { biblioteca_id, libro_id, limit = 50, offset = 0 } = req.query;
  
  const baseQuery = `
    SELECT 
      bl.id, bl.biblioteca_id, bl.libro_id,
      b.nombre as biblioteca_nombre,
      c.nombre as colegio_nombre,
      l.titulo, l.autor, l.isbn, l.categoria,
      l.anio_publicacion, l.editorial, l.imagen_url,
      ${getDisponibilidadSQL('bl')},
      bl.created_at, bl.updated_at
    FROM biblioteca_libros bl
    JOIN bibliotecas b ON bl.biblioteca_id = b.id
    JOIN colegios c ON b.colegio_id = c.id
    JOIN libros l ON bl.libro_id = l.id
  `;
  
  const builder = new QueryBuilder(baseQuery);
  
  if (biblioteca_id) {
    builder.where('bl.biblioteca_id', biblioteca_id);
  }
  
  if (libro_id) {
    builder.where('bl.libro_id', libro_id);
  }
  
  builder.orderBy('l.titulo, b.nombre', 'ASC');
  builder.paginate(Number.parseInt(limit, 10), Number.parseInt(offset, 10));
  
  const { query, params } = builder.build();
  const { query: countQuery, params: countParams } = builder.buildCount();
  
  const [result, countResult] = await Promise.all([
    pool.query(query, params),
    pool.query(countQuery, countParams)
  ]);
  
  const total = Number.parseInt(countResult.rows[0].count || countResult.rows[0].total, 10);
  
  return paginated(res, result.rows, total, Number.parseInt(limit, 10), Number.parseInt(offset, 10));
});

// GET /biblioteca-libros/:id - Obtener ejemplar por ID
const obtenerBibliotecaLibroPorId = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await pool.query(`
    SELECT 
      bl.id, bl.biblioteca_id, bl.libro_id,
      b.nombre as biblioteca_nombre, b.direccion as biblioteca_direccion,
      c.nombre as colegio_nombre,
      l.titulo, l.autor, l.isbn, l.categoria,
      l.anio_publicacion, l.editorial, l.imagen_url,
      ${getDisponibilidadSQL('bl')},
      bl.created_at, bl.updated_at
    FROM biblioteca_libros bl
    JOIN bibliotecas b ON bl.biblioteca_id = b.id
    JOIN colegios c ON b.colegio_id = c.id
    JOIN libros l ON bl.libro_id = l.id
    WHERE bl.id = $1
  `, [id]);

  if (result.rows.length === 0) {
    return notFound(res, 'Ejemplar no encontrado');
  }

  // Obtener historial de préstamos para este ejemplar
  const prestamosResult = await pool.query(`
    SELECT 
      p.id, p.fecha_prestamo, p.fecha_devolucion,
      u.nombre, u.apellido, u.email
    FROM prestamos p
    JOIN usuarios u ON p.usuario_id = u.id
    WHERE p.biblioteca_libro_id = $1
    ORDER BY p.fecha_prestamo DESC
    LIMIT 10
  `, [id]);

  const ejemplar = result.rows[0];
  ejemplar.historial_prestamos = prestamosResult.rows;

  return success(res, ejemplar);
});

// POST /biblioteca-libros - Asignar libro a biblioteca (admin)
const crearBibliotecaLibro = asyncHandler(async (req, res) => {
  const { biblioteca_id, libro_id } = req.body;

  if (!biblioteca_id || !libro_id) {
    return badRequest(res, 'biblioteca_id y libro_id son obligatorios');
  }

  // Verificar que la biblioteca existe
  const bibliotecaExists = await pool.query(
    'SELECT id FROM bibliotecas WHERE id = $1',
    [biblioteca_id]
  );

  if (bibliotecaExists.rows.length === 0) {
    return badRequest(res, 'La biblioteca especificada no existe');
  }

  // Verificar que el libro existe
  const libroExists = await pool.query(
    'SELECT id FROM libros WHERE id = $1',
    [libro_id]
  );

  if (libroExists.rows.length === 0) {
    return badRequest(res, 'El libro especificado no existe');
  }

  // Verificar que no existe ya esta combinación (unicidad)
  const existingCombination = await pool.query(
    'SELECT id FROM biblioteca_libros WHERE biblioteca_id = $1 AND libro_id = $2',
    [biblioteca_id, libro_id]
  );

  if (existingCombination.rows.length > 0) {
    return conflict(res, 'Este libro ya está asignado a esta biblioteca');
  }

  const result = await pool.query(`
    INSERT INTO biblioteca_libros (biblioteca_id, libro_id)
    VALUES ($1, $2)
    RETURNING id, biblioteca_id, libro_id, created_at, updated_at
  `, [biblioteca_id, libro_id]);

  // Obtener información completa del ejemplar creado
  const ejemplarCompleto = await pool.query(`
    SELECT 
      bl.id, bl.biblioteca_id, bl.libro_id,
      b.nombre as biblioteca_nombre,
      c.nombre as colegio_nombre,
      l.titulo, l.autor, l.isbn, l.categoria,
      bl.created_at, bl.updated_at
    FROM biblioteca_libros bl
    JOIN bibliotecas b ON bl.biblioteca_id = b.id
    JOIN colegios c ON b.colegio_id = c.id
    JOIN libros l ON bl.libro_id = l.id
    WHERE bl.id = $1
  `, [result.rows[0].id]);

  return created(res, ejemplarCompleto.rows[0], 'Libro asignado a la biblioteca exitosamente');
});

// DELETE /biblioteca-libros/:id - Eliminar ejemplar (admin, con protección)
const eliminarBibliotecaLibro = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verificar si el ejemplar existe
  const existingEjemplar = await pool.query(
    'SELECT id FROM biblioteca_libros WHERE id = $1',
    [id]
  );

  if (existingEjemplar.rows.length === 0) {
    return notFound(res, 'Ejemplar no encontrado');
  }

  // Verificar si hay préstamos activos para este ejemplar
  const prestamosActivos = await pool.query(
    'SELECT COUNT(*) as count FROM prestamos WHERE biblioteca_libro_id = $1 AND fecha_devolucion IS NULL',
    [id]
  );

  if (Number.parseInt(prestamosActivos.rows[0].count, 10) > 0) {
    return badRequest(res, 'No se puede eliminar el ejemplar porque tiene préstamos activos');
  }

  // Verificar si hay préstamos históricos (opcional, para auditoría)
  const prestamosHistoricos = await pool.query(
    'SELECT COUNT(*) as count FROM prestamos WHERE biblioteca_libro_id = $1',
    [id]
  );

  if (Number.parseInt(prestamosHistoricos.rows[0].count, 10) > 0) {
    // Si hay préstamos históricos, solo marcar como eliminado en lugar de borrar
    await pool.query(`
      UPDATE biblioteca_libros 
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [id]);

    return success(res, null, 'Ejemplar marcado como eliminado (tiene historial de préstamos)');
  }

  // Si no hay préstamos, eliminar completamente
  await pool.query('DELETE FROM biblioteca_libros WHERE id = $1', [id]);

  return success(res, null, 'Ejemplar eliminado exitosamente');
});

// GET /biblioteca-libros/:id/disponibilidad - Verificar disponibilidad
const verificarDisponibilidad = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await pool.query(`
    SELECT 
      bl.id,
      l.titulo, l.autor,
      b.nombre as biblioteca_nombre,
      ${getDisponibilidadSQL('bl')},
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM prestamos p 
          WHERE p.biblioteca_libro_id = bl.id 
          AND p.fecha_devolucion IS NULL
        ) THEN (
          SELECT p.fecha_prestamo + INTERVAL '15 days'
          FROM prestamos p 
          WHERE p.biblioteca_libro_id = bl.id 
          AND p.fecha_devolucion IS NULL
        )
        ELSE NULL
      END as fecha_estimada_devolucion
    FROM biblioteca_libros bl
    JOIN libros l ON bl.libro_id = l.id
    JOIN bibliotecas b ON bl.biblioteca_id = b.id
    WHERE bl.id = $1
  `, [id]);

  if (result.rows.length === 0) {
    return notFound(res, 'Ejemplar no encontrado');
  }

  return success(res, result.rows[0]);
});

module.exports = {
  obtenerBibliotecaLibros,
  obtenerBibliotecaLibroPorId,
  crearBibliotecaLibro,
  eliminarBibliotecaLibro,
  verificarDisponibilidad
};
