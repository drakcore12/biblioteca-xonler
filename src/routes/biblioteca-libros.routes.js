const express = require('express');
const router = express.Router();
const {
  obtenerBibliotecaLibros,
  obtenerBibliotecaLibroPorId,
  crearBibliotecaLibro,
  eliminarBibliotecaLibro,
  verificarDisponibilidad
} = require('../controllers/biblioteca-libros.controller');

const { auth, requireRole } = require('../middleware/auth');

// Rutas públicas (solo lectura)
router.get('/', obtenerBibliotecaLibros);
router.get('/:id', obtenerBibliotecaLibroPorId);
router.get('/:id/disponibilidad', verificarDisponibilidad);

// Rutas protegidas (requieren autenticación y rol de admin)
router.use(auth);
router.use(requireRole('admin'));

router.post('/', crearBibliotecaLibro);
router.delete('/:id', eliminarBibliotecaLibro);

module.exports = router;
