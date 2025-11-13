// Test directo para metrics.js
// Este test ejecuta el código real para que se cuente en cobertura

const express = require('express');
const request = require('supertest');

// Mock solo lo necesario
const mockMetrics = jest.fn(() => Promise.resolve('# metrics data'));
jest.mock('../../src/utils/metrics', () => ({
  register: {
    contentType: 'text/plain',
    metrics: mockMetrics
  }
}));

describe('metrics.js - test directo', () => {
  let app;

  beforeEach(() => {
    app = express();
    // Cargar el router real
    const metricsRouter = require('../../src/routes/metrics');
    app.use(metricsRouter);
    jest.clearAllMocks();
  });

  it('debe tener ruta GET /metrics', async () => {
    const res = await request(app).get('/metrics');
    
    expect(res.status).toBe(200);
    // Express puede agregar charset=utf-8 al content-type
    expect(res.headers['content-type']).toContain('text/plain');
  });

  it('debe manejar errores en /metrics', async () => {
    // Resetear el mock y hacer que falle
    mockMetrics.mockRejectedValueOnce(new Error('Metrics error'));
    
    const res = await request(app).get('/metrics');
    
    expect(res.status).toBe(500);
    // Restaurar el mock para otros tests
    mockMetrics.mockResolvedValueOnce('# metrics data');
  });
});

