const { pool } = require('../config/database');

/**
 * Obtener la biblioteca asignada al administrador actual
 */
async function obtenerBibliotecaAsignada(req, res) {
  try {
    const userId = req.user.id;
    
    const sql = `
      SELECT b.id, b.nombre, b.direccion, b.colegio_id,
             c.nombre AS colegio_nombre, c.direccion AS colegio_direccion
      FROM usuario_biblioteca ub
      JOIN bibliotecas b ON b.id = ub.biblioteca_id
      JOIN colegios c ON c.id = b.colegio_id
      WHERE ub.usuario_id = $1
    `;
    
    const { rows } = await pool.query(sql, [userId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        error: 'No tienes una biblioteca asignada. Contacta al administrador del sistema.' 
      });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('❌ Error en obtenerBibliotecaAsignada:', error);
    res.status(500).json({ error: 'Error obteniendo biblioteca asignada' });
  }
}

/**
 * Obtener estadísticas de la biblioteca asignada
 */
async function obtenerEstadisticasBiblioteca(req, res) {
  try {
    const userId = req.user.id;
    
    // Obtener ID de la biblioteca asignada
    const bibliotecaResult = await pool.query(
      'SELECT biblioteca_id FROM usuario_biblioteca WHERE usuario_id = $1',
      [userId]
    );
    
    if (bibliotecaResult.rows.length === 0) {
      return res.status(404).json({ error: 'No tienes una biblioteca asignada' });
    }
    
    const bibliotecaId = bibliotecaResult.rows[0].biblioteca_id;
    
    // Estadísticas generales
    const stats = await pool.query(`
      WITH biblioteca_stats AS (
        SELECT 
          COUNT(DISTINCT bl.id) as total_libros,
          COUNT(DISTINCT CASE WHEN p.fecha_devolucion IS NULL THEN p.id END) as prestamos_activos,
          COUNT(DISTINCT p.id) as total_prestamos,
          COUNT(DISTINCT p.usuario_id) as usuarios_unicos
        FROM biblioteca_libros bl
        LEFT JOIN prestamos p ON p.biblioteca_libro_id = bl.id
        WHERE bl.biblioteca_id = $1
      ),
      prestamos_por_mes AS (
        SELECT 
          DATE_TRUNC('month', fecha_prestamo) as mes,
          COUNT(*) as cantidad
        FROM prestamos p
        JOIN biblioteca_libros bl ON bl.id = p.biblioteca_libro_id
        WHERE bl.biblioteca_id = $1
          AND fecha_prestamo >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', fecha_prestamo)
        ORDER BY mes DESC
      ),
      libros_populares AS (
        SELECT 
          l.id, l.titulo, l.autor, l.categoria,
          COUNT(p.id) as total_prestamos
        FROM biblioteca_libros bl
        JOIN libros l ON l.id = bl.libro_id
        LEFT JOIN prestamos p ON p.biblioteca_libro_id = bl.id
        WHERE bl.biblioteca_id = $1
        GROUP BY l.id, l.titulo, l.autor, l.categoria
        ORDER BY total_prestamos DESC
        LIMIT 5
      )
      SELECT 
        (SELECT row_to_json(bs) FROM biblioteca_stats bs) as estadisticas,
        (SELECT json_agg(row_to_json(pp)) FROM prestamos_por_mes pp) as prestamos_mensuales,
        (SELECT json_agg(row_to_json(lp)) FROM libros_populares lp) as libros_populares
    `, [bibliotecaId]);
    
    res.json(stats.rows[0]);
  } catch (error) {
    console.error('❌ Error en obtenerEstadisticasBiblioteca:', error);
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
}

/**
 * Obtener libros de la biblioteca asignada con filtros
 */
async function obtenerLibrosBiblioteca(req, res) {
  try {
    const userId = req.user.id;
    const { 
      q = null, 
      categoria = null, 
      disponibilidad = null,
      limit = 20, 
      offset = 0 
    } = req.query;
    
    // Obtener ID de la biblioteca asignada
    const bibliotecaResult = await pool.query(
      'SELECT biblioteca_id FROM usuario_biblioteca WHERE usuario_id = $1',
      [userId]
    );
    
    if (bibliotecaResult.rows.length === 0) {
      return res.status(404).json({ error: 'No tienes una biblioteca asignada' });
    }
    
    const bibliotecaId = bibliotecaResult.rows[0].biblioteca_id;
    const limitNum = Math.min(Number.parseInt(limit, 10) || 20, 100);
    const offsetNum = Math.max(Number.parseInt(offset, 10) || 0, 0);
    
    // Construir filtros
    const where = ['bl.biblioteca_id = $1'];
    const params = [bibliotecaId];
    let paramIndex = 2;
    
    if (q?.trim()) {
      where.push(`(l.titulo ILIKE '%'||$${paramIndex}||'%' OR l.autor ILIKE '%'||$${paramIndex}||'%' OR l.isbn ILIKE '%'||$${paramIndex}||'%')`);
      params.push(q.trim());
      paramIndex++;
    }
    
    if (categoria) {
      where.push(`l.categoria = $${paramIndex}`);
      params.push(categoria);
      paramIndex++;
    }
    
    if (disponibilidad === 'disponibles') {
      where.push(`NOT EXISTS (SELECT 1 FROM prestamos p WHERE p.biblioteca_libro_id = bl.id AND p.fecha_devolucion IS NULL)`);
    } else if (disponibilidad === 'prestados') {
      where.push(`EXISTS (SELECT 1 FROM prestamos p WHERE p.biblioteca_libro_id = bl.id AND p.fecha_devolucion IS NULL)`);
    }
    
    const whereClause = where.join(' AND ');
    
    const sql = `
      SELECT 
        bl.id as biblioteca_libro_id,
        l.id as libro_id,
        l.titulo, l.autor, l.isbn, l.imagen_url, l.descripcion, l.categoria,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM prestamos p 
            WHERE p.biblioteca_libro_id = bl.id AND p.fecha_devolucion IS NULL
          ) THEN false 
          ELSE true 
        END as disponible,
        COUNT(p.id) as total_prestamos
      FROM biblioteca_libros bl
      JOIN libros l ON l.id = bl.libro_id
      LEFT JOIN prestamos p ON p.biblioteca_libro_id = bl.id
      WHERE ${whereClause}
      GROUP BY bl.id, l.id, l.titulo, l.autor, l.isbn, l.imagen_url, l.descripcion, l.categoria
      ORDER BY l.titulo
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limitNum, offsetNum);
    
    const { rows } = await pool.query(sql, params);
    
    // Contar total para paginación
    const countSql = `
      SELECT COUNT(*)::int as total
      FROM biblioteca_libros bl
      JOIN libros l ON l.id = bl.libro_id
      WHERE ${whereClause}
    `;
    
    const { rows: countRows } = await pool.query(countSql, params.slice(0, -2));
    
    res.json({
      data: rows,
      paginacion: {
        total: countRows[0].total,
        limit: limitNum,
        offset: offsetNum
      }
    });
  } catch (error) {
    console.error('❌ Error en obtenerLibrosBiblioteca:', error);
    res.status(500).json({ error: 'Error obteniendo libros de la biblioteca' });
  }
}

/**
 * Agregar libro a la biblioteca asignada
 */
async function agregarLibroABiblioteca(req, res) {
  try {
    const userId = req.user.id;
    const { libro_id } = req.body;
    
    if (!libro_id) {
      return res.status(400).json({ error: 'libro_id es obligatorio' });
    }
    
    // Obtener ID de la biblioteca asignada
    const bibliotecaResult = await pool.query(
      'SELECT biblioteca_id FROM usuario_biblioteca WHERE usuario_id = $1',
      [userId]
    );
    
    if (bibliotecaResult.rows.length === 0) {
      return res.status(404).json({ error: 'No tienes una biblioteca asignada' });
    }
    
    const bibliotecaId = bibliotecaResult.rows[0].biblioteca_id;
    
    // Verificar que el libro existe
    const libroExists = await pool.query('SELECT id FROM libros WHERE id = $1', [libro_id]);
    if (libroExists.rows.length === 0) {
      return res.status(404).json({ error: 'Libro no encontrado' });
    }
    
    // Verificar que no esté ya en la biblioteca
    const yaExiste = await pool.query(
      'SELECT id FROM biblioteca_libros WHERE biblioteca_id = $1 AND libro_id = $2',
      [bibliotecaId, libro_id]
    );
    
    if (yaExiste.rows.length > 0) {
      return res.status(409).json({ error: 'El libro ya está en esta biblioteca' });
    }
    
    // Agregar libro a la biblioteca
    const result = await pool.query(`
      INSERT INTO biblioteca_libros (biblioteca_id, libro_id)
      VALUES ($1, $2)
      RETURNING *
    `, [bibliotecaId, libro_id]);
    
    res.status(201).json({
      message: 'Libro agregado exitosamente a la biblioteca',
      biblioteca_libro: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error en agregarLibroABiblioteca:', error);
    res.status(500).json({ error: 'Error agregando libro a la biblioteca' });
  }
}

/**
 * Remover libro de la biblioteca asignada
 */
async function removerLibroDeBiblioteca(req, res) {
  try {
    const userId = req.user.id;
    const { biblioteca_libro_id } = req.params;
    
    // Obtener ID de la biblioteca asignada
    const bibliotecaResult = await pool.query(
      'SELECT biblioteca_id FROM usuario_biblioteca WHERE usuario_id = $1',
      [userId]
    );
    
    if (bibliotecaResult.rows.length === 0) {
      return res.status(404).json({ error: 'No tienes una biblioteca asignada' });
    }
    
    const bibliotecaId = bibliotecaResult.rows[0].biblioteca_id;
    
    // Verificar que el libro pertenece a la biblioteca del admin
    const libroBiblioteca = await pool.query(`
      SELECT id FROM biblioteca_libros 
      WHERE id = $1 AND biblioteca_id = $2
    `, [biblioteca_libro_id, bibliotecaId]);
    
    if (libroBiblioteca.rows.length === 0) {
      return res.status(404).json({ error: 'Libro no encontrado en tu biblioteca' });
    }
    
    // Verificar que no tenga préstamos activos
    const prestamosActivos = await pool.query(`
      SELECT COUNT(*)::int as count FROM prestamos 
      WHERE biblioteca_libro_id = $1 AND fecha_devolucion IS NULL
    `, [biblioteca_libro_id]);
    
    if (prestamosActivos.rows[0].count > 0) {
      return res.status(400).json({ 
        error: 'No se puede remover: el libro tiene préstamos activos' 
      });
    }
    
    // Remover libro de la biblioteca
    await pool.query('DELETE FROM biblioteca_libros WHERE id = $1', [biblioteca_libro_id]);
    
    res.json({ message: 'Libro removido exitosamente de la biblioteca' });
  } catch (error) {
    console.error('❌ Error en removerLibroDeBiblioteca:', error);
    res.status(500).json({ error: 'Error removiendo libro de la biblioteca' });
  }
}

/**
 * Obtener préstamos de la biblioteca asignada
 */
async function obtenerPrestamosBiblioteca(req, res) {
  try {
    const userId = req.user.id;
    const { 
      estado = 'todos', // todos, activos, devueltos, vencidos
      limit = 20, 
      offset = 0 
    } = req.query;
    
    // Obtener ID de la biblioteca asignada
    const bibliotecaResult = await pool.query(
      'SELECT biblioteca_id FROM usuario_biblioteca WHERE usuario_id = $1',
      [userId]
    );
    
    if (bibliotecaResult.rows.length === 0) {
      return res.status(404).json({ error: 'No tienes una biblioteca asignada' });
    }
    
    const bibliotecaId = bibliotecaResult.rows[0].biblioteca_id;
    const limitNum = Math.min(Number.parseInt(limit, 10) || 20, 100);
    const offsetNum = Math.max(Number.parseInt(offset, 10) || 0, 0);
    
    // Construir filtro de estado
    const params = [bibliotecaId];
    const paramIndex = 2;
    
    let estadoFilter = '';
    switch (estado) {
      case 'activos':
        estadoFilter = 'AND p.fecha_devolucion IS NULL';
        break;
      case 'devueltos':
        estadoFilter = 'AND p.fecha_devolucion IS NOT NULL';
        break;
      case 'vencidos':
        estadoFilter = 'AND p.fecha_devolucion IS NULL AND p.fecha_prestamo < CURRENT_DATE - INTERVAL \'15 days\'';
        break;
    }
    
    const sql = `
      SELECT 
        p.id, p.fecha_prestamo, p.fecha_devolucion,
        u.nombre as usuario_nombre, u.email as usuario_email,
        l.titulo as libro_titulo, l.autor as libro_autor,
        CASE 
          WHEN p.fecha_devolucion IS NOT NULL THEN 'devuelto'
          WHEN p.fecha_prestamo < CURRENT_DATE - INTERVAL '15 days' THEN 'vencido'
          ELSE 'activo'
        END as estado
      FROM prestamos p
      JOIN biblioteca_libros bl ON bl.id = p.biblioteca_libro_id
      JOIN libros l ON l.id = bl.libro_id
      JOIN usuarios u ON u.id = p.usuario_id
      WHERE bl.biblioteca_id = $1 ${estadoFilter}
      ORDER BY p.fecha_prestamo DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limitNum, offsetNum);
    
    const { rows } = await pool.query(sql, params);
    
    // Contar total para paginación
    const countSql = `
      SELECT COUNT(*)::int as total
      FROM prestamos p
      JOIN biblioteca_libros bl ON bl.id = p.biblioteca_libro_id
      WHERE bl.biblioteca_id = $1 ${estadoFilter}
    `;
    
    const { rows: countRows } = await pool.query(countSql, params.slice(0, -2));
    
    res.json({
      data: rows,
      paginacion: {
        total: countRows[0].total,
        limit: limitNum,
        offset: offsetNum
      }
    });
  } catch (error) {
    console.error('❌ Error en obtenerPrestamosBiblioteca:', error);
    res.status(500).json({ error: 'Error obteniendo préstamos de la biblioteca' });
  }
}

/**
 * Marcar préstamo como devuelto
 */
async function marcarPrestamoDevuelto(req, res) {
  try {
    const userId = req.user.id;
    const { prestamo_id } = req.params;
    
    // Obtener ID de la biblioteca asignada
    const bibliotecaResult = await pool.query(
      'SELECT biblioteca_id FROM usuario_biblioteca WHERE usuario_id = $1',
      [userId]
    );
    
    if (bibliotecaResult.rows.length === 0) {
      return res.status(404).json({ error: 'No tienes una biblioteca asignada' });
    }
    
    const bibliotecaId = bibliotecaResult.rows[0].biblioteca_id;
    
    // Verificar que el préstamo pertenece a la biblioteca del admin
    const prestamo = await pool.query(`
      SELECT p.id, p.fecha_devolucion
      FROM prestamos p
      JOIN biblioteca_libros bl ON bl.id = p.biblioteca_libro_id
      WHERE p.id = $1 AND bl.biblioteca_id = $2
    `, [prestamo_id, bibliotecaId]);
    
    if (prestamo.rows.length === 0) {
      return res.status(404).json({ error: 'Préstamo no encontrado en tu biblioteca' });
    }
    
    if (prestamo.rows[0].fecha_devolucion) {
      return res.status(400).json({ error: 'El préstamo ya fue devuelto' });
    }
    
    // Marcar como devuelto
    const result = await pool.query(`
      UPDATE prestamos 
      SET fecha_devolucion = CURRENT_DATE
      WHERE id = $1
      RETURNING *
    `, [prestamo_id]);
    
    res.json({
      message: 'Préstamo marcado como devuelto exitosamente',
      prestamo: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error en marcarPrestamoDevuelto:', error);
    res.status(500).json({ error: 'Error marcando préstamo como devuelto' });
  }
}

/**
 * Crear nuevo libro
 */
async function crearLibro(req, res) {
  try {
    const userId = req.user.id;
    const {
      titulo,
      autor,
      isbn = null,
      categoria,
      editorial = null,
      ano_publicacion = null,
      paginas = null,
      idioma = 'Español',
      descripcion = null,
      imagen_url = null,
      disponibilidad = true,
      agregar_a_biblioteca = true
    } = req.body;

    // Validar campos requeridos
    if (!titulo || !autor || !categoria) {
      return res.status(400).json({ 
        error: 'Título, autor y categoría son campos requeridos' 
      });
    }

    // Obtener ID de la biblioteca asignada
    const bibliotecaResult = await pool.query(
      'SELECT biblioteca_id FROM usuario_biblioteca WHERE usuario_id = $1',
      [userId]
    );
    
    if (bibliotecaResult.rows.length === 0) {
      return res.status(404).json({ error: 'No tienes una biblioteca asignada' });
    }
    
    const bibliotecaId = bibliotecaResult.rows[0].biblioteca_id;

    // Crear el libro
    const libroResult = await pool.query(`
      INSERT INTO libros (
        titulo, autor, isbn, categoria, editorial, ano_publicacion, 
        paginas, idioma, descripcion, imagen_url, disponibilidad, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING *
    `, [
      titulo, autor, isbn, categoria, editorial, ano_publicacion,
      paginas, idioma, descripcion, imagen_url, disponibilidad
    ]);

    const libro = libroResult.rows[0];

    // Si se debe agregar a la biblioteca, crear la relación
    if (agregar_a_biblioteca) {
      await pool.query(`
        INSERT INTO biblioteca_libros (biblioteca_id, libro_id, created_at)
        VALUES ($1, $2, NOW())
      `, [bibliotecaId, libro.id]);
    }

    res.status(201).json({
      message: 'Libro creado exitosamente',
      libro: libro,
      agregado_a_biblioteca: agregar_a_biblioteca
    });

  } catch (error) {
    console.error('❌ Error en crearLibro:', error);
    res.status(500).json({ error: 'Error creando libro' });
  }
}

module.exports = {
  obtenerBibliotecaAsignada,
  obtenerEstadisticasBiblioteca,
  obtenerLibrosBiblioteca,
  agregarLibroABiblioteca,
  removerLibroDeBiblioteca,
  crearLibro,
  obtenerPrestamosBiblioteca,
  marcarPrestamoDevuelto
};
