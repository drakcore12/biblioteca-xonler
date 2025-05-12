// js/backend/controllers/librosController.js

// Importa correctamente tu pool (asumiendo que database.js está en js/backend/database.js)
const pool = require('../database');

// Obtener todos los libros, con filtros opcionales por query params
async function obtenerLibros(req, res) {
  try {
    const {
      titulo,
      autor,
      categorias,      // string como "ficcion,ciencia"
      disponibilidad,  // "todos" o "disponibles"
      biblioteca       // "todas" o id numérico
    } = req.query;

    const conditions = [];
    const values = [];
    let idx = 1;

    // Filtro por título
    if (titulo) {
      conditions.push(`LOWER(l.titulo) LIKE LOWER($${idx})`);
      values.push(`%${titulo}%`);
      idx++;
    }

    // Filtro por autor
    if (autor) {
      conditions.push(`LOWER(l.autor) LIKE LOWER($${idx})`);
      values.push(`%${autor}%`);
      idx++;
    }

    // Filtro por categoría (requiere columna "categoria" en libros)
    if (categorias) {
      const cats = categorias.split(',').map(c => c.trim().toLowerCase());
      conditions.push(`unaccent(LOWER(l.categoria)) = ANY($${idx}::text[])`);
      values.push(cats);
      idx++;
    }

    // Filtro por biblioteca (requiere join con biblioteca_libros)
    let joinBiblioteca = '';
    if (biblioteca && biblioteca !== 'todas') {
      joinBiblioteca = ' JOIN biblioteca_libros bl ON bl.libro_id = l.id ';
      conditions.push(`bl.biblioteca_id = $${idx}`);
      values.push(parseInt(biblioteca, 10));
      idx++;
    }

    // Filtro por disponibilidad (requiere consultar préstamos pendientes)
    let selectDisponibilidad = `,
      l.disponibilidad
    `;
    if (disponibilidad === 'disponibles') {
      selectDisponibilidad += `,
        NOT EXISTS(
          SELECT 1
          FROM prestamos p
          JOIN biblioteca_libros bl2 ON p.biblioteca_libro_id = bl2.id
          WHERE bl2.libro_id = l.id
            AND p.fecha_devolucion IS NULL
        ) AS disponible
      `;
    }

    // Montar la consulta
    let sql = `
      SELECT
        l.id,
        l.titulo,
        l.autor,
        l.isbn,
        l.imagen_url,
        l.descripcion,
        l.categoria
        ${selectDisponibilidad}
      FROM libros l
      ${joinBiblioteca}
    `;

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await pool.query(sql, values);
    res.json(result.rows);

  } catch (error) {
    console.error('Error al obtener libros con filtros:', error);
    res.status(500).json({ error: 'Error interno al filtrar libros' });
  }
}

// Obtener un libro por ID
async function obtenerLibroPorId(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, titulo, autor, isbn, imagen_url, descripcion, categoria, disponibilidad FROM libros WHERE id = $1',
      [Number(id)]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Libro no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener el libro por ID:', error);
    res.status(500).json({ error: 'Error al obtener el libro' });
  }
}

// Crear un nuevo libro (con imagen opcional)
async function crearLibro(req, res) {
  try {
    const { titulo, autor, isbn, descripcion } = req.body;
    if (!titulo || !autor) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Si hay archivo de imagen, guarda la URL pública
    let imagen_url = null;
    if (req.file) {
      imagen_url = `/assets/images/${req.file.filename}`;
    }

    const result = await pool.query(
      'INSERT INTO libros (titulo, autor, isbn, imagen_url, descripcion) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [titulo, autor, isbn, imagen_url, descripcion]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear libro:', error);
    res.status(500).json({ error: 'Error al crear el libro' });
  }
}

// Actualizar un libro existente
async function actualizarLibro(req, res) {
  try {
    const { id } = req.params;
    const { titulo, autor, isbn, descripcion } = req.body;

    const result = await pool.query(
      'UPDATE libros SET titulo = $1, autor = $2, isbn = $3, descripcion = $4 WHERE id = $5 RETURNING *',
      [titulo, autor, isbn, descripcion, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Libro no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar libro:', error);
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
    console.error('Error al eliminar libro:', error);
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
