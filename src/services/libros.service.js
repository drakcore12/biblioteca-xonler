const { pool } = require('../config/database');
const AppError = require('../utils/app-error');

const DEFAULT_LIMIT = 9;
const MAX_LIMIT = 100;
const DEFAULT_ORDER = 'popularidad';

const ORDER_BY_MAPPINGS = {
  popularidad: 'b.popularidad DESC, b.titulo ASC',
  recientes: 'b.id DESC',
  autor: 'b.autor ASC, b.titulo ASC',
  titulo: 'b.titulo ASC'
};

function parseCategorias(queryCategorias, legacyCategoria) {
  const categorias = [];

  if (Array.isArray(queryCategorias)) {
    categorias.push(...queryCategorias);
  } else if (typeof queryCategorias === 'string' && queryCategorias.trim()) {
    categorias.push(...queryCategorias.split(',').map(cat => cat.trim()));
  }

  if (!categorias.length && legacyCategoria) {
    if (Array.isArray(legacyCategoria)) {
      categorias.push(...legacyCategoria);
    } else if (typeof legacyCategoria === 'string' && legacyCategoria.trim()) {
      categorias.push(legacyCategoria.trim());
    }
  }

  return categorias
    .map(cat => (typeof cat === 'string' ? cat.trim() : ''))
    .filter(Boolean);
}

