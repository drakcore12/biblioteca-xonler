// Módulo para la página de libros
export default function initLibrosPage() {
  console.log('Página de libros inicializada');
  cargarLibros();
  initLibrosSearch();
  cargarBibliotecas();
}

// ✅ NUEVO: función helper para headers de autenticación
function authHeaders() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) {
    console.warn('⚠️ No se encontró token de autenticación');
    return {};
  }
  
  console.log('🔐 Usando token para autenticación');
  return { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

// ✅ ARREGLADO: Resolver rutas de imágenes con fallback
function resolveImg(libro) {
  // Si viene URL absoluta, úsala
  if (libro.imagen_url && /^https?:\/\//i.test(libro.imagen_url)) {
    return libro.imagen_url;
  }
  
  // Si viene solo el nombre del archivo, apunta a tu carpeta estática
  if (libro.imagen_url) {
    // ✅ ARREGLADO: Evitar doble ruta - si ya empieza con /assets/, no añadir
    if (libro.imagen_url.startsWith('/assets/')) {
      return libro.imagen_url;
    }
    // Si es solo el nombre del archivo, añadir la ruta base
    return `/assets/images/${libro.imagen_url}`;
  }
  
  // Fallback por defecto
  return '/assets/images/libro-placeholder.jpg';
}

// ✅ ARREGLADO: Configurar fallbacks de imágenes
function setupImageFallbacks() {
  const librosGrid = document.getElementById('librosGrid');
  if (!librosGrid) return;
  
  librosGrid.querySelectorAll('img.libro-img').forEach(img => {
    img.addEventListener('error', () => {
      console.log('🖼️ Imagen fallida, usando placeholder:', img.src);
      img.src = '/assets/images/libro-placeholder.jpg';
    });
  });
}

// ✅ ARREGLADO: Configurar delegación de eventos para botones de detalle
function setupEventDelegation() {
  const librosGrid = document.getElementById('librosGrid');
  if (!librosGrid) return;
  
  // ✅ ARREGLADO: Usar event delegation simple sin clonar (más eficiente)
  // Remover listeners previos si existen
  if (librosGrid._clickHandler) {
    librosGrid.removeEventListener('click', librosGrid._clickHandler);
  }
  
  // Crear y guardar referencia al handler
  librosGrid._clickHandler = (e) => {
    const btn = e.target.closest('.ver-detalle');
    if (!btn) return;
    
    const libroId = btn.dataset.id;
    console.log('📖 Ver detalle del libro:', libroId);
    verDetalleLibro(libroId);
  };
  
  // Añadir el listener
  librosGrid.addEventListener('click', librosGrid._clickHandler);
}

// ✅ NUEVO: función para debug de autenticación
export function debugAuth() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const role = localStorage.getItem('role') || sessionStorage.getItem('role');
  
  console.log('🔍 Debug de autenticación:', {
    token: token ? `${token.substring(0, 20)}...` : 'No encontrado',
    role: role || 'No encontrado',
    storage: {
      local: !!localStorage.getItem('token'),
      session: !!sessionStorage.getItem('token')
    }
  });
  
  return { token, role };
}

