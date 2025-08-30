const express = require('express');
const router  = express.Router();
const {
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
} = require('../controllers/usuarios.controller');

const { auth } = require('../middleware/auth');

// ✅ ARREGLADO: Rutas públicas
router.post('/registro', crearUsuario);
router.post('/login',    loginUsuario);

// ✅ ARREGLADO: Rutas protegidas (requieren autenticación)
// ⚠️ IMPORTANTE: Rutas específicas ANTES que las generales
router.get('/me',        auth, obtenerUsuarioActual);           // Usuario actual
router.put('/me',         auth, actualizarUsuarioActual);       // Actualizar usuario actual
router.put('/me/preferencias', auth, actualizarPreferenciasUsuario); // Actualizar preferencias usuario actual
router.put('/me/password', auth, cambiarPasswordUsuario);       // Cambiar contraseña usuario actual

router.get('/',           auth, obtenerUsuarios);               // Lista de usuarios
router.get('/:id',        auth, obtenerUsuarioPorId);           // Usuario por ID
router.put('/:id',        auth, actualizarUsuario);             // Actualizar usuario por ID
router.put('/:id/password', auth, cambiarPasswordUsuario);      // Cambiar contraseña por ID

router.delete('/:id',     auth, eliminarUsuario);               // Eliminar usuario

module.exports = router;