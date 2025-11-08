const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

// Obtener todos los usuarios (sin exponer el password_hash)
async function obtenerUsuarios(req, res) {
  try {
    const { rol, busqueda, limit = 10, offset = 0 } = req.query;
    
    let query = `
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
        r.name AS rol,
        r.id AS rol_id
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (rol) {
      paramCount++;
      query += ` AND u.rol_id = $${paramCount}`;
      params.push(rol);
    }
    
    if (busqueda) {
      paramCount++;
      query += ` AND (u.nombre ILIKE $${paramCount} OR u.apellido ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      params.push(`%${busqueda}%`);
    }
    
    // Contar total de registros
    const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM');
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    // Añadir paginación
    paramCount++;
    query += ` ORDER BY u.created_at DESC LIMIT $${paramCount}`;
    params.push(limit);
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      total: total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
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

// Nota: obtenerUsuarioPorId está definida más abajo (línea ~431) para super admin
// Esta función duplicada fue eliminada para evitar conflictos

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

// Obtener usuario por ID (para super admin)
async function obtenerUsuarioPorId(req, res) {
  try {
    const { id } = req.params;
    
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
        r.name AS rol,
        r.id AS rol_id
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      WHERE u.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error en obtenerUsuarioPorId:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
}

// Crear nuevo usuario (para super admin)
async function crearUsuario(req, res) {
  try {
    const {
      nombre,
      apellido,
      email,
      password,
      rol_id,
      telefono,
      fecha_nacimiento,
      genero,
      direccion,
      ciudad,
      codigo_postal
    } = req.body;
    
    // Validar campos requeridos
    if (!nombre || !email || !password || !rol_id) {
      return res.status(400).json({ 
        error: 'Faltan campos requeridos: nombre, email, password, rol_id' 
      });
    }
    
    // Verificar si el email ya existe
    const existingUser = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }
    
    // Hash de la contraseña
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Crear usuario
    const result = await pool.query(`
      INSERT INTO usuarios (
        nombre, apellido, email, password_hash, rol_id,
        telefono, fecha_nacimiento, genero, direccion, ciudad, codigo_postal
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, nombre, apellido, email, rol_id, created_at
    `, [
      nombre, apellido, email, passwordHash, rol_id,
      telefono, fecha_nacimiento, genero, direccion, ciudad, codigo_postal
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error en crearUsuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
}

// Actualizar usuario (para super admin)
async function actualizarUsuarioCompleto(req, res) {
  try {
    const { id } = req.params;
    const {
      nombre,
      apellido,
      email,
      rol_id,
      telefono,
      fecha_nacimiento,
      genero,
      direccion,
      ciudad,
      codigo_postal
    } = req.body;
    
    // Verificar si el usuario existe
    const existingUser = await pool.query(
      'SELECT id FROM usuarios WHERE id = $1',
      [id]
    );
    
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Verificar si el email ya existe en otro usuario
    if (email) {
      const emailCheck = await pool.query(
        'SELECT id FROM usuarios WHERE email = $1 AND id != $2',
        [email, id]
      );
      
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'El email ya está registrado por otro usuario' });
      }
    }
    
    // Actualizar usuario
    const result = await pool.query(`
      UPDATE usuarios SET
        nombre = COALESCE($1, nombre),
        apellido = COALESCE($2, apellido),
        email = COALESCE($3, email),
        rol_id = COALESCE($4, rol_id),
        telefono = COALESCE($5, telefono),
        fecha_nacimiento = COALESCE($6, fecha_nacimiento),
        genero = COALESCE($7, genero),
        direccion = COALESCE($8, direccion),
        ciudad = COALESCE($9, ciudad),
        codigo_postal = COALESCE($10, codigo_postal),
        updated_at = NOW()
      WHERE id = $11
      RETURNING id, nombre, apellido, email, rol_id, updated_at
    `, [
      nombre, apellido, email, rol_id, telefono,
      fecha_nacimiento, genero, direccion, ciudad, codigo_postal, id
    ]);
    
    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error en actualizarUsuarioCompleto:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
}

// Eliminar usuario (para super admin)
async function eliminarUsuarioCompleto(req, res) {
  try {
    const { id } = req.params;
    
    console.log(`🔄 [USUARIOS] Iniciando eliminación de usuario ID: ${id}`);
    console.log(`🔍 [USUARIOS] Headers de autorización:`, req.headers.authorization ? 'Presente' : 'Ausente');
    console.log(`🔍 [USUARIOS] User info:`, req.user);
    
    // Validar ID
    const userId = Number(id);
    if (!Number.isInteger(userId)) {
      return res.status(400).json({ error: 'ID de usuario inválido' });
    }
    
    // Verificar si el usuario existe
    const existingUser = await pool.query(
      'SELECT id, nombre, email FROM usuarios WHERE id = $1',
      [userId]
    );
    
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const usuario = existingUser.rows[0];
    console.log(`👤 [USUARIOS] Usuario encontrado:`, usuario);
    
    // Verificar si el usuario tiene préstamos activos
    const prestamosActivos = await pool.query(
      'SELECT COUNT(*) as total FROM prestamos WHERE usuario_id = $1 AND fecha_devolucion IS NULL',
      [userId]
    );
    
    const totalPrestamosActivos = parseInt(prestamosActivos.rows[0].total);
    
    if (totalPrestamosActivos > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el usuario',
        message: `El usuario tiene ${totalPrestamosActivos} préstamo(s) activo(s). Debe devolver todos los libros antes de ser eliminado.`
      });
    }

    // Verificar si el usuario es administrador de alguna biblioteca
    const adminBibliotecas = await pool.query(
      'SELECT COUNT(*) as total FROM admin_bibliotecas WHERE usuario_id = $1',
      [userId]
    );
    
    const totalAdminBibliotecas = parseInt(adminBibliotecas.rows[0].total);
    
    if (totalAdminBibliotecas > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el usuario',
        message: `El usuario es administrador de ${totalAdminBibliotecas} biblioteca(s). Debe removerlo como administrador antes de eliminarlo.`
      });
    }
    
    // Iniciar transacción para eliminación en cascada
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      console.log(`🔄 [USUARIOS] Iniciando transacción para eliminar usuario ${userId}`);
      
      // Eliminar registros relacionados en orden correcto
      // 1. Eliminar préstamos (activos y devueltos) - ESTO ES CLAVE
      console.log(`🔄 [USUARIOS] Eliminando préstamos del usuario ${userId}...`);
      const prestamosEliminados = await client.query('DELETE FROM prestamos WHERE usuario_id = $1', [userId]);
      console.log(`🗑️ [USUARIOS] Eliminados ${prestamosEliminados.rowCount} préstamo(s) del usuario ${userId}`);
      
      // 2. Eliminar relaciones usuario-biblioteca
      console.log(`🔄 [USUARIOS] Eliminando relaciones usuario-biblioteca del usuario ${userId}...`);
      const usuarioBibliotecaEliminados = await client.query('DELETE FROM usuario_biblioteca WHERE usuario_id = $1', [userId]);
      console.log(`🗑️ [USUARIOS] Eliminadas ${usuarioBibliotecaEliminados.rowCount} relación(es) usuario-biblioteca del usuario ${userId}`);
      
      // 3. Eliminar relaciones admin-biblioteca
      console.log(`🔄 [USUARIOS] Eliminando relaciones admin-biblioteca del usuario ${userId}...`);
      const adminBibliotecaEliminados = await client.query('DELETE FROM admin_bibliotecas WHERE usuario_id = $1', [userId]);
      console.log(`🗑️ [USUARIOS] Eliminadas ${adminBibliotecaEliminados.rowCount} relación(es) admin-biblioteca del usuario ${userId}`);
      
      // 4. Finalmente eliminar el usuario
      console.log(`🔄 [USUARIOS] Eliminando usuario ${userId}...`);
      const usuarioEliminado = await client.query('DELETE FROM usuarios WHERE id = $1', [userId]);
      console.log(`✅ [USUARIOS] Usuario ${userId} eliminado exitosamente (${usuarioEliminado.rowCount} fila(s) afectada(s))`);
      
      await client.query('COMMIT');
      console.log(`✅ [USUARIOS] Transacción completada exitosamente`);
      
      res.json({
        success: true,
        message: `Usuario ${usuario.nombre} (${usuario.email}) eliminado exitosamente`,
        detalles: {
          prestamos_eliminados: prestamosEliminados.rowCount,
          usuario_biblioteca_eliminados: usuarioBibliotecaEliminados.rowCount,
          admin_biblioteca_eliminados: adminBibliotecaEliminados.rowCount
        }
      });
      
    } catch (transactionError) {
      console.error(`❌ [USUARIOS] Error en transacción:`, transactionError);
      console.error(`❌ [USUARIOS] Error code:`, transactionError.code);
      console.error(`❌ [USUARIOS] Error detail:`, transactionError.detail);
      console.error(`❌ [USUARIOS] Error constraint:`, transactionError.constraint);
      await client.query('ROLLBACK');
      console.log(`🔄 [USUARIOS] Transacción revertida`);
      throw transactionError;
    } finally {
      client.release();
      console.log(`🔄 [USUARIOS] Cliente de base de datos liberado`);
    }
    
  } catch (error) {
    console.error('❌ [USUARIOS] Error en eliminarUsuarioCompleto:', error);
    console.error('❌ [USUARIOS] Error code:', error.code);
    console.error('❌ [USUARIOS] Error message:', error.message);
    console.error('❌ [USUARIOS] Error detail:', error.detail);
    console.error('❌ [USUARIOS] Error constraint:', error.constraint);
    
    if (error.code === '23503') { // Foreign key constraint violation
      console.log('🚫 [USUARIOS] Violación de foreign key constraint');
      res.status(409).json({ 
        error: 'No se puede eliminar el usuario',
        message: 'El usuario tiene registros relacionados que impiden su eliminación. Verifique que no sea administrador de bibliotecas.',
        code: 'FOREIGN_KEY_VIOLATION',
        details: {
          constraint: error.constraint,
          detail: error.detail
        }
      });
    } else if (error.code === '23502') { // Not null constraint violation
      console.log('🚫 [USUARIOS] Violación de not null constraint');
      res.status(400).json({ 
        error: 'No se puede eliminar el usuario',
        message: 'El usuario tiene campos requeridos que impiden su eliminación.',
        code: 'NOT_NULL_VIOLATION'
      });
    } else if (error.code === '23505') { // Unique constraint violation
      console.log('🚫 [USUARIOS] Violación de unique constraint');
      res.status(400).json({ 
        error: 'No se puede eliminar el usuario',
        message: 'El usuario tiene restricciones de unicidad que impiden su eliminación.',
        code: 'UNIQUE_VIOLATION'
      });
    } else {
      console.log('💥 [USUARIOS] Error interno del servidor:', error.message);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: error.message,
        code: error.code || 'INTERNAL_ERROR',
        details: {
          constraint: error.constraint,
          detail: error.detail
        }
      });
    }
  }
}

// Debug: Verificar referencias del usuario
async function debugUsuarioReferencias(req, res) {
  try {
    const { id } = req.params;
    
    // Verificar préstamos
    const prestamos = await pool.query(
      'SELECT id, fecha_prestamo, fecha_devolucion FROM prestamos WHERE usuario_id = $1',
      [id]
    );
    
    // Verificar admin_bibliotecas
    const adminBibliotecas = await pool.query(
      'SELECT biblioteca_id, can_manage FROM admin_bibliotecas WHERE usuario_id = $1',
      [id]
    );
    
    // Verificar usuario_biblioteca
    const usuarioBiblioteca = await pool.query(
      'SELECT biblioteca_id FROM usuario_biblioteca WHERE usuario_id = $1',
      [id]
    );
    
    res.json({
      usuario_id: id,
      prestamos: prestamos.rows,
      admin_bibliotecas: adminBibliotecas.rows,
      usuario_biblioteca: usuarioBiblioteca.rows
    });
  } catch (error) {
    console.error('Error en debugUsuarioReferencias:', error);
    res.status(500).json({ error: 'Error al verificar referencias' });
  }
}

module.exports = {
  obtenerUsuarios,
  obtenerUsuarioActual,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  actualizarUsuarioActual,
  actualizarUsuarioCompleto,
  eliminarUsuario,
  eliminarUsuarioCompleto,
  loginUsuario,
  cambiarPasswordUsuario,
  actualizarPreferenciasUsuario,
  debugUsuarioReferencias
};
