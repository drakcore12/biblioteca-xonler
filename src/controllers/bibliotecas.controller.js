const { pool } = require('../config/database');

/**
 * GET /api/bibliotecas
 * Query params opcionales: q, colegio_id, limit=50, offset=0
 */
async function obtenerBibliotecas(req, res) {
  try {
    const { q = null, colegio_id = null } = req.query;
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
    const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);

    const sql = `
      SELECT b.id, b.nombre, b.direccion, b.colegio_id,
             c.nombre AS colegio_nombre, c.direccion AS colegio_direccion
      FROM bibliotecas b
      JOIN colegios c ON c.id = b.colegio_id
      WHERE ($1::text IS NULL OR b.nombre ILIKE '%'||$1||'%' OR b.direccion ILIKE '%'||$1||'%')
        AND ($2::bigint IS NULL OR b.colegio_id = $2::bigint)
      ORDER BY b.id
      LIMIT $3 OFFSET $4
    `;
    const { rows } = await pool.query(sql, [q, colegio_id ? Number(colegio_id) : null, limit, offset]);

    // total para paginación (opcional)
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM bibliotecas b
      WHERE ($1::text IS NULL OR b.nombre ILIKE '%'||$1||'%' OR b.direccion ILIKE '%'||$1||'%')
        AND ($2::bigint IS NULL OR b.colegio_id = $2::bigint)
    `;
    const { rows: countRows } = await pool.query(countSql, [q, colegio_id ? Number(colegio_id) : null]);

    res.json({ data: rows, paginacion: { total: countRows[0].total, limit, offset } });
  } catch (e) {
    console.error('❌ obtenerBibliotecas:', e);
    res.status(500).json({ error: 'Error listando bibliotecas' });
  }
}

/**
 * GET /api/bibliotecas/:id
 */
async function obtenerBibliotecaPorId(req, res) {
  try {
    const { id } = req.params;
    const sql = `
      SELECT b.id, b.nombre, b.direccion, b.colegio_id,
             c.nombre AS colegio_nombre, c.direccion AS colegio_direccion
      FROM bibliotecas b
      JOIN colegios c ON c.id = b.colegio_id
      WHERE b.id = $1
    `;
    const { rows } = await pool.query(sql, [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Biblioteca no encontrada' });
    res.json(rows[0]);
  } catch (e) {
    console.error('❌ obtenerBibliotecaPorId:', e);
    res.status(500).json({ error: 'Error obteniendo biblioteca' });
  }
}

/**
 * GET /api/bibliotecas/:id/libros
 * Query params opcionales: q, categoria, limit=50, offset=0
 * Calcula disponibilidad por ejemplar en la biblioteca (no prestado actualmente).
 */
async function obtenerLibrosPorBiblioteca(req, res) {
  try {
    const { id } = req.params;
    const { q = null, categoria = null } = req.query;
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
    const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);

    // Existe la biblioteca?
    const exist = await pool.query('SELECT 1 FROM bibliotecas WHERE id = $1', [id]);
    if (exist.rowCount === 0) return res.status(404).json({ error: 'Biblioteca no encontrada' });

    const sql = `
      SELECT
        bl.id AS biblioteca_libro_id,
        l.id  AS libro_id,
        l.titulo, l.autor, l.isbn, l.imagen_url, l.descripcion, l.categoria,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM prestamos p
            WHERE p.biblioteca_libro_id = bl.id
              AND p.fecha_devolucion IS NULL
          ) THEN false ELSE true
        END AS disponible
      FROM biblioteca_libros bl
      JOIN libros l ON l.id = bl.libro_id
      WHERE bl.biblioteca_id = $1
        AND ($2::text IS NULL OR l.titulo ILIKE '%'||$2||'%' OR l.autor ILIKE '%'||$2||'%' OR l.isbn ILIKE '%'||$2||'%')
        AND ($3::text IS NULL OR l.categoria = $3)
      ORDER BY l.titulo
      LIMIT $4 OFFSET $5
    `;
    const params = [id, q, categoria, limit, offset];
    const { rows } = await pool.query(sql, params);

    // total (opcional)
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM biblioteca_libros bl
      JOIN libros l ON l.id = bl.libro_id
      WHERE bl.biblioteca_id = $1
        AND ($2::text IS NULL OR l.titulo ILIKE '%'||$2||'%' OR l.autor ILIKE '%'||$2||'%' OR l.isbn ILIKE '%'||$2||'%')
        AND ($3::text IS NULL OR l.categoria = $3)
    `;
    const { rows: countRows } = await pool.query(countSql, [id, q, categoria]);

    res.json({ data: rows, paginacion: { total: countRows[0].total, limit, offset } });
  } catch (e) {
    console.error('❌ obtenerLibrosPorBiblioteca:', e);
    res.status(500).json({ error: 'Error listando libros de la biblioteca' });
  }
}

