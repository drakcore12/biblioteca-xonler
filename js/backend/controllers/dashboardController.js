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

module.exports = { obtenerResumen };