// ✅ ARREGLADO: cargar libros con filtros usando URL builder
export async function cargarLibros(filtros = {}) {
  const librosGrid = document.getElementById('librosGrid');
  if (!librosGrid) {
    console.warn('Elemento #librosGrid no encontrado');
    return;
  }
  
  // Mostrar mensaje de carga
  librosGrid.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border" role="status"></div><p class="mt-2">Cargando libros...</p></div>';
  
  try {
    // ✅ ARREGLADO: Usar función builder para construir URL
    const url = buildLibrosUrl(filtros);
    console.log('📚 Cargando libros desde:', url);
    
    const response = await fetch(url, {
      headers: { ...authHeaders() }
    });
    
    console.log('📥 Status respuesta libros:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const libros = await response.json();
    console.log('📚 Libros recibidos:', libros);
    
    if (!Array.isArray(libros) || libros.length === 0) {
      librosGrid.innerHTML = `
        <div class="col-12 text-center py-5">
          <div class="alert alert-info">
            <i class="bi bi-info-circle me-2"></i>
            No se encontraron libros con los filtros aplicados.
            <br><small>Intenta ajustar los criterios de búsqueda.</small>
          </div>
        </div>
      `;
      actualizarContadorResultados(0);
        return;
      }

    // Renderizar libros
    renderizarLibros(libros);
    actualizarContadorResultados(libros.length);
    
  } catch (error) {
    console.error('❌ Error cargando libros:', error);
    librosGrid.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="alert alert-danger">
          <i class="bi bi-exclamation-triangle me-2"></i>
          <strong>Error al cargar libros:</strong><br>
          ${error.message}
        </div>
      </div>
    `;
    actualizarContadorResultados(0);
  }
}

// ✅ NUEVO: renderizar libros en grid
function renderizarLibros(libros) {
  const librosGrid = document.getElementById('librosGrid');
  
  librosGrid.innerHTML = libros.map(libro => `
    <div class="col-md-4 mb-3">
      <div class="card h-100 shadow-sm">
        <img src="${resolveImg(libro)}" 
             class="card-img-top libro-img" 
             alt="${libro.titulo}"
             style="height: 200px; object-fit: cover;">
        <div class="card-body d-flex flex-column">
          <h6 class="card-title">${libro.titulo}</h6>
          <p class="card-text small text-muted">${libro.autor || 'Autor desconocido'}</p>
          ${libro.categoria ? `<span class="badge bg-primary mb-2">${libro.categoria}</span>` : ''}
          ${libro.isbn ? `<small class="text-muted">ISBN: ${libro.isbn}</small>` : ''}
          <div class="mt-auto">
            <button class="btn btn-outline-primary btn-sm w-100 ver-detalle" 
                    data-id="${libro.id}">
              Ver detalles
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
  
  // ✅ ARREGLADO: Configurar fallback de imágenes y delegación de eventos
  setupImageFallbacks();
  setupEventDelegation();
}

// ✅ NUEVO: actualizar contador de resultados
function actualizarContadorResultados(count) {
  const resultCount = document.getElementById('resultCount');
  if (resultCount) {
    resultCount.textContent = `Mostrando ${count} libro${count !== 1 ? 's' : ''}`;
  }
}

// ✅ NUEVO: cargar bibliotecas para el filtro
async function cargarBibliotecas() {
  const bibliotecaSelect = document.getElementById('biblioteca');
  if (!bibliotecaSelect) return;
  
  try {
    const response = await fetch('/api/bibliotecas', {
      headers: { ...authHeaders() }
    });
    
    if (!response.ok) {
      console.warn('No se pudieron cargar las bibliotecas para el filtro');
          return;
        }

    const bibliotecas = await response.json();
    
    // Limpiar opciones existentes (mantener "Todas las bibliotecas")
    bibliotecaSelect.innerHTML = '<option value="todas">Todas las bibliotecas</option>';
    
    // Añadir bibliotecas
    bibliotecas.forEach(bib => {
      const option = document.createElement('option');
      option.value = bib.id;
      option.textContent = bib.nombre;
      bibliotecaSelect.appendChild(option);
    });
    
    console.log(`📚 Cargadas ${bibliotecas.length} bibliotecas para filtro`);
    
  } catch (error) {
    console.error('Error cargando bibliotecas para filtro:', error);
  }
}

// ✅ ARREGLADO: inicializar búsqueda y filtros con debounce mejorado
function initLibrosSearch() {
  const applyFiltersBtn = document.getElementById('applyFiltersBtn');
  if (!applyFiltersBtn) return;
  
  // ✅ ARREGLADO: limpiar listeners previos para evitar duplicados
  const newBtn = applyFiltersBtn.cloneNode(true);
  applyFiltersBtn.parentNode.replaceChild(newBtn, applyFiltersBtn);
  
  newBtn.addEventListener('click', () => {
    console.log('🔍 Aplicando filtros...');
    aplicarFiltros();
  });
  
  // ✅ ARREGLADO: búsqueda en tiempo real con debounce y minLength
  const searchTitle = document.getElementById('searchTitle');
  const searchAuthor = document.getElementById('searchAuthor');
  
  if (searchTitle) {
    searchTitle.addEventListener('input', debounce(() => {
      const valor = searchTitle.value.trim();
      if (valor.length >= 2) { // ✅ ARREGLADO: minLength = 2 (no 3)
        aplicarFiltrosEnTiempoReal();
      } else if (valor.length === 0) {
        // Si se borra todo, recargar sin filtros
        cargarLibros();
      }
    }, 300)); // ✅ ARREGLADO: debounce = 300ms (no 500ms)
  }
  
  if (searchAuthor) {
    searchAuthor.addEventListener('input', debounce(() => {
      const valor = searchAuthor.value.trim();
      if (valor.length >= 2) { // ✅ ARREGLADO: minLength = 2 (no 3)
        aplicarFiltrosEnTiempoReal();
      } else if (valor.length === 0) {
        // Si se borra todo, recargar sin filtros
        cargarLibros();
      }
    }, 300)); // ✅ ARREGLADO: debounce = 300ms (no 500ms)
  }
}

// ✅ ARREGLADO: Función para aplicar filtros (centralizada)
export function aplicarFiltros() {
  const filtros = {
    titulo: document.getElementById('searchTitle')?.value?.trim() || '',
    autor: document.getElementById('searchAuthor')?.value?.trim() || '',
    categorias: obtenerCategoriasSeleccionadas(),
    disponibilidad: document.getElementById('disponibilidad')?.value || 'todos',
    biblioteca: document.getElementById('biblioteca')?.value || 'todas'
  };
  
  console.log('🔍 Filtros aplicados:', filtros);
  cargarLibros(filtros);
}

// ✅ NUEVO: obtener categorías seleccionadas
function obtenerCategoriasSeleccionadas() {
  const categorias = [];
  const checkboxes = document.querySelectorAll('input[name="categoriasFavoritas"]:checked');
  
  checkboxes.forEach(checkbox => {
    categorias.push(checkbox.value);
  });
  
  return categorias;
}

// ✅ ARREGLADO: aplicar filtros en tiempo real usando función centralizada
function aplicarFiltrosEnTiempoReal() {
  aplicarFiltros();
}

// ✅ ARREGLADO: función debounce mejorada para búsqueda en tiempo real
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// ✅ ARREGLADO: Construir URL de filtros de manera robusta
function buildLibrosUrl(filtros = {}) {
  const params = new URLSearchParams();
  
  // ✅ ARREGLADO: Solo añadir parámetros si tienen valor
  if (filtros.titulo && filtros.titulo.trim().length >= 2) {
    params.set('titulo', filtros.titulo.trim());
  }
  
  if (filtros.autor && filtros.autor.trim().length >= 2) {
    params.set('autor', filtros.autor.trim());
  }
  
  if (filtros.categorias && Array.isArray(filtros.categorias) && filtros.categorias.length > 0) {
    params.set('categorias', filtros.categorias.join(','));
  }
  
  if (filtros.disponibilidad && filtros.disponibilidad !== 'todos') {
    params.set('disponibilidad', filtros.disponibilidad);
  }
  
  if (filtros.biblioteca && filtros.biblioteca !== 'todas') {
    params.set('biblioteca', filtros.biblioteca);
  }
  
  const queryString = params.toString();
  const url = `/api/libros${queryString ? '?' + queryString : ''}`;
  
  console.log('🔗 URL construida:', url);
  return url;
}

// ✅ ARREGLADO: ver detalle de libro (funcional)
export async function verDetalleLibro(libroId) {
  console.log('📖 Ver detalle del libro:', libroId);
  
  // ✅ ARREGLADO: Implementación funcional del modal
  const modal = document.getElementById('bookDetailModal');
  const modalTitle = document.getElementById('bookDetailModalLabel');
  const modalImg = document.getElementById('modalBookImg');
  const modalAuthor = document.getElementById('modalBookAuthor');
  const modalISBN = document.getElementById('modalBookISBN');
  const modalDescription = document.getElementById('modalBookDescription');
  
  if (modal && modalTitle) {
    modalTitle.textContent = 'Cargando...';
    
    try {
      // ✅ ARREGLADO: Obtener datos completos del libro desde la API
      const response = await fetch(`/api/libros/${libroId}`, {
        headers: { ...authHeaders() }
      });
      
      if (response.ok) {
        const libro = await response.json();
        console.log('📚 Datos del libro obtenidos:', libro);
        
        // ✅ ARREGLADO: Mostrar datos reales del libro
        modalTitle.textContent = libro.titulo || 'Título no disponible';
        modalAuthor.textContent = libro.autor || 'Autor no disponible';
        modalISBN.textContent = libro.isbn || 'ISBN no disponible';
        modalDescription.textContent = libro.descripcion || 'Descripción no disponible para este libro.';
        
        // ✅ ARREGLADO: Mostrar imagen del libro en el modal
        if (modalImg) {
          modalImg.src = resolveImg(libro);
          modalImg.alt = libro.titulo || 'Portada del libro';
        }
        
      } else {
        // Fallback si la API falla
        const libroCard = document.querySelector(`[data-id="${libroId}"]`);
        if (libroCard) {
          const card = libroCard.closest('.card');
          const titulo = card.querySelector('.card-title')?.textContent || 'Título no disponible';
          const autor = card.querySelector('.card-text')?.textContent || 'Autor no disponible';
          
          const isbnElement = card.querySelector('small.text-muted');
          const isbn = isbnElement?.textContent?.replace('ISBN: ', '') || 'No disponible';
          
          modalTitle.textContent = titulo;
          modalAuthor.textContent = autor;
          modalISBN.textContent = isbn;
          modalDescription.textContent = 'Descripción no disponible. Error al cargar datos del servidor.';
          
          const imgElement = card.querySelector('.libro-img');
          if (imgElement && modalImg) {
            modalImg.src = imgElement.src;
            modalImg.alt = titulo;
          }
        } else {
          modalTitle.textContent = 'Libro no encontrado';
          modalAuthor.textContent = 'N/A';
          modalISBN.textContent = 'N/A';
          modalDescription.textContent = 'No se pudo cargar la información del libro.';
        }
      }
      
      // Mostrar modal
      if (window.bootstrap) {
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
      }
      
    } catch (error) {
      console.error('❌ Error obteniendo detalles del libro:', error);
      
      // Fallback en caso de error
      modalTitle.textContent = 'Error al cargar';
      modalAuthor.textContent = 'N/A';
      modalISBN.textContent = 'N/A';
      modalDescription.textContent = 'Error al conectar con el servidor. Intenta nuevamente.';
      
      if (window.bootstrap) {
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
      }
    }
  } else {
    // Fallback si no hay modal
    alert(`Detalle del libro ${libroId} - Función en desarrollo`);
  }
}

// ✅ ARREGLADO: Hacer la función global para compatibilidad (async)
window.verDetalleLibro = async function(libroId) {
  return await verDetalleLibro(libroId);
};

// ✅ NUEVO: cambiar vista (grid/list)
export function cambiarVista(modo) {
  const librosGrid = document.getElementById('librosGrid');
  const viewGrid = document.getElementById('viewGrid');
  const viewList = document.getElementById('viewList');
  
  if (!librosGrid || !viewGrid || !viewList) return;
  
  if (modo === 'list') {
    librosGrid.classList.remove('row');
    librosGrid.classList.add('list-group');
    viewList.classList.add('active');
    viewGrid.classList.remove('active');
  } else {
    librosGrid.classList.remove('list-group');
    librosGrid.classList.add('row');
    viewGrid.classList.add('active');
    viewList.classList.remove('active');
  }
}

// ✅ NUEVO: ordenar libros
export function ordenarLibros(criterio) {
  console.log('📚 Ordenando libros por:', criterio);
  
  // Aquí puedes implementar la lógica de ordenamiento
  // Por ahora, recargar los libros (el backend debería manejar el ordenamiento)
  cargarLibros();
}

// ✅ ARREGLADO: función para limpiar filtros
export function limpiarFiltros() {
  const filterForm = document.getElementById('filterForm');
  if (filterForm) {
    filterForm.reset();
  }
  
  // ✅ ARREGLADO: Recargar libros sin filtros
  cargarLibros({});
  
  console.log('🧹 Filtros limpiados, recargando todos los libros...');
}
