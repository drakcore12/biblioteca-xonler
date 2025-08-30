// src/app.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares base
app.use(express.json());
app.use(cors());

// Logs simples
app.use((req, _res, next) => {
  console.log(`↗️  ${req.method} ${req.originalUrl}`);
  next();
});

// ====== RUTAS API (usa las rutas REALES) ======
const usuariosRouter    = require('./routes/usuarios.routes');
const librosRouter      = require('./routes/libros.routes');
const bibliotecasRouter = require('./routes/bibliotecas.routes');
const colegiosRouter    = require('./routes/colegios.routes');

app.use('/api/usuarios', usuariosRouter);
app.use('/api/libros', librosRouter);
app.use('/api/bibliotecas', bibliotecasRouter);
app.use('/api/colegios', colegiosRouter);

// ====== ESTÁTICOS ======
// Sirve TODO lo que hay en /public (HTML, CSS, JS, imágenes)
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/guest/index.html'));
});

app.get('/contacto', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/guest/contacto.html'));
});

app.get('/login', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/guest/login.html'));
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/guest/index.html'));
});


// Opcional: ruta de salud
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ✅ ARREGLADO: Manejo global de errores
app.use((err, req, res, next) => {
  console.error('❌ Error no manejado:', err);
  
  // Si ya se envió respuesta, no enviar otra
  if (res.headersSent) {
    return next(err);
  }
  
  // Error de validación de JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'JSON inválido en el body' });
  }
  
  // Error de base de datos
  if (err.code === '23505') { // unique_violation
    return res.status(409).json({ error: 'Conflicto: el recurso ya existe' });
  }
  
  if (err.code === '23503') { // foreign_key_violation
    return res.status(400).json({ error: 'Referencia inválida' });
  }
  
  // Error genérico
  res.status(500).json({ error: 'Error interno del servidor' });
});

// 404 JSON para endpoints no encontrados
app.use((req, res) => {
  res.status(404).json({ error: 'No encontrado' });
});

module.exports = app;
