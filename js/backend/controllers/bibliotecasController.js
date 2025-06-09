const pool = require('../database');

// Obtener todas las bibliotecas con su colegio asociado
async function obtenerBibliotecas(req, res) {
  try {
    const { nombreBiblioteca, colegio } = req.query;
    const conditions = [];
    const values = [];
    let idx = 1;

    if (nombreBiblioteca) {
      conditions.push(`LOWER(b.nombre) LIKE LOWER($${idx})`);
      values.push(`%${nombreBiblioteca}%`);
      idx++;
    }

    if (colegio) {
      conditions.push(`b.colegio_id = $${idx}`);
      values.push(colegio);
      idx++;
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT
        b.id,
        b.nombre,
        b.direccion,
        c.nombre AS colegio_nombre,
        COUNT(DISTINCT bl.id) - COUNT(p.id) FILTER (WHERE p.fecha_devolucion IS NULL) AS libros_disponibles,
        COUNT(p.id) FILTER (WHERE p.fecha_devolucion IS NULL) AS prestamos_activos
      FROM bibliotecas b
      JOIN colegios c ON b.colegio_id = c.id
      LEFT JOIN biblioteca_libros bl ON b.id = bl.biblioteca_id
      LEFT JOIN prestamos p ON p.biblioteca_libro_id = bl.id
      ${whereClause}
      GROUP BY b.id, c.nombre
      ORDER BY b.nombre`;

    const result = await pool.query(sql, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener bibliotecas:', error);
    res.status(500).json({ error: 'Error al obtener bibliotecas' });
  }
}

// Obtener una biblioteca por ID
async function obtenerBibliotecaPorId(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT b.id, b.nombre, b.direccion, c.nombre AS colegio_nombre, c.id AS colegio_id
       FROM bibliotecas b
       JOIN colegios c ON b.colegio_id = c.id
       WHERE b.id = $1`, [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Biblioteca no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la biblioteca' });
  }
}

// Crear una nueva biblioteca
async function crearBiblioteca(req, res) {
  try {
    const { nombre, direccion, colegio_id } = req.body;
    if (!nombre || !direccion || !colegio_id) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }
    const result = await pool.query(
      'INSERT INTO bibliotecas (nombre, direccion, colegio_id) VALUES ($1, $2, $3) RETURNING *',
      [nombre, direccion, colegio_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la biblioteca' });
  }
}

// Actualizar una biblioteca
async function actualizarBiblioteca(req, res) {
  try {
    const { id } = req.params;
    const { nombre, direccion, colegio_id } = req.body;
    const result = await pool.query(
      'UPDATE bibliotecas SET nombre = $1, direccion = $2, colegio_id = $3 WHERE id = $4 RETURNING *',
      [nombre, direccion, colegio_id, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Biblioteca no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la biblioteca' });
  }
}

// Eliminar una biblioteca
async function eliminarBiblioteca(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM bibliotecas WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Biblioteca no encontrada' });
    }
    res.json({ message: 'Biblioteca eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la biblioteca' });
  }
}

// Nueva función para obtener los libros de una biblioteca concreta
async function obtenerLibrosPorBiblioteca(req, res) {
  try {
    const { id } = req.params;
    const disponibilidad = req.query.disponibilidad;
    const result = await pool.query(
      `SELECT 
         l.id, 
         l.titulo, 
         l.autor, 
         l.isbn, 
         l.imagen_url, 
         COUNT(p.id) FILTER (WHERE p.fecha_devolucion IS NULL) AS prestados
       FROM biblioteca_libros bl 
       JOIN libros         l ON bl.libro_id = l.id 
       LEFT JOIN prestamos p ON p.biblioteca_libro_id = bl.id 
       WHERE bl.biblioteca_id = $1 
       GROUP BY l.id, bl.id 
       ${disponibilidad === 'disponibles'
         ? 'HAVING COUNT(p.id) FILTER (WHERE p.fecha_devolucion IS NULL) = 0'
         : ''}
       ORDER BY l.titulo`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener libros por biblioteca:', err);
    res.status(500).json({ error: 'Error interno' });
  }
}

// Exporta todas tus funciones, incluyendo la nueva
module.exports = {
  obtenerBibliotecas,
  obtenerBibliotecaPorId,
  crearBiblioteca,
  actualizarBiblioteca,
  eliminarBiblioteca,
  obtenerLibrosPorBiblioteca
};
