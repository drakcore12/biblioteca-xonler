/**
 * Servicio unificado para páginas de bibliotecas
 * Maneja tanto la vista de admin como la de invitado
 */

/**
 * Inicializar página de bibliotecas (admin)
 */
export default function initBibliotecasPage() {
  console.log('Página de bibliotecas inicializada');
  cargaBibliotecas({ isGuest: false });
  initBibliotecasSearch();
}

/**
 * Inicializar página de bibliotecas (invitado)
 */
export function initBibliotecasGuestPage() {
  console.log('Página de bibliotecas (invitado) inicializada');
  cargaBibliotecas({ isGuest: true });
  initBibliotecasSearch();
}

/**
 * Cargar bibliotecas (unificado para admin e invitado)
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.isGuest - Si es true, usa formato de invitado
 */
export async function cargaBibliotecas(options = {}) {
  const { isGuest = false } = options;
  const bibliotecasList = document.getElementById('bibliotecasList');
  
  if (!bibliotecasList) {
    console.warn('Elemento #bibliotecasList no encontrado');
    return;
  }
  
  bibliotecasList.innerHTML = '<div class="text-center my-3">Cargando bibliotecas...</div>';
  
  try {
    const res = await fetch('/api/bibliotecas');
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    // Normalizar payload (guest puede recibir diferentes formatos)
    const payload = await res.json();
    const bibliotecas = Array.isArray(payload)
      ? payload
      : (payload?.bibliotecas || payload?.data || []);
    
    console.log('📚 Bibliotecas recibidas:', bibliotecas);
    
    if (!Array.isArray(bibliotecas) || bibliotecas.length === 0) {
      bibliotecasList.innerHTML = '<div class="alert alert-warning">No se encontraron bibliotecas.</div>';
      return;
    }
    
    // Renderizado según el modo
    bibliotecasList.innerHTML = bibliotecas.map(b => {
      if (isGuest) {
        return `
          <a href="#" class="list-group-item list-group-item-action" data-id="${b.id}">
            <div class="d-flex w-100 justify-content-between">
              <h5 class="mb-1">${b.nombre}</h5>
              <small class="text-muted">${b.colegio_nombre || b.colegio || 'Colegio no especificado'}</small>
            </div>
            <p class="mb-1">${b.direccion || 'Dirección no especificada'}</p>
          </a>
        `;
      } else {
        return `
          <li class="list-group-item" data-id="${b.id}">
            <h5>${b.nombre}</h5>
            <p>${b.direccion}</p>
            <small class="text-muted">${b.colegio || b.colegio_nombre}</small>
          </li>
        `;
      }
    }).join('');
    
    initBibliotecasList({ isGuest });
    
    // Auto-cargar la primera biblioteca
    const firstItem = bibliotecasList.querySelector('.list-group-item');
    if (firstItem) {
      firstItem.classList.add('active');
      cargarLibros(firstItem, { isGuest });
      
      // Mostrar detalles
      const defaultMessage = document.getElementById('defaultMessage');
      const detailsContent = document.getElementById('detailsContent');
      if (defaultMessage) defaultMessage.style.display = 'none';
      if (detailsContent) detailsContent.style.display = 'block';
    }
    
  } catch (error) {
    console.error('❌ Error cargando bibliotecas:', error);
    bibliotecasList.innerHTML = `
      <div class="alert alert-danger">
        <strong>Error al cargar las bibliotecas:</strong><br>
        ${error.message}
      </div>
    `;
  }
}

/**
 * Inicializar lista de bibliotecas (unificado)
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.isGuest - Si es true, usa formato de invitado
 */
