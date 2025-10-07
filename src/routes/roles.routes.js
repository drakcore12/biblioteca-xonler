const express = require('express');
const router = express.Router();
const { obtenerRoles, obtenerRolPorId } = require('../controllers/roles.controller');
const { hybridAuth } = require('../middleware/hybrid-auth');

// Rutas protegidas (requieren autenticación)
router.get('/', hybridAuth, obtenerRoles);           // Lista de roles
router.get('/:id', hybridAuth, obtenerRolPorId);     // Rol por ID

module.exports = router;