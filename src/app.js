// src/app.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();

// ================== CONFIGURACIÓN BÁSICA ==================
const SERVER_STARTED_AT = Date.now();

// ================== MIDDLEWARES BASE ==================
app.use(express.json());

// CORS (ajusta origin si necesitas restringir)
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Middleware de debug para POST requests
app.use((req, res, next) => {
  if (req.method === 'POST') {
    console.log('🔍 [DEBUG] POST Request:', {
      url: req.url,
      contentType: req.get('Content-Type'),
      body: req.body,
      bodyKeys: Object.keys(req.body || {}),
    });
  }
  next();
});



// Logs simples
app.use((req, _res, next) => {
  console.log(`↗️  ${req.method} ${req.originalUrl}`);
  next();
});



// ================== RUTAS API ==================
// Ruta de prueba antes de las rutas API
app.get('/api/test', (req, res) => {
  res.json({ message: 'API funcionando correctamente' });
});

const apiRoutes = require('./routes/index.routes');
app.use('/api', apiRoutes);

// ================== ESTÁTICOS ==================
app.use(express.static(path.join(__dirname, '../public')));

// ================== RUTAS DE PÁGINAS ==================
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/guest/index.html'));
});

app.get('/contacto', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/guest/contacto.html'));
});

app.get('/login', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/guest/login.html'));
});

// ================== ERRORES ==================
app.use((err, req, res, next) => {
  console.error('❌ Error no manejado:', err);
  if (res.headersSent) return next(err);

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'JSON inválido en el body' });
  }

  if (err.code === '23505') {
    return res.status(409).json({ error: 'Conflicto: el recurso ya existe' });
  }

  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referencia inválida' });
  }

  res.status(500).json({ error: 'Error interno del servidor' });
});

// 404 JSON para endpoints no encontrados
app.use((req, res) => {
  res.status(404).json({ error: 'No encontrado' });
});

module.exports = app;
