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

// ===== Paginación 3x3 =====
const PAGINATION = {
  page: 1,
  pageSize: 9, // 3x3
  totalPages: 1,
  libros: [],
};

// Alias para código legado que aún use LIBROS_POR_PAGINA
const LIBROS_POR_PAGINA = PAGINATION.pageSize;

function setLibros(data) {
  PAGINATION.libros = Array.isArray(data) ? data : [];
  PAGINATION.totalPages = Math.max(1, Math.ceil(PAGINATION.libros.length / PAGINATION.pageSize));
  PAGINATION.page = 1;
}

function getPageSlice(page) {
  const p = Math.min(Math.max(1, page), PAGINATION.totalPages);
  const start = (p - 1) * PAGINATION.pageSize;
  const end = start + PAGINATION.pageSize;
  return PAGINATION.libros.slice(start, end);
}

function goToPage(page) {
  PAGINATION.page = Math.min(Math.max(1, page), PAGINATION.totalPages);
  const visibles = getPageSlice(PAGINATION.page);
  renderizarLibros(visibles);
  renderPagination();
  actualizarContadorResultados(visibles.length, PAGINATION.libros.length, PAGINATION.page, PAGINATION.totalPages);
  // opcional: subir al inicio del grid
  document.getElementById('librosGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

let filtrosActuales = {};

// ✅ ARREGLADO: cargar libros con filtros usando URL builder y paginación
export async function cargarLibros(filtros = {}, pagina = 1) {
  const librosGrid = document.getElementById('librosGrid');
  if (!librosGrid) {
    console.warn('Elemento #librosGrid no encontrado');
    return;
  }

  // Actualizar estado global
  filtrosActuales = { ...filtros };

  // Mostrar loader
  librosGrid.innerHTML = `
    <div class="col-12 text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
      <p class="mt-2 text-muted">Cargando libros...</p>
    </div>
  `;

  try {
    // Construir URL con paginación
    const url = buildLibrosUrl({
      ...filtros,
      limit: LIBROS_POR_PAGINA,
      offset: (pagina - 1) * LIBROS_POR_PAGINA
    });
    
    console.log('📚 Cargando libros desde:', url);
    const response = await fetch(url, {
      headers: { ...authHeaders() }
    });
    
    console.log('📥 Status respuesta:', response.status);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    const payload = await response.json();
    console.log('📚 Libros recibidos:', payload);

    // Extraer datos normalizando diferentes formatos de respuesta
    const crudos = payload?.libros || payload?.data || payload || [];
    
    // Manejar caso sin resultados
    if (!Array.isArray(crudos) || crudos.length === 0) {
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
      actualizarPaginacion(0, 1, 1);
      return;
    }

    // Configurar paginación y renderizar
    setLibros(crudos);
    if (payload.paginacion?.total) {
      // Si el backend provee total, usar ese para la paginación
      PAGINATION.totalPages = Math.max(1, Math.ceil(payload.paginacion.total / PAGINATION.pageSize));
    }
    goToPage(1);

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
    <div class="col">
      <div class="card h-100 shadow-sm">
        <img src="${resolveImg(libro)}"
             class="card-img-top libro-img"
             alt="${libro.titulo}"
             style="height:200px;object-fit:cover;">
        <div class="card-body d-flex flex-column">
          <h6 class="card-title">${libro.titulo}</h6>
          <p class="card-text small text-muted">${libro.autor || 'Autor desconocido'}</p>
          ${libro.categoria ? `<span class="badge bg-primary mb-2">${libro.categoria}</span>` : ''}
          ${libro.isbn ? `<small class="text-muted">ISBN: ${libro.isbn}</small>` : ''}
          ${libro.disponibilidad !== undefined
            ? `<span class="badge ${libro.disponibilidad ? 'bg-success' : 'bg-danger'} mb-2">
                 ${libro.disponibilidad ? 'Disponible' : 'No disponible'}
               </span>` : ''}
          <div class="mt-auto">
            <button class="btn btn-outline-primary btn-sm w-100 ver-detalle" data-id="${libro.id}">
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

function actualizarContadorResultados(countVisibles, total = countVisibles, page = 1, totalPages = 1) {
  const el = document.getElementById('resultCount');
  if (!el) return;
  if (total === 0) {
    el.textContent = 'No se encontraron libros';
  } else {
    el.textContent = `Mostrando ${countVisibles} de ${total} libro${total !== 1 ? 's' : ''} — página ${page}/${totalPages}`;
  }
}

// ✅ ARREGLADO: No cargar bibliotecas ya que no tienes esa tabla
function cargarBibliotecas() {
  const bibliotecaSelect = document.getElementById('biblioteca');
  if (!bibliotecaSelect) return;
  
  // ✅ ARREGLADO: Como no tienes tabla bibliotecas, solo mostrar opción por defecto
  bibliotecaSelect.innerHTML = '<option value="todas">Todas las bibliotecas</option>';
  console.log('📚 Filtro de biblioteca deshabilitado (no hay tabla bibliotecas)');
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
  
  // Parámetros de búsqueda
  if (filtros.titulo && filtros.titulo.trim().length >= 2) {
    params.set('titulo', filtros.titulo.trim());
  }
  
  if (filtros.autor && filtros.autor.trim().length >= 2) {
    params.set('autor', filtros.autor.trim());
  }
  
  if (filtros.categorias && Array.isArray(filtros.categorias) && filtros.categorias.length > 0) {
    params.set('categoria', filtros.categorias[0]); // Solo la primera categoría por ahora
  }
  
  if (filtros.disponibilidad && filtros.disponibilidad !== 'todos') {
    params.set('disponibilidad', filtros.disponibilidad);
  }

  // Server-side pagination
  params.set('limit', PAGINATION.pageSize);
  params.set('offset', (PAGINATION.page - 1) * PAGINATION.pageSize);
  
  const url = `/api/libros${params.toString() ? '?' + params.toString() : ''}`;
  
  console.log('🔗 URL construida:', url);
  return url;
}

function renderPagination() {
  const ul = document.getElementById('pagination');
  if (!ul) return;

  const { page, totalPages } = PAGINATION;

  if (totalPages <= 1) {
    ul.innerHTML = '';
    return;
  }

  const mkItem = (label, target, disabled = false, active = false) => `
    <li class="page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}">
      <a class="page-link" href="#" data-page="${target}">${label}</a>
    </li>
  `;

  // Prev
  let html = mkItem('«', page - 1, page === 1, false);

  // Números (máximo 5 visibles; ajusta si quieres)
  const max = 5;
  let start = Math.max(1, page - Math.floor(max / 2));
  let end = Math.min(totalPages, start + max - 1);
  if (end - start + 1 < max) start = Math.max(1, end - max + 1);

  for (let p = start; p <= end; p++) {
    html += mkItem(String(p), p, false, p === page);
  }

  // Next
  html += mkItem('»', page + 1, page === totalPages, false);

  ul.innerHTML = html;

  // Delegación de eventos
  ul.querySelectorAll('a.page-link').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const target = Number(a.dataset.page);
      if (!Number.isNaN(target)) goToPage(target);
    });
  });
}

