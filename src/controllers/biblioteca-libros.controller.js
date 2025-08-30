const { pool } = require('../config/database');

// GET /biblioteca-libros - Listar ejemplares con filtros
async function obtenerBibliotecaLibros(req, res) {
  try {
    const { biblioteca_id, libro_id, limit = 50, offset = 0 } = req.query;
    
    let whereClause = '';
    let params = [];
    let paramIndex = 1;

    // Construir filtros dinámicos
    if (biblioteca_id) {
      whereClause += `WHERE bl.biblioteca_id = $${paramIndex}`;
      params.push(biblioteca_id);
      paramIndex++;
    }

    if (libro_id) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += `bl.libro_id = $${paramIndex}`;
      params.push(libro_id);
      paramIndex++;
    }

    // Agregar paginación
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(`
      SELECT 
        bl.id, bl.biblioteca_id, bl.libro_id,
        b.nombre as biblioteca_nombre,
        c.nombre as colegio_nombre,
        l.titulo, l.autor, l.isbn, l.categoria,
        l.anio_publicacion, l.editorial, l.imagen_url,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM prestamos p 
            WHERE p.biblioteca_libro_id = bl.id 
            AND p.fecha_devolucion IS NULL
          ) THEN false
          ELSE true
        END as disponible,
        bl.created_at, bl.updated_at
      FROM biblioteca_libros bl
      JOIN bibliotecas b ON bl.biblioteca_id = b.id
      JOIN colegios c ON b.colegio_id = c.id
      JOIN libros l ON bl.libro_id = l.id
      ${whereClause}
      ORDER BY l.titulo, b.nombre
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, params);

    // Obtener total de registros para paginación
    const countResult = await pool.query(`
      SELECT COUNT(*) as total
      FROM biblioteca_libros bl
      ${whereClause}
    `, params.slice(0, -2));

    res.json({
      ejemplares: result.rows,
      paginacion: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('Error en obtenerBibliotecaLibros:', error);
    res.status(500).json({ error: 'Error al obtener ejemplares' });
  }
}

// GET /biblioteca-libros/:id - Obtener ejemplar por ID
async function obtenerBibliotecaLibroPorId(req, res) {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        bl.id, bl.biblioteca_id, bl.libro_id,
        b.nombre as biblioteca_nombre, b.direccion as biblioteca_direccion,
        c.nombre as colegio_nombre,
        l.titulo, l.autor, l.isbn, l.categoria,
        l.anio_publicacion, l.editorial, l.imagen_url,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM prestamos p 
            WHERE p.biblioteca_libro_id = bl.id 
            AND p.fecha_devolucion IS NULL
          ) THEN false
          ELSE true
        END as disponible,
        bl.created_at, bl.updated_at
      FROM biblioteca_libros bl
      JOIN bibliotecas b ON bl.biblioteca_id = b.id
      JOIN colegios c ON b.colegio_id = c.id
      JOIN libros l ON bl.libro_id = l.id
      WHERE bl.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ejemplar no encontrado' });
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

    res.json(ejemplar);
  } catch (error) {
    console.error('Error en obtenerBibliotecaLibroPorId:', error);
    res.status(500).json({ error: 'Error al obtener el ejemplar' });
  }
}

// POST /biblioteca-libros - Asignar libro a biblioteca (admin)
async function crearBibliotecaLibro(req, res) {
  try {
    const { biblioteca_id, libro_id } = req.body;

    if (!biblioteca_id || !libro_id) {
      return res.status(400).json({ 
        error: 'biblioteca_id y libro_id son obligatorios' 
      });
    }

    // Verificar que la biblioteca existe
    const bibliotecaExists = await pool.query(
      'SELECT id FROM bibliotecas WHERE id = $1',
      [biblioteca_id]
    );

    if (bibliotecaExists.rows.length === 0) {
      return res.status(400).json({ error: 'La biblioteca especificada no existe' });
    }

    // Verificar que el libro existe
    const libroExists = await pool.query(
      'SELECT id FROM libros WHERE id = $1',
      [libro_id]
    );

    if (libroExists.rows.length === 0) {
      return res.status(400).json({ error: 'El libro especificado no existe' });
    }

    // Verificar que no existe ya esta combinación (unicidad)
    const existingCombination = await pool.query(
      'SELECT id FROM biblioteca_libros WHERE biblioteca_id = $1 AND libro_id = $2',
      [biblioteca_id, libro_id]
    );

    if (existingCombination.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Este libro ya está asignado a esta biblioteca' 
      });
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

    res.status(201).json({
      message: 'Libro asignado a la biblioteca exitosamente',
      ejemplar: ejemplarCompleto.rows[0]
    });

  } catch (error) {
    console.error('Error en crearBibliotecaLibro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// DELETE /biblioteca-libros/:id - Eliminar ejemplar (admin, con protección)
async function eliminarBibliotecaLibro(req, res) {
  try {
    const { id } = req.params;

    // Verificar si el ejemplar existe
    const existingEjemplar = await pool.query(
      'SELECT id FROM biblioteca_libros WHERE id = $1',
      [id]
    );

    if (existingEjemplar.rows.length === 0) {
      return res.status(404).json({ error: 'Ejemplar no encontrado' });
    }

    // Verificar si hay préstamos activos para este ejemplar
    const prestamosActivos = await pool.query(
      'SELECT COUNT(*) as count FROM prestamos WHERE biblioteca_libro_id = $1 AND fecha_devolucion IS NULL',
      [id]
    );

    if (parseInt(prestamosActivos.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el ejemplar porque tiene préstamos activos' 
      });
    }

    // Verificar si hay préstamos históricos (opcional, para auditoría)
    const prestamosHistoricos = await pool.query(
      'SELECT COUNT(*) as count FROM prestamos WHERE biblioteca_libro_id = $1',
      [id]
    );

    if (parseInt(prestamosHistoricos.rows[0].count) > 0) {
      // Si hay préstamos históricos, solo marcar como eliminado en lugar de borrar
      await pool.query(`
        UPDATE biblioteca_libros 
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [id]);

      return res.json({ 
        message: 'Ejemplar marcado como eliminado (tiene historial de préstamos)' 
      });
    }

    // Si no hay préstamos, eliminar completamente
    await pool.query('DELETE FROM biblioteca_libros WHERE id = $1', [id]);

    res.json({ message: 'Ejemplar eliminado exitosamente' });

  } catch (error) {
    console.error('Error en eliminarBibliotecaLibro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// GET /biblioteca-libros/:id/disponibilidad - Verificar disponibilidad
async function verificarDisponibilidad(req, res) {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        bl.id,
        l.titulo, l.autor,
        b.nombre as biblioteca_nombre,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM prestamos p 
            WHERE p.biblioteca_libro_id = bl.id 
            AND p.fecha_devolucion IS NULL
          ) THEN false
          ELSE true
        END as disponible,
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
      return res.status(404).json({ error: 'Ejemplar no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error en verificarDisponibilidad:', error);
    res.status(500).json({ error: 'Error al verificar disponibilidad' });
  }
}

module.exports = {
  obtenerBibliotecaLibros,
  obtenerBibliotecaLibroPorId,
  crearBibliotecaLibro,
  eliminarBibliotecaLibro,
  verificarDisponibilidad
};
