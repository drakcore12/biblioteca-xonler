const { pool } = require('../config/database');
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

// Obtener el usuario autenticado actualmente (/me)
async function obtenerUsuarioActual(req, res) {
  try {
    // ✅ ARREGLADO: Obtener userId del middleware de autenticación
    const userId = req.user?.id || req.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    
    console.log('🔍 Obteniendo usuario actual:', userId);
    
    // ✅ ARREGLADO: Usar TODAS las columnas disponibles en la base de datos
    const result = await pool.query(`
      SELECT 
        u.id,
        u.nombre,
        u.apellido,
        u.email,
        u.telefono,
        u.fecha_nacimiento,
        u.genero,
        u.direccion,
        u.ciudad,
        u.codigo_postal,
        u.created_at,
        u.updated_at,
        u.preferencias,
        r.name AS rol,
        r.id   AS rol_id
      FROM usuarios u
      JOIN roles   r ON u.rol_id = r.id
      WHERE u.id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    console.log('✅ Usuario actual obtenido:', result.rows[0].nombre);
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error('Error en obtenerUsuarioActual:', error);
    res.status(500).json({ error: 'Error al obtener el usuario actual' });
  }
}

// Obtener un usuario por ID
async function obtenerUsuarioPorId(req, res) {
  try {
    const { id } = req.params;
    
    // ✅ ARREGLADO: Usar TODAS las columnas disponibles en la base de datos
    const result = await pool.query(`
      SELECT 
        u.id,
        u.nombre,
        u.apellido,
        u.email,
        u.telefono,
        u.fecha_nacimiento,
        u.genero,
        u.direccion,
        u.ciudad,
        u.codigo_postal,
        u.created_at,
        u.updated_at,
        u.preferencias,
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
    console.error('Error en obtenerUsuarioActual:', error);
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

// Actualizar un usuario (incluyendo campos adicionales)
async function actualizarUsuario(req, res) {
  try {
    const { id } = req.params;
    const { 
      nombre, 
      email, 
      telefono, 
      fecha_nacimiento, 
      genero, 
      direccion, 
      ciudad, 
      codigo_postal,
      preferencias
    } = req.body;

    const updateRes = await pool.query(
      `UPDATE usuarios
         SET nombre           = COALESCE($1, nombre),
             email            = COALESCE($2, email),
             telefono         = COALESCE($3, telefono),
             fecha_nacimiento = COALESCE($4, fecha_nacimiento),
             genero           = COALESCE($5, genero),
             direccion        = COALESCE($6, direccion),
             ciudad           = COALESCE($7, ciudad),
             codigo_postal    = COALESCE($8, codigo_postal),
             preferencias     = COALESCE($9, preferencias),
             updated_at       = NOW()
       WHERE id = $10
       RETURNING id, nombre, email, telefono, fecha_nacimiento, genero, direccion, ciudad, codigo_postal, preferencias`,
      [nombre, email, telefono, fecha_nacimiento, genero, direccion, ciudad, codigo_postal, preferencias, id]
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

// ✅ ARREGLADO: Login de usuario con JWT
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

    // ✅ ARREGLADO: 3) Generar JWT
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'dev-secret-key-2025';
    
    const payload = {
      user_id: user.id,
      email: user.email,
      role: user.rol,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
    };
    
    const token = jwt.sign(payload, secret);

    // ✅ ARREGLADO: 4) Devolver respuesta con JWT
    res.json({ 
      success: true, 
      token: token,
      role: user.rol,
      userName: user.nombre,
      userId: user.id
    });
    
  } catch (error) {
    console.error('Error en loginUsuario:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
}

// ✅ ARREGLADO: Actualizar usuario actual (PUT /me)
async function actualizarUsuarioActual(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'No autenticado' });

    const {
      nombre,
      apellido,
      email,
      telefono,
      fecha_nacimiento, // yyyy-MM-dd desde el front
      genero,
      direccion,
      ciudad,
      codigo_postal,
    } = req.body || {};

    // ✅ ARREGLADO: Usar TODAS las columnas disponibles en la base de datos
    const q = `
      UPDATE usuarios
         SET nombre           = COALESCE($1, nombre),
             apellido         = COALESCE($2, apellido),
             email            = COALESCE($3, email),
             telefono         = COALESCE($4, telefono),
             fecha_nacimiento = COALESCE($5, fecha_nacimiento),
             genero           = COALESCE($6, genero),
             direccion        = COALESCE($7, direccion),
             ciudad           = COALESCE($8, ciudad),
             codigo_postal    = COALESCE($9, codigo_postal),
             updated_at       = NOW()
       WHERE id = $10
       RETURNING id, nombre, apellido, email, telefono, fecha_nacimiento, genero, direccion, ciudad, codigo_postal, created_at, updated_at`;
    const params = [nombre, apellido, email, telefono, fecha_nacimiento, genero, direccion, ciudad, codigo_postal, userId];

    const r = await pool.query(q, params);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.json(r.rows[0]);
  } catch (e) {
    console.error('actualizarUsuarioActual error:', e);
    return res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
}

// Cambiar contraseña de usuario
async function cambiarPasswordUsuario(req, res) {
  try {
    const { id } = req.params;
    const { password_actual, password_nueva } = req.body;
    
    if (!password_actual || !password_nueva) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // 1) Verificar contraseña actual
    const userRes = await pool.query(
      'SELECT password_hash FROM usuarios WHERE id = $1',
      [id]
    );
    
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const match = await bcrypt.compare(password_actual, userRes.rows[0].password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    // 2) Hashear nueva contraseña
    const password_hash = await bcrypt.hash(password_nueva, 10);

    // 3) Actualizar contraseña
    const updateRes = await pool.query(
      'UPDATE usuarios SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING id',
      [password_hash, id]
    );

    if (updateRes.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ success: true, message: 'Contraseña cambiada correctamente' });
  } catch (error) {
    console.error('Error en cambiarPasswordUsuario:', error);
    res.status(500).json({ error: 'Error al cambiar la contraseña' });
  }
}

// Actualizar preferencias del usuario actual
async function actualizarPreferenciasUsuario(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'No autenticado' });

    console.log('🔍 Body recibido:', req.body);
    const { preferencias } = req.body;
    
    if (!preferencias || typeof preferencias !== 'object') {
      return res.status(400).json({ error: 'Preferencias no proporcionadas o formato inválido' });
    }

    // Obtener preferencias actuales
    const currentPrefs = await pool.query(
      'SELECT preferencias FROM usuarios WHERE id = $1',
      [userId]
    );

    if (currentPrefs.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Combinar preferencias actuales con las nuevas
    const currentPrefsObj = currentPrefs.rows[0].preferencias || {};
    console.log('🔍 Preferencias actuales:', currentPrefsObj);
    console.log('🔍 Nuevas preferencias:', preferencias);
    
    const newPrefsObj = { ...currentPrefsObj, ...preferencias };
    console.log('🔍 Preferencias combinadas:', newPrefsObj);

    // Actualizar preferencias
    const result = await pool.query(
      `UPDATE usuarios 
       SET preferencias = $1::jsonb, 
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, preferencias`,
      [newPrefsObj, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    console.log('✅ Preferencias actualizadas:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error en actualizarPreferenciasUsuario:', error);
    res.status(500).json({ 
      error: 'Error al actualizar preferencias',
      detail: error.message,
      code: error.code
    });
  }
}

module.exports = {
  obtenerUsuarios,
  obtenerUsuarioActual,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  actualizarUsuarioActual,
  eliminarUsuario,
  loginUsuario,
  cambiarPasswordUsuario,
  actualizarPreferenciasUsuario
};
