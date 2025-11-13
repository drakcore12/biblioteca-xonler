const { Pool } = require('pg');
require('dotenv').config();

// Configuración de la base de datos
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number.parseInt(process.env.DB_PORT ?? '5432', 10),
  database: process.env.DB_NAME || 'xonler',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  // Configuraciones adicionales para mejor rendimiento (desde variables de entorno)
  max: Number.parseInt(process.env.DB_POOL_MAX ?? '20', 10), // máximo de conexiones en el pool
  idleTimeoutMillis: Number.parseInt(process.env.DB_POOL_IDLE_TIMEOUT ?? '30000', 10), // tiempo de inactividad antes de cerrar
  connectionTimeoutMillis: Number.parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT ?? '2000', 10), // tiempo máximo para conectar
});

// Evento cuando se conecta una nueva conexión
pool.on('connect', () => {
  console.log('🔌 Nueva conexión a PostgreSQL establecida');
});

// Evento cuando hay un error en la conexión
pool.on('error', (err) => {
  console.error('❌ Error en el pool de PostgreSQL:', err);
});

// Función para probar la conexión
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Conexión a PostgreSQL exitosa');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error.message);
    return false;
  }
}

// Función para cerrar el pool (útil para tests o shutdown)
async function closePool() {
  await pool.end();
  console.log('🔌 Pool de PostgreSQL cerrado');
}

module.exports = {
  pool,
  testConnection,
  closePool
};