function initBibliotecasList(options = {}) {
  const { isGuest = false } = options;
  const bibliotecasList = document.getElementById('bibliotecasList');
  const container = document.getElementById('bibliotecaLibros');
  
  if (!bibliotecasList) {
    console.warn('Elemento #bibliotecasList no encontrado en initBibliotecasList');
    return;
  }
  
  if (!container) {
    console.warn('Elemento #bibliotecaLibros no encontrado - saltando inicialización de libros');
    return;
  }
  
  const items = bibliotecasList.querySelectorAll('.list-group-item');
  console.log('📋 bibliotecasItems count:', items.length);
  
  // Limpiar listeners previos
  for (const item of items) {
    item.replaceWith(item.cloneNode(true));
  }
  
  const freshItems = bibliotecasList.querySelectorAll('.list-group-item');
  
  for (const item of freshItems) {
    console.log('🔗 Adjuntar listener a biblioteca:', item.dataset.id, '->', item.querySelector('h5')?.textContent);
    item.addEventListener('click', (e) => {
      if (isGuest) e.preventDefault();
      for (const i of freshItems) {
        i.classList.remove('active');
      }
      item.classList.add('active');
      cargarLibros(item, { isGuest });
    });
  }
  
  console.log('↪ initBibliotecasList completa, items count:', freshItems.length);
}

/**
 * Cargar libros de una biblioteca (unificado)
 * @param {HTMLElement} item - Elemento de la biblioteca seleccionada
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.isGuest - Si es true, usa formato de invitado
 */
