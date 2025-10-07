const { pool } = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { generatePending2FAToken } = require('./twofa.controller');
const { setAuthCookies, clearAuthCookies } = require('../utils/cookie-utils');
const simpleJWT = require('../utils/simple-jwt');
const { logAudit, logSecurity } = require('../config/logger');

// Helper para normalizar preferencias que pueden venir como string
function asObject(x) {
  if (!x) return {};
  if (typeof x === 'object') return x;
  try { return JSON.parse(x); } catch { return {}; }
}

// Generar JWT token
function generateToken(user) {
  return simpleJWT.generateToken({
    id: user.id, 
    email: user.email, 
    role: user.rol,  // Changed from 'rol' to 'role' to match middleware
    rol_id: user.rol_id 
  }, { expiresIn: '24h' });
}

// POST /auth/register
async function register(req, res) {
  try {
    console.log('📝 [REGISTER] Datos recibidos:', {
      body: req.body,
      contentType: req.get('Content-Type'),
      method: req.method,
      url: req.url
    });

    const { nombre, apellido, email, password, telefono, fecha_nacimiento, genero, direccion, ciudad, codigo_postal } = req.body;

    // Validaciones básicas
    if (!nombre || !apellido || !email || !password) {
      console.log('❌ [REGISTER] Campos faltantes:', { nombre: !!nombre, apellido: !!apellido, email: !!email, password: !!password });
      return res.status(400).json({ 
        error: 'Nombre, apellido, email y password son obligatorios',
        received: { nombre: !!nombre, apellido: !!apellido, email: !!email, password: !!password }
      });
    }

    console.log('✅ [REGISTER] Validación pasada, procediendo con registro...');

    // Verificar si el email ya existe
    const existingUser = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ 
        error: 'El email ya está registrado' 
      });
    }

    // Hash del password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insertar usuario (rol por defecto: usuario = 1)
    const result = await pool.query(`
      INSERT INTO usuarios (
        nombre, apellido, email, password_hash, telefono, 
        fecha_nacimiento, genero, direccion, ciudad, codigo_postal, rol_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1)
      RETURNING id, nombre, apellido, email, rol_id
    `, [nombre, apellido, email, passwordHash, telefono, fecha_nacimiento, genero, direccion, ciudad, codigo_postal]);

    const newUser = result.rows[0];

    // Obtener información del rol
    const rolResult = await pool.query(
      'SELECT name FROM roles WHERE id = $1',
      [newUser.rol_id]
    );

    console.log('🔍 [REGISTER] Consulta de rol:', {
      rol_id_asignado: newUser.rol_id,
      rol_encontrado: rolResult.rows[0]?.name || 'No encontrado',
      total_roles: rolResult.rows.length,
      query: `SELECT name FROM roles WHERE id = ${newUser.rol_id}`
    });

    // Verificar que el rol exista
    if (rolResult.rows.length === 0) {
      console.error('❌ [REGISTER] Error: No se encontró el rol con ID:', newUser.rol_id);
      return res.status(500).json({ error: 'Error interno: Rol no encontrado' });
    }

    const userWithRol = {
      ...newUser,
      rol: rolResult.rows[0].name
    };

    // Generar token
    const token = generateToken(userWithRol);

    console.log('✅ [REGISTER] Usuario registrado exitosamente:', {
      id: userWithRol.id,
      email: userWithRol.email,
      rol: userWithRol.rol
    });

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: {
        id: userWithRol.id,
        nombre: userWithRol.nombre,
        apellido: userWithRol.apellido,
        email: userWithRol.email,
        rol: userWithRol.rol,
        rol_id: userWithRol.rol_id
      },
      token
    });

  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// POST /auth/login
