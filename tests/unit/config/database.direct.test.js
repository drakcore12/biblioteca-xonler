// Test directo para database.js
// Este test ejecuta el código real para que se cuente en cobertura

// Mock solo pg.Pool pero permitir que el código se ejecute
const mockPoolInstance = {
  on: jest.fn(),
  connect: jest.fn(),
  end: jest.fn()
};

jest.mock('pg', () => ({
  Pool: jest.fn(() => mockPoolInstance)
}));

jest.mock('dotenv', () => ({
  config: jest.fn()
}));

describe('database.js - test directo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  it('debe crear pool y exportar funciones', () => {
    // Limpiar cache para forzar re-carga
    delete require.cache[require.resolve('../../../src/config/database')];
    
    const { pool, testConnection, closePool } = require('../../../src/config/database');
    
    expect(pool).toBeDefined();
    expect(typeof testConnection).toBe('function');
    expect(typeof closePool).toBe('function');
    
    // Verificar que se registraron los event handlers
    expect(mockPoolInstance.on).toHaveBeenCalled();
  });

  it('debe probar conexión exitosamente', async () => {
    delete require.cache[require.resolve('../../../src/config/database')];
    const { testConnection } = require('../../../src/config/database');
    
    const mockClient = {
      release: jest.fn()
    };
    mockPoolInstance.connect.mockResolvedValueOnce(mockClient);
    
    const result = await testConnection();
    
    expect(result).toBe(true);
    expect(mockClient.release).toHaveBeenCalled();
  });

  it('debe manejar error en testConnection', async () => {
    delete require.cache[require.resolve('../../../src/config/database')];
    const { testConnection } = require('../../../src/config/database');
    
    mockPoolInstance.connect.mockRejectedValueOnce(new Error('Connection failed'));
    
    const result = await testConnection();
    
    expect(result).toBe(false);
    expect(console.error).toHaveBeenCalled();
  });

  it('debe cerrar pool correctamente', async () => {
    delete require.cache[require.resolve('../../../src/config/database')];
    const { closePool } = require('../../../src/config/database');
    
    mockPoolInstance.end.mockResolvedValueOnce();
    
    await closePool();
    
    expect(mockPoolInstance.end).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalled();
  });
});

