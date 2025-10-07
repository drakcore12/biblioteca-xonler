// ============================================================================
// MODULE INITIALIZATION
// ============================================================================

// Módulo para la página de libros
export default function initLibrosPage() {
  console.log('Página de libros inicializada');
  cargarLibros();
  initLibrosSearch();
  cargarBibliotecas();
}

// ============================================================================
// AUTHENTICATION & UTILITIES
// ============================================================================

export function authHeaders(method = 'GET') {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) {
    console.warn('⚠️ No se encontró token de autenticación');
    return {};
  }
  const h = { 'Authorization': `Bearer ${token}` };
  if (['POST','PUT','PATCH','DELETE'].includes(String(method).toUpperCase())) {
    h['Content-Type'] = 'application/json';
  }
  console.log('🔐 Usando token para autenticación');
  return h;
}

function resolveImg(libro) {
  if (libro.imagen_url && /^https?:\/\//i.test(libro.imagen_url)) {
    return libro.imagen_url;
  }
  
  if (libro.imagen_url) {
    if (libro.imagen_url.startsWith('/assets/')) {
      return libro.imagen_url;
    }
    if (libro.imagen_url.startsWith('assets/')) {
      return `/${libro.imagen_url}`;
    }
    if (libro.imagen_url.startsWith('./')) {
      return `/assets/images/${libro.imagen_url.slice(2)}`;
    }

    return `/assets/images/${libro.imagen_url}`;
  }
  
  return '/assets/images/libro-placeholder.jpg';
}


// ============================================================================
// UI HELPERS & DOM MANIPULATION
// ============================================================================

function setupImageFallbacks() {
  const librosGrid = document.getElementById('librosGrid');
  if (!librosGrid) return;

  librosGrid.querySelectorAll('img.libro-img').forEach(img => {
    if (img._fallbackBound) return;
    img._fallbackBound = true;
    img.addEventListener('error', () => {
      console.log('🖼️ Imagen fallida, usando placeholder:', img.src);
      img.src = '/assets/images/libro-placeholder.jpg';
    });
  });
}

function setupEventDelegation() {
  const librosGrid = document.getElementById('librosGrid');
  if (!librosGrid) return;
  
  if (librosGrid._clickHandler) {
    librosGrid.removeEventListener('click', librosGrid._clickHandler);
  }
  
  librosGrid._clickHandler = (e) => {
    const btn = e.target.closest('.ver-detalle');
    if (!btn) return;
    
    const libroId = btn.dataset.id;
    console.log('📖 Ver detalle del libro:', libroId);
    verDetalleLibro(libroId);
  };
  
  librosGrid.addEventListener('click', librosGrid._clickHandler);
}

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

// ============================================================================
// STATE MANAGEMENT & PAGINATION
// ============================================================================

const STATE = {
  lastVisibles: [],         
};

const PAGINATION = {
  page: 1,
  pageSize: 9, 
  totalPages: 1,
  libros: [],
};

let _librosAbortController = null;



