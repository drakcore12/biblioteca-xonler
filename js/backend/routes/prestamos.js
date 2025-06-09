const express = require('express');
const router = express.Router();
const {
  obtenerPrestamos,
  obtenerPrestamoPorId,
  crearPrestamo,
  actualizarPrestamo,
  eliminarPrestamo
} = require('../controllers/prestamosController');

router.get('/', obtenerPrestamos);
router.get('/:id', obtenerPrestamoPorId);
router.post('/', crearPrestamo);
router.put('/:id', actualizarPrestamo);
router.delete('/:id', eliminarPrestamo);

module.exports = router;
