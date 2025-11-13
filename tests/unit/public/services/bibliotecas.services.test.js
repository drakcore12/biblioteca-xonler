/**
 * @jest-environment jsdom
 */

// ============================================================================
// CONFIGURAR MOCKS GLOBALES
// ============================================================================

global.fetch = jest.fn();

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
const bibliotecasService = require('../../../public/services/bibliotecas.services.js');

// ============================================================================
// TESTS
// ============================================================================

describe('bibliotecas.services.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('initBibliotecasPage', () => {
    it('debe inicializar página de bibliotecas (admin)', () => {
      document.body.innerHTML = '<div id="bibliotecasList"></div>';
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      });

      bibliotecasService.default();

      expect(global.console.log).toHaveBeenCalledWith('Página de bibliotecas inicializada');
      // Verificar que se llamó a fetch (puede ser asíncrono)
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('initBibliotecasGuestPage', () => {
    it('debe inicializar página de bibliotecas (invitado)', () => {
      document.body.innerHTML = '<div id="bibliotecasList"></div>';
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      });

      bibliotecasService.initBibliotecasGuestPage();

      expect(global.console.log).toHaveBeenCalledWith('Página de bibliotecas (invitado) inicializada');
      // Verificar que se llamó a fetch (puede ser asíncrono)
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('cargaBibliotecas', () => {
    beforeEach(() => {
      document.body.innerHTML = '<div id="bibliotecasList"></div>';
    });

    it('debe cargar bibliotecas exitosamente (admin)', async () => {
      document.body.innerHTML = `
        <div id="bibliotecasList"></div>
        <div id="bibliotecaLibros"></div>
      `;
      
      const mockBibliotecas = [
        { id: 1, nombre: 'Biblioteca Central', direccion: 'Calle Principal 123', colegio_nombre: 'Colegio 1' },
        { id: 2, nombre: 'Biblioteca Norte', direccion: 'Avenida Norte 456', colegio_nombre: 'Colegio 2' }
      ];

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockBibliotecas })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] })
        });

      await bibliotecasService.cargaBibliotecas({ isGuest: false });

      const bibliotecasList = document.getElementById('bibliotecasList');
      expect(bibliotecasList.innerHTML).toContain('Biblioteca Central');
      expect(bibliotecasList.innerHTML).toContain('Biblioteca Norte');
    });

    it('debe cargar bibliotecas exitosamente (invitado)', async () => {
      document.body.innerHTML = `
        <div id="bibliotecasList"></div>
        <div id="bibliotecaLibros"></div>
      `;
      
      const mockBibliotecas = [
        { id: 1, nombre: 'Biblioteca Central', direccion: 'Calle Principal 123', colegio_nombre: 'Colegio 1' }
      ];

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockBibliotecas })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] })
        });

      await bibliotecasService.cargaBibliotecas({ isGuest: true });

      const bibliotecasList = document.getElementById('bibliotecasList');
      expect(bibliotecasList.innerHTML).toContain('Biblioteca Central');
      expect(bibliotecasList.innerHTML).toContain('list-group-item-action');
    });

    it('debe manejar error 500 del servidor', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await bibliotecasService.cargaBibliotecas({ isGuest: false });

      const bibliotecasList = document.getElementById('bibliotecasList');
      expect(bibliotecasList.innerHTML).toContain('Error al cargar las bibliotecas');
      expect(bibliotecasList.innerHTML).toContain('HTTP 500');
      expect(global.console.error).toHaveBeenCalled();
    });

    it('debe manejar error de red', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      await bibliotecasService.cargaBibliotecas({ isGuest: false });

      const bibliotecasList = document.getElementById('bibliotecasList');
      expect(bibliotecasList.innerHTML).toContain('Error al cargar las bibliotecas');
      expect(global.console.error).toHaveBeenCalled();
    });

    it('debe mostrar mensaje si no hay bibliotecas', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      });

      await bibliotecasService.cargaBibliotecas({ isGuest: false });

      const bibliotecasList = document.getElementById('bibliotecasList');
      expect(bibliotecasList.innerHTML).toContain('No se encontraron bibliotecas');
    });

    it('debe manejar diferentes formatos de respuesta', async () => {
      document.body.innerHTML = `
        <div id="bibliotecasList"></div>
        <div id="bibliotecaLibros"></div>
      `;
      
      // Formato array directo
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ id: 1, nombre: 'Biblioteca 1' }]
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] })
        });

      await bibliotecasService.cargaBibliotecas({ isGuest: false });

      const bibliotecasList = document.getElementById('bibliotecasList');
      expect(bibliotecasList.innerHTML).toContain('Biblioteca 1');
    });

    it('debe mostrar warning si el elemento no existe', async () => {
      document.body.innerHTML = '';

      await bibliotecasService.cargaBibliotecas({ isGuest: false });

      expect(global.console.warn).toHaveBeenCalledWith('Elemento #bibliotecasList no encontrado');
    });

    it('debe normalizar payload con bibliotecas.bibliotecas', async () => {
      document.body.innerHTML = `
        <div id="bibliotecasList"></div>
        <div id="bibliotecaLibros"></div>
      `;
      
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ bibliotecas: [{ id: 1, nombre: 'Biblioteca 1' }] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] })
        });

      await bibliotecasService.cargaBibliotecas({ isGuest: false });

      const bibliotecasList = document.getElementById('bibliotecasList');
      expect(bibliotecasList.innerHTML).toContain('Biblioteca 1');
    });
  });

  describe('mostrarLoginRequerido', () => {
    it('debe mostrar mensaje de login requerido', () => {
      document.body.innerHTML = '<main></main>';

      bibliotecasService.mostrarLoginRequerido();

      const main = document.querySelector('main');
      expect(main.innerHTML).toContain('Acceso limitado');
      expect(main.innerHTML).toContain('inicia sesión');
    });

    it('debe manejar cuando no hay elemento main', () => {
      document.body.innerHTML = '';

      expect(() => bibliotecasService.mostrarLoginRequerido()).not.toThrow();
    });
  });
});

