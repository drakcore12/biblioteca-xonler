const express = require('express');
const router = express.Router();

// Importar todas las rutas
const authRoutes = require('./auth.routes');
const usuariosRoutes = require('./usuarios.routes');
const rolesRoutes = require('./roles.routes');
const colegiosRoutes = require('./colegios.routes');
const bibliotecasRoutes = require('./bibliotecas.routes');
const librosRoutes = require('./libros.routes');
const bibliotecaLibrosRoutes = require('./biblioteca-libros.routes');
const prestamosRoutes = require('./prestamos.routes');
const twofaRoutes = require('./twofa.routes');

// Definir prefijos para cada grupo de rutas
router.use('/auth', authRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/usuarios', twofaRoutes); // 2FA usa el mismo prefijo que usuarios
router.use('/roles', rolesRoutes);
router.use('/colegios', colegiosRoutes);
router.use('/bibliotecas', bibliotecasRoutes);
router.use('/libros', librosRoutes);
router.use('/biblioteca-libros', bibliotecaLibrosRoutes);
router.use('/prestamos', prestamosRoutes);

// Ruta de salud para verificar que el servidor esté funcionando
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Biblioteca Xonler API funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Ruta raíz
router.get('/', (req, res) => {
  res.json({
    message: 'Bienvenido a la API de Biblioteca Xonler',
    version: '1.0.0',
    endpoints: {
      auth: '/auth',
      usuarios: '/usuarios',
      roles: '/roles',
      colegios: '/colegios',
      bibliotecas: '/bibliotecas',
      libros: '/libros',
      'biblioteca-libros': '/biblioteca-libros',
      prestamos: '/prestamos',
      health: '/health'
    },
    documentation: 'Consulta la documentación para más detalles'
  });
});

module.exports = router;
