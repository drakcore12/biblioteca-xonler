// Helpers de base de datos para usuarios y 2FA
const { pool } = require('../config/database');

/**
 * Obtener usuario por ID
 */
async function getById(id) {
  try {
    const { rows } = await pool.query(`
      SELECT 
        id, email, password_hash, rol_id, 
        preferencias, dobleautenticacion, 
        nombre, apellido, created_at, updated_at
      FROM public.usuarios 
      WHERE id = $1 
      LIMIT 1
    `, [id]);
    
    const user = rows[0];
    if (!user) return null;
    
    // Asegurar que preferencias sea un objeto JSON válido
    user.preferencias = user.preferencias || {};
    
    return user;
  } catch (error) {
    console.error('❌ [DB] Error obteniendo usuario por ID:', error);
    throw error;
  }
}

/**
 * Obtener usuario por email
 */
async function getByEmail(email) {
  try {
    const { rows } = await pool.query(`
      SELECT 
        u.id, u.email, u.password_hash, u.rol_id, 
        u.preferencias, u.dobleautenticacion, 
        u.nombre, u.apellido, u.created_at, u.updated_at,
        r.name AS rol
      FROM public.usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      WHERE u.email = $1 
      LIMIT 1
    `, [email]);
    
    const user = rows[0];
    if (!user) return null;
    
    // Asegurar que preferencias sea un objeto JSON válido
    user.preferencias = user.preferencias || {};
    
    return user;
  } catch (error) {
    console.error('❌ [DB] Error obteniendo usuario por email:', error);
    throw error;
  }
}

/**
 * Guardar secreto 2FA en preferencias (sin activar 2FA)
 */
async function saveTwoFASecret(userId, base32Secret) {
  try {
    console.log('🔐 [DB] Guardando secreto 2FA para usuario:', userId);
    console.log('🔐 [DB] Secreto base32:', base32Secret);
    
    const result = await pool.query(`
      UPDATE public.usuarios 
      SET 
        preferencias = jsonb_set(
          COALESCE(preferencias, '{}'::jsonb),
          '{twofa}',
          jsonb_build_object(
            'secret_base32', $2::text,
            'created_at', now()
          ),
          true
        ),
        updated_at = now()
      WHERE id = $1::integer
    `, [userId, base32Secret]);
    
    console.log('✅ [DB] Secreto 2FA guardado correctamente, rowCount:', result.rowCount);
    return result;
  } catch (error) {
    console.error('❌ [DB] Error guardando secreto 2FA:', error);
    throw error;
  }
}

/**
 * Activar 2FA para el usuario
 */
async function enableTwoFA(userId) {
  try {
    console.log('🔐 [DB] Activando 2FA para usuario:', userId);
    
    const result = await pool.query(`
      UPDATE public.usuarios 
      SET 
        dobleautenticacion = true,
        updated_at = now()
      WHERE id = $1
    `, [userId]);
    
    console.log('✅ [DB] 2FA activado correctamente');
    return result;
  } catch (error) {
    console.error('❌ [DB] Error activando 2FA:', error);
    throw error;
  }
}

/**
 * Desactivar 2FA para el usuario
 */
async function disableTwoFA(userId) {
  try {
    console.log('🔐 [DB] Desactivando 2FA para usuario:', userId);
    
    const result = await pool.query(`
      UPDATE public.usuarios 
      SET 
        dobleautenticacion = false,
        preferencias = (COALESCE(preferencias, '{}'::jsonb) - 'twofa'),
        updated_at = now()
      WHERE id = $1
    `, [userId]);
    
    console.log('✅ [DB] 2FA desactivado correctamente');
    return result;
  } catch (error) {
    console.error('❌ [DB] Error desactivando 2FA:', error);
    throw error;
  }
}

module.exports = {
  getById,
  getByEmail,
  saveTwoFASecret,
  enableTwoFA,
  disableTwoFA
};
