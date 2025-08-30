const express = require('express');
const router = express.Router();
const {
  obtenerRoles,
  obtenerRolPorId,
  crearRol,
  actualizarRol,
  eliminarRol
} = require('../controllers/roles.controller');

const { auth, requireRole } = require('../middleware/auth');

// Ruta pública para ver roles (sin autenticación)
router.get('/public', obtenerRoles);

// Todas las demás rutas requieren autenticación y rol de admin
router.use(auth);
router.use(requireRole('admin'));

// Rutas CRUD para roles
router.get('/', obtenerRoles);
router.get('/:id', obtenerRolPorId);
router.post('/', crearRol);
router.put('/:id', actualizarRol);
router.delete('/:id', eliminarRol);

module.exports = router;
