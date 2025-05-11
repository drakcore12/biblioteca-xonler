const pool = require('../database');

// Obtener todas las bibliotecas con su colegio asociado
async function obtenerBibliotecas(req, res) {
  try {
    const result = await pool.query(
      `SELECT b.id, b.nombre, b.direccion, c.nombre AS colegio, c.id AS colegio_id
       FROM bibliotecas b
       JOIN colegios c ON b.colegio_id = c.id`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener bibliotecas' });
  }
}

// Obtener una biblioteca por ID
async function obtenerBibliotecaPorId(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT b.id, b.nombre, b.direccion, c.nombre AS colegio, c.id AS colegio_id
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

module.exports = {
  obtenerBibliotecas,
  obtenerBibliotecaPorId,
  crearBiblioteca,
  actualizarBiblioteca,
  eliminarBiblioteca
};