const { pool } = require('../config/database');

async function obtenerLibros(req, res) {
  try {
    const { q = null, disponibilidad = null, orden = 'titulo' } = req.query;
    
    // ✅ Manejar múltiples categorías (Express las convierte en array)
    let categoria = req.query.categoria;
    if (categoria && !Array.isArray(categoria)) {
      categoria = [categoria]; // Convertir a array si es solo una
    }
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
    const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);

    // Construir ORDER BY dinámico
    let orderBy = 'l.titulo';
    let needsJoin = false;
    
    switch (orden) {
      case 'relevancia':
        // Ordenar por libros más prestados (popularidad)
        orderBy = 'total_prestamos DESC, l.titulo ASC';
        needsJoin = true;
        break;
      case 'recientes':
        // Ordenar por ID más alto (libros más recientes)
        orderBy = 'l.id DESC';
        break;
      case 'autor':
        orderBy = 'l.autor ASC, l.titulo ASC';
        break;
      case 'titulo':
      default:
        orderBy = 'l.titulo ASC';
        break;
    }

    // ✅ Query más robusta como en bibliotecas
    let sql;
    
    // Construir WHERE dinámicamente para mejor debug
    let whereConditions = [];
    let paramIndex = 1;
    
    // Filtro de búsqueda (q)
    if (q && q.trim()) {
      whereConditions.push(`(l.titulo ILIKE '%'||$${paramIndex}||'%' OR l.autor ILIKE '%'||$${paramIndex}||'%' OR l.isbn ILIKE '%'||$${paramIndex}||'%')`);
      paramIndex++;
    }
    
         // Filtro de categoría (múltiples categorías con OR)
     if (categoria && Array.isArray(categoria) && categoria.length > 0) {
       const categoriaConditions = categoria.map((_, index) => 
         `l.categoria = $${paramIndex + index}`
       );
       whereConditions.push(`(${categoriaConditions.join(' OR ')})`);
       paramIndex += categoria.length;
     } else if (categoria && typeof categoria === 'string' && categoria.trim()) {
       // Compatibilidad con categoría única
       whereConditions.push(`l.categoria = $${paramIndex}`);
       paramIndex++;
     }
    
    // Filtro de disponibilidad
    if (disponibilidadValue !== null) {
      whereConditions.push(`l.disponibilidad = $${paramIndex}`);
      paramIndex++;
    }
    
    // Construir SQL final
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Construir SQL con JOIN opcional para relevancia
    if (needsJoin) {
      sql = `
        SELECT l.id, l.titulo, l.autor, l.isbn, 
               l.imagen_url, l.descripcion, l.categoria, 
               l.disponibilidad,
               COALESCE(COUNT(p.id), 0) as total_prestamos
        FROM public.libros l
        LEFT JOIN public.biblioteca_libros bl ON bl.libro_id = l.id
        LEFT JOIN public.prestamos p ON p.biblioteca_libro_id = bl.id
        ${whereClause}
        GROUP BY l.id, l.titulo, l.autor, l.isbn, l.imagen_url, l.descripcion, l.categoria, l.disponibilidad
        ORDER BY ${orderBy}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
    } else {
      sql = `
        SELECT l.id, l.titulo, l.autor, l.isbn, 
               l.imagen_url, l.descripcion, l.categoria, 
               l.disponibilidad
        FROM public.libros l
        ${whereClause}
        ORDER BY ${orderBy}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
    }
    
    console.log('🔍 [DEBUG] SQL construido dinámicamente:', sql);
    console.log('🔍 [DEBUG] Condiciones WHERE:', whereConditions);
    console.log('🔍 [DEBUG] Ordenamiento:', { orden, orderBy, needsJoin });

    // Debug de parámetros recibidos
    console.log('🔍 [DEBUG] Parámetros recibidos:', { q, categoria, disponibilidad, orden, limit, offset });
    
    // Convertir disponibilidad correctamente
    let disponibilidadValue = null;
    if (disponibilidad === 'disponibles') {
      disponibilidadValue = true;
    } else if (disponibilidad === 'no_disponibles') {
      disponibilidadValue = false;
    }
    
    // Construir array de parámetros dinámicamente
    const params = [];
    
    if (q && q.trim()) params.push(q.trim());
    if (categoria && Array.isArray(categoria) && categoria.length > 0) {
      // Agregar cada categoría como parámetro separado
      categoria.forEach(cat => {
        if (cat && cat.trim()) params.push(cat.trim());
      });
    } else if (categoria && typeof categoria === 'string' && categoria.trim()) {
      params.push(categoria.trim());
    }
    if (disponibilidadValue !== null) params.push(disponibilidadValue);
    params.push(limit, offset);
    
    console.log('🔍 [DEBUG] Parámetros finales:', params);

    console.log('🔍 [DEBUG] Ejecutando query con parámetros:', params);
    console.log('🔍 [DEBUG] SQL generado:', sql);
    
    // Log de los primeros resultados para debug
    const { rows } = await pool.query(sql, params);
    console.log('🔍 [DEBUG] Resultados obtenidos:', rows.length, 'libros');
    if (rows.length > 0) {
      console.log('🔍 [DEBUG] Primeros 3 libros:', rows.slice(0, 3).map(l => ({ id: l.id, titulo: l.titulo, autor: l.autor, categoria: l.categoria })));
    }

    // Count query para paginación (consistente con el JOIN cuando sea necesario)
    let countSql;
    if (needsJoin) {
      countSql = `
        SELECT COUNT(DISTINCT l.id)::int AS total
        FROM public.libros l
        LEFT JOIN public.biblioteca_libros bl ON bl.libro_id = l.id
        LEFT JOIN public.prestamos p ON p.biblioteca_libro_id = bl.id
        ${whereClause}
      `;
    } else {
      countSql = `
        SELECT COUNT(*)::int AS total
        FROM public.libros l
        ${whereClause}
      `;
    }

    // Parámetros para count (sin limit y offset)
    const countParams = params.slice(0, -2);
    
    console.log('🔍 [DEBUG] Ejecutando count query con parámetros:', countParams);
    const { rows: countRows } = await pool.query(countSql, countParams);
    console.log('🔍 [DEBUG] Total de libros encontrados:', countRows[0].total);

    // ✅ Mismo formato de respuesta que bibliotecas
    const respuesta = {
      data: rows,
      paginacion: {
        total: countRows[0].total,
        limit,
        offset
      }
    };
    
    console.log('🔍 [DEBUG] Respuesta enviada:', {
      totalLibros: rows.length,
      totalEnPaginacion: countRows[0].total,
      limit,
      offset
    });
    
    res.json(respuesta);

  } catch (e) {
    console.error('❌ obtenerLibros:', e);
    
    // ✅ Manejo de errores específico como en bibliotecas
    if (e.code === '42P01') {
      return res.status(500).json({ error: 'Tabla libros no encontrada' });
    }
    if (e.code === '42703') {
      return res.status(500).json({ error: 'Columna no encontrada en tabla libros' });
    }
    
    res.status(500).json({ error: 'Error listando libros' });
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
