const pool = require('../js/backend/database');

async function testConnection() {
  try {
    await pool.query('SELECT 1');
    console.log('Database connection successful');
    process.exit(0);
  } catch (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
}

testConnection();

