const {
  createValidator,
  validateRequired,
  requireFields,
  isValidEmail,
  validateEmail,
  validateEnum,
  validateRange,
  validateId
} = require('../../src/utils/validation-helpers');

describe('validation-helpers', () => {

  describe('createValidator', () => {
    test('debe crear un validador que retorna valid: true cuando la función retorna true', () => {
      const validator = createValidator(() => true, 'Error');
      expect(validator('value')).toEqual({ valid: true });
    });

    test('debe crear un validador que retorna valid: false cuando la función retorna false', () => {
      const validator = createValidator(() => false, 'Error personalizado');
      expect(validator('value')).toEqual({ valid: false, error: 'Error personalizado' });
    });

    test('debe manejar errores en la función validadora', () => {
      const validator = createValidator(() => {
        throw new Error('Error de validación');
      }, 'Error por defecto');
      expect(validator('value')).toEqual({ valid: false, error: 'Error de validación' });
    });

    test('debe aceptar un objeto con valid como resultado', () => {
      const validator = createValidator(() => ({ valid: false, error: 'Custom error' }), 'Default');
      expect(validator('value')).toEqual({ valid: false, error: 'Custom error' });
    });
  });

  describe('validateRequired', () => {
    test('debe retornar valid: true cuando todos los campos están presentes', () => {
      const data = { nombre: 'Juan', email: 'juan@test.com' };
      const result = validateRequired(['nombre', 'email'], data);
      expect(result.valid).toBe(true);
    });

    test('debe retornar valid: false cuando faltan campos', () => {
      const data = { nombre: 'Juan' };
      const result = validateRequired(['nombre', 'email'], data);
      expect(result.valid).toBe(false);
      expect(result.missing).toContain('email');
    });

    test('debe retornar error cuando fields no es un array', () => {
      const result = validateRequired(null, {});
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Lista de campos requeridos inválida');
    });

    test('debe retornar error cuando data no es un objeto', () => {
      const result = validateRequired(['nombre'], null);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Datos inválidos');
    });

    test('debe ignorar campos vacíos en la lista de campos', () => {
      const data = { nombre: 'Juan' };
      const result = validateRequired(['nombre', '', '  '], data);
      expect(result.valid).toBe(true);
    });
  });

  describe('requireFields', () => {
    test('debe llamar next() cuando todos los campos están presentes', () => {
      const req = { body: { nombre: 'Juan', email: 'test@test.com' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      const middleware = requireFields('nombre', 'email');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('debe retornar badRequest cuando faltan campos', () => {
      const req = { body: { nombre: 'Juan' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      const middleware = requireFields('nombre', 'email');
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
    });

    test('debe retornar error cuando req.body no existe', () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      const middleware = requireFields('nombre');
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('isValidEmail', () => {
    test('debe validar emails correctos', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    test('debe rechazar emails inválidos', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });

    test('debe rechazar valores no string', () => {
      expect(isValidEmail(null)).toBe(false);
      expect(isValidEmail(123)).toBe(false);
    });
  });

  describe('validateEmail', () => {
    test('debe validar email y retornar null si es válido', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const result = validateEmail('test@example.com', res);
      expect(result).toBeNull();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('debe retornar badRequest si email es inválido', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const result = validateEmail('invalid', res);
      expect(result).not.toBeNull();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('debe lanzar error si res no es válido', () => {
      expect(() => validateEmail('test@example.com', null)).toThrow();
    });
  });

  describe('validateEnum', () => {
    test('debe validar valores en enum', () => {
      const result = validateEnum('A', ['A', 'B', 'C']);
      expect(result.valid).toBe(true);
    });

    test('debe rechazar valores fuera del enum', () => {
      const result = validateEnum('D', ['A', 'B', 'C'], 'tipo');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('tipo');
    });

    test('debe retornar error si allowedValues no es array', () => {
      const result = validateEnum('A', null);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateRange', () => {
    test('debe validar números en rango', () => {
      const result = validateRange(5, 1, 10, 'edad');
      expect(result.valid).toBe(true);
    });

    test('debe rechazar números fuera de rango', () => {
      const result = validateRange(15, 1, 10, 'edad');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('edad');
    });

    test('debe retornar error si rango es inválido', () => {
      const result = validateRange(5, 10, 1);
      expect(result.valid).toBe(false);
    });

    test('debe validar strings numéricos', () => {
      const result = validateRange('5', 1, 10);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateId', () => {
    test('debe validar IDs numéricos válidos', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const result = validateId('5', res, 'libro');
      expect(result).toBeNull();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('debe retornar badRequest para IDs inválidos', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const result = validateId('invalid', res, 'libro');
      expect(result).not.toBeNull();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('debe rechazar IDs negativos o cero', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      expect(validateId('-1', res, 'libro')).not.toBeNull();
      expect(validateId('0', res, 'libro')).not.toBeNull();
    });
  });
});

