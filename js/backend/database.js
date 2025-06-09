require('dotenv').config();
const { Pool } = require('pg');

// Convertir DB_SSL a booleano
const useSSL = process.env.DB_SSL === 'true';

const pool = new Pool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port:     process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  max:      10,
  idleTimeoutMillis:     30000,
  connectionTimeoutMillis: 2000,
  ssl: useSSL ? { rejectUnauthorized: false } : false
});

// Log de configuración
console.log('PG Pool config:', {
  host: pool.options.host,
  user: pool.options.user,
  database: pool.options.database,
  port: pool.options.port,
  ssl: useSSL
});

// Prueba de conexión inmediata
pool.connect()
  .then(client => {
    console.log('✔️ Conectado a PostgreSQL:', (new Date()).toISOString());
    client.release();
  })
  .catch(err => {
    console.error('❌ Error conectando a PostgreSQL:', err.message);
  });

module.exports = pool;
