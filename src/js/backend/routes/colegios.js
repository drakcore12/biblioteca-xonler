const express = require('express');
const router = express.Router();
const {
  obtenerColegios,
  obtenerColegioPorId,
  crearColegio,
  actualizarColegio,
  eliminarColegio
} = require('../controllers/colegiosController');

// Ruta para obtener todos los colegios
router.get('/', obtenerColegios);

// Ruta para obtener un colegio por ID
router.get('/:id', obtenerColegioPorId);

// Ruta para crear un colegio
router.post('/', crearColegio);

// Ruta para actualizar un colegio
router.put('/:id', actualizarColegio);

// Ruta para eliminar un colegio
router.delete('/:id', eliminarColegio);

module.exports = router;