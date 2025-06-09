const pool = require('../database');

async function obtenerResumen(req, res) {
  try {
    const [librosRes, bibliotecasRes, prestamosRes, usuariosRes, prestamosRecientesRes] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM libros'),
      pool.query('SELECT COUNT(*) FROM bibliotecas'),
      pool.query('SELECT COUNT(*) FROM prestamos'),
      pool.query('SELECT COUNT(*) FROM usuarios'),
      pool.query(`
        SELECT p.id, u.nombre AS usuario, l.titulo AS libro, b.nombre AS biblioteca,
               p.fecha_prestamo, p.fecha_devolucion,
               CASE
                 WHEN p.fecha_devolucion IS NULL THEN 'Activo'
                 ELSE 'Devuelto'
               END AS estado
          FROM prestamos p
          JOIN usuarios u ON p.usuario_id = u.id
          JOIN biblioteca_libros bl ON p.biblioteca_libro_id = bl.id
          JOIN libros l ON bl.libro_id = l.id
          JOIN bibliotecas b ON bl.biblioteca_id = b.id
         ORDER BY p.fecha_prestamo DESC
         LIMIT 5`)
    ]);

    res.json({
      counts: {
        libros: parseInt(librosRes.rows[0].count, 10),
        bibliotecas: parseInt(bibliotecasRes.rows[0].count, 10),
        prestamos: parseInt(prestamosRes.rows[0].count, 10),
        usuarios: parseInt(usuariosRes.rows[0].count, 10)
      },
      prestamosRecientes: prestamosRecientesRes.rows
    });
  } catch (err) {
    console.error('Error al obtener resumen del dashboard:', err);
    res.status(500).json({ error: 'Error interno' });
  }
}

// Devuelve una lista simple de actividad reciente basada en la tabla de préstam
// os. Esta función es solo un ejemplo para poblar la sección "Actividad Reciente"
// del dashboard.
async function obtenerActividadReciente(req, res) {
  try {
    const result = await pool.query(`
      SELECT p.id,
             u.nombre AS usuario,
             l.titulo AS libro,
             b.nombre AS biblioteca,
             COALESCE(p.fecha_devolucion, p.fecha_prestamo) AS fecha,
             CASE WHEN p.fecha_devolucion IS NULL
                  THEN 'Préstamo realizado'
                  ELSE 'Préstamo devuelto'
             END AS accion
        FROM prestamos p
        JOIN usuarios u ON p.usuario_id = u.id
        JOIN biblioteca_libros bl ON p.biblioteca_libro_id = bl.id
        JOIN libros l ON bl.libro_id = l.id
        JOIN bibliotecas b ON bl.biblioteca_id = b.id
       ORDER BY fecha DESC
       LIMIT 5`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener actividad reciente:', err);
    res.status(500).json({ error: 'Error interno' });
  }
}

module.exports = { obtenerResumen, obtenerActividadReciente };
