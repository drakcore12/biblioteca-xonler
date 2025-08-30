const express = require('express');
const router  = express.Router();
const {
  obtenerUsuarios,
  obtenerUsuarioActual,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  actualizarUsuarioActual, // ✅ ARREGLADO: Nueva función para PUT /me
  eliminarUsuario,
  loginUsuario,
  cambiarPasswordUsuario
} = require('../controllers/usuarios.controller');

const {
  getPreferenciasMe,
  putPreferenciasMe,
  getPreferenciasById,
  putPreferenciasById
} = require('../controllers/preferencias.controller');

const { auth } = require('../middleware/auth');

// ✅ ARREGLADO: Rutas públicas
router.post('/registro', crearUsuario);
router.post('/login',    loginUsuario);

// ✅ ARREGLADO: Rutas protegidas (requieren autenticación)
// ⚠️ IMPORTANTE: Rutas específicas ANTES que las generales
router.get('/me/preferencias', auth, getPreferenciasMe);        // Obtener preferencias usuario actual
router.put('/me/preferencias', auth, putPreferenciasMe);        // Actualizar preferencias usuario actual
router.get('/me/password', auth, cambiarPasswordUsuario);       // Cambiar contraseña usuario actual
router.get('/me',        auth, obtenerUsuarioActual);           // Usuario actual

router.get('/',           auth, obtenerUsuarios);               // Lista de usuarios
router.put('/me',         auth, actualizarUsuarioActual);        // ✅ ARREGLADO: Actualizar usuario actual
router.put('/:id',        auth, actualizarUsuario);             // Actualizar usuario por ID
router.put('/:id/password', auth, cambiarPasswordUsuario);      // Cambiar contraseña por ID
router.get('/:id/preferencias', auth, getPreferenciasById);     // Obtener preferencias por ID (fallback)
router.put('/:id/preferencias', auth, putPreferenciasById);     // Actualizar preferencias por ID (fallback)
router.get('/:id',        auth, obtenerUsuarioPorId);           // Usuario por ID

router.delete('/:id',     auth, eliminarUsuario);               // Eliminar usuario

module.exports = router;