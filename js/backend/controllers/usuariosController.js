// controllers/usuariosController.js

const pool   = require('../database');
const bcrypt = require('bcrypt');

// Obtener todos los usuarios (sin exponer el password_hash)
async function obtenerUsuarios(req, res) {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.nombre,
        u.email,
        r.name AS rol,
        r.id   AS rol_id
      FROM usuarios u
      JOIN roles   r ON u.rol_id = r.id
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error en obtenerUsuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
}

// Obtener un usuario por ID
async function obtenerUsuarioPorId(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        u.id,
        u.nombre,
        u.email,
        r.name AS rol,
        r.id   AS rol_id
      FROM usuarios u
      JOIN roles   r ON u.rol_id = r.id
      WHERE u.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error en obtenerUsuarioPorId:', error);
    res.status(500).json({ error: 'Error al obtener el usuario' });
  }
}

// Crear un nuevo usuario
async function crearUsuario(req, res) {
  try {
    const { nombre, email, password } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // 1) Buscar el rol por defecto "usuario"
    const rolRes = await pool.query(
      'SELECT id FROM roles WHERE name = $1',
      ['usuario']
    );
    if (rolRes.rows.length === 0) {
      return res.status(500).json({ error: 'Rol “usuario” no configurado' });
    }
    const rol_id = rolRes.rows[0].id;

    // 2) Hashear la contraseña
    const password_hash = await bcrypt.hash(password, 10);

    // 3) Insertar usuario
    const insertRes = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nombre, email, rol_id`,
      [nombre, email, password_hash, rol_id]
    );

    res.status(201).json(insertRes.rows[0]);
  } catch (error) {
    console.error('Error en crearUsuario:', error);
    res.status(500).json({ error: 'Error al crear el usuario' });
  }
}

// Actualizar un usuario (sin cambiar contraseña; podría ampliarse)
async function actualizarUsuario(req, res) {
  try {
    const { id }         = req.params;
    const { nombre, email, rol_id } = req.body;

    const updateRes = await pool.query(
      `UPDATE usuarios
         SET nombre  = $1,
             email   = $2,
             rol_id  = $3
       WHERE id = $4
       RETURNING id, nombre, email, rol_id`,
      [nombre, email, rol_id, id]
    );
    if (updateRes.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(updateRes.rows[0]);
  } catch (error) {
    console.error('Error en actualizarUsuario:', error);
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
}

// Eliminar un usuario
async function eliminarUsuario(req, res) {
  try {
    const { id } = req.params;
    const deleteRes = await pool.query(
      'DELETE FROM usuarios WHERE id = $1',
      [id]
    );
    if (deleteRes.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error en eliminarUsuario:', error);
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

    // 1) Buscar usuario por email
    const userRes = await pool.query(
      `SELECT 
         u.id,
         u.nombre,
         u.email,
         u.password_hash,
         r.name AS rol,
         r.id   AS rol_id
       FROM usuarios u
       JOIN roles   r ON u.rol_id = r.id
       WHERE u.email = $1`,
      [email]
    );
    if (userRes.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
    }
    const user = userRes.rows[0];

    // 2) Verificar contraseña
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
    }

    // 3) Devolver datos sin el hash
    delete user.password_hash;
    res.json({ success: true, usuario: user });
  } catch (error) {
    console.error('Error en loginUsuario:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
}

module.exports = {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  loginUsuario
};
