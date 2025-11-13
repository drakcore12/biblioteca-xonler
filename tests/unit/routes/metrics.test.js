const request = require('supertest');
const express = require('express');

// Mock prom-client
jest.mock('../../../src/utils/metrics', () => ({
  register: {
    contentType: 'text/plain',
    metrics: jest.fn(() => Promise.resolve('# metrics data'))
  }
}));

const metricsRoutes = require('../../../src/routes/metrics');

describe('metrics.routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(metricsRoutes);
    jest.clearAllMocks();
  });

  describe('GET /metrics', () => {
    it('debe retornar métricas en formato Prometheus', async () => {
      const res = await request(app).get('/metrics');
      
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/plain');
    });

    it('debe manejar errores', async () => {
      const { register } = require('../../../src/utils/metrics');
      register.metrics.mockRejectedValueOnce(new Error('Metrics error'));
      
      const res = await request(app).get('/metrics');
      
      expect(res.status).toBe(500);
    });
  });
});

