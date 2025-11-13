const client = require('prom-client');

// Crear un Registry para las métricas
const register = new client.Registry();

// Agregar métricas por defecto (CPU, memoria, etc.)
// collectDefaultMetrics retorna un objeto con un método para detener la recolección
const defaultMetrics = client.collectDefaultMetrics({ register });

// Métricas personalizadas de la aplicación
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duración de las peticiones HTTP en segundos',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total de peticiones HTTP',
  labelNames: ['method', 'route', 'status']
});

const dbQueryDuration = new client.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duración de las consultas a la base de datos en segundos',
  labelNames: ['query_type', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

const dbQueryTotal = new client.Counter({
  name: 'db_queries_total',
  help: 'Total de consultas a la base de datos',
  labelNames: ['query_type', 'table', 'status']
});

const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Número de conexiones activas'
});

// Registrar todas las métricas
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(dbQueryDuration);
register.registerMetric(dbQueryTotal);
register.registerMetric(activeConnections);

// Función para detener la recolección de métricas por defecto (útil para tests)
function stopDefaultMetrics() {
  if (defaultMetrics && typeof defaultMetrics.stop === 'function') {
    defaultMetrics.stop();
  }
}

module.exports = {
  register,
  httpRequestDuration,
  httpRequestTotal,
  dbQueryDuration,
  dbQueryTotal,
  activeConnections,
  stopDefaultMetrics
};

