const express = require('express');
const router = express.Router();
const { obtenerLibros, obtenerLibroPorId } = require('../controllers/librosController');

// Ruta GET / para devolver todos los libros
router.get('/', obtenerLibros);

// Ruta GET /:id para devolver un libro por su ID
router.get('/:id', obtenerLibroPorId);

module.exports = router;