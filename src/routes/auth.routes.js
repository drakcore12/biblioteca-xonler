const express = require('express');
const router = express.Router();
const {
  register,
  login,
  me,
  refresh
} = require('../controllers/auth.controller');

const { auth } = require('../middleware/auth');

// Rutas públicas
router.post('/register', register);
router.post('/login', login);

// Rutas protegidas (requieren autenticación)
router.get('/me', auth, me);
router.post('/refresh', auth, refresh);

module.exports = router;
