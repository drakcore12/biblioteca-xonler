const express = require('express');
const router = express.Router();
const { hybridAuth } = require('../middleware/hybrid-auth');
const { requireRole } = require('../middleware/auth');
const {
  obtenerBibliotecaAsignada,
  obtenerEstadisticasBiblioteca,
  obtenerLibrosBiblioteca,
  agregarLibroABiblioteca,
  removerLibroDeBiblioteca,
  crearLibro,
  obtenerPrestamosBiblioteca,
  marcarPrestamoDevuelto
} = require('../controllers/admin-biblioteca.controller');

// Middleware: requiere autenticación híbrida y rol de admin
router.use(hybridAuth);
router.use(requireRole('admin'));

// Información de la biblioteca asignada
router.get('/biblioteca', obtenerBibliotecaAsignada);

// Estadísticas de la biblioteca
router.get('/estadisticas', obtenerEstadisticasBiblioteca);

// Gestión de libros de la biblioteca
router.get('/libros', obtenerLibrosBiblioteca);
router.post('/libros', agregarLibroABiblioteca);
router.post('/libros/crear', crearLibro);
router.delete('/libros/:biblioteca_libro_id', removerLibroDeBiblioteca);

// Gestión de préstamos
router.get('/prestamos', obtenerPrestamosBiblioteca);
router.patch('/prestamos/:prestamo_id/devolver', marcarPrestamoDevuelto);

module.exports = router;
