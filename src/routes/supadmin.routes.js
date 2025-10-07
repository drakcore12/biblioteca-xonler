const express = require('express');
const router = express.Router();
const supadminController = require('../controllers/supadmin.controller');
const { auth, requireRole } = require('../middleware/auth');

// Middleware para verificar que el usuario sea super administrador
const requireSupAdmin = requireRole('supadmin');

// Aplicar autenticación a todas las rutas
router.use(auth);
router.use(requireSupAdmin);

// Rutas de estadísticas
router.get('/estadisticas', supadminController.obtenerEstadisticasGlobales);

// Rutas de actividad
router.get('/actividad', supadminController.obtenerActividadReciente);

// Rutas de logs
router.get('/logs', supadminController.obtenerLogs);

module.exports = router;