function normalizeLimit(limit) {
  const parsed = Number.parseInt(limit, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}

function normalizeOffset(offset) {
  const parsed = Number.parseInt(offset, 10);
  if (Number.isNaN(parsed) || parsed < 0) return 0;
  return parsed;
}

function parseDisponibilidad(value) {
  if (value === 'disponibles') return true;
  if (value === 'no_disponibles') return false;
  return null;
}

function normalizeOrder(order) {
  if (typeof order !== 'string') return DEFAULT_ORDER;
  const lower = order.toLowerCase();
  return ORDER_BY_MAPPINGS[lower] ? lower : DEFAULT_ORDER;
}

function buildWhereClause({ searchTerm, categorias, disponibilidad, bibliotecaId }) {
  const clauses = [];
  const params = [];
  let index = 1;

  if (searchTerm) {
    clauses.push(`(l.titulo ILIKE '%'||$${index}||'%' OR l.autor ILIKE '%'||$${index}||'%' OR l.isbn ILIKE '%'||$${index}||'%')`);
    params.push(searchTerm);
    index += 1;
  }

  if (Array.isArray(categorias) && categorias.length > 0) {
    const categoriaPlaceholders = categorias
      .map((_, idx) => `lower(l.categoria) = lower($${index + idx})`)
      .join(' OR ');
    clauses.push(`(${categoriaPlaceholders})`);
    for (const cat of categorias) {
      params.push(cat);
    }
    index += categorias.length;
  }

  if (disponibilidad !== null) {
    clauses.push(`l.disponibilidad = $${index}`);
    params.push(disponibilidad);
    index += 1;
  }

  if (bibliotecaId !== null && bibliotecaId !== undefined) {
    clauses.push(`bl.biblioteca_id = $${index}`);
    params.push(bibliotecaId);
    index += 1;
  }

  return {
    whereClause: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    params
  };
}

function normalizeLibroFilters(query = {}) {
  const {
    q = null,
    disponibilidad = null,
    orden = DEFAULT_ORDER,
    limit = DEFAULT_LIMIT,
    offset = 0,
    categorias = null,
    categoria = null,
    biblioteca_id = null
  } = query;

  const searchTerm = typeof q === 'string' && q.trim() ? q.trim() : null;
  const categoriaFinal = parseCategorias(categorias, categoria);
  const disponibilidadValue = parseDisponibilidad(disponibilidad);
  
  // Normalizar biblioteca_id: conservar 0 como valor válido, filtrar NaN
  let bibliotecaId = null;
  if (biblioteca_id !== null && biblioteca_id !== undefined && biblioteca_id !== 'todas') {
    const parsedBib = Number(biblioteca_id);
    bibliotecaId = Number.isFinite(parsedBib) ? parsedBib : null;
  }
  
  const order = normalizeOrder(orden);

  return {
    searchTerm,
    categorias: categoriaFinal,
    disponibilidad: disponibilidadValue,
    bibliotecaId,
    order,
    limit: normalizeLimit(limit),
    offset: normalizeOffset(offset)
  };
}

async function searchLibros(query) {
  const filters = normalizeLibroFilters(query);
  const { whereClause, params } = buildWhereClause(filters);
  const orderBy = ORDER_BY_MAPPINGS[filters.order];
  const limitParamIndex = params.length + 1;
  const offsetParamIndex = params.length + 2;

  const sql = `
    WITH base AS (
      SELECT
        l.id, l.titulo, l.autor, l.isbn,
        l.imagen_url, l.descripcion, l.categoria,
        l.disponibilidad,
        COALESCE(COUNT(p.id), 0)::int AS popularidad
      FROM public.libros l
      LEFT JOIN public.biblioteca_libros bl ON bl.libro_id = l.id
      LEFT JOIN public.prestamos p ON p.biblioteca_libro_id = bl.id
      ${whereClause}
      GROUP BY l.id, l.titulo, l.autor, l.isbn, l.imagen_url, l.descripcion, l.categoria, l.disponibilidad
    )
    SELECT b.*
    FROM base b
    ORDER BY ${orderBy}
    LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex};
  `;

  const finalParams = [...params, filters.limit, filters.offset];
  const { rows } = await pool.query(sql, finalParams);

  const countSql = `
    SELECT COUNT(*)::int AS total
    FROM (
      SELECT l.id
      FROM public.libros l
      LEFT JOIN public.biblioteca_libros bl ON bl.libro_id = l.id
      LEFT JOIN public.prestamos p ON p.biblioteca_libro_id = bl.id
      ${whereClause}
      GROUP BY l.id
    ) t
  `;

  const { rows: countRows } = await pool.query(countSql, params);
  const total = countRows[0]?.total || 0;

  return {
    data: rows,
    paginacion: {
      total,
      limit: filters.limit,
      offset: filters.offset
    }
  };
}

async function findLibroById(id) {
  const { rows } = await pool.query(
    `
      SELECT l.id, l.titulo, l.autor, l.isbn,
             l.imagen_url, l.descripcion, l.categoria,
             l.disponibilidad
      FROM public.libros l
      WHERE l.id = $1
    `,
    [id]
  );

  return rows[0] || null;
}

async function ensureLibroExists(id) {
  const libro = await findLibroById(id);
  if (!libro) {
    throw new AppError('Libro no encontrado', 404);
  }
  return libro;
}

async function ensureIsbnUnique(isbn, excludeId = null) {
  if (!isbn) return;

  const params = [isbn];
  let queryText = 'SELECT id FROM public.libros WHERE isbn = $1';

  if (excludeId) {
    params.push(excludeId);
    queryText += ' AND id != $2';
  }

  const { rowCount } = await pool.query(queryText, params);
  if (rowCount > 0) {
    throw new AppError('Ya existe un libro con ese ISBN', 409);
  }
}

async function createLibro(payload) {
  const { titulo, autor, isbn, categoria, imagen_url, descripcion } = payload;

  if (!titulo || !autor) {
    throw new AppError('Título y autor son obligatorios', 400);
  }

  await ensureIsbnUnique(isbn);
  const categoriaFinal = categoria || 'Otros';

  const { rows } = await pool.query(
    `
      INSERT INTO public.libros (titulo, autor, isbn, categoria, imagen_url, descripcion, disponibilidad)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING id, titulo, autor, isbn, categoria, imagen_url, descripcion, disponibilidad
    `,
    [titulo, autor, isbn, categoriaFinal, imagen_url, descripcion]
  );

  return rows[0];
}

async function updateLibro(id, payload) {
  const { titulo, autor, isbn, categoria, imagen_url, descripcion, disponibilidad } = payload;

  if (!titulo || !autor) {
    throw new AppError('Título y autor son obligatorios', 400);
  }

  await ensureLibroExists(id);
  await ensureIsbnUnique(isbn, id);

  const { rows } = await pool.query(
    `
      UPDATE public.libros
      SET titulo = $1, autor = $2, isbn = $3, categoria = $4,
          imagen_url = $5, descripcion = $6, disponibilidad = $7
      WHERE id = $8
      RETURNING id, titulo, autor, isbn, categoria, imagen_url, descripcion, disponibilidad
    `,
    [titulo, autor, isbn, categoria, imagen_url, descripcion, disponibilidad, id]
  );

  return rows[0];
}

async function deleteLibro(id) {
  await ensureLibroExists(id);

  const { rows } = await pool.query(
    `
      SELECT COUNT(*)::int AS count
      FROM public.prestamos p
      JOIN public.biblioteca_libros bl ON bl.id = p.biblioteca_libro_id
      WHERE bl.libro_id = $1
    `,
    [id]
  );

  if (rows[0]?.count > 0) {
    throw new AppError('No se puede eliminar: tiene préstamos asociados', 400);
  }

  await pool.query('DELETE FROM public.biblioteca_libros WHERE libro_id = $1', [id]);
  await pool.query('DELETE FROM public.libros WHERE id = $1', [id]);
}

async function updateLibroImage(id, imagePath) {
  await ensureLibroExists(id);

  const { rows } = await pool.query(
    `
      UPDATE public.libros
      SET imagen_url = $1
      WHERE id = $2
      RETURNING id, titulo, imagen_url
    `,
    [imagePath, id]
  );

  return rows[0];
}

function buildRecommendationSql({ includeFavorites }) {
  const categoryFilter = includeFavorites
    ? `AND (
          CASE
            WHEN cardinality($1::text[]) = 0 THEN true
            ELSE lower(l.categoria) = ANY(SELECT lower(unnest($1::text[])))
          END
        )`
    : 'AND NOT (lower(l.categoria) = ANY(SELECT lower(unnest($1::text[]))))';

  const scoreBase = includeFavorites ? '10 + ' : '';

  return `
    WITH disponibles AS (
      SELECT DISTINCT l.id
      FROM public.libros l
      JOIN public.biblioteca_libros bl ON bl.libro_id = l.id
      WHERE NOT EXISTS (
        SELECT 1 FROM public.prestamos p
        WHERE p.biblioteca_libro_id = bl.id
          AND p.fecha_devolucion IS NULL
      )
      ${categoryFilter}
    ),
    pop AS (
      SELECT bl.libro_id, COUNT(*) AS total
      FROM public.prestamos p
      JOIN public.biblioteca_libros bl ON bl.id = p.biblioteca_libro_id
      GROUP BY bl.libro_id
    ),
    ya_leidos AS (
      SELECT DISTINCT bl.libro_id
      FROM public.prestamos p
      JOIN public.biblioteca_libros bl ON bl.id = p.biblioteca_libro_id
      WHERE p.usuario_id = $2
    )
    SELECT
      l.*,
      TRUE AS disponible,
      ${scoreBase}COALESCE((SELECT 0.1 * total FROM pop WHERE pop.libro_id = l.id), 0) AS score,
      EXISTS(SELECT 1 FROM ya_leidos yl WHERE yl.libro_id = l.id) AS ya_leido
    FROM public.libros l
    JOIN disponibles d ON d.id = l.id
    ORDER BY score DESC, RANDOM()
    LIMIT $3
  `;
}

async function obtenerRecomendaciones(userId) {
  if (!userId) {
    throw new AppError('Usuario no autenticado', 401);
  }

  const usuario = await pool.query(
    'SELECT preferencias FROM public.usuarios WHERE id = $1',
    [userId]
  );

  if (!usuario.rowCount) {
    throw new AppError('Usuario no encontrado', 404);
  }

  const preferencias = usuario.rows[0].preferencias || {};
  const categorias = Array.isArray(preferencias.categoriasFavoritas)
    ? preferencias.categoriasFavoritas
        .filter(v => typeof v === 'string')
        .map(v => v.trim().toLowerCase())
        .filter(Boolean)
    : [];

  const limit = 3;

  const favoritasSql = buildRecommendationSql({ includeFavorites: true });
  const descubrimientosSql = buildRecommendationSql({ includeFavorites: false });

  const recomendados = await pool.query(favoritasSql, [categorias, userId, limit]);
  const descubrimientos = await pool.query(descubrimientosSql, [categorias, userId, limit]);

  return {
    recomendaciones: {
      porCategoria: recomendados.rows,
      nuevosLanzamientos: descubrimientos.rows,
      metadata: {
        categoriasPreferidas: categorias,
        totalLibros: recomendados.rows.length + descubrimientos.rows.length
      }
    },
    preferencias: {
      categorias,
      otros: {
        idioma: preferencias.idioma,
        tamanoFuente: preferencias.tamanoFuente
      }
    }
  };
}

module.exports = {
  searchLibros,
  findLibroById,
  createLibro,
  updateLibro,
  deleteLibro,
  updateLibroImage,
  obtenerRecomendaciones
};
