// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
  decode: jest.fn()
}));

const simpleJWT = require('../../../src/utils/simple-jwt');
const jwt = require('jsonwebtoken');

describe('simple-jwt - casos adicionales', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIRES_IN;
    delete process.env.JWT_ISSUER;
    delete process.env.JWT_AUDIENCE;
  });

  describe('generateToken - casos edge', () => {
    it('debe usar variables de entorno si están configuradas', () => {
      process.env.JWT_EXPIRES_IN = '1h';
      process.env.JWT_ISSUER = 'custom-issuer';
      process.env.JWT_AUDIENCE = 'custom-audience';
      
      jwt.sign.mockReturnValueOnce('test-token');
      
      simpleJWT.generateToken({ userId: 1 });
      
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 1 },
        expect.any(String),
        expect.objectContaining({
          expiresIn: '1h',
          issuer: 'custom-issuer',
          audience: 'custom-audience'
        })
      );
    });

    it('debe sobrescribir opciones por defecto', () => {
      jwt.sign.mockReturnValueOnce('test-token');
      
      simpleJWT.generateToken({ userId: 1 }, { expiresIn: '2h' });
      
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 1 },
        expect.any(String),
        expect.objectContaining({
          expiresIn: '2h'
        })
      );
    });
  });

  describe('verifyToken - casos edge', () => {
    it('debe usar variables de entorno para verificación', () => {
      process.env.JWT_ISSUER = 'custom-issuer';
      process.env.JWT_AUDIENCE = 'custom-audience';
      
      jwt.verify.mockReturnValueOnce({ userId: 1 });
      
      const result = simpleJWT.verifyToken('test-token');
      
      expect(result).toEqual({ userId: 1 });
      expect(jwt.verify).toHaveBeenCalledWith(
        'test-token',
        expect.any(String),
        expect.objectContaining({
          issuer: 'custom-issuer',
          audience: 'custom-audience'
        })
      );
    });

    it('debe lanzar error genérico si la verificación falla', () => {
      jwt.verify.mockImplementationOnce(() => {
        throw new Error('Token expired');
      });
      
      expect(() => {
        simpleJWT.verifyToken('invalid-token');
      }).toThrow('Token inválido');
      
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('decodeToken', () => {
    it('debe decodificar token sin verificar', () => {
      jwt.decode.mockReturnValueOnce({ userId: 1 });
      
      const result = simpleJWT.decodeToken('test-token');
      
      expect(result).toEqual({ userId: 1 });
      expect(jwt.decode).toHaveBeenCalledWith('test-token');
    });
  });
});