async function cargarLibros(item, options = {}) {
  const { isGuest = false } = options;
  const bibliotecaId = item.dataset.id;
  const container = document.getElementById('bibliotecaLibros');
  
  console.log('↪ Cargando libros para biblioteca ID:', bibliotecaId);
  
  if (!container) {
    console.warn('Container de libros no encontrado');
    return;
  }
  
  // Mostrar detalles
  const nombre = item.querySelector('h5')?.textContent || '';
  const direccion = item.querySelector('p')?.textContent || '';
  
  const bibliotecaTitle = document.getElementById('bibliotecaTitle');
  const detailName = document.getElementById('detailName');
  const detailAddress = document.getElementById('detailAddress');
  
  if (bibliotecaTitle) bibliotecaTitle.textContent = nombre;
  if (detailName) detailName.textContent = nombre;
  if (detailAddress) detailAddress.textContent = direccion;
  
  if (direccion) {
    showLibraryMap(direccion);
  }
  
  container.innerHTML = '<div class="text-center my-3">Cargando libros…</div>';
  
  try {
    const response = await fetch(`/api/bibliotecas/${bibliotecaId}/libros`);
    console.log('📥 Status respuesta:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Normalizar payload
    const payload = await response.json();
    const libros = Array.isArray(payload)
      ? payload
      : (payload?.libros || payload?.data || []);
    
    console.log('📚 Libros recibidos:', libros);
    
    if (!Array.isArray(libros) || libros.length === 0) {
      container.innerHTML = '<div class="alert alert-warning">No hay libros disponibles para esta biblioteca.</div>';
      return;
    }
    
    // Renderizado según el modo
    if (isGuest) {
      container.innerHTML = libros.map(l => `
        <div class="col-md-4 mb-3">
          <div class="card h-100">
            <img src="${l.imagen_url || '/assets/images/libro-placeholder.jpg'}"
                 class="card-img-top"
                 alt="${l.titulo || 'Libro'}"
                 style="height: 200px; object-fit: cover;"
                 onerror="this.src='/assets/images/libro-placeholder.jpg'">
            <div class="card-body d-flex flex-column">
              <h6 class="card-title">${l.titulo}</h6>
              <p class="card-text small">${l.autor || 'Autor no especificado'}</p>
              ${l.categoria ? `<span class="badge bg-primary mb-2">${l.categoria}</span>` : ''}
              <div class="mt-auto">
                <button class="btn btn-outline-primary btn-sm w-100" disabled>
                  ${l.disponible === false ? 'No disponible' : 'Inicia sesión para ver detalles'}
                </button>
              </div>
            </div>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = libros.map(l => `
        <div class="col-md-4 mb-3">
          <div class="card h-100">
            <img src="${l.imagen_url || '/assets/images/libro-placeholder.jpg'}" 
                 class="card-img-top" 
                 alt="${l.titulo}"
                 onerror="this.src='/assets/images/libro-placeholder.jpg'">
            <div class="card-body">
              <h6 class="card-title">${l.titulo}</h6>
              <p class="card-text small">${l.autor}</p>
            </div>
          </div>
        </div>
      `).join('');
    }
    
  } catch (err) {
    console.error('❌ Error cargando libros de la biblioteca:', err);
    container.innerHTML = `
      <div class="alert alert-danger">
        <strong>Error al cargar libros:</strong><br>
        ${err.message}
      </div>
    `;
  }
}

/**
 * Inicializar búsqueda de bibliotecas (unificado)
 */
function initBibliotecasSearch() {
  const searchBtn = document.getElementById('searchBtn');
  if (!searchBtn) {
    console.warn('Botón de búsqueda no encontrado');
    return;
  }
  
  // Limpiar listener previo
  const newSearchBtn = searchBtn.cloneNode(true);
  searchBtn.parentNode.replaceChild(newSearchBtn, searchBtn);
  
  newSearchBtn.addEventListener('click', () => {
    const nombreBusqueda = document.getElementById('searchName')?.value?.toLowerCase() || '';
    const ubicacionBusqueda = document.getElementById('searchLocation')?.value?.toLowerCase() || '';
    const bibliotecasItems = document.querySelectorAll('#bibliotecasList .list-group-item');
    
    console.log('🔍 Búsqueda:', { nombre: nombreBusqueda, ubicacion: ubicacionBusqueda });
    
    for (const item of bibliotecasItems) {
      const nombre = item.querySelector('h5')?.textContent?.toLowerCase() || '';
      const ubicacion = item.querySelector('p')?.textContent?.toLowerCase() || '';
      const visible = (nombreBusqueda === '' || nombre.includes(nombreBusqueda))
                   && (ubicacionBusqueda === '' || ubicacion.includes(ubicacionBusqueda));
      item.style.display = visible ? 'block' : 'none';
    }
    
    console.log(`🔍 Búsqueda completada: ${Array.from(bibliotecasItems).filter(i => i.style.display !== 'none').length} resultados`);
  });
}

/**
 * Mostrar mapa de la biblioteca
 * @param {string} address - Dirección de la biblioteca
 */
function showLibraryMap(address) {
  const mapIframe = document.getElementById('mapIframe');
  if (!mapIframe) {
    console.warn('Elemento #mapIframe no encontrado - saltando mapa');
    return;
  }
  
  if (!address || address.trim() === '') {
    console.warn('Dirección vacía - saltando mapa');
    return;
  }
  
  try {
    const apiKey = 'AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao';
    const base = 'https://www.google.com/maps/embed/v1/place';
    const url = `${base}?key=${apiKey}&q=${encodeURIComponent(address)}`;
    
    console.log('🗺️ Cargando mapa para:', address);
    mapIframe.src = url;
  } catch (error) {
    console.error('❌ Error cargando mapa:', error);
  }
}

/**
 * Mostrar mensaje de login requerido (solo para invitados)
 */
export function mostrarLoginRequerido() {
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-info alert-dismissible fade show';
  alertDiv.innerHTML = `
    <i class="bi bi-info-circle me-2"></i>
    <strong>Acceso limitado:</strong> Para ver más detalles y realizar préstamos, 
    <a href="/pages/guest/login.html" class="alert-link">inicia sesión</a> o 
    <a href="/pages/guest/login.html" class="alert-link">crea una cuenta</a>.
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  const main = document.querySelector('main');
  if (main) main.insertBefore(alertDiv, main.firstChild);
  setTimeout(() => alertDiv?.remove(), 10000);
}

