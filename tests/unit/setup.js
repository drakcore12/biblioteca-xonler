/**
 * Setup global para tests
 * Limpia intervalos y timers después de todos los tests
 */

// Limpiar intervalos al finalizar todos los tests
if (typeof afterAll !== 'undefined') {
  afterAll(() => {
    // Limpiar intervalos de realtime-monitoring
    try {
      const realtimeMonitoring = require('../src/utils/realtime-monitoring');
      if (realtimeMonitoring && typeof realtimeMonitoring.stopMonitoring === 'function') {
        realtimeMonitoring.stopMonitoring();
      }
    } catch (e) {
      // Ignorar errores si el módulo no está disponible
    }

    // Limpiar intervalos de jwt-rotation
    try {
      const jwtRotation = require('../src/utils/jwt-rotation');
      if (jwtRotation && typeof jwtRotation.stopKeyRotation === 'function') {
        jwtRotation.stopKeyRotation();
      }
    } catch (e) {
      // Ignorar errores si el módulo no está disponible
    }
  });
}

