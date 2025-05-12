const pool = require('../database');

// Obtener todos los colegios
async function obtenerColegios(req, res) {
  try {
    const result = await pool.query('SELECT * FROM colegios');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener colegios' });
  }
}

// Obtener un colegio por ID
async function obtenerColegioPorId(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM colegios WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Colegio no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el colegio' });
  }
}

// Crear un nuevo colegio
async function crearColegio(req, res) {
  try {
    const { nombre, direccion } = req.body;
    if (!nombre) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }
    const result = await pool.query(
      'INSERT INTO colegios (nombre, direccion) VALUES ($1, $2) RETURNING *',
      [nombre, direccion]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el colegio' });
  }
}

// Actualizar un colegio
async function actualizarColegio(req, res) {
  try {
    const { id } = req.params;
    const { nombre, direccion } = req.body;
    const result = await pool.query(
      'UPDATE colegios SET nombre = $1, direccion = $2 WHERE id = $3 RETURNING *',
      [nombre, direccion, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Colegio no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el colegio' });
  }
}

// Eliminar un colegio
async function eliminarColegio(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM colegios WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Colegio no encontrado' });
    }
    res.json({ message: 'Colegio eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el colegio' });
  }
}

module.exports = {
  obtenerColegios,
  obtenerColegioPorId,
  crearColegio,
  actualizarColegio,
  eliminarColegio
};