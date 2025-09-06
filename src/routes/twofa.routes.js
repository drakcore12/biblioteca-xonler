const express = require('express');
const router = express.Router();
const {
  verify2FALogin,
  setup2FA,
  verify2FA,
  disable2FA,
  get2FAStatus
} = require('../controllers/twofa.controller');
const { auth } = require('../middleware/auth');

// POST /api/usuarios/login/2fa - Verificar código 2FA en login (sin auth, usa pending2faToken)
router.post('/login/2fa', verify2FALogin);

// POST /api/usuarios/2fa/setup - Generar QR para configurar 2FA
router.post('/2fa/setup', auth, setup2FA);

// POST /api/usuarios/2fa/verify - Verificar código y activar 2FA
router.post('/2fa/verify', auth, verify2FA);

// POST /api/usuarios/2fa/disable - Desactivar 2FA
router.post('/2fa/disable', auth, disable2FA);

// GET /api/usuarios/2fa/status - Obtener estado de 2FA
router.get('/2fa/status', auth, get2FAStatus);


module.exports = router;
