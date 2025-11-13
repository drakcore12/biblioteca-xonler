// Mock dependencies
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn()
}));

jest.mock('../../src/utils/jwt-rotation', () => ({
  verifyToken: jest.fn()
}));

jest.mock('../../src/config/logger', () => ({
  logSecurity: jest.fn()
}));

const { jwtCompatibility } = require('../../src/middleware/jwt-compatibility');
const jwt = require('jsonwebtoken');
const jwtRotation = require('../../src/utils/jwt-rotation');

describe('jwt-compatibility middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
    console.log = jest.fn();
    process.env.JWT_SECRET = 'test-secret';
  });

  afterAll(() => {
    // Limpiar intervalos de jwt-rotation si existe
    try {
      const jwtRotation = require('../../src/utils/jwt-rotation');
      if (jwtRotation && typeof jwtRotation.stopKeyRotation === 'function') {
        jwtRotation.stopKeyRotation();
      }
    } catch (e) {
      // Ignorar errores de limpieza
    }
  });

  it('debe continuar si no hay header Authorization', () => {
    jwtCompatibility(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user).toBeUndefined();
  });

  it('debe continuar si el header no empieza con Bearer', () => {
    mockReq.headers.authorization = 'Invalid token';

    jwtCompatibility(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('debe verificar token con jwt-rotation exitosamente', () => {
    mockReq.headers.authorization = 'Bearer valid-token';
    const mockDecoded = {
      user_id: 1,
      email: 'test@test.com',
      role: 'usuario',
      nombre: 'Test',
      exp: Date.now() / 1000 + 3600
    };

    jwtRotation.verifyToken.mockReturnValueOnce(mockDecoded);

    jwtCompatibility(mockReq, mockRes, mockNext);

    expect(jwtRotation.verifyToken).toHaveBeenCalledWith('valid-token');
    expect(mockReq.user).toEqual({
      id: 1,
      email: 'test@test.com',
      role: 'usuario',
      nombre: 'Test',
      authSource: 'jwt-rotation',
      tokenExp: mockDecoded.exp
    });
    expect(mockNext).toHaveBeenCalled();
  });

  it('debe usar verificación directa si jwt-rotation falla', () => {
    mockReq.headers.authorization = 'Bearer valid-token';
    mockReq.ip = '127.0.0.1';
    mockReq.get = jest.fn(() => 'test-agent');
    mockReq.url = '/test';
    const mockDecoded = {
      id: 1,
      email: 'test@test.com',
      role: 'usuario',
      nombre: 'Test',
      exp: Date.now() / 1000 + 3600
    };

    jwtRotation.verifyToken.mockImplementationOnce(() => {
      throw new Error('Rotation error');
    });
    jwt.verify.mockReturnValueOnce(mockDecoded);

    jwtCompatibility(mockReq, mockRes, mockNext);

    expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
    expect(mockReq.user).toEqual({
      id: 1,
      email: 'test@test.com',
      role: 'usuario',
      nombre: 'Test',
      authSource: 'jwt-direct',
      tokenExp: mockDecoded.exp
    });
    expect(mockNext).toHaveBeenCalled();
  });

  it('debe retornar 401 si ambas verificaciones fallan', () => {
    mockReq.headers.authorization = 'Bearer invalid-token';
    mockReq.ip = '127.0.0.1';
    mockReq.get = jest.fn(() => 'test-agent');
    mockReq.url = '/test';

    jwtRotation.verifyToken.mockImplementationOnce(() => {
      throw new Error('Rotation error');
    });
    jwt.verify.mockImplementationOnce(() => {
      throw new Error('Invalid token');
    });

    jwtCompatibility(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Token inválido'
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });
});

