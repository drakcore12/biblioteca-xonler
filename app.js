// app.js
require('dotenv').config();
const path    = require('path');
const express = require('express');
const cors    = require('cors');

// 1) Importa tus routers usando la ruta correcta
const usuariosRouter     = require('./js/backend/routes/usuarios');
const librosRouter       = require('./js/backend/routes/libros');
const bibliotecasRouter  = require('./js/backend/routes/bibliotecas');
const colegiosRouter = require('./js/backend/routes/colegios');

const app = express();
const PORT = process.env.PORT || 5500;

// Logging de todas las peticiones
app.use((req, res, next) => {
  console.log(`↗️  ${req.method} ${req.originalUrl}`);
  next();
});

// 2) Middlewares
app.use(express.json());
app.use(cors());

// 3) Archivos estáticos
app.use('/',       express.static(path.join(__dirname, 'pages')));
app.use('/js',     express.static(path.join(__dirname, 'js')));
app.use('/css',    express.static(path.join(__dirname, 'css')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// 4) Montar rutas de API
app.use('/api/libros',       librosRouter);
app.use('/api/usuarios',     usuariosRouter);
app.use('/api/bibliotecas',  bibliotecasRouter);
app.use('/api/colegios', colegiosRouter);

// 5) Manejo de rutas no encontradas (opcional)
app.use((req, res) => {
  res.status(404).json({ error: 'No encontrado' });
});

// 6) Inicio del servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor Express corriendo en http://localhost:${PORT}`);
});