/**
 * POST /api/bibliotecas
 * body: { nombre, direccion?, colegio_id }
 */
async function crearBiblioteca(req, res) {
  try {
    const { nombre, direccion = null, colegio_id } = req.body;
    if (!nombre || !colegio_id) return res.status(400).json({ error: 'nombre y colegio_id son obligatorios' });

    const sql = `
      INSERT INTO bibliotecas (nombre, direccion, colegio_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const { rows } = await pool.query(sql, [nombre, direccion, Number(colegio_id)]);
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error('❌ crearBiblioteca:', e);
    if (e.code === '23503') return res.status(400).json({ error: 'colegio_id no existe' }); // FK
    res.status(500).json({ error: 'Error creando biblioteca' });
  }
}

/**
 * PUT /api/bibliotecas/:id
 * body: { nombre?, direccion?, colegio_id? }
 */
async function actualizarBiblioteca(req, res) {
  try {
    const { id } = req.params;
    const { nombre = null, direccion = null, colegio_id = null } = req.body;

    const sql = `
      UPDATE bibliotecas
      SET nombre    = COALESCE($2, nombre),
          direccion = COALESCE($3, direccion),
          colegio_id= COALESCE($4, colegio_id)
      WHERE id = $1
      RETURNING *
    `;
    const { rows } = await pool.query(sql, [id, nombre, direccion, colegio_id !== null ? Number(colegio_id) : null]);
    if (rows.length === 0) return res.status(404).json({ error: 'Biblioteca no encontrada' });
    res.json(rows[0]);
  } catch (e) {
    console.error('❌ actualizarBiblioteca:', e);
    if (e.code === '23503') return res.status(400).json({ error: 'colegio_id no existe' }); // FK
    res.status(500).json({ error: 'Error actualizando biblioteca' });
  }
}

/**
 * DELETE /api/bibliotecas/:id
 * Bloquea si hay relaciones (biblioteca_libros -> prestamos indirecto)
 */
async function eliminarBiblioteca(req, res) {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    // ¿Tiene libros asociados?
    const rel = await client.query('SELECT 1 FROM biblioteca_libros WHERE biblioteca_id = $1 LIMIT 1', [id]);
    if (rel.rowCount > 0) {
      return res.status(409).json({ error: 'No se puede eliminar: la biblioteca tiene libros asociados' });
    }

    const del = await client.query('DELETE FROM bibliotecas WHERE id = $1 RETURNING id', [id]);
    if (del.rowCount === 0) return res.status(404).json({ error: 'Biblioteca no encontrada' });
    res.status(204).end();
  } catch (e) {
    console.error('❌ eliminarBiblioteca:', e);
    res.status(500).json({ error: 'Error eliminando biblioteca' });
  } finally {
    client.release();
  }
}

module.exports = {
  obtenerBibliotecas,
  obtenerBibliotecaPorId,
  obtenerLibrosPorBiblioteca,
  crearBiblioteca,
  actualizarBiblioteca,
  eliminarBiblioteca
};
