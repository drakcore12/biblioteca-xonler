const {
  isFiniteNumber,
  createTypeConverter,
  asObject,
  asBoolean,
  asNumber,
  asInteger,
  sanitizeString,
  cleanObject,
  getValue,
  indexBy
} = require('../../../src/utils/data-helpers');

describe('data-helpers', () => {
  describe('isFiniteNumber', () => {
    test('debe retornar true para números finitos válidos', () => {
      expect(isFiniteNumber(42)).toBe(true);
      expect(isFiniteNumber(0)).toBe(true);
      expect(isFiniteNumber(-10)).toBe(true);
      expect(isFiniteNumber(3.14)).toBe(true);
    });

    test('debe retornar false para valores no numéricos', () => {
      expect(isFiniteNumber('42')).toBe(false);
      expect(isFiniteNumber(null)).toBe(false);
      expect(isFiniteNumber(undefined)).toBe(false);
      expect(isFiniteNumber({})).toBe(false);
    });

    test('debe retornar false para NaN e Infinity', () => {
      expect(isFiniteNumber(Number.NaN)).toBe(false);
      expect(isFiniteNumber(Infinity)).toBe(false);
      expect(isFiniteNumber(-Infinity)).toBe(false);
    });
  });

  describe('createTypeConverter', () => {
    test('debe crear un convertidor que ejecuta la función', () => {
      const converter = createTypeConverter((v) => Number.parseInt(v, 10), 0);
      expect(converter('42')).toBe(42);
    });

    test('debe retornar valor por defecto cuando falla', () => {
      const converter = createTypeConverter(() => {
        throw new Error('Error');
      }, 'default');
      expect(converter('invalid')).toBe('default');
    });

    test('debe usar customDefault si se proporciona', () => {
      const converter = createTypeConverter(() => {
        throw new Error('Error');
      }, 'default');
      expect(converter('invalid', 'custom')).toBe('custom');
    });
  });

  describe('asObject', () => {
    test('debe retornar objeto vacío para null/undefined', () => {
      expect(asObject(null)).toEqual({});
      expect(asObject(undefined)).toEqual({});
    });

    test('debe retornar el objeto si ya es un objeto', () => {
      const obj = { nombre: 'Juan' };
      expect(asObject(obj)).toEqual(obj);
    });

    test('debe parsear string JSON válido', () => {
      expect(asObject('{"nombre":"Juan"}')).toEqual({ nombre: 'Juan' });
    });

    test('debe retornar objeto vacío para string vacío', () => {
      expect(asObject('')).toEqual({});
      expect(asObject('null')).toEqual({});
    });

    test('debe retornar objeto vacío para arrays', () => {
      expect(asObject([1, 2, 3])).toEqual({});
    });

    test('debe retornar objeto vacío para JSON inválido', () => {
      expect(asObject('invalid json')).toEqual({});
    });
  });

  describe('asBoolean', () => {
    test('debe retornar false para null/undefined', () => {
      expect(asBoolean(null)).toBe(false);
      expect(asBoolean(undefined)).toBe(false);
    });

    test('debe retornar el valor para booleanos', () => {
      expect(asBoolean(true)).toBe(true);
      expect(asBoolean(false)).toBe(false);
    });

    test('debe convertir strings a boolean', () => {
      expect(asBoolean('true')).toBe(true);
      expect(asBoolean('false')).toBe(false);
      expect(asBoolean('1')).toBe(true);
      expect(asBoolean('yes')).toBe(true);
      expect(asBoolean('on')).toBe(true);
    });

    test('debe convertir números a boolean', () => {
      expect(asBoolean(1)).toBe(true);
      expect(asBoolean(0)).toBe(false);
      expect(asBoolean(-1)).toBe(true);
    });
  });

  describe('asNumber', () => {
    test('debe convertir strings numéricos', () => {
      expect(asNumber('42')).toBe(42);
      expect(asNumber('3.14')).toBe(3.14);
    });

    test('debe retornar valor por defecto para valores inválidos', () => {
      expect(asNumber('invalid', 0)).toBe(0);
      expect(asNumber(null, 10)).toBe(10);
    });

    test('debe retornar el número si ya es un número', () => {
      expect(asNumber(42)).toBe(42);
    });

    test('debe retornar default para NaN', () => {
      expect(asNumber(Number.NaN, 0)).toBe(0);
    });
  });

  describe('asInteger', () => {
    test('debe convertir strings a enteros', () => {
      expect(asInteger('42')).toBe(42);
      expect(asInteger('3.14')).toBe(3);
    });

    test('debe retornar valor por defecto para valores inválidos', () => {
      expect(asInteger('invalid', 0)).toBe(0);
      expect(asInteger(null, 10)).toBe(10);
    });

    test('debe convertir números a enteros', () => {
      expect(asInteger(42.7)).toBe(42);
      expect(asInteger(42)).toBe(42);
    });
  });

  describe('sanitizeString', () => {
    test('debe eliminar tags HTML', () => {
      const result = sanitizeString('<script>alert("xss")</script>');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).toContain('script');
    });

    test('debe escapar caracteres especiales', () => {
      const result = sanitizeString('test & "quotes"');
      expect(result).toContain('&amp;');
      expect(result).toContain('&quot;');
    });

    test('debe eliminar caracteres de control', () => {
      const result = sanitizeString('test\u0000\u0001\u0002');
      expect(result).not.toContain('\u0000');
    });

    test('debe trim espacios', () => {
      expect(sanitizeString('  test  ')).toBe('test');
    });

    test('debe retornar string vacío para valores no string', () => {
      expect(sanitizeString(null)).toBe('');
      expect(sanitizeString(undefined)).toBe('');
      expect(sanitizeString(123)).toBe('');
    });
  });

  describe('cleanObject', () => {
    test('debe eliminar propiedades undefined/null/vacías', () => {
      const obj = { a: 1, b: null, c: undefined, d: '', e: 'value' };
      const cleaned = cleanObject(obj);
      expect(cleaned).toEqual({ a: 1, e: 'value' });
    });

    test('debe retornar objeto vacío para objeto vacío', () => {
      expect(cleanObject({})).toEqual({});
    });
  });

  describe('getValue', () => {
    test('debe obtener valor de objeto', () => {
      const obj = { name: 'Juan', age: 30 };
      expect(getValue(obj, 'name')).toBe('Juan');
      expect(getValue(obj, 'age')).toBe(30);
    });

    test('debe retornar default si no existe', () => {
      const obj = { name: 'Juan' };
      expect(getValue(obj, 'email', 'default@test.com')).toBe('default@test.com');
    });

    test('debe retornar default para objeto inválido', () => {
      expect(getValue(null, 'key', 'default')).toBe('default');
      expect(getValue(undefined, 'key', 'default')).toBe('default');
    });
  });

  describe('indexBy', () => {
    test('debe indexar array por clave', () => {
      const array = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }];
      const indexed = indexBy(array, 'id');
      expect(indexed[1].name).toBe('A');
      expect(indexed[2].name).toBe('B');
    });

    test('debe retornar objeto vacío para array vacío', () => {
      expect(indexBy([], 'id')).toEqual({});
    });

    test('debe retornar objeto vacío para clave inválida', () => {
      expect(indexBy([{ id: 1 }], '')).toEqual({});
    });
  });
});

