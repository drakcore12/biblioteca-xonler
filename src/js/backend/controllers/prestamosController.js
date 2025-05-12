const pool = require('../database');

// Obtener todos los préstamos
async function obtenerPrestamos(req, res) {
  try {
    const result = await pool.query(
      `SELECT p.id, u.nombre AS usuario, l.titulo AS libro, p.fecha_prestamo, p.fecha_devolucion
       FROM prestamos p
       JOIN usuarios u ON p.usuario_id = u.id
       JOIN biblioteca_libros bl ON p.biblioteca_libro_id = bl.id
       JOIN libros l ON bl.libro_id = l.id`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener préstamos' });
  }
}

// Obtener un préstamo por ID
async function obtenerPrestamoPorId(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT p.id, u.nombre AS usuario, l.titulo AS libro, p.fecha_prestamo, p.fecha_devolucion
       FROM prestamos p
       JOIN usuarios u ON p.usuario_id = u.id
       JOIN biblioteca_libros bl ON p.biblioteca_libro_id = bl.id
       JOIN libros l ON bl.libro_id = l.id
       WHERE p.id = $1`, [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el préstamo' });
  }
}

// Crear un nuevo préstamo
async function crearPrestamo(req, res) {
  try {
    const { usuario_id, biblioteca_libro_id, fecha_prestamo, fecha_devolucion } = req.body;
    if (!usuario_id || !biblioteca_libro_id || !fecha_prestamo) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }
    const result = await pool.query(
      'INSERT INTO prestamos (usuario_id, biblioteca_libro_id, fecha_prestamo, fecha_devolucion) VALUES ($1, $2, $3, $4) RETURNING *',
      [usuario_id, biblioteca_libro_id, fecha_prestamo, fecha_devolucion]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el préstamo' });
  }
}

// Actualizar un préstamo
async function actualizarPrestamo(req, res) {
  try {
    const { id } = req.params;
    const { usuario_id, biblioteca_libro_id, fecha_prestamo, fecha_devolucion } = req.body;
    const result = await pool.query(
      'UPDATE prestamos SET usuario_id = $1, biblioteca_libro_id = $2, fecha_prestamo = $3, fecha_devolucion = $4 WHERE id = $5 RETURNING *',
      [usuario_id, biblioteca_libro_id, fecha_prestamo, fecha_devolucion, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el préstamo' });
  }
}

// Eliminar un préstamo
async function eliminarPrestamo(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM prestamos WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }
    res.json({ message: 'Préstamo eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el préstamo' });
  }
}

module.exports = {
  obtenerPrestamos,
  obtenerPrestamoPorId,
  crearPrestamo,
  actualizarPrestamo,
  eliminarPrestamo
};