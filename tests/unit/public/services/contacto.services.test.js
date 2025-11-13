/**
 * @jest-environment jsdom
 */

// ============================================================================
// CONFIGURAR MOCKS GLOBALES
// ============================================================================

global.fetch = jest.fn();

const mockLocalStorage = {
  getItem: jest.fn().mockReturnValue(null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

const mockSessionStorage = {
  getItem: jest.fn().mockReturnValue(null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(global, 'localStorage', { value: mockLocalStorage, configurable: true });
Object.defineProperty(global, 'sessionStorage', { value: mockSessionStorage, configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: mockSessionStorage, configurable: true });

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', { value: mockLocalStorage, configurable: true });
  Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage, configurable: true });
}

global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

// Mock de form-handler y api-client
jest.mock('../../../public/services/common/form-handler.js', () => ({
  handleFormSubmit: jest.fn((form, handler, options) => handler({})),
  showError: jest.fn(),
  showSuccess: jest.fn(),
  isValidEmail: jest.fn((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)),
  validateRequired: jest.fn((value, fieldName) => {
    if (!value || value.trim() === '') {
      return `${fieldName} es requerido`;
    }
    return null;
  })
}));

jest.mock('../../../public/services/common/api-client.js', () => ({
  post: jest.fn().mockResolvedValue({ success: true })
}));

// ============================================================================
// IMPORTAR MÓDULO
// ============================================================================

jest.resetModules();
const contactoService = require('../../../public/services/contacto.services.js');

// ============================================================================
// TESTS
// ============================================================================

describe('contacto.services.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('initContactoForm', () => {
    it('debe inicializar formulario de contacto', () => {
      document.body.innerHTML = `
        <form id="contactForm">
          <input name="nombre" value="Test" />
          <input name="email" value="test@example.com" />
          <select name="asunto"><option value="consulta">Consulta</option></select>
          <textarea name="mensaje">Mensaje de prueba</textarea>
          <button type="submit">Enviar</button>
        </form>
      `;

      contactoService.initContactoForm();

      const form = document.getElementById('contactForm');
      expect(form).toBeTruthy();
    });

    it('debe mostrar warning si formulario no existe', () => {
      contactoService.initContactoForm();
      expect(global.console.warn).toHaveBeenCalledWith('Formulario de contacto no encontrado');
    });
  });

  describe('simularEnvioContacto', () => {
    it('debe simular envío de contacto', async () => {
      jest.useFakeTimers();
      
      const formData = {
        nombre: 'Test',
        email: 'test@example.com',
        asunto: 'consulta',
        mensaje: 'Mensaje de prueba'
      };

      const promise = contactoService.simularEnvioContacto(formData);
      
      jest.advanceTimersByTime(1000);
      
      const result = await promise;

      expect(result.success).toBe(true);
      expect(result.message).toBe('Mensaje enviado correctamente');
      expect(global.console.log).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('debe retornar una promesa que se resuelve después del delay', async () => {
      jest.useFakeTimers();
      
      const formData = {
        nombre: 'Test',
        email: 'test@example.com',
        asunto: 'consulta',
        mensaje: 'Mensaje de prueba'
      };

      const promise = contactoService.simularEnvioContacto(formData);
      
      // Verificar que la promesa no se resuelve inmediatamente
      let resolved = false;
      promise.then(() => { resolved = true; });
      
      jest.advanceTimersByTime(500);
      expect(resolved).toBe(false);
      
      jest.advanceTimersByTime(500);
      const result = await promise;
      
      expect(resolved).toBe(true);
      expect(result.success).toBe(true);

      jest.useRealTimers();
    });
  });
});

