const express = require('express');
const router = express.Router();
const {
  obtenerBibliotecas,
  obtenerBibliotecaPorId,
  crearBiblioteca,
  actualizarBiblioteca,
  eliminarBiblioteca,
  obtenerLibrosPorBiblioteca
} = require('../controllers/bibliotecasController');

// Ruta para obtener todas las bibliotecas (con o sin filtros)
router.get('/', obtenerBibliotecas);

// Rutas CRUD y la nueva ruta para libros de una biblioteca
router.get('/:id', obtenerBibliotecaPorId);
router.post('/', crearBiblioteca);
router.put('/:id', actualizarBiblioteca);
router.delete('/:id', eliminarBiblioteca);
router.get('/:id/libros', obtenerLibrosPorBiblioteca);

module.exports = router;