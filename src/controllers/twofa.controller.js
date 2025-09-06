const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const db = require('../db/usuarios.db');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const APP_NAME = 'Xonler';
const TOTP_STEP = 30;
const TOTP_WINDOW = 1;

// Construye otpauth:// si la lib no lo trae
function buildOtpAuthURL({ base32, label, issuer }) {
  return speakeasy.otpauthURL({
    secret: base32,
    label,          // p.ej. "Xonler:correo@dominio"
    issuer,         // "Xonler"
    encoding: 'base32'
  });
}

// Helper para generar token pendiente de 2FA
function generatePending2FAToken(userId) {
  return jwt.sign(
    { sub: userId, twofa: 1 },
    process.env.JWT_SECRET,
    { expiresIn: '5m' }
  );
}

async function get2FAStatus(req, res) {
  try {
    const userId = req.auth?.sub || req.user?.id;
    const user = await db.getById(userId);
    if (!user) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });

    const enabled = !!user.dobleautenticacion;
    const secret = user.preferencias?.twofa?.secret_base32 || null;

    return res.json({ success: true, enabled, hasSecret: !!secret });
  } catch (err) {
    console.error('[/2fa/status] ERROR:', err);
    return res.status(500).json({ success: false, error: 'Error consultando estado 2FA' });
  }
}

async function setup2FA(req, res) {
  try {
    console.log('🔧 [2FA SETUP] Configurando 2FA...');
    
    const userId = req.auth?.sub || req.user?.id;
    if (!userId) return res.status(401).json({ error: 'No auth' });

    const user = await db.getById(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    // 1) Generar secreto base32
    const secret = speakeasy.generateSecret({ length: 20 }); // simple y seguro
    const base32 = secret.base32;

    console.log('🔐 [2FA SETUP] Secreto generado:', base32);

    // 2) Guardar en DB (sin activar)
    const result = await db.saveTwoFASecret(user.id, base32);
    if (result?.rowCount === 0) {
      console.error('[/2fa/setup] UPDATE no afectó filas');
      return res.status(500).json({ error: 'No se pudo guardar el secreto' });
    }

    // 3) Construir otpauth URL (manual, para evitar undefined)
    const label = `${APP_NAME}:${user.email || user.nombre || user.id}`;
    const otpauth = buildOtpAuthURL({ base32, label, issuer: APP_NAME });

    console.log('🔐 [2FA SETUP] OTP Auth URL:', otpauth);

    // 4) Generar QR
    const qrcodeDataURL = await QRCode.toDataURL(otpauth);

    console.log('✅ [2FA SETUP] QR generado correctamente');

    return res.json({ 
      success: true,
      qrcodeDataURL,
      secret: base32, // Para debug/testing
      manualEntryKey: base32
    });
  } catch (err) {
    console.error('[/2fa/setup] ERROR:', err);
    return res.status(500).json({ error: 'Error generando configuración 2FA' });
  }
}

async function verify2FA(req, res) {
  try {
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ error: 'code requerido' });

    const userId = req.auth?.sub || req.user?.id;
    const user = await db.getById(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const secret = user.preferencias?.twofa?.secret_base32;
    if (!secret) return res.status(400).json({ error: 'No hay secreto' });

    const ok = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      step: TOTP_STEP,
      window: TOTP_WINDOW,
    });
    if (!ok) return res.status(400).json({ error: 'Código inválido' });

    await db.enableTwoFA(user.id);
    return res.json({ success: true, message: '2FA activado correctamente' });
  } catch (err) {
    console.error('[/2fa/verify] ERROR:', err);
    return res.status(500).json({ error: 'Error verificando 2FA' });
  }
}

async function disable2FA(req, res) {
  try {
    const userId = req.auth?.sub || req.user?.id;
    const user = await db.getById(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Si quieres exigir código para desactivar:
    const { code } = req.body || {};
    if (code && user.preferencias?.twofa?.secret_base32) {
      const ok = speakeasy.totp.verify({
        secret: user.preferencias.twofa.secret_base32,
        encoding: 'base32',
        token: code,
        step: TOTP_STEP,
        window: TOTP_WINDOW,
      });
      if (!ok) return res.status(401).json({ error: 'Código inválido' });
    }

    await db.disableTwoFA(user.id);
    return res.json({ success: true, message: '2FA desactivado correctamente' });
  } catch (err) {
    console.error('[/2fa/disable] ERROR:', err);
    return res.status(500).json({ error: 'Error desactivando 2FA' });
  }
}

// POST /api/usuarios/login/2fa - Verificar código 2FA
async function verify2FALogin(req, res) {
  try {
    console.log('🔐 [2FA LOGIN] Verificando código 2FA...');
    
    const { pending2faToken, code } = req.body || {};
    
    if (!pending2faToken || !code) {
      return res.status(400).json({ 
        error: 'Token pendiente y código son requeridos' 
      });
    }

    // Verificar token pendiente
    const payload = jwt.verify(pending2faToken, process.env.JWT_SECRET);
    if (!payload || payload.twofa !== 1) {
      return res.status(401).json({ 
        error: 'Token de 2FA inválido o expirado' 
      });
    }

    // Obtener usuario
    const user = await db.getById(payload.sub);
    if (!user || !user.dobleautenticacion) {
      return res.status(400).json({ 
        error: '2FA no está activo para este usuario' 
      });
    }

    // Obtener secreto
    const secret = user.preferencias?.twofa?.secret_base32;
    if (!secret) {
      return res.status(400).json({ 
        error: 'No se encontró secreto 2FA' 
      });
    }

    // Verificar código TOTP
    const isValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      step: TOTP_STEP,
      window: TOTP_WINDOW
    });

    if (!isValid) {
      console.log('❌ [2FA LOGIN] Código inválido');
      return res.status(401).json({ 
        error: 'Código 2FA inválido' 
      });
    }

    // Obtener el nombre del rol
    const rolResult = await pool.query('SELECT name FROM roles WHERE id = $1', [user.rol_id]);
    const rolName = rolResult.rows[0]?.name || 'usuario';

    // Generar token final
    const finalToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        rol: rolName,
        rol_id: user.rol_id 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ [2FA LOGIN] Código verificado correctamente');

    res.json({
      success: true,
      token: finalToken,
      user: {
        id: user.id,
        rol: rolName,
        rol_id: user.rol_id,
        nombre: user.nombre || ''
      }
    });

  } catch (error) {
    console.error('❌ [2FA LOGIN] Error:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
}

module.exports = { 
  get2FAStatus, 
  setup2FA, 
  verify2FA, 
  disable2FA, 
  verify2FALogin,
  generatePending2FAToken
};