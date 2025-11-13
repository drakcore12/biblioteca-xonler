const path = require('node:path');
const express = require('express');
const apiRoutes = require('../routes/index.routes');
const securityRoutes = require('../routes/security.routes');

const PUBLIC_BASE_PATH = path.join(__dirname, '../../public');

function registerApiRoutes(app) {
  app.get('/api/test', (_req, res) => {
    res.json({ message: 'API funcionando correctamente' });
  });

  app.use('/api', apiRoutes);
  app.use('/api/security', securityRoutes);
}

function registerStaticRoutes(app) {
  // NOSONAR S2068: '/reset-password' es una ruta URL, no una contraseña hardcodeada
  const staticPages = {
    '/': 'pages/guest/index.html',
    '/contacto': 'pages/guest/contacto.html',
    '/login': 'pages/guest/login.html',
    '/reset-password': 'pages/guest/reset-password.html', // NOSONAR
    '/monitoring': 'pages/admin/monitoring.html',
    '/cleanup-tokens': 'cleanup-tokens.html',
  };

  for (const [route, relativePath] of Object.entries(staticPages)) {
    app.get(route, (_req, res) => {
      res.sendFile(path.join(PUBLIC_BASE_PATH, relativePath));
    });
  }
}

function registerPublicAssets(app) {
  app.use(express.static(PUBLIC_BASE_PATH));
}

function registerRoutes(app) {
  registerApiRoutes(app);
  registerPublicAssets(app);
  registerStaticRoutes(app);
}

module.exports = { registerRoutes };
