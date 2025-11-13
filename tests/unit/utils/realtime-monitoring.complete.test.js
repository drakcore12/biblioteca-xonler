// Mock os
jest.mock('node:os', () => ({
  cpus: jest.fn(),
  totalmem: jest.fn(),
  freemem: jest.fn(),
  uptime: jest.fn(),
  loadavg: jest.fn(),
  platform: jest.fn(),
  arch: jest.fn()
}));

// Mock fs
jest.mock('node:fs', () => ({
  statSync: jest.fn()
}));

// Mock logger
jest.mock('../../../src/config/logger', () => ({
  logInfo: jest.fn(),
  logError: jest.fn()
}));

// Mock security-alerts
jest.mock('../../../src/utils/security-alerts', () => ({
  alertResourceUsage: jest.fn(),
  alertHighErrorRate: jest.fn(),
  sendSecurityAlert: jest.fn()
}));

const realtimeMonitoring = require('../../../src/utils/realtime-monitoring');
const os = require('node:os');
const securityAlerts = require('../../../src/utils/security-alerts');

describe('realtime-monitoring - cobertura completa', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    process.env.MONITORING_INTERVAL = '1000';
    realtimeMonitoring.stopMonitoring();
  });

  afterEach(() => {
    // Asegurar que el monitoreo se detiene después de cada test
    realtimeMonitoring.stopMonitoring();
  });

  afterAll(() => {
    // Asegurar que el monitoreo se detiene después de todos los tests
    realtimeMonitoring.stopMonitoring();
  });

  describe('getDiskUsage - casos edge', () => {
    it('debe retornar valores por defecto si hay error', () => {
      const fs = require('node:fs');
      fs.statSync.mockImplementationOnce(() => {
        throw new Error('Stat error');
      });
      
      const diskUsage = realtimeMonitoring.getDiskUsage();
      
      expect(diskUsage).toEqual({
        total: 0,
        used: 0,
        free: 0,
        usage: 0
      });
    });
  });

  describe('calculateAverageResponseTime', () => {
    it('debe retornar 0 si no hay tiempos', () => {
      realtimeMonitoring.requestMetrics.responseTimes = [];
      
      const avg = realtimeMonitoring.calculateAverageResponseTime();
      
      expect(avg).toBe(0);
    });

    it('debe calcular promedio correctamente', () => {
      realtimeMonitoring.requestMetrics.responseTimes = [100, 200, 300];
      
      const avg = realtimeMonitoring.calculateAverageResponseTime();
      
      expect(avg).toBe(200);
    });
  });

  describe('recordRequest - casos edge', () => {
    it('debe limitar tamaño de responseTimes', () => {
      process.env.MONITORING_MAX_RESPONSE_TIMES = '5';
      
      for (let i = 0; i < 10; i++) {
        realtimeMonitoring.recordRequest(100, false);
      }
      
      expect(realtimeMonitoring.requestMetrics.responseTimes.length).toBeLessThanOrEqual(5);
    });
  });

  describe('checkThresholds - casos edge', () => {
    it('debe manejar error en alertas', async () => {
      realtimeMonitoring.metrics.system = {
        cpu: { usage: 0.9 }
      };
      realtimeMonitoring.alertThresholds.cpu = 0.8;
      securityAlerts.alertResourceUsage.mockRejectedValueOnce(new Error('Alert error'));
      
      await realtimeMonitoring.checkThresholds();
      
      // No debe lanzar error
      expect(securityAlerts.alertResourceUsage).toHaveBeenCalled();
    });
  });
});

