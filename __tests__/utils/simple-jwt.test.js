const SimpleJWT = require('../../src/utils/simple-jwt');

describe('SimpleJWT', () => {
  let jwt;

  beforeEach(() => {
    jwt = new SimpleJWT();
  });

  test('debe generar un token JWT válido', () => {
    const payload = { id: 1, email: 'test@example.com', role: 'user' };
    const token = jwt.generateToken(payload);
    
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3); // JWT tiene 3 partes separadas por puntos
  });

  test('debe verificar un token válido correctamente', () => {
    const payload = { id: 1, email: 'test@example.com', role: 'user' };
    const token = jwt.generateToken(payload);
    const decoded = jwt.verifyToken(token);
    
    expect(decoded.id).toBe(payload.id);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  test('debe lanzar error al verificar token inválido', () => {
    const invalidToken = 'token.invalido.123';
    
    expect(() => {
      jwt.verifyToken(invalidToken);
    }).toThrow();
  });

  test('debe generar token con expiración personalizada', () => {
    const payload = { id: 1 };
    const token = jwt.generateToken(payload, { expiresIn: '1h' });
    const decoded = jwt.verifyToken(token);
    
    expect(decoded).toBeDefined();
    expect(decoded.exp).toBeDefined();
  });
});

