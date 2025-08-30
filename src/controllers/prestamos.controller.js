const { pool } = require('../config/database');

// GET /prestamos - Listar préstamos con filtros (admin)
async function obtenerPrestamos(req, res) {
  try {
    const { 
      usuario_id, biblioteca_id, activo, fecha_desde, fecha_hasta, 
      limit = 50, offset = 0 
    } = req.query;
    
    let whereClause = '';
    let params = [];
    let paramIndex = 1;

    // Construir filtros dinámicos
    if (usuario_id) {
      whereClause += `WHERE p.usuario_id = $${paramIndex}`;
      params.push(usuario_id);
      paramIndex++;
    }

    if (biblioteca_id) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += `b.id = $${paramIndex}`;
      params.push(biblioteca_id);
      paramIndex++;
    }

    if (activo !== undefined) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      if (activo === 'true') {
        whereClause += `p.fecha_devolucion IS NULL`;
      } else {
        whereClause += `p.fecha_devolucion IS NOT NULL`;
      }
    }

    if (fecha_desde) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += `p.fecha_prestamo >= $${paramIndex}`;
      params.push(fecha_desde);
      paramIndex++;
    }

    if (fecha_hasta) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += `p.fecha_prestamo <= $${paramIndex}`;
      params.push(fecha_hasta);
      paramIndex++;
    }

    // Agregar paginación
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(`
      SELECT 
        p.id, p.fecha_prestamo, p.fecha_devolucion,
        u.nombre, u.apellido, u.email, u.id as usuario_id,
        l.titulo, l.autor, l.isbn,
        b.nombre as biblioteca_nombre, b.id as biblioteca_id,
        c.nombre as colegio_nombre,
        CASE 
          WHEN p.fecha_devolucion IS NULL THEN true
          ELSE false
        END as activo,
        CASE 
          WHEN p.fecha_devolucion IS NULL THEN
            p.fecha_prestamo + INTERVAL '15 days'
          ELSE NULL
        END as fecha_vencimiento
      FROM prestamos p
      JOIN usuarios u ON p.usuario_id = u.id
      JOIN biblioteca_libros bl ON p.biblioteca_libro_id = bl.id
      JOIN libros l ON bl.libro_id = l.id
      JOIN bibliotecas b ON bl.biblioteca_id = b.id
      JOIN colegios c ON b.colegio_id = c.id
      ${whereClause}
      ORDER BY p.fecha_prestamo DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, params);

    // Obtener total de registros para paginación
    const countResult = await pool.query(`
      SELECT COUNT(*) as total
      FROM prestamos p
      JOIN biblioteca_libros bl ON p.biblioteca_libro_id = bl.id
      JOIN bibliotecas b ON bl.biblioteca_id = b.id
      ${whereClause}
    `, params.slice(0, -2));

    res.json({
      prestamos: result.rows,
      paginacion: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('Error en obtenerPrestamos:', error);
    res.status(500).json({ error: 'Error al obtener préstamos' });
  }
}

// GET /prestamos/:id - Obtener préstamo por ID
async function obtenerPrestamoPorId(req, res) {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        p.id, p.fecha_prestamo, p.fecha_devolucion,
        u.nombre, u.apellido, u.email, u.id as usuario_id,
        l.titulo, l.autor, l.isbn, l.categoria,
        b.nombre as biblioteca_nombre, b.direccion as biblioteca_direccion,
        c.nombre as colegio_nombre,
        CASE 
          WHEN p.fecha_devolucion IS NULL THEN true
          ELSE false
        END as activo,
        CASE 
          WHEN p.fecha_devolucion IS NULL THEN
            p.fecha_prestamo + INTERVAL '15 days'
          ELSE NULL
        END as fecha_vencimiento
      FROM prestamos p
      JOIN usuarios u ON p.usuario_id = u.id
      JOIN biblioteca_libros bl ON p.biblioteca_libro_id = bl.id
      JOIN libros l ON bl.libro_id = l.id
      JOIN bibliotecas b ON bl.biblioteca_id = b.id
      JOIN colegios c ON b.colegio_id = c.id
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error en obtenerPrestamoPorId:', error);
    res.status(500).json({ error: 'Error al obtener el préstamo' });
  }
}

// POST /prestamos - Crear préstamo (auth requerido)
async function crearPrestamo(req, res) {
  let client;
  try {
    const { libro_id, fecha_prestamo } = req.body;
    
    // Verificar que el usuario está autenticado
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    
    const usuario_id = req.user.id;
    console.log('🔍 [PRESTAMOS] Creando préstamo:', { usuario_id, libro_id, fecha_prestamo });

    if (!libro_id) {
      return res.status(400).json({ error: 'libro_id es obligatorio' });
    }

    console.log('🔍 [PRESTAMOS] Verificando libro:', libro_id);
    
    // Primero verificar que el libro existe y está disponible
    const libroExists = await pool.query(`
      SELECT l.id, l.titulo, l.autor, l.disponibilidad
      FROM public.libros l
      WHERE l.id = $1
    `, [libro_id]);

    if (libroExists.rows.length === 0) {
      return res.status(404).json({ error: 'Libro no encontrado' });
    }

    const libro = libroExists.rows[0];

    if (!libro.disponibilidad) {
      return res.status(409).json({ error: 'Este libro no está disponible actualmente' });
    }

    // Luego buscar una biblioteca que tenga el libro disponible
    const bibliotecaLibroExists = await pool.query(`
      SELECT bl.id as biblioteca_libro_id, 
             b.nombre as biblioteca_nombre
      FROM public.biblioteca_libros bl
      JOIN public.bibliotecas b ON b.id = bl.biblioteca_id
      WHERE bl.libro_id = $1
      AND NOT EXISTS (
        SELECT 1 FROM prestamos p 
        WHERE p.biblioteca_libro_id = bl.id 
        AND p.fecha_devolucion IS NULL
      )
      LIMIT 1
    `, [libro_id]);
    
    console.log('✅ [PRESTAMOS] Resultado libro:', libro);
    console.log('✅ [PRESTAMOS] Resultado biblioteca:', bibliotecaLibroExists.rows[0]);

    if (bibliotecaLibroExists.rows.length === 0) {
      return res.status(404).json({ error: 'No hay copias disponibles de este libro en ninguna biblioteca' });
    }

    const biblioteca_libro_id = bibliotecaLibroExists.rows[0].biblioteca_libro_id;

    // Verificar que el usuario no tenga préstamos activos del mismo libro
    const prestamoUsuarioActivo = await pool.query(
      'SELECT id FROM prestamos WHERE usuario_id = $1 AND biblioteca_libro_id = $2 AND fecha_devolucion IS NULL',
      [usuario_id, biblioteca_libro_id]
    );

    if (prestamoUsuarioActivo.rows.length > 0) {
      return res.status(409).json({ error: 'Ya tienes un préstamo activo de este libro' });
    }

    // Fecha de préstamo (por defecto hoy si no se especifica)
    const fechaPrestamo = fecha_prestamo || new Date().toISOString().split('T')[0];

    // Iniciar transacción
    client = await pool.connect();
    await client.query('BEGIN');

    // Marcar libro como no disponible
    await client.query(
      'UPDATE libros SET disponibilidad = false WHERE id = $1',
      [libro_id]
    );

    // Crear el préstamo
    const result = await client.query(`
      INSERT INTO prestamos (usuario_id, biblioteca_libro_id, fecha_prestamo)
      VALUES ($1, $2, $3)
      RETURNING id, usuario_id, biblioteca_libro_id, fecha_prestamo, fecha_devolucion
    `, [usuario_id, biblioteca_libro_id, fechaPrestamo]);

    await client.query('COMMIT');

    // Obtener información completa del préstamo creado
    const prestamoCompleto = await pool.query(`
      SELECT 
        p.id, p.fecha_prestamo, p.fecha_devolucion,
        u.nombre, u.apellido, u.email,
        l.titulo, l.autor, l.isbn, l.categoria,
        b.nombre as biblioteca_nombre,
        CASE 
          WHEN p.fecha_devolucion IS NULL THEN true
          ELSE false
        END as activo,
        p.fecha_prestamo + INTERVAL '15 days' as fecha_vencimiento
      FROM prestamos p
      JOIN usuarios u ON p.usuario_id = u.id
      JOIN biblioteca_libros bl ON p.biblioteca_libro_id = bl.id
      JOIN libros l ON bl.libro_id = l.id
      JOIN bibliotecas b ON bl.biblioteca_id = b.id
      WHERE p.id = $1
    `, [result.rows[0].id]);

    res.status(201).json({
      message: 'Préstamo creado exitosamente',
      prestamo: prestamoCompleto.rows[0]
    });

  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
      client.release();
    }
    console.error('Error en crearPrestamo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    if (client) {
      client.release();
    }
  }
}

// POST /prestamos/:id/devolucion - Marcar devolución
async function marcarDevolucion(req, res) {
  try {
    const { id } = req.params;
    
    // Verificar que el préstamo existe
    const prestamoExists = await pool.query(`
      SELECT p.id, p.usuario_id, p.fecha_prestamo, p.fecha_devolucion,
             u.nombre, u.apellido, l.titulo
      FROM prestamos p
      JOIN usuarios u ON p.usuario_id = u.id
      JOIN biblioteca_libros bl ON p.biblioteca_libro_id = bl.id
      JOIN libros l ON bl.libro_id = l.id
      WHERE p.id = $1
    `, [id]);

    if (prestamoExists.rows.length === 0) {
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }

    const prestamo = prestamoExists.rows[0];

    // Verificar que el préstamo esté activo
    if (prestamo.fecha_devolucion) {
      return res.status(400).json({ 
        error: 'Este préstamo ya fue devuelto' 
      });
    }

    // Verificar permisos: solo el propietario del préstamo o admin puede devolver
    if (prestamo.usuario_id !== req.user.id && req.user.rol !== 'admin') {
      return res.status(403).json({ 
        error: 'No tienes permisos para devolver este préstamo' 
      });
    }

    // Marcar devolución
    const fechaDevolucion = new Date().toISOString().split('T')[0];
    
    await pool.query(`
      UPDATE prestamos 
      SET fecha_devolucion = $1
      WHERE id = $2
    `, [fechaDevolucion, id]);

    // Obtener préstamo actualizado
    const prestamoActualizado = await pool.query(`
      SELECT 
        p.id, p.fecha_prestamo, p.fecha_devolucion,
        u.nombre, u.apellido, u.email,
        l.titulo, l.autor, l.isbn,
        b.nombre as biblioteca_nombre,
        false as activo
      FROM prestamos p
      JOIN usuarios u ON p.usuario_id = u.id
      JOIN biblioteca_libros bl ON p.biblioteca_libro_id = bl.id
      JOIN libros l ON bl.libro_id = l.id
      JOIN bibliotecas b ON bl.biblioteca_id = b.id
      WHERE p.id = $1
    `, [id]);

    res.json({
      message: 'Devolución registrada exitosamente',
      prestamo: prestamoActualizado.rows[0]
    });

  } catch (error) {
    console.error('Error en marcarDevolucion:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// POST /prestamos/:id/renovar - Renovar préstamo (opcional)
async function renovarPrestamo(req, res) {
  try {
    const { id } = req.params;
    
    // Verificar que el préstamo existe y esté activo
    const prestamoExists = await pool.query(`
      SELECT p.id, p.usuario_id, p.fecha_prestamo, p.fecha_devolucion,
             u.nombre, u.apellido, l.titulo
      FROM prestamos p
      JOIN usuarios u ON p.usuario_id = u.id
      JOIN biblioteca_libros bl ON p.biblioteca_libro_id = bl.id
      JOIN libros l ON bl.libro_id = l.id
      WHERE p.id = $1
    `, [id]);

    if (prestamoExists.rows.length === 0) {
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }

    const prestamo = prestamoExists.rows[0];

    // Verificar que el préstamo esté activo
    if (prestamo.fecha_devolucion) {
      return res.status(400).json({ 
        error: 'Este préstamo ya fue devuelto' 
      });
    }

    // Verificar permisos: solo el propietario del préstamo puede renovar
    if (prestamo.usuario_id !== req.user.id) {
      return res.status(403).json({ 
        error: 'No tienes permisos para renovar este préstamo' 
      });
    }

    // Verificar que no esté vencido (más de 15 días)
    const fechaVencimiento = new Date(prestamo.fecha_prestamo);
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 15);
    
    if (new Date() > fechaVencimiento) {
      return res.status(400).json({ 
        error: 'No se puede renovar un préstamo vencido' 
      });
    }

    // Renovar el préstamo (extender 15 días más)
    const nuevaFechaPrestamo = new Date().toISOString().split('T')[0];
    
    await pool.query(`
      UPDATE prestamos 
      SET fecha_prestamo = $1
      WHERE id = $2
    `, [nuevaFechaPrestamo, id]);

    // Obtener préstamo renovado
    const prestamoRenovado = await pool.query(`
      SELECT 
        p.id, p.fecha_prestamo, p.fecha_devolucion,
        u.nombre, u.apellido, u.email,
        l.titulo, l.autor, l.isbn,
        b.nombre as biblioteca_nombre,
        true as activo,
        p.fecha_prestamo + INTERVAL '15 days' as fecha_vencimiento
      FROM prestamos p
      JOIN usuarios u ON p.usuario_id = u.id
      JOIN biblioteca_libros bl ON p.biblioteca_libro_id = bl.id
      JOIN libros l ON bl.libro_id = l.id
      JOIN bibliotecas b ON bl.biblioteca_id = b.id
      WHERE p.id = $1
    `, [id]);

    res.json({
      message: 'Préstamo renovado exitosamente',
      prestamo: prestamoRenovado.rows[0]
    });

  } catch (error) {
    console.error('Error en renovarPrestamo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// GET /prestamos/usuario/actual - Préstamos del usuario logueado
async function obtenerPrestamosUsuarioActual(req, res) {
  try {
    const usuario_id = req.user.id;
    
    const result = await pool.query(`
      SELECT 
        p.id, p.fecha_prestamo, p.fecha_devolucion,
        l.titulo, l.autor, l.isbn, l.categoria,
        b.nombre as biblioteca_nombre, b.id as biblioteca_id,
        c.nombre as colegio_nombre,
        CASE 
          WHEN p.fecha_devolucion IS NULL THEN true
          ELSE false
        END as activo,
        CASE 
          WHEN p.fecha_devolucion IS NULL THEN
            p.fecha_prestamo + INTERVAL '15 days'
          ELSE NULL
        END as fecha_vencimiento
      FROM prestamos p
      JOIN biblioteca_libros bl ON p.biblioteca_libro_id = bl.id
      JOIN libros l ON bl.libro_id = l.id
      JOIN bibliotecas b ON bl.biblioteca_id = b.id
      JOIN colegios c ON b.colegio_id = c.id
      WHERE p.usuario_id = $1
      ORDER BY p.fecha_prestamo DESC
    `, [usuario_id]);

    res.json({
      prestamos: result.rows
    });

  } catch (error) {
    console.error('Error en obtenerPrestamosUsuarioActual:', error);
    res.status(500).json({ error: 'Error al obtener préstamos del usuario' });
  }
}

// Exportar todas las funciones
module.exports = {
  obtenerPrestamos,
  obtenerPrestamoPorId,
  crearPrestamo,
  marcarDevolucion,
  renovarPrestamo,
  obtenerPrestamosUsuarioActual
};
