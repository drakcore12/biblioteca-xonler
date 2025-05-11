const pool = require('../database');

// Obtener todos los usuarios
async function obtenerUsuarios(req, res) {
  try {
    const result = await pool.query(
      `SELECT u.id, u.nombre, u.email, r.name AS rol, r.id AS rol_id
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
}

// Obtener un usuario por ID
async function obtenerUsuarioPorId(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT u.id, u.nombre, u.email, r.name AS rol, r.id AS rol_id
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE u.id = $1`, [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el usuario' });
  }
}

// Crear un nuevo usuario
async function crearUsuario(req, res) {
  try {
    const { nombre, email, rol_id } = req.body;
    if (!nombre || !email || !rol_id) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }
    const result = await pool.query(
      'INSERT INTO usuarios (nombre, email, rol_id) VALUES ($1, $2, $3) RETURNING *',
      [nombre, email, rol_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el usuario' });
  }
}

// Actualizar un usuario
async function actualizarUsuario(req, res) {
  try {
    const { id } = req.params;
    const { nombre, email, rol_id } = req.body;
    const result = await pool.query(
      'UPDATE usuarios SET nombre = $1, email = $2, rol_id = $3 WHERE id = $4 RETURNING *',
      [nombre, email, rol_id, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
}

// Eliminar un usuario
async function eliminarUsuario(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
}

// Login de usuario
async function loginUsuario(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }
    const result = await pool.query(
      'SELECT u.id, u.nombre, u.email, r.name AS rol, r.id AS rol_id FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.email = $1 AND u.password = $2',
      [email, password]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
    }
    // Puedes devolver más datos si lo necesitas
    res.json({ success: true, usuario: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
}

module.exports = {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  loginUsuario // <-- Exporta la función de login
};