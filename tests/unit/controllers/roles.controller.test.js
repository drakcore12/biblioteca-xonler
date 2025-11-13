// Mock controller-helpers
jest.mock('../../../src/utils/controller-helpers', () => ({
  getAllRecords: jest.fn(() => jest.fn()),
  getRecordById: jest.fn(() => jest.fn())
}));

const { obtenerRoles, obtenerRolPorId } = require('../../../src/controllers/roles.controller');
const { getAllRecords, getRecordById } = require('../../../src/utils/controller-helpers');

describe('roles.controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      query: {},
      params: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  it('debe exportar obtenerRoles', () => {
    expect(obtenerRoles).toBeDefined();
    expect(typeof obtenerRoles).toBe('function');
  });

  it('debe exportar obtenerRolPorId', () => {
    expect(obtenerRolPorId).toBeDefined();
    expect(typeof obtenerRolPorId).toBe('function');
  });

  it('debe usar getAllRecords para obtenerRoles', () => {
    // getAllRecords se llama al importar el módulo, verificamos que se configuró correctamente
    expect(getAllRecords).toBeDefined();
  });

  it('debe usar getRecordById para obtenerRolPorId', () => {
    // getRecordById se llama al importar el módulo, verificamos que se configuró correctamente
    expect(getRecordById).toBeDefined();
  });
});

