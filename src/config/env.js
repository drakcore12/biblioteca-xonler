const dotenv = require('dotenv');

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  logEncryptionEnabled: process.env.LOG_ENCRYPTION === 'true',
};

module.exports = { env };
