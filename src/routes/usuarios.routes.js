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

const { hybridAuth } = require('../middleware/hybrid-auth');

// ✅ ARREGLADO: Rutas públicas
router.post('/registro', crearUsuario);
router.post('/login',    loginUsuario);

// ✅ ARREGLADO: Rutas protegidas (requieren autenticación)
// ⚠️ IMPORTANTE: Rutas específicas ANTES que las generales
router.get('/me',        hybridAuth, obtenerUsuarioActual);           // Usuario actual
router.put('/me',         hybridAuth, actualizarUsuarioActual);       // Actualizar usuario actual
router.put('/me/preferencias', hybridAuth, actualizarPreferenciasUsuario); // Actualizar preferencias usuario actual
router.put('/me/password', hybridAuth, cambiarPasswordUsuario);       // Cambiar contraseña usuario actual

router.get('/',           hybridAuth, obtenerUsuarios);               // Lista de usuarios
router.get('/:id',        hybridAuth, obtenerUsuarioPorId);           // Usuario por ID
router.put('/:id',        hybridAuth, actualizarUsuario);             // Actualizar usuario por ID
router.put('/:id/password', hybridAuth, cambiarPasswordUsuario);      // Cambiar contraseña por ID

router.delete('/:id',     hybridAuth, eliminarUsuario);               // Eliminar usuario

module.exports = router;