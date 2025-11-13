/**
 * @jest-environment jsdom
 */

// ============================================================================
// CONFIGURAR MOCKS GLOBALES
// ============================================================================

global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

// ============================================================================
// IMPORTAR MÓDULO
// ============================================================================

jest.resetModules();
const formHandler = require('../../../../../public/services/common/form-handler.js');

// ============================================================================
// TESTS
// ============================================================================

describe('form-handler.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('setupSubmitButton', () => {
    it('debe configurar botón con estado de carga', () => {
      document.body.innerHTML = '<button id="submitBtn">Enviar</button>';
      const button = document.getElementById('submitBtn');
      
      const restore = formHandler.setupSubmitButton(button, 'Cargando...');
      
      expect(button.disabled).toBe(true);
      expect(button.textContent).toBe('Cargando...');
      
      // Restaurar
      restore();
      expect(button.textContent).toBe('Enviar');
    });

    it('debe retornar función no-op si el botón no existe', () => {
      const restore = formHandler.setupSubmitButton(null);
      expect(typeof restore).toBe('function');
      expect(() => restore()).not.toThrow();
    });
  });

  describe('getFormData', () => {
    it('debe extraer datos de formulario con campos específicos', () => {
      document.body.innerHTML = `
        <form id="testForm">
          <input name="nombre" value="Juan" />
          <input name="email" value="juan@example.com" />
          <input name="edad" value="25" />
        </form>
      `;
      
      const form = document.getElementById('testForm');
      const data = formHandler.getFormData(form, ['nombre', 'email']);
      
      expect(data.nombre).toBe('Juan');
      expect(data.email).toBe('juan@example.com');
      expect(data.edad).toBeUndefined();
    });

    it('debe extraer todos los datos del formulario si no se especifican campos', () => {
      document.body.innerHTML = `
        <form id="testForm">
          <input name="nombre" value="Juan" />
          <input name="email" value="juan@example.com" />
        </form>
      `;
      
      const form = document.getElementById('testForm');
      const data = formHandler.getFormData(form);
      
      expect(data.nombre).toBe('Juan');
      expect(data.email).toBe('juan@example.com');
    });

    it('debe retornar objeto vacío si el formulario no existe', () => {
      const data = formHandler.getFormData(null);
      expect(data).toEqual({});
    });

    it('debe manejar checkboxes', () => {
      document.body.innerHTML = `
        <form id="testForm">
          <input type="checkbox" name="acepta" checked />
        </form>
      `;
      
      const form = document.getElementById('testForm');
      const data = formHandler.getFormData(form);
      
      expect(data.acepta).toBe(true);
    });

    it('debe manejar radio buttons', () => {
      document.body.innerHTML = `
        <form id="testForm">
          <input type="radio" name="genero" value="masculino" />
          <input type="radio" name="genero" value="femenino" checked />
        </form>
      `;
      
      const form = document.getElementById('testForm');
      const data = formHandler.getFormData(form);
      
      expect(data.genero).toBe('femenino');
    });
  });

  describe('isValidEmail', () => {
    it('debe validar email correcto', () => {
      expect(formHandler.isValidEmail('test@example.com')).toBe(true);
      expect(formHandler.isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('debe rechazar email inválido', () => {
      expect(formHandler.isValidEmail('invalid')).toBe(false);
      expect(formHandler.isValidEmail('invalid@')).toBe(false);
      expect(formHandler.isValidEmail('@domain.com')).toBe(false);
      expect(formHandler.isValidEmail('')).toBe(false);
    });

    it('debe rechazar email muy largo', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(formHandler.isValidEmail(longEmail)).toBe(false);
    });

    it('debe rechazar valores no string', () => {
      expect(formHandler.isValidEmail(null)).toBe(false);
      expect(formHandler.isValidEmail(123)).toBe(false);
      expect(formHandler.isValidEmail(undefined)).toBe(false);
    });
  });

  describe('validateRequired', () => {
    it('debe validar campo requerido con valor', () => {
      expect(formHandler.validateRequired('test', 'Campo')).toBeNull();
      expect(formHandler.validateRequired('  test  ', 'Campo')).toBeNull();
    });

    it('debe retornar error si el campo está vacío', () => {
      const error = formHandler.validateRequired('', 'Campo');
      expect(error).toContain('Campo');
      expect(error).toContain('requerido');
    });

    it('debe retornar error si el campo es null o undefined', () => {
      expect(formHandler.validateRequired(null, 'Campo')).toBeTruthy();
      expect(formHandler.validateRequired(undefined, 'Campo')).toBeTruthy();
    });
  });

  describe('showError', () => {
    it('debe mostrar error en el formulario', () => {
      document.body.innerHTML = '<form id="testForm"></form>';
      const form = document.getElementById('testForm');
      
      formHandler.showError(form, 'Error de prueba');
      
      // Verificar que se agregó un elemento de error
      const errorElement = form.querySelector('.alert-danger, .error-message, [role="alert"]');
      expect(errorElement).toBeTruthy();
    });
  });

  describe('showSuccess', () => {
    it('debe mostrar mensaje de éxito en el formulario', () => {
      document.body.innerHTML = '<form id="testForm"></form>';
      const form = document.getElementById('testForm');
      
      formHandler.showSuccess(form, 'Éxito');
      
      // Verificar que se agregó un elemento de éxito
      const successElement = form.querySelector('.alert-success, .success-message');
      expect(successElement).toBeTruthy();
    });
  });

  describe('handleFormSubmit', () => {
    it('debe manejar envío de formulario exitoso', async () => {
      document.body.innerHTML = `
        <form id="testForm">
          <input name="nombre" value="Test" />
          <button type="submit">Enviar</button>
        </form>
      `;
      
      const form = document.getElementById('testForm');
      const mockHandler = jest.fn().mockResolvedValue({ success: true });
      
      await formHandler.handleFormSubmit(form, mockHandler);
      
      expect(mockHandler).toHaveBeenCalled();
    });

    it('debe manejar errores en el envío', async () => {
      document.body.innerHTML = `
        <form id="testForm">
          <input name="nombre" value="Test" />
          <button type="submit">Enviar</button>
        </form>
      `;
      
      const form = document.getElementById('testForm');
      const mockHandler = jest.fn().mockRejectedValue(new Error('Error de prueba'));
      
      await formHandler.handleFormSubmit(form, mockHandler);
      
      expect(mockHandler).toHaveBeenCalled();
    });
  });
});