function setLibros(data) {
  PAGINATION.libros = Array.isArray(data) ? data : [];
  PAGINATION.totalPages = Math.max(1, Math.ceil(PAGINATION.libros.length / PAGINATION.pageSize));
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

  STATE.lastVisibles = visibles;
  renderizarLibros(visibles);
  renderPagination();
  actualizarContadorResultados(visibles.length, PAGINATION.libros.length, PAGINATION.page, PAGINATION.totalPages);
  document.getElementById('librosGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

let filtrosActuales = {};

// ============================================================================
// CORE DATA FETCHING & API INTERACTIONS
// ============================================================================

export async function cargarLibros(filtros = {}, pagina = 1) {
  const librosGrid = document.getElementById('librosGrid');
  if (!librosGrid) {
    console.warn('Elemento #librosGrid no encontrado');
    return;
  }


  filtrosActuales = { ...filtros };
  PAGINATION.pageSize = 9;                
  PAGINATION.page = Math.max(1, pagina);

  if (!filtrosActuales.orden) {
    filtrosActuales.orden = 'popularidad';
  }

  librosGrid.innerHTML = `
    <div class="col-12 text-center py-5">
      <div class="spinner-border text-primary" role="status" aria-live="polite">
        <span class="visually-hidden">Cargando...</span>
      </div>
      <p class="mt-2 text-muted">Cargando libros...</p>
    </div>
  `;

  try {
    if (_librosAbortController) _librosAbortController.abort();
    _librosAbortController = new AbortController();
    const { signal } = _librosAbortController;

    const limit = PAGINATION.pageSize;
    const offset = (PAGINATION.page - 1) * PAGINATION.pageSize;
    const url = buildLibrosUrl({ ...filtrosActuales, limit, offset });
    
    console.log('📚 Cargando libros desde:', url);
    const response = await fetch(url, {
      headers: { ...authHeaders('GET') },
      signal
    });
    
    console.log('📥 Status respuesta:', response.status);
    
    if (response.status === 401 || response.status === 403) {
      librosGrid.innerHTML = `
        <div class="col-12 text-center py-5">
          <div class="alert alert-warning">
            <strong>Sesión expirada.</strong> Vuelve a iniciar sesión para ver los libros.
            <div class="mt-2">
              <a href="/login" class="btn btn-sm btn-primary">Ir a iniciar sesión</a>
            </div>
          </div>
        </div>`;
      actualizarContadorResultados(0, 0, 1, 1);
      return;
    }
    
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    const payload = await response.json();
    console.log('📚 Libros recibidos:', payload);

    const crudos = payload?.libros || payload?.data || payload || [];
    const totalBackend = payload?.paginacion?.total ?? (Array.isArray(crudos) ? crudos.length : 0);
    
    
    const backendFuncionaCorrectamente = Array.isArray(crudos) && crudos.length <= limit && crudos.length > 0;
    const hayTitulo = filtrosActuales.titulo?.trim()?.length >= 2;
    const hayAutor = filtrosActuales.autor?.trim()?.length >= 2;
    const hayCategoria = Array.isArray(filtrosActuales.categorias) && filtrosActuales.categorias.length > 0;
    const hayDisp = filtrosActuales.disponibilidad && filtrosActuales.disponibilidad !== 'todos';
    const hayBiblioteca = filtrosActuales.biblioteca && filtrosActuales.biblioteca !== 'todas';
    const hayFiltro = hayTitulo || hayAutor || hayCategoria || hayDisp || hayBiblioteca;


    let dataset = crudos;

    if (hayFiltro) {
      const t = (filtrosActuales.titulo || '').trim().toLowerCase();
      const a = (filtrosActuales.autor || '').trim().toLowerCase();
      const cat = hayCategoria ? String(filtrosActuales.categorias[0]).toLowerCase() : null;
      const disp = filtrosActuales.disponibilidad;
      const bib = hayBiblioteca ? filtrosActuales.biblioteca : null;

      dataset = crudos.filter(l => {
        const tituloOk = t ? String(l.titulo || '').toLowerCase().includes(t) : true;
        const autorOk = a ? String(l.autor || '').toLowerCase().includes(a) : true;
        
        let catOk = true;
        if (hayCategoria && filtrosActuales.categorias && filtrosActuales.categorias.length > 0) {
          const libroCategoria = String(l.categoria || '');
          catOk = filtrosActuales.categorias.some(cat => 
            String(cat) === libroCategoria
          );
        }
        
        const dispOk = disp && disp !== 'todos'
          ? (disp === 'disponibles' ? !!l.disponibilidad : !l.disponibilidad)
          : true;
        const bibOk = bib ? (l.biblioteca_id === bib || l.biblioteca_id === parseInt(bib)) : true;
        return tituloOk && autorOk && catOk && dispOk && bibOk;
      });

    }

    if (!backendFuncionaCorrectamente || hayFiltro) {
      const criterio = filtrosActuales.orden || 'popularidad';
      const datasetOrdenado = ordenarDataset(dataset, criterio, filtrosActuales);

      setLibros(datasetOrdenado);               
      PAGINATION.totalPages = Math.max(1, Math.ceil(datasetOrdenado.length / PAGINATION.pageSize));
      goToPage(PAGINATION.page);    
      actualizarContadorResultados(
        getPageSlice(PAGINATION.page).length,
        datasetOrdenado.length,
        PAGINATION.page,
        PAGINATION.totalPages
      );
      renderPagination();
      return;
    }

    setLibros(crudos); 
    PAGINATION.totalPages = Math.max(1, Math.ceil(totalBackend / PAGINATION.pageSize));
    STATE.lastVisibles = crudos;            
    renderizarLibros(crudos);           
    renderPagination();
    actualizarContadorResultados(crudos.length, totalBackend, PAGINATION.page, PAGINATION.totalPages);

    document.getElementById('librosGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('⏭️ Petición cancelada por nueva búsqueda/paginación');
      return;
    }
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
    actualizarContadorResultados(0, 0, 1, 1);
  }
}

function renderizarLibros(libros) {
  const librosGrid = document.getElementById('librosGrid');
  if (!librosGrid) {
    console.error('❌ Elemento #librosGrid no encontrado');
    return;
  }
  
  const isListView = librosGrid.classList.contains('list-group');
  
  if (!isListView) {
    librosGrid.classList.remove('list-group');
    librosGrid.classList.add('row', 'row-cols-1', 'row-cols-md-3', 'g-3');
  }
  
  if (isListView) {
    librosGrid.innerHTML = libros.map(libro => `
      <div class="list-group-item list-group-item-action">
        <div class="d-flex align-items-center">
          <img src="${resolveImg(libro)}"
               class="me-3 libro-img"
               alt="${libro.titulo}"
               loading="lazy" decoding="async"
               style="width:80px;height:100px;object-fit:cover;">
          <div class="flex-grow-1">
            <h6 class="mb-1">${libro.titulo}</h6>
            <p class="mb-1 small text-muted">${libro.autor || 'Sin autor'}</p>
            <div class="mb-2">
              ${libro.categoria ? `<span class="badge bg-primary me-2">${libro.categoria}</span>` : ''}
              ${libro.disponibilidad !== undefined
                ? `<span class="badge ${libro.disponibilidad ? 'bg-success' : 'bg-danger'} me-2">
                     ${libro.disponibilidad ? 'Disponible' : 'No disponible'}
                   </span>` : ''}
            </div>
            ${libro.isbn ? `<small class="text-muted">ISBN: ${libro.isbn}</small>` : ''}
          </div>
          <div class="ms-3">
            <button class="btn btn-outline-primary btn-sm ver-detalle" data-id="${libro.id}">
              Ver detalles
            </button>
          </div>
        </div>
      </div>
    `).join('');
  } else {
    librosGrid.innerHTML = libros.map(libro => `
      <div class="col-12 col-md-6 col-lg-4 mb-3">
        <div class="card h-100 shadow-sm libro-card" data-id="${libro.id}">
          <img src="${resolveImg(libro)}"
               class="card-img-top libro-img"
               alt="${libro.titulo}"
               loading="lazy" decoding="async"
               style="height:200px;object-fit:cover;">
          <div class="card-body d-flex flex-column">
            <h6 class="card-title">${libro.titulo}</h6>
            <p class="card-text small text-muted">${libro.autor || 'Sin autor'}</p>
            ${libro.categoria ? `<span class="badge bg-primary mb-2">${libro.categoria}</span>` : ''}
            ${libro.isbn ? `<small class="text-muted">ISBN: ${libro.isbn}</small>` : ''}
            ${libro.disponibilidad !== undefined
              ? `<span class="badge ${libro.disponibilidad ? 'bg-success' : 'bg-danger'} mb-2 badge-disponibilidad">
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
  }
  
  setupImageFallbacks();
  setupEventDelegation();
  
  STATE.lastVisibles = libros;
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

export async function cargarBibliotecas() {
  const bibliotecaSelect = document.getElementById('biblioteca');
  if (!bibliotecaSelect) return;
  
  try {
    console.log('📚 Cargando bibliotecas para el selector...');
    
    const response = await fetch('/api/bibliotecas');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const bibliotecas = await response.json();
    console.log('📚 Bibliotecas recibidas:', bibliotecas);
    
    const bibliotecasArray = bibliotecas?.bibliotecas || bibliotecas?.data || bibliotecas || [];
    
    if (!Array.isArray(bibliotecasArray) || bibliotecasArray.length === 0) {
      throw new Error('No se encontraron bibliotecas');
    }
    
    let options = '<option value="todas">Todas las bibliotecas</option>';
    
    bibliotecasArray.forEach(biblioteca => {
      const nombre = biblioteca.nombre || 'Biblioteca sin nombre';
      const id = biblioteca.id || 'unknown';
      options += `<option value="${id}">${nombre}</option>`;
    });
    
    bibliotecaSelect.innerHTML = options;
    console.log(`✅ Selector de bibliotecas cargado con ${bibliotecasArray.length} opciones`);
    
  } catch (error) {
    console.error('❌ Error cargando bibliotecas:', error);
    bibliotecaSelect.innerHTML = '<option value="todas">Error cargando bibliotecas</option>';
  }
}

// ============================================================================
// SEARCH & FILTERING LOGIC
// ============================================================================

function initLibrosSearch() {
  const applyFiltersBtn = document.getElementById('applyFiltersBtn');
  if (!applyFiltersBtn) return;
  
  const newBtn = applyFiltersBtn.cloneNode(true);
  applyFiltersBtn.parentNode.replaceChild(newBtn, applyFiltersBtn);
  
  newBtn.addEventListener('click', () => {
    console.log('🔍 Aplicando filtros...');
    aplicarFiltros();
  });
  
  const sortBySelect = document.getElementById('sortBy');
  if (sortBySelect) {
    sortBySelect.addEventListener('change', () => {
      console.log('🔄 Ordenamiento cambiado, aplicando filtros...');
      aplicarFiltros();
    });
  }
  
  const searchTitle = document.getElementById('searchTitle');
  const searchAuthor = document.getElementById('searchAuthor');
  
  if (searchTitle) {
    searchTitle.addEventListener('input', debounce(() => {
      const valor = searchTitle.value.trim();
      if (valor.length >= 2) { 
        aplicarFiltrosEnTiempoReal();
      } else if (valor.length === 0) {

        cargarLibros();
      }
    }, 300));
  }
  
  if (searchAuthor) {
    searchAuthor.addEventListener('input', debounce(() => {
      const valor = searchAuthor.value.trim();
      if (valor.length >= 2) { 
        aplicarFiltrosEnTiempoReal();
      } else if (valor.length === 0) {

        cargarLibros();
      }
    }, 300)); 
  }
}

export function aplicarFiltros() {
  const filtros = {
    titulo: document.getElementById('searchTitle')?.value?.trim() || '',
    autor: document.getElementById('searchAuthor')?.value?.trim() || '',
    categorias: obtenerCategoriasSeleccionadas(),
    disponibilidad: document.getElementById('disponibilidad')?.value || 'todos',
    biblioteca: document.getElementById('biblioteca')?.value || 'todas',
    orden: document.getElementById('sortBy')?.value || 'popularidad'
  };
  
  console.log('🔍 Filtros aplicados:', filtros);
  cargarLibros(filtros, 1); 
}

function obtenerCategoriasSeleccionadas() {
  const categorias = [];
  const checkboxes = document.querySelectorAll('input[name="categoriasFavoritas"]:checked');
  
  checkboxes.forEach(checkbox => {
    categorias.push(checkbox.value);
  });
  
  return categorias;
}

function aplicarFiltrosEnTiempoReal() {
  aplicarFiltros(); 
}

// ============================================================================
// DATA PROCESSING & SORTING UTILITIES
// ============================================================================

function normalizarTexto(v) {
  return String(v || '').toLowerCase().trim();
}

function ordenarDataset(dataset, criterio, filtros = {}) {
  const arr = [...dataset];
  const key = (criterio || 'relevancia').toLowerCase();

  const byNumDesc = (field) => (a, b) => (Number(b?.[field]) || 0) - (Number(a?.[field]) || 0);

  switch (key) {
    case 'titulo':
      arr.sort((a, b) => normalizarTexto(a.titulo).localeCompare(normalizarTexto(b.titulo)));
      break;

    case 'autor':
      arr.sort((a, b) => normalizarTexto(a.autor).localeCompare(normalizarTexto(b.autor)));
      break;

    case 'recientes': {
      const getTs = (x) => {
        const c = x?.created_at || x?.updated_at || x?.fecha_alta;
        const t = c ? Date.parse(c) : NaN;
        return Number.isNaN(t) ? 0 : t;
      };
      arr.sort((a, b) => getTs(b) - getTs(a) || normalizarTexto(a.titulo).localeCompare(normalizarTexto(b.titulo)));
      break;
    }

    case 'popularidad':

      arr.sort((a, b) => {
        const getPop = (x) => Number(x?.popularidad ?? 0);
        const pa = getPop(a);
        const pb = getPop(b);
        
        if (pb !== pa) return pb - pa;
        
        return normalizarTexto(a.titulo).localeCompare(normalizarTexto(b.titulo));
      });
      break;

    case 'relevancia':
    default:
      arr.sort((a, b) => {
        const r = byNumDesc('relevancia')(a, b);
        if (r !== 0) return r;
        const p = byNumDesc('popularidad')(a, b);
        if (p !== 0) return p;
        return normalizarTexto(a.titulo).localeCompare(normalizarTexto(b.titulo));
      });

      const q = normalizarTexto(filtros?.titulo || filtros?.autor || filtros?.q || '');
      if (q && !arr.some(x => x.relevancia || x.popularidad)) {
        const score = (libro) => {
          const t = normalizarTexto(libro.titulo);
          const a = normalizarTexto(libro.autor);
          let s = 0;
          if (t.includes(q)) s += 2;
          if (t.startsWith(q)) s += 2;
          if (a.includes(q)) s += 1;
          return s;
        };
        arr.sort((x, y) => score(y) - score(x));
      }
      break;
  }
  return arr;
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// ============================================================================
// URL BUILDING & API PARAMETER HANDLING
// ============================================================================

function buildLibrosUrl(filtros = {}) {
  const params = new URLSearchParams();
  
  const orden = filtros.orden || 'popularidad';
  params.set('orden', orden);
  
  const titulo = filtros.titulo?.trim();
  const autor = filtros.autor?.trim();
  
  if (titulo && titulo.length >= 2) params.set('titulo', titulo);
  if (autor && autor.length >= 2) params.set('autor', autor);
  if ((titulo && titulo.length >= 2) || (autor && autor.length >= 2)) {
    params.set('q', [titulo, autor].filter(Boolean).join(' '));
  }
  
  if (Array.isArray(filtros.categorias) && filtros.categorias.length > 0) {
    filtros.categorias.forEach(cat => params.append('categoria', String(cat)));
  }
  
  if (filtros.disponibilidad && filtros.disponibilidad !== 'todos') {
    params.set('disponibilidad', filtros.disponibilidad === 'disponibles' ? 'true' : 'false');
  }
  
  if (filtros.biblioteca && filtros.biblioteca !== 'todas') {
    params.set('biblioteca', filtros.biblioteca);
  }

  const limit = Number.isFinite(filtros.limit) ? filtros.limit : PAGINATION.pageSize;
  const offset = Number.isFinite(filtros.offset) ? filtros.offset : (PAGINATION.page - 1) * PAGINATION.pageSize;
  params.set('limit', String(limit));
  params.set('offset', String(offset));
  
  const url = `/api/libros${params.toString() ? '?' + params.toString() : ''}`;
  
  console.log('🔗 URL construida:', url);
  return url;
}

// ============================================================================
// PAGINATION & UI RENDERING
// ============================================================================

function renderPagination() {
  const ul = document.getElementById('pagination');
  if (!ul) return;

  const { page, totalPages } = PAGINATION;
  if (totalPages <= 1) { ul.innerHTML = ''; return; }

  const mkItem = (label, target, disabled = false, active = false) => `
    <li class="page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}">
      <a class="page-link" href="#" data-page="${target}">${label}</a>
    </li>
  `;

  let html = mkItem('«', page - 1, page === 1);

  const max = 5;
  let start = Math.max(1, page - Math.floor(max / 2));
  let end = Math.min(totalPages, start + max - 1);
  if (end - start + 1 < max) start = Math.max(1, end - max + 1);

  for (let p = start; p <= end; p++) {
    html += mkItem(String(p), p, false, p === page);
  }

  html += mkItem('»', page + 1, page === totalPages);

  ul.innerHTML = html;

  ul.querySelectorAll('a.page-link').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const target = Number(a.dataset.page);
      if (!Number.isNaN(target)) cargarLibros(filtrosActuales, target);
    });
  });
}

// ============================================================================
// MODAL & DETAIL VIEW FUNCTIONALITY
// ============================================================================

export async function verDetalleLibro(libroId) {
  console.log('📖 Ver detalle del libro:', libroId);

  window.solicitarPrestamo = async function(libroId) {
    try {
      const btnPrestamo = document.getElementById('btnSolicitarPrestamo');
      const statusDiv = document.getElementById('modalPrestamoStatus');
      
      btnPrestamo.disabled = true;
      btnPrestamo.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Procesando...';
      
      const response = await fetch('/api/prestamos', {
        method: 'POST',
        headers: {
          ...authHeaders('POST')
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

      document.getElementById('modalBookDisponibilidad').textContent = 'Prestado';
      document.getElementById('modalBookDisponibilidad').className = 'badge bg-warning';

      const libroCard = document.querySelector(`.libro-card[data-id="${libroId}"]`);
      if (libroCard) {
        const badgeDisponibilidad = libroCard.querySelector('.badge-disponibilidad');
        if (badgeDisponibilidad) {
          badgeDisponibilidad.textContent = 'No disponible';
          badgeDisponibilidad.className = 'badge bg-danger mb-2 badge-disponibilidad';
        }
      }

      cargarLibros(filtrosActuales, PAGINATION.page);
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

      const response = await fetch(`/api/libros/${libroId}`, {
        headers: { ...authHeaders('GET') }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📚 Datos del libro obtenidos:', data);

        const libro = data.libro || data;
        console.log('📚 Libro extraído:', libro);

        modalTitle.textContent = libro.titulo || 'Sin título';
        modalAuthor.textContent = libro.autor || 'Sin autor';
        modalISBN.textContent = libro.isbn || 'Sin ISBN';
        modalDescription.textContent = libro.descripcion || 'Sin descripción';

        if (modalCategoria) {
          modalCategoria.textContent = libro.categoria || 'Sin categoría';
          modalCategoria.className = 'badge bg-secondary';
        }

        const disponibilidadElement = document.getElementById('modalBookDisponibilidad');
        if (disponibilidadElement) {
          const disponible = libro.disponibilidad === true || libro.disponibilidad === 'true' || libro.disponible === true;
          disponibilidadElement.textContent = disponible ? 'Disponible' : 'No disponible';
          disponibilidadElement.className = `badge ${disponible ? 'bg-success' : 'bg-danger'}`;
          
        }
        
        if (btnPrestamo) {
          const disponible = libro.disponibilidad === true || libro.disponibilidad === 'true' || libro.disponible === true;
          btnPrestamo.disabled = !disponible;
          btnPrestamo.dataset.libroId = libro.id;
          btnPrestamo.className = `btn ${disponible ? 'btn-primary' : 'btn-secondary'}`;
          btnPrestamo.innerHTML = disponible ? 
            '<i class="bi bi-book me-1"></i>Solicitar préstamo' : 
            '<i class="bi bi-x-circle me-1"></i>No disponible';
        }

        if (modalImg) {
          modalImg.src = resolveImg(libro);
          modalImg.alt = libro.titulo || 'Portada del libro';
        }
        
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      if (window.bootstrap) {
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
      }
      
    } catch (error) {
      console.error('❌ Error obteniendo detalles del libro:', error);
      modalTitle.textContent = 'Error al cargar';
      modalDescription.textContent = error.message;
      
      if (window.bootstrap) {
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
      }
    }
  }
}

window.verDetalleLibro = async function(libroId) {
  return await verDetalleLibro(libroId);
};

// ============================================================================
// VIEW CONTROLS & USER INTERACTIONS
// ============================================================================

export function cambiarVista(modo) {
  const grid = document.getElementById('librosGrid');
  const viewGrid = document.getElementById('viewGrid');
  const viewList = document.getElementById('viewList');
  if (!grid || !viewGrid || !viewList) return;

  if (modo === 'list') {
    grid.classList.remove('row', 'row-cols-1', 'row-cols-md-3', 'g-3');
    grid.classList.add('list-group');
    viewList.classList.add('active'); 
    viewGrid.classList.remove('active');
  } else {
    grid.classList.remove('list-group');
    grid.classList.add('row', 'row-cols-1', 'row-cols-md-3', 'g-3'); 
    viewGrid.classList.add('active'); 
    viewList.classList.remove('active');
  }

  const lote = (STATE.lastVisibles && STATE.lastVisibles.length)
    ? STATE.lastVisibles
    : getPageSlice(PAGINATION.page);
  renderizarLibros(lote);
}


export function ordenarLibros(criterio) {
  console.log('📚 Ordenando libros por:', criterio);
  
  filtrosActuales = { ...(filtrosActuales || {}), orden: criterio || 'popularidad' };
  
  cargarLibros(filtrosActuales, 1);
}

export function limpiarFiltros() {
  const filterForm = document.getElementById('filterForm');
  if (filterForm) {
    filterForm.reset();
  }

  cargarLibros({}, 1); 
  
  console.log('🧹 Filtros limpiados, recargando todos los libros...');
}
