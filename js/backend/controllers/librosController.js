const pool = require('../database');

// Obtener todos los libros
async function obtenerLibros(req, res) {
  try {
    const result = await pool.query('SELECT * FROM libros');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener libros' });
  }
}

// Obtener un libro por ID
async function obtenerLibroPorId(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM libros WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Libro no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el libro' });
  }
}

// Crear un nuevo libro
async function crearLibro(req, res) {
  try {
    const { titulo, autor, isbn } = req.body;
    if (!titulo || !autor) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }
    const result = await pool.query(
      'INSERT INTO libros (titulo, autor, isbn) VALUES ($1, $2, $3) RETURNING *',
      [titulo, autor, isbn]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el libro' });
  }
}

// Actualizar un libro
async function actualizarLibro(req, res) {
  try {
    const { id } = req.params;
    const { titulo, autor, isbn } = req.body;
    const result = await pool.query(
      'UPDATE libros SET titulo = $1, autor = $2, isbn = $3 WHERE id = $4 RETURNING *',
      [titulo, autor, isbn, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Libro no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el libro' });
  }
}

// Eliminar un libro
async function eliminarLibro(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM libros WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Libro no encontrado' });
    }
    res.json({ message: 'Libro eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el libro' });
  }
}

module.exports = {
  obtenerLibros,
  obtenerLibroPorId,
  crearLibro,
  actualizarLibro,
  eliminarLibro
};