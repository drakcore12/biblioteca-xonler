/**
 * Tests para src/utils/metrics.js
 */

// Mock de prom-client antes de cargar el módulo
jest.mock('prom-client', () => {
  const mockRegistry = {
    registerMetric: jest.fn()
  };

  const mockHistogram = jest.fn().mockImplementation(() => ({
    labels: jest.fn().mockReturnThis(),
    observe: jest.fn()
  }));

  const mockCounter = jest.fn().mockImplementation(() => ({
    labels: jest.fn().mockReturnThis(),
    inc: jest.fn()
  }));

  const mockGauge = jest.fn().mockImplementation(() => ({
    set: jest.fn()
  }));

  return {
    Registry: jest.fn(() => mockRegistry),
    Histogram: mockHistogram,
    Counter: mockCounter,
    Gauge: mockGauge,
    collectDefaultMetrics: jest.fn()
  };
});

describe('src/utils/metrics.js', () => {
  let metricsModule;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    metricsModule = require('../../../src/utils/metrics');
  });

  test('debe exportar register', () => {
    expect(metricsModule.register).toBeDefined();
  });

  test('debe exportar httpRequestDuration', () => {
    expect(metricsModule.httpRequestDuration).toBeDefined();
  });

  test('debe exportar httpRequestTotal', () => {
    expect(metricsModule.httpRequestTotal).toBeDefined();
  });

  test('debe exportar dbQueryDuration', () => {
    expect(metricsModule.dbQueryDuration).toBeDefined();
  });

  test('debe exportar dbQueryTotal', () => {
    expect(metricsModule.dbQueryTotal).toBeDefined();
  });

  test('debe exportar activeConnections', () => {
    expect(metricsModule.activeConnections).toBeDefined();
  });
});

