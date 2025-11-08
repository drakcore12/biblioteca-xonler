const { createApp } = require('./app');
const { env } = require('./config/env');

const app = createApp();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor corriendo en ${HOST}:${PORT}`);
  console.log(`📖 Biblioteca Xonler API disponible en http://${HOST}:${PORT}`);
  console.log(`🌐 Frontend disponible en http://${HOST}:${PORT}`);
  console.log(`🔒 Entorno: ${env.nodeEnv}`);
});
