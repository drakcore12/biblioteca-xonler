const express = require('express');
const router = express.Router();
const { obtenerResumen } = require('../controllers/dashboardController');

router.get('/', obtenerResumen);

module.exports = router;