// ✅ ARREGLADO: ver detalle de libro (funcional)
export async function verDetalleLibro(libroId) {
  console.log('📖 Ver detalle del libro:', libroId);
  
  // Función para solicitar préstamo
  window.solicitarPrestamo = async function(libroId) {
    try {
      const btnPrestamo = document.getElementById('btnSolicitarPrestamo');
      const statusDiv = document.getElementById('modalPrestamoStatus');
      
      btnPrestamo.disabled = true;
      btnPrestamo.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Procesando...';
      
      const response = await fetch('/api/prestamos', {
        method: 'POST',
        headers: {
          ...authHeaders()
        },
        body: JSON.stringify({
          libro_id: parseInt(libroId)
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al solicitar el préstamo');
      }
      
      const data = await response.json();
      
      // Actualizar UI
      btnPrestamo.classList.remove('btn-primary');
      btnPrestamo.classList.add('btn-success');
      btnPrestamo.innerHTML = '<i class="bi bi-check-circle me-1"></i>Préstamo solicitado';
      
      statusDiv.innerHTML = `
        <div class="alert alert-success mb-0 py-1 px-2">
          <small>
            <i class="bi bi-info-circle me-1"></i>
            Préstamo registrado correctamente. Fecha de devolución: 
            <strong>${new Date(data.prestamo.fecha_vencimiento).toLocaleDateString()}</strong>
          </small>
        </div>
      `;
      
      // Actualizar disponibilidad en el modal
      document.getElementById('modalBookDisponibilidad').textContent = 'Prestado';
      document.getElementById('modalBookDisponibilidad').className = 'badge bg-warning';

      // Actualizar disponibilidad en la lista
      const libroCard = document.querySelector(`.libro-card[data-id="${libroId}"]`);
      if (libroCard) {
        const badgeDisponibilidad = libroCard.querySelector('.badge-disponibilidad');
        if (badgeDisponibilidad) {
          badgeDisponibilidad.textContent = 'No disponible';
          badgeDisponibilidad.className = 'badge bg-danger mb-2 badge-disponibilidad';
        }
      }

      // Recargar la lista de libros para actualizar todo
      cargarLibros();
    } catch (error) {
      console.error('❌ Error solicitando préstamo:', error);
      
      const btnPrestamo = document.getElementById('btnSolicitarPrestamo');
      const statusDiv = document.getElementById('modalPrestamoStatus');
      
      btnPrestamo.disabled = false;
      btnPrestamo.innerHTML = '<i class="bi bi-book me-1"></i>Reintentar préstamo';
      
      statusDiv.innerHTML = `
        <div class="alert alert-danger mb-0 py-1 px-2">
          <small>
            <i class="bi bi-exclamation-triangle me-1"></i>
            ${error.message}
          </small>
        </div>
      `;
    }
  };
  
  // ✅ ARREGLADO: Implementación funcional del modal
  const modal = document.getElementById('bookDetailModal');
  const modalTitle = document.getElementById('bookDetailModalLabel');
  const modalImg = document.getElementById('modalBookImg');
  const modalAuthor = document.getElementById('modalBookAuthor');
  const modalISBN = document.getElementById('modalBookISBN');
  const modalDescription = document.getElementById('modalBookDescription');
  const modalCategoria = document.getElementById('modalBookCategoria');
  const btnPrestamo = document.getElementById('btnSolicitarPrestamo');
  
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
        
        // ✅ NUEVO: Mostrar categoría
        if (modalCategoria) {
          modalCategoria.textContent = libro.categoria || 'Sin categoría';
          modalCategoria.className = 'badge bg-secondary';
        }
        
        // ✅ NUEVO: Mostrar disponibilidad y configurar botón de préstamo
        const disponibilidadElement = document.getElementById('modalBookDisponibilidad');
        if (disponibilidadElement) {
          disponibilidadElement.textContent = libro.disponibilidad ? 'Disponible' : 'No disponible';
          disponibilidadElement.className = `badge ${libro.disponibilidad ? 'bg-success' : 'bg-danger'}`;
        }
        
        // Configurar botón de préstamo
        if (btnPrestamo) {
          btnPrestamo.disabled = !libro.disponibilidad;
          btnPrestamo.dataset.libroId = libro.id;
          btnPrestamo.className = `btn ${libro.disponibilidad ? 'btn-primary' : 'btn-secondary'}`;
          btnPrestamo.innerHTML = libro.disponibilidad ? 
            '<i class="bi bi-book me-1"></i>Solicitar préstamo' : 
            '<i class="bi bi-x-circle me-1"></i>No disponible';
        }
        
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
