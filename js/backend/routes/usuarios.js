const express = require('express');
const router  = express.Router();
const {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  loginUsuario
} = require('../controllers/usuariosController');

// Rutas CRUD
router.get('/',          obtenerUsuarios);
router.get('/:id',       obtenerUsuarioPorId);
router.post('/registro', crearUsuario);

// Ruta de login
router.post('/login',    loginUsuario);

router.put('/:id',       actualizarUsuario);
router.delete('/:id',    eliminarUsuario);

module.exports = router;