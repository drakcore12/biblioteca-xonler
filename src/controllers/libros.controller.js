const { pool } = require('../config/database');

async function obtenerLibros(req, res) {
  try {
    const { q = null, categoria = null, disponibilidad = null } = req.query;
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
    const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);

    // ✅ Query más robusta como en bibliotecas
    const sql = `
      SELECT l.id, l.titulo, l.autor, l.isbn, 
             l.imagen_url, l.descripcion, l.categoria, 
             l.disponibilidad
      FROM public.libros l
      WHERE ($1::text IS NULL OR 
            l.titulo ILIKE '%'||$1||'%' OR 
            l.autor ILIKE '%'||$1||'%' OR 
            l.isbn ILIKE '%'||$1||'%')
        AND ($2::text IS NULL OR l.categoria = $2)
        AND ($3::boolean IS NULL OR l.disponibilidad = $3)
      ORDER BY l.titulo
      LIMIT $4 OFFSET $5
    `;

    const params = [
      q,
      categoria,
      disponibilidad === 'disponibles' ? true : null,
      limit,
      offset
    ];

    const { rows } = await pool.query(sql, params);

    // Count query para paginación
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM public.libros l
      WHERE ($1::text IS NULL OR 
            l.titulo ILIKE '%'||$1||'%' OR 
            l.autor ILIKE '%'||$1||'%' OR 
            l.isbn ILIKE '%'||$1||'%')
        AND ($2::text IS NULL OR l.categoria = $2)
        AND ($3::boolean IS NULL OR l.disponibilidad = $3)
    `;

    const { rows: countRows } = await pool.query(countSql, [q, categoria, disponibilidad === 'disponibles' ? true : null]);

    // ✅ Mismo formato de respuesta que bibliotecas
    res.json({
      data: rows,
      paginacion: {
        total: countRows[0].total,
        limit,
        offset
      }
    });

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

    // Verificar si el libro existe
    const existingLibro = await pool.query(
      'SELECT id FROM libros WHERE id = $1',
      [id]
    );

    if (existingLibro.rows.length === 0) {
      return res.status(404).json({ error: 'Libro no encontrado' });
    }

    // ✅ ARREGLADO: En tu estructura real, no hay biblioteca_libros
    // Los préstamos van directo a libros, así que verificamos si hay préstamos
    const prestamosAsociados = await pool.query(`
      SELECT COUNT(*) as count 
      FROM prestamos p
      WHERE p.libro_id = $1
    `, [id]);

    if (parseInt(prestamosAsociados.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el libro porque tiene préstamos asociados' 
      });
    }

    // Eliminar el libro
    await pool.query('DELETE FROM libros WHERE id = $1', [id]);

    res.json({ message: 'Libro eliminado exitosamente' });

  } catch (error) {
    console.error('Error en eliminarLibro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
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

module.exports = {
  obtenerLibros,
  obtenerLibroPorId,
  crearLibro,
  actualizarLibro,
  eliminarLibro,
  subirImagenLibro
};
