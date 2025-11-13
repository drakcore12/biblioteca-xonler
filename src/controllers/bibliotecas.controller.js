const { pool } = require('../config/database');
const AppError = require('../utils/app-error');

/**
 * GET /api/bibliotecas
 * Query params opcionales: q, colegio_id, limit=50, offset=0
 */
async function obtenerBibliotecas(req, res) {
  try {
    const { q = null, colegio_id = null } = req.query;
    const limit = Math.min(Number.parseInt(req.query.limit ?? '50', 10), 100);
    const offset = Math.max(Number.parseInt(req.query.offset ?? '0', 10), 0);

    // Normalizar parámetros de búsqueda
    const searchTerm = q && q.trim() ? q.trim() : null;
    const colegioIdValue = colegio_id ? Number.parseInt(colegio_id, 10) : null;

    // Construir condiciones WHERE dinámicamente para evitar problemas con NULL
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (searchTerm) {
      conditions.push(`(b.nombre ILIKE $${paramIndex} OR b.direccion ILIKE $${paramIndex})`);
      params.push(`%${searchTerm}%`);
      paramIndex++;
    }

    if (colegioIdValue !== null) {
      conditions.push(`b.colegio_id = $${paramIndex}`);
      params.push(colegioIdValue);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT b.id, b.nombre, b.direccion, b.colegio_id,
             c.nombre AS colegio_nombre, c.direccion AS colegio_direccion,
             COALESCE(admin_count.total_admins, 0) AS total_admins,
             COALESCE(libros_count.total_libros, 0) AS total_libros
      FROM public.bibliotecas b
      LEFT JOIN public.colegios c ON c.id = b.colegio_id
      LEFT JOIN (
        SELECT biblioteca_id, COUNT(*) AS total_admins
        FROM public.usuario_biblioteca
        GROUP BY biblioteca_id
      ) admin_count ON admin_count.biblioteca_id = b.id
      LEFT JOIN (
        SELECT biblioteca_id, COUNT(*) AS total_libros
        FROM public.biblioteca_libros
        GROUP BY biblioteca_id
      ) libros_count ON libros_count.biblioteca_id = b.id
      ${whereClause}
      ORDER BY b.id
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);
    const { rows } = await pool.query(sql, params);

    // total para paginación (opcional)
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM public.bibliotecas b
      ${whereClause}
    `;
    const countParams = params.slice(0, -2); // Remover limit y offset
    const { rows: countRows } = await pool.query(countSql, countParams);

    res.json({ data: rows, paginacion: { total: countRows[0]?.total || 0, limit, offset } });
  } catch (e) {
    console.error('❌ obtenerBibliotecas:', e?.message || e);
    console.error('Stack:', e?.stack);
    
    // Detectar errores de conexión a la base de datos
    if (e?.code === '28P01' || e?.message?.includes('password') || e?.message?.includes('autentificación')) {
      console.error('🔴 Error de autenticación con PostgreSQL. Verifica las credenciales en .env');
      return res.status(500).json({ 
        error: 'Error de conexión a la base de datos',
        details: process.env.NODE_ENV === 'development' ? 'Verifica DB_USER, DB_PASSWORD y que PostgreSQL esté corriendo' : undefined
      });
    }
    
    if (e?.code === 'ECONNREFUSED' || e?.message?.includes('connect')) {
      console.error('🔴 No se puede conectar a PostgreSQL. Verifica que el servidor esté corriendo.');
      return res.status(500).json({ 
        error: 'Error de conexión a la base de datos',
        details: process.env.NODE_ENV === 'development' ? 'Verifica DB_HOST, DB_PORT y que PostgreSQL esté corriendo' : undefined
      });
    }
    
    if (e instanceof AppError) {
      return res.status(e.statusCode).json({ error: e.message });
    }
    
    res.status(500).json({ error: 'Error listando bibliotecas', details: process.env.NODE_ENV === 'development' ? e.message : undefined });
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
             c.nombre AS colegio_nombre, c.direccion AS colegio_direccion,
             COALESCE(admin_count.total_admins, 0) AS total_admins,
             COALESCE(libros_count.total_libros, 0) AS total_libros
      FROM public.bibliotecas b
      LEFT JOIN public.colegios c ON c.id = b.colegio_id
      LEFT JOIN (
        SELECT biblioteca_id, COUNT(*) AS total_admins
        FROM public.usuario_biblioteca
        GROUP BY biblioteca_id
      ) admin_count ON admin_count.biblioteca_id = b.id
      LEFT JOIN (
        SELECT biblioteca_id, COUNT(*) AS total_libros
        FROM public.biblioteca_libros
        GROUP BY biblioteca_id
      ) libros_count ON libros_count.biblioteca_id = b.id
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
    const limit = Math.min(Number.parseInt(req.query.limit ?? '50', 10), 100);
    const offset = Math.max(Number.parseInt(req.query.offset ?? '0', 10), 0);

    // Existe la biblioteca?
    const exist = await pool.query('SELECT 1 FROM public.bibliotecas WHERE id = $1', [id]);
    if (exist.rowCount === 0) return res.status(404).json({ error: 'Biblioteca no encontrada' });

    const sql = `
      SELECT
        bl.id AS biblioteca_libro_id,
        l.id  AS libro_id,
        l.titulo, l.autor, l.isbn, l.imagen_url, l.descripcion, l.categoria,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM public.prestamos p
            WHERE p.biblioteca_libro_id = bl.id
              AND p.fecha_devolucion IS NULL
          ) THEN false ELSE true
        END AS disponible
      FROM public.biblioteca_libros bl
      JOIN public.libros l ON l.id = bl.libro_id
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
      FROM public.biblioteca_libros bl
      JOIN public.libros l ON l.id = bl.libro_id
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
      INSERT INTO public.bibliotecas (nombre, direccion, colegio_id)
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
      UPDATE public.bibliotecas
      SET nombre    = COALESCE($2, nombre),
          direccion = COALESCE($3, direccion),
          colegio_id= COALESCE($4, colegio_id)
      WHERE id = $1
      RETURNING *
    `;
    const colegioIdValue = colegio_id === null ? null : Number(colegio_id);
    const { rows } = await pool.query(sql, [id, nombre, direccion, colegioIdValue]);
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
    const rel = await client.query('SELECT 1 FROM public.biblioteca_libros WHERE biblioteca_id = $1 LIMIT 1', [id]);
    if (rel.rowCount > 0) {
      return res.status(409).json({ error: 'No se puede eliminar: la biblioteca tiene libros asociados' });
    }

    const del = await client.query('DELETE FROM public.bibliotecas WHERE id = $1 RETURNING id', [id]);
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
