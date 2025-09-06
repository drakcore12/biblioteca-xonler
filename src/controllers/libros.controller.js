const { pool } = require('../config/database');

async function obtenerLibros(req, res) {
  try {
    const { 
      q = null,
      disponibilidad = null,
      orden = 'popularidad',
      limit = 9,
      offset = 0,
      categorias = null,
      biblioteca_id = null,
      // ✅ NUEVO: ventana de fechas opcional
      date_from = null,
      date_to = null,
    } = req.query;

    // ✅ categorías: CSV o array
    let categoria = null;
    if (categorias) {
      if (typeof categorias === 'string') {
        categoria = categorias.split(',').map(cat => cat.trim()).filter(Boolean);
      } else if (Array.isArray(categorias)) {
        categoria = categorias;
      }
    }
    if (!categoria && req.query.categoria) {
      categoria = Array.isArray(req.query.categoria)
        ? req.query.categoria
        : [req.query.categoria];
    }

    const limitNum  = Math.min(parseInt(limit, 10)  || 9, 100);
    const offsetNum = Math.max(parseInt(offset, 10) || 0, 0);

    // ✅ Convertir disponibilidad a boolean/null
    let disponibilidadValue = null;
    if (disponibilidad === 'disponibles')      disponibilidadValue = true;
    else if (disponibilidad === 'no_disponibles') disponibilidadValue = false;

    // === WHERE dinámico (solo filtros del usuario, NADA de popularidad) ===
    const where = [];
    const params = [];
    let i = 1;

    if (q && q.trim()) {
      where.push(`(l.titulo ILIKE '%'||$${i}||'%' OR l.autor ILIKE '%'||$${i}||'%' OR l.isbn ILIKE '%'||$${i}||'%')`);
      params.push(q.trim()); i++;
    }

    if (Array.isArray(categoria) && categoria.length > 0) {
      const cs = categoria.map((_, idx) => `l.categoria = $${i + idx}`).join(' OR ');
      where.push(`(${cs})`);
      categoria.forEach(c => params.push(c.trim()));
      i += categoria.length;
    }

    if (disponibilidadValue !== null) {
      where.push(`l.disponibilidad = $${i}`);
      params.push(disponibilidadValue); i++;
    }

    if (biblioteca_id && biblioteca_id !== 'todas') {
      // No filtra por popularidad; sólo restringe a esa biblioteca
      where.push(`bl.biblioteca_id = $${i}`);
      params.push(biblioteca_id); i++;
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    // === ORDER BY (solo cambia el orden, no el set) ===
    let orderBy;
    switch ((orden || 'popularidad')) {
      case 'popularidad': orderBy = 'b.popularidad DESC, b.titulo ASC'; break;
      case 'recientes':   orderBy = 'b.id DESC'; break;
      case 'autor':       orderBy = 'b.autor ASC, b.titulo ASC'; break;
      case 'titulo':
      default:            orderBy = 'b.titulo ASC'; break;
    }

    // === SQL: calcula popularidad pero NO la usa como filtro; sólo para ORDER ===
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
      LIMIT $${i} OFFSET $${i+1};
    `;

    const finalParams = [...params, limitNum, offsetNum];

    console.log('🔍 [LIBROS][SQL]', sql.replace(/\s+/g,' '));
    console.log('🔍 [LIBROS][PARAMS_FINAL]', finalParams);

    const { rows } = await pool.query(sql, finalParams);
    console.log('🔍 [LIBROS][RESULTADOS]', rows.length, 'libros obtenidos');
    if (rows.length > 0) {
      console.log('🔍 [LIBROS][PRIMEROS_3]', rows.slice(0, 3).map(l => ({
        id: l.id, titulo: l.titulo, popularidad: l.popularidad, autor: l.autor, categoria: l.categoria
      })));
    }

    // === COUNT coherente (mismos filtros, sin LIMIT/OFFSET; sin tocar popularidad) ===
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

    console.log('🔍 [LIBROS][COUNT_SQL]', countSql.replace(/\s+/g,' '));
    console.log('🔍 [LIBROS][COUNT_PARAMS]', params);

    const { rows: countRows } = await pool.query(countSql, params);
    const totalRows = countRows[0]?.total || 0;

    // === Respuesta ===
    res.json({
      data: rows,
      paginacion: {
        total: totalRows,
        limit: limitNum,
        offset: offsetNum,
      }
    });

  } catch (e) {
    console.error('❌ obtenerLibros:', e);
    if (e.code === '42P01') return res.status(500).json({ error: 'Tabla libros no encontrada' });
    if (e.code === '42703') return res.status(500).json({ error: 'Columna no encontrada en tabla libros' });
    return res.status(500).json({ error: 'Error listando libros' });
  }
}

// GET /libros/:id - Obtener libro por ID
async function obtenerLibroPorId(req, res) {
  try {
    const { id } = req.params;
    const sql = `
      SELECT l.id, l.titulo, l.autor, l.isbn, 
             l.imagen_url, l.descripcion, l.categoria, 
             l.disponibilidad
      FROM public.libros l
      WHERE l.id = $1
    `;
    
    const { rows } = await pool.query(sql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Libro no encontrado' });
    }
    
    res.json(rows[0]);
  } catch (e) {
    console.error('❌ obtenerLibroPorId:', e);
    res.status(500).json({ error: 'Error obteniendo libro' });
  }
}

// POST /libros - Crear nuevo libro (admin)
async function crearLibro(req, res) {
  try {
    const { 
      titulo, autor, isbn, categoria, imagen_url, descripcion 
    } = req.body;

    if (!titulo || !autor) {
      return res.status(400).json({ 
        error: 'Título y autor son obligatorios' 
      });
    }

    // Verificar si el ISBN ya existe (si se proporciona)
    if (isbn) {
      const existingIsbn = await pool.query(
        'SELECT id FROM libros WHERE isbn = $1',
        [isbn]
      );

      if (existingIsbn.rows.length > 0) {
        return res.status(409).json({ 
          error: 'Ya existe un libro con ese ISBN' 
        });
      }
    }

    // Categoría por defecto si no se especifica
    const categoriaFinal = categoria || 'Otros';

    const result = await pool.query(`
      INSERT INTO libros (titulo, autor, isbn, categoria, imagen_url, descripcion, disponibilidad)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING id, titulo, autor, isbn, categoria, imagen_url, descripcion, disponibilidad
    `, [titulo, autor, isbn, categoriaFinal, imagen_url, descripcion]);

    res.status(201).json({
      message: 'Libro creado exitosamente',
      libro: result.rows[0]
    });

  } catch (error) {
    console.error('Error en crearLibro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// PUT /libros/:id - Actualizar libro (admin)
async function actualizarLibro(req, res) {
  try {
    const { id } = req.params;
    const { 
      titulo, autor, isbn, categoria, imagen_url, descripcion, disponibilidad 
    } = req.body;

    if (!titulo || !autor) {
      return res.status(400).json({ 
        error: 'Título y autor son obligatorios' 
      });
    }

    // Verificar si el libro existe
    const existingLibro = await pool.query(
      'SELECT id FROM libros WHERE id = $1',
      [id]
    );

    if (existingLibro.rows.length === 0) {
      return res.status(404).json({ error: 'Libro no encontrado' });
    }

    // Verificar si el nuevo ISBN ya existe en otro libro (si se proporciona)
    if (isbn) {
      const duplicateIsbn = await pool.query(
        'SELECT id FROM libros WHERE isbn = $1 AND id != $2',
        [isbn, id]
      );

      if (duplicateIsbn.rows.length > 0) {
        return res.status(409).json({ 
          error: 'Ya existe otro libro con ese ISBN' 
        });
      }
    }

    const result = await pool.query(`
      UPDATE libros 
      SET titulo = $1, autor = $2, isbn = $3, categoria = $4, 
          imagen_url = $5, descripcion = $6, disponibilidad = $7
      WHERE id = $8
      RETURNING id, titulo, autor, isbn, categoria, imagen_url, descripcion, disponibilidad
    `, [titulo, autor, isbn, categoria, imagen_url, descripcion, disponibilidad, id]);

    res.json({
      message: 'Libro actualizado exitosamente',
      libro: result.rows[0]
    });

  } catch (error) {
    console.error('Error en actualizarLibro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// DELETE /libros/:id - Eliminar libro (admin, con protección)
async function eliminarLibro(req, res) {
  try {
    const { id } = req.params;

    const libro = await pool.query('SELECT id FROM public.libros WHERE id = $1', [id]);
    if (!libro.rowCount) return res.status(404).json({ error: 'Libro no encontrado' });

    // Verifica préstamos asociados (activos o históricos)
    const prests = await pool.query(`
      SELECT COUNT(*)::int AS count
      FROM public.prestamos p
      JOIN public.biblioteca_libros bl ON bl.id = p.biblioteca_libro_id
      WHERE bl.libro_id = $1
    `, [id]);

    if (prests.rows[0].count > 0) {
      return res.status(400).json({ error: 'No se puede eliminar: tiene préstamos asociados' });
    }

    await pool.query('DELETE FROM public.biblioteca_libros WHERE libro_id = $1', [id]); // por si quedan vínculos
    await pool.query('DELETE FROM public.libros WHERE id = $1', [id]);

    return res.json({ message: 'Libro eliminado exitosamente' });
  } catch (error) {
    console.error('Error en eliminarLibro:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// POST /libros/:id/imagen - Subir imagen del libro (multer)
async function subirImagenLibro(req, res) {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
    }

    // Verificar si el libro existe
    const existingLibro = await pool.query(
      'SELECT id FROM libros WHERE id = $1',
      [id]
    );

    if (existingLibro.rows.length === 0) {
      return res.status(404).json({ error: 'Libro no encontrado' });
    }

    // Construir URL de la imagen
    const imagenUrl = `/uploads/libros/${req.file.filename}`;

    // ✅ ARREGLADO: Tu tabla libros no tiene updated_at
    const result = await pool.query(`
      UPDATE libros 
      SET imagen_url = $1
      WHERE id = $2
      RETURNING id, titulo, imagen_url
    `, [imagenUrl, id]);

    res.json({
      message: 'Imagen del libro actualizada exitosamente',
      libro: result.rows[0]
    });

  } catch (error) {
    console.error('Error en subirImagenLibro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// GET /libros/recomendaciones - Obtener recomendaciones personalizadas
async function obtenerRecomendaciones(req, res) {
  try {
    // 1) Autenticación
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    const userId = req.user.id;
    const limit = 3; // Fijo 3 libros por sección

    // 2) Preferencias del usuario
    const u = await pool.query(
      'SELECT preferencias FROM public.usuarios WHERE id = $1',
      [userId]
    );
    if (!u.rowCount) return res.status(404).json({ error: 'Usuario no encontrado' });

    const prefs = u.rows[0].preferencias || {};
    const cats = Array.isArray(prefs.categoriasFavoritas)
      ? prefs.categoriasFavoritas
          .filter(v => typeof v === 'string')
          .map(v => v.trim().toLowerCase())
          .filter(Boolean)
      : [];

    // 3) Recomendaciones por categorías favoritas
    console.log('🔍 [DEBUG] Categorías favoritas:', cats);
    const recomendados = await pool.query(`
      WITH disponibles AS (
        SELECT DISTINCT l.id
        FROM public.libros l
        JOIN public.biblioteca_libros bl ON bl.libro_id = l.id
        WHERE NOT EXISTS (
          SELECT 1 FROM public.prestamos p
          WHERE p.biblioteca_libro_id = bl.id
            AND p.fecha_devolucion IS NULL
        )
        AND (
          CASE 
            WHEN cardinality($1::text[]) = 0 THEN true
            ELSE lower(l.categoria) = ANY(SELECT lower(unnest($1::text[])))
          END
        )
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
        10 + COALESCE((SELECT 0.1 * total FROM pop WHERE pop.libro_id = l.id), 0) AS score,
        EXISTS(SELECT 1 FROM ya_leidos yl WHERE yl.libro_id = l.id) AS ya_leido
      FROM public.libros l
      JOIN disponibles d ON d.id = l.id
      ORDER BY score DESC, RANDOM()
      LIMIT $3
    `, [cats, userId, limit]);

    console.log('🔍 [DEBUG] Recomendados encontrados:', {
      total: recomendados.rows.length,
      libros: recomendados.rows.map(l => ({ id: l.id, titulo: l.titulo, categoria: l.categoria }))
    });

    // 4) Descubrimientos (libros de otras categorías)
    const descubrimientos = await pool.query(`
      WITH disponibles AS (
        SELECT DISTINCT l.id
        FROM public.libros l
        JOIN public.biblioteca_libros bl ON bl.libro_id = l.id
        WHERE NOT EXISTS (
          SELECT 1 FROM public.prestamos p
          WHERE p.biblioteca_libro_id = bl.id
            AND p.fecha_devolucion IS NULL
        )
        AND NOT (lower(l.categoria) = ANY(SELECT lower(unnest($1::text[]))))
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
        COALESCE((SELECT 0.1 * total FROM pop WHERE pop.libro_id = l.id), 0) AS score,
        EXISTS(SELECT 1 FROM ya_leidos yl WHERE yl.libro_id = l.id) AS ya_leido
      FROM public.libros l
      JOIN disponibles d ON d.id = l.id
      ORDER BY score DESC, RANDOM()
      LIMIT $3
    `, [cats, userId, limit]);

    console.log('🔍 [DEBUG] Descubrimientos encontrados:', {
      total: descubrimientos.rows.length,
      libros: descubrimientos.rows.map(l => ({ id: l.id, titulo: l.titulo, categoria: l.categoria }))
    });

    // 5) Preparar recomendaciones
    const recomendaciones = {
      porCategoria: recomendados.rows,
      nuevosLanzamientos: descubrimientos.rows,
      metadata: {
        categoriasPreferidas: cats,
        totalLibros: recomendados.rows.length + descubrimientos.rows.length
      }
    };

    // 6) Respuesta compatible con el frontend
    return res.json({
      recomendaciones,
      preferencias: {
        categorias: cats,
        otros: {
          idioma: prefs.idioma,
          tamanoFuente: prefs.tamanoFuente
        }
      }
    });

  } catch (error) {
    console.error('❌ Error en obtenerRecomendaciones:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      stack: error.stack,
    });
    return res.status(500).json({ error: 'Error obteniendo recomendaciones' }); 
  }
}

module.exports = {
  obtenerLibros,
  obtenerLibroPorId,
  crearLibro,
  actualizarLibro,
  eliminarLibro,
  subirImagenLibro,
  obtenerRecomendaciones
};
