const express = require('express');
const router = express.Router();
const { obtenerResumen, obtenerActividadReciente } = require('../controllers/dashboardController');

router.get('/', obtenerResumen);
router.get('/actividad', obtenerActividadReciente);

module.exports = router;