async function login(req, res) {
  try {
    console.log('🔍 [LOGIN] ===== INICIANDO FUNCIÓN LOGIN =====');
    console.log('🔍 [LOGIN] Iniciando función login...');
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email y password son obligatorios' 
      });
    }

    // Buscar usuario por email (incluyendo 2FA) - con COALESCE para normalizar
    console.log('🔍 [LOGIN] Ejecutando consulta SQL...');
    const result = await pool.query(`
      SELECT 
        u.id, u.nombre, u.apellido, u.email, u.password_hash,
        COALESCE(u.dobleautenticacion, false) AS dobleautenticacion,
        COALESCE(u.preferencias, '{}'::jsonb) AS preferencias,
        r.name AS rol, r.id AS rol_id
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      WHERE u.email = $1
    `, [email]);
    
    console.log('🔍 [LOGIN] Consulta SQL ejecutada, filas encontradas:', result.rows.length);

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas' 
      });
    }

    const user = result.rows[0];

    // 🔧 Normalización robusta
    user.preferencias = asObject(user.preferencias);
    user.dobleautenticacion = Boolean(user.dobleautenticacion);

    console.log('🔍 [LOGIN DEBUG] Normalizado:', {
      id: user.id,
      dobleautenticacion: user.dobleautenticacion,
      prefs_type: typeof user.preferencias,
      has_twofa_node: !!user.preferencias?.twofa,
      has_secret: !!user.preferencias?.twofa?.secret_base32
    });

    // Verificar password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas' 
      });
    }

    // ✅ Ahora sí: decisión de 2FA
    const twofaEnabled = user.dobleautenticacion;          // ya es boolean
    const hasSecret    = !!(user.preferencias.twofa?.secret_base32);

    console.log('🔐 [LOGIN] 2FA check:', { twofaEnabled, hasSecret });

    if (twofaEnabled && hasSecret) {
      console.log('🔐 [LOGIN] Usuario con 2FA activado, generando token pendiente...');
      
      const pending2faToken = generatePending2FAToken(user.id);
      
      return res.json({
        message: 'Se requiere autenticación de dos factores',
        pending2faToken,
        user: {
          id: user.id,
          nombre: user.nombre,
          apellido: user.apellido,
          email: user.email,
          rol: user.rol,
          rol_id: user.rol_id
        }
      });
    }

    // Generar token normal (sin 2FA)
    const token = generateToken(user);

    console.log('✅ [LOGIN] Usuario autenticado:', {
      id: user.id,
      email: user.email,
      rol: user.rol,
      rol_id: user.rol_id,
      has2FA: false
    });

    // 🍪 NUEVO: Establecer cookies HTTP-only seguras
    const remember = req.body.remember || false;
    const authData = {
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        rol: user.rol,
        rol_id: user.rol_id
      }
    };
    
    setAuthCookies(res, authData, remember);

    // 🔄 MANTENER: Respuesta JSON para compatibilidad con localStorage
    res.json({
      message: 'Login exitoso',
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        rol: user.rol,
        rol_id: user.rol_id
      },
      token // Mantener para compatibilidad con frontend existente
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// GET /auth/me (requiere JWT)
async function me(req, res) {
  try {
    // El middleware de auth ya verificó el token y puso req.user
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT 
        u.id, u.nombre, u.apellido, u.email, u.telefono,
        u.fecha_nacimiento, u.genero, u.direccion, u.ciudad,
        u.codigo_postal, u.created_at, u.updated_at, u.preferencias,
        r.name AS rol, r.id AS rol_id
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      WHERE u.id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error en me:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// POST /auth/refresh (renovar token)
async function refresh(req, res) {
  try {
    // El middleware de auth ya verificó el token
    const userId = req.user.id;

    // Obtener usuario actualizado
    const result = await pool.query(`
      SELECT 
        u.id, u.nombre, u.apellido, u.email,
        r.name AS rol, r.id AS rol_id
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      WHERE u.id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];

    // Generar nuevo token
    const newToken = generateToken(user);

    res.json({
      message: 'Token renovado exitosamente',
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        rol: user.rol,
        rol_id: user.rol_id
      },
      token: newToken
    });

  } catch (error) {
    console.error('Error en refresh:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// POST /auth/logout (nuevo endpoint)
async function logout(req, res) {
  try {
    console.log('🚪 [LOGOUT] Cerrando sesión...');
    
    // Limpiar cookies HTTP-only
    clearAuthCookies(res);
    
    res.json({
      message: 'Logout exitoso',
      success: true
    });
    
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// POST /auth/forgot-password (nuevo endpoint)
async function forgotPassword(req, res) {
  try {
    console.log('🔐 [FORGOT-PASSWORD] Iniciando proceso de recuperación...');
    
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        error: 'Email requerido',
        message: 'Debes proporcionar un correo electrónico'
      });
    }
    
    // Verificar si el usuario existe
    const result = await pool.query(
      'SELECT id, nombre, email FROM usuarios WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      // Por seguridad, no revelamos si el email existe o no
      console.log('🔐 [FORGOT-PASSWORD] Email no encontrado:', email);
      return res.json({
        message: 'Si el correo electrónico existe en nuestro sistema, recibirás un enlace de recuperación.',
        success: true
      });
    }
    
    const user = result.rows[0];
    
    // Generar token de recuperación (válido por 1 hora)
    const resetToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        type: 'password_reset'
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Guardar token en la base de datos (opcional, para invalidar tokens)
    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'1 hour\')',
      [user.id, resetToken]
    );
    
    // En un entorno real, aquí enviarías el email
    // Por ahora, solo logueamos el token para desarrollo
    console.log('🔐 [FORGOT-PASSWORD] Token generado para:', user.email);
    console.log('🔗 [FORGOT-PASSWORD] Enlace de recuperación:', 
      `http://localhost:3000/reset-password?token=${resetToken}`);
    
    // En desarrollo, devolvemos el token para testing
    if (process.env.NODE_ENV !== 'production') {
      return res.json({
        message: 'Enlace de recuperación generado (solo en desarrollo)',
        success: true,
        resetToken: resetToken, // Solo en desarrollo
        resetUrl: `http://localhost:3000/reset-password?token=${resetToken}`
      });
    }
    
    // En producción, solo confirmar que se envió
    res.json({
      message: 'Si el correo electrónico existe en nuestro sistema, recibirás un enlace de recuperación.',
      success: true
    });
    
  } catch (error) {
    console.error('Error en forgot-password:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudo procesar la solicitud. Intenta de nuevo.'
    });
  }
}

// POST /auth/verify-reset-token
async function verifyResetToken(req, res) {
  try {
    console.log('🔐 [VERIFY-RESET-TOKEN] Verificando token...');
    
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ 
        error: 'Token requerido',
        message: 'Debes proporcionar un token de recuperación'
      });
    }
    
    // Verificar el token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'password_reset') {
      return res.status(400).json({ 
        error: 'Token inválido',
        message: 'Este token no es válido para recuperación de contraseña'
      });
    }
    
    // Verificar que el token existe en la base de datos y no ha sido usado
    const result = await pool.query(
      'SELECT id, user_id, expires_at, used FROM password_reset_tokens WHERE token = $1',
      [token]
    );
    
    if (result.rows.length === 0) {
      return res.status(400).json({ 
        error: 'Token no encontrado',
        message: 'Este enlace de recuperación no es válido'
      });
    }
    
    const tokenData = result.rows[0];
    
    // Verificar si el token ha expirado
    if (new Date() > new Date(tokenData.expires_at)) {
      return res.status(400).json({ 
        error: 'Token expirado',
        message: 'Este enlace de recuperación ha expirado'
      });
    }
    
    // Verificar si el token ya fue usado
    if (tokenData.used) {
      return res.status(400).json({ 
        error: 'Token ya usado',
        message: 'Este enlace de recuperación ya fue utilizado'
      });
    }
    
    console.log('✅ [VERIFY-RESET-TOKEN] Token válido para usuario:', decoded.userId);
    
    res.json({
      message: 'Token válido',
      success: true,
      userId: decoded.userId
    });
    
  } catch (error) {
    console.error('Error en verify-reset-token:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ 
        error: 'Token inválido',
        message: 'Este enlace de recuperación no es válido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ 
        error: 'Token expirado',
        message: 'Este enlace de recuperación ha expirado'
      });
    }
    
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudo verificar el token. Intenta de nuevo.'
    });
  }
}

// POST /auth/reset-password
async function resetPassword(req, res) {
  try {
    console.log('🔐 [RESET-PASSWORD] Restableciendo contraseña...');
    
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ 
        error: 'Datos requeridos',
        message: 'Debes proporcionar el token y la nueva contraseña'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Contraseña inválida',
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }
    
    // Verificar el token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'password_reset') {
      return res.status(400).json({ 
        error: 'Token inválido',
        message: 'Este token no es válido para recuperación de contraseña'
      });
    }
    
    // Verificar que el token existe en la base de datos y no ha sido usado
    const tokenResult = await pool.query(
      'SELECT id, user_id, expires_at, used FROM password_reset_tokens WHERE token = $1',
      [token]
    );
    
    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ 
        error: 'Token no encontrado',
        message: 'Este enlace de recuperación no es válido'
      });
    }
    
    const tokenData = tokenResult.rows[0];
    
    // Verificar si el token ha expirado
    if (new Date() > new Date(tokenData.expires_at)) {
      return res.status(400).json({ 
        error: 'Token expirado',
        message: 'Este enlace de recuperación ha expirado'
      });
    }
    
    // Verificar si el token ya fue usado
    if (tokenData.used) {
      return res.status(400).json({ 
        error: 'Token ya usado',
        message: 'Este enlace de recuperación ya fue utilizado'
      });
    }
    
    // Hash de la nueva contraseña
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Actualizar la contraseña del usuario
    await pool.query(
      'UPDATE usuarios SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, tokenData.user_id]
    );
    
    // Marcar el token como usado
    await pool.query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE id = $1',
      [tokenData.id]
    );
    
    console.log('✅ [RESET-PASSWORD] Contraseña restablecida para usuario:', tokenData.user_id);
    
    res.json({
      message: 'Contraseña restablecida exitosamente',
      success: true
    });
    
  } catch (error) {
    console.error('Error en reset-password:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ 
        error: 'Token inválido',
        message: 'Este enlace de recuperación no es válido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ 
        error: 'Token expirado',
        message: 'Este enlace de recuperación ha expirado'
      });
    }
    
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudo restablecer la contraseña. Intenta de nuevo.'
    });
  }
}

module.exports = {
  register,
  login,
  me,
  refresh,
  logout,
  forgotPassword,
  verifyResetToken,
  resetPassword
};
