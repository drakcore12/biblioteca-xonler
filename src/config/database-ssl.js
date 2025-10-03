const { Pool } = require('pg');

/**
 * Configuración de base de datos con SSL
 */
const createSecurePool = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Configuración base
  const baseConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'biblioteca_xonler',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
    max: 20, // Máximo de conexiones en el pool
    idleTimeoutMillis: 30000, // Tiempo de inactividad antes de cerrar conexión
    connectionTimeoutMillis: 2000, // Tiempo de espera para nueva conexión
  };

  // Configuración SSL
  const sslConfig = {
    // En producción, SSL es obligatorio
    ssl: isProduction ? {
      rejectUnauthorized: true,
      ca: process.env.DB_SSL_CA, // Certificado de CA
      cert: process.env.DB_SSL_CERT, // Certificado del cliente
      key: process.env.DB_SSL_KEY, // Clave privada del cliente
      servername: process.env.DB_HOST // Nombre del servidor
    } : isDevelopment ? {
      // En desarrollo, SSL opcional pero recomendado
      rejectUnauthorized: false,
      sslmode: 'prefer'
    } : false
  };

  // Configuración de logging
  const loggingConfig = {
    // Log de conexiones
    onConnect: (client) => {
      console.log('🔌 [DB] Nueva conexión establecida');
    },
    
    // Log de errores
    onError: (err, client) => {
      console.error('❌ [DB] Error en conexión:', err.message);
    },
    
    // Log de desconexiones
    onRemove: (client) => {
      console.log('🔌 [DB] Conexión cerrada');
    }
  };

  // Configuración final
  const finalConfig = {
    ...baseConfig,
    ...sslConfig,
    ...loggingConfig
  };

  // Crear pool de conexiones
  const pool = new Pool(finalConfig);

  // Manejar errores del pool
  pool.on('error', (err) => {
    console.error('❌ [DB] Error inesperado en el pool de conexiones:', err);
  });

  // Función para probar la conexión
  const testConnection = async () => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT NOW() as current_time, version() as db_version');
      client.release();
      
      console.log('✅ [DB] Conexión SSL exitosa:', {
        time: result.rows[0].current_time,
        version: result.rows[0].db_version.split(' ')[0]
      });
      
      return true;
    } catch (error) {
      console.error('❌ [DB] Error de conexión SSL:', error.message);
      return false;
    }
  };

  // Función para obtener estadísticas del pool
  const getPoolStats = () => {
    return {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    };
  };

  // Función para cerrar el pool
  const closePool = async () => {
    try {
      await pool.end();
      console.log('🔌 [DB] Pool de conexiones cerrado');
    } catch (error) {
      console.error('❌ [DB] Error cerrando pool:', error.message);
    }
  };

  return {
    pool,
    testConnection,
    getPoolStats,
    closePool
  };
};

// Configuración de SSL para diferentes entornos
const getSSLConfig = (environment) => {
  const configs = {
    development: {
      ssl: false, // SSL opcional en desarrollo
      sslmode: 'prefer'
    },
    staging: {
      ssl: {
        rejectUnauthorized: false,
        sslmode: 'require'
      }
    },
    production: {
      ssl: {
        rejectUnauthorized: true,
        ca: process.env.DB_SSL_CA,
        cert: process.env.DB_SSL_CERT,
        key: process.env.DB_SSL_KEY,
        servername: process.env.DB_HOST
      }
    }
  };

  return configs[environment] || configs.development;
};

// Función para validar configuración SSL
const validateSSLConfig = () => {
  const requiredVars = ['DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PASSWORD'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn('⚠️ [DB] Variables de entorno faltantes:', missingVars);
  }

  if (process.env.NODE_ENV === 'production') {
    const sslVars = ['DB_SSL_CA', 'DB_SSL_CERT', 'DB_SSL_KEY'];
    const missingSSL = sslVars.filter(varName => !process.env[varName]);
    
    if (missingSSL.length > 0) {
      console.error('❌ [DB] Variables SSL faltantes para producción:', missingSSL);
      return false;
    }
  }

  return true;
};

module.exports = {
  createSecurePool,
  getSSLConfig,
  validateSSLConfig
};
