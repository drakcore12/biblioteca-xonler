const express = require('express');
const router = express.Router();
const {
  obtenerColegios,
  obtenerColegioPorId,
  crearColegio,
  actualizarColegio,
  eliminarColegio
} = require('../controllers/colegios.controller');

const { auth, requireRole } = require('../middleware/auth');

// Rutas públicas (solo lectura)
router.get('/', obtenerColegios);
router.get('/:id', obtenerColegioPorId);

// Rutas protegidas (requieren autenticación y rol de admin)
router.use(auth);
router.use(requireRole('admin'));

router.post('/', crearColegio);
router.put('/:id', actualizarColegio);
router.delete('/:id', eliminarColegio);

module.exports = router;
