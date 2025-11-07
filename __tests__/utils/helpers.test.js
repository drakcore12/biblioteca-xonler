// Tests unitarios para funciones helper

describe('Funciones Helper', () => {
  
  test('suma de dos números', () => {
    const sum = (a, b) => a + b;
    expect(sum(2, 2)).toBe(4);
    expect(sum(-1, 1)).toBe(0);
    expect(sum(0, 0)).toBe(0);
  });

  test('validación de email', () => {
    const isValidEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('admin@biblioteca.edu')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
  });

  test('formateo de fecha', () => {
    const formatDate = (date) => {
      return new Date(date).toISOString().split('T')[0];
    };

    const date = new Date('2024-01-15');
    expect(formatDate(date)).toBe('2024-01-15');
  });

  test('normalización de string a objeto', () => {
    const asObject = (x) => {
      if (!x) return {};
      if (typeof x === 'object') return x;
      try { return JSON.parse(x); } catch { return {}; }
    };

    expect(asObject('{"key":"value"}')).toEqual({ key: 'value' });
    expect(asObject({ key: 'value' })).toEqual({ key: 'value' });
    expect(asObject(null)).toEqual({});
    expect(asObject('invalid')).toEqual({});
  });
});

