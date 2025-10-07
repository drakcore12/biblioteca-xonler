const { createApp } = require('./app');
const { env } = require('./config/env');

const app = createApp();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📖 Biblioteca Xonler API disponible en http://localhost:${PORT}`);
  console.log(`🌐 Frontend disponible en http://localhost:${PORT}`);
  console.log(`🔒 Entorno: ${env.nodeEnv}`);
});
