/**
 * Servicio para cargar componentes HTML reutilizables
 */

class ComponentLoader {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Carga un componente HTML desde el servidor
   * @param {string} componentPath - Ruta del componente
   * @returns {Promise<string>} HTML del componente
   */
  async loadComponent(componentPath) {
    // Verificar cache
    if (this.cache.has(componentPath)) {
      return this.cache.get(componentPath);
    }

    try {
      const response = await fetch(componentPath);
      if (!response.ok) {
        throw new Error(`Error cargando componente: ${response.status}`);
      }
      
      const html = await response.text();
      
      // Guardar en cache
      this.cache.set(componentPath, html);
      
      return html;
    } catch (error) {
      console.error('Error cargando componente:', error);
      return '';
    }
  }

  /**
   * Carga y reemplaza un elemento con un componente
   * @param {string} selector - Selector del elemento a reemplazar
   * @param {string} componentPath - Ruta del componente
   * @param {Object} options - Opciones adicionales
   */
  async loadIntoElement(selector, componentPath, options = {}) {
    const element = document.querySelector(selector);
    if (!element) {
      console.warn(`Elemento no encontrado: ${selector}`);
      return;
    }

    const html = await this.loadComponent(componentPath);
    if (html) {
      element.innerHTML = html;
      
      // Ejecutar callback si se proporciona
      if (options.onLoad) {
        options.onLoad(element);
      }
    }
  }

  /**
   * Carga múltiples componentes
   * @param {Array} components - Array de objetos {selector, path, options}
   */
  async loadComponents(components) {
    const promises = components.map(comp => 
      this.loadIntoElement(comp.selector, comp.path, comp.options)
    );
    
    await Promise.all(promises);
  }

  /**
   * Limpia el cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Crear instancia global
const componentLoader = new ComponentLoader();

// Funciones de conveniencia
export async function loadGuestHeader(activePage = '') {
  await componentLoader.loadIntoElement('#guest-header', '/components/guest-header.html', {
    onLoad: (element) => {
      // Marcar página activa
      if (activePage) {
        const activeLink = element.querySelector(`[data-page="${activePage}"]`);
        if (activeLink) {
          activeLink.classList.add('active');
        }
      }
    }
  });
}

export async function loadGuestFooter() {
  await componentLoader.loadIntoElement('#guest-footer', '/components/guest-footer.html');
}

export async function loadGuestLayout(activePage = '') {
  await componentLoader.loadComponents([
    { selector: '#guest-header', path: '/components/guest-header.html', options: {
      onLoad: (element) => {
        if (activePage) {
          const activeLink = element.querySelector(`[data-page="${activePage}"]`);
          if (activeLink) {
            activeLink.classList.add('active');
          }
        }
      }
    }},
    { selector: '#guest-footer', path: '/components/guest-footer.html' }
  ]);
}

export { componentLoader };
