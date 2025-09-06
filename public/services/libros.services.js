// Módulo para la página de libros
export default function initLibrosPage() {
  console.log('Página de libros inicializada');
  cargarLibros();
  initLibrosSearch();
  cargarBibliotecas();
}

// ✅ NUEVO: función helper para headers de autenticación
export function authHeaders() {
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

// ===== Estado Global y Paginación 3x3 =====
const STATE = {
  lastVisibles: [],          // último lote renderizado (para re-render en cambio de vista)
};

const PAGINATION = {
  page: 1,
  pageSize: 9, // 3x3 SIEMPRE
  totalPages: 1,
  libros: [],
};



// ✅ RESTAURADO: Funciones de paginación client-side para rescate
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
  console.log('🔍 [DEBUG] goToPage llamado con página:', page);
  PAGINATION.page = Math.min(Math.max(1, page), PAGINATION.totalPages);
  const visibles = getPageSlice(PAGINATION.page);

  // 👇 guarda para re-render al cambiar vista
  STATE.lastVisibles = visibles;

  console.log('🔍 [DEBUG] Libros visibles en página', page, ':', visibles.length);
  console.log('🔍 [DEBUG] Llamando renderizarLibros con', visibles.length, 'libros');
  renderizarLibros(visibles);
  renderPagination();
  actualizarContadorResultados(visibles.length, PAGINATION.libros.length, PAGINATION.page, PAGINATION.totalPages);
  document.getElementById('librosGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

let filtrosActuales = {};

// ✅ ARREGLADO: cargar libros con lógica híbrida (backend + rescate client-side)
export async function cargarLibros(filtros = {}, pagina = 1) {
  const librosGrid = document.getElementById('librosGrid');
  if (!librosGrid) {
    console.warn('Elemento #librosGrid no encontrado');
    return;
  }

  console.log('🔍 [DEBUG] cargarLibros llamado con:', { filtros, pagina });

  // ✅ Actualizar estado global y asegurar 3×3
  filtrosActuales = { ...filtros };
  PAGINATION.pageSize = 9;                   // 3×3 SIEMPRE
  PAGINATION.page = Math.max(1, pagina);

  // 👈 IMPORTANTE: Asegurar que siempre haya un orden por defecto
  if (!filtrosActuales.orden) {
    filtrosActuales.orden = 'popularidad';
  }

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
    // ✅ Construir URL con paginación correcta
    const limit = PAGINATION.pageSize;
    const offset = (PAGINATION.page - 1) * PAGINATION.pageSize;
    const url = buildLibrosUrl({ ...filtrosActuales, limit, offset });
    
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
    const totalBackend = payload?.paginacion?.total ?? (Array.isArray(crudos) ? crudos.length : 0);
    
    console.log('🔍 [DEBUG] Datos extraídos:', { crudos, esArray: Array.isArray(crudos), longitud: crudos.length });
    
    // 👈 DEBUG: Verificar si el backend está devolviendo popularidad
    if (crudos.length > 0) {
      const primerLibro = crudos[0];
      console.log('🔍 [DEBUG] Primer libro recibido:', {
        id: primerLibro.id,
        titulo: primerLibro.titulo,
        popularidad: primerLibro.popularidad,
        total_prestamos: primerLibro.total_prestamos,
        tienePopularidad: 'popularidad' in primerLibro
      });
    }
    
    // --- Heurística: ¿el backend ignoró limit/offset o el filtro?
    // ✅ ARREGLADO: Mejor detección de si el backend está funcionando correctamente
    const backendFuncionaCorrectamente = Array.isArray(crudos) && crudos.length <= limit && crudos.length > 0;
    const hayTitulo = filtrosActuales.titulo?.trim()?.length >= 2;
    const hayAutor = filtrosActuales.autor?.trim()?.length >= 2;
    const hayCategoria = Array.isArray(filtrosActuales.categorias) && filtrosActuales.categorias.length > 0;
    const hayDisp = filtrosActuales.disponibilidad && filtrosActuales.disponibilidad !== 'todos';
    const hayBiblioteca = filtrosActuales.biblioteca && filtrosActuales.biblioteca !== 'todas';
    const hayFiltro = hayTitulo || hayAutor || hayCategoria || hayDisp || hayBiblioteca;

    console.log('🔍 [DEBUG] Heurística backend:', {
      backendFuncionaCorrectamente,
      hayFiltro,
      hayTitulo,
      hayAutor,
      hayCategoria,
      hayDisp,
      hayBiblioteca,
      crudosRecibidos: crudos.length,
      limitSolicitado: limit
    });

    let dataset = crudos;

    // Si hay filtros y parece que el backend NO filtró, filtramos en cliente
    if (hayFiltro) {
      const t = (filtrosActuales.titulo || '').trim().toLowerCase();
      const a = (filtrosActuales.autor || '').trim().toLowerCase();
      const cat = hayCategoria ? String(filtrosActuales.categorias[0]).toLowerCase() : null;
      const disp = filtrosActuales.disponibilidad;
      const bib = hayBiblioteca ? filtrosActuales.biblioteca : null;

      dataset = crudos.filter(l => {
        const tituloOk = t ? String(l.titulo || '').toLowerCase().includes(t) : true;
        const autorOk = a ? String(l.autor || '').toLowerCase().includes(a) : true;
        
        // ✅ Filtro de categoría (múltiples con OR)
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
        // ✅ Filtro de biblioteca (asumiendo que los libros tienen biblioteca_id)
        const bibOk = bib ? (l.biblioteca_id === bib || l.biblioteca_id === parseInt(bib)) : true;
        return tituloOk && autorOk && catOk && dispOk && bibOk;
      });

      console.log('🔍 [DEBUG] Filtrado en cliente:', {
        totalOriginal: crudos.length,
        totalFiltrado: dataset.length,
        filtrosAplicados: { 
          titulo: t, 
          autor: a, 
          categorias: filtrosActuales.categorias, 
          disponibilidad: disp, 
          biblioteca: bib 
        }
      });
    }

    // Si el backend NO está funcionando correctamente o estamos filtrando en cliente, paginamos nosotros
    if (!backendFuncionaCorrectamente || hayFiltro) {
      console.log('🔄 [DEBUG] Usando paginación client-side');
      
      // 👇 NUEVO: orden en cliente cuando el backend no lo hace
      const criterio = filtrosActuales.orden || 'popularidad';
      const datasetOrdenado = ordenarDataset(dataset, criterio, filtrosActuales);
      
      console.log('🔄 [DEBUG] Dataset ordenado por:', criterio, 'Total libros:', datasetOrdenado.length);

      setLibros(datasetOrdenado);               // guarda TODO ya ordenado
      PAGINATION.totalPages = Math.max(1, Math.ceil(datasetOrdenado.length / PAGINATION.pageSize));
      goToPage(PAGINATION.page);        // esto llama a renderizarLibros con el slice 3×3
      actualizarContadorResultados(
        getPageSlice(PAGINATION.page).length,
        datasetOrdenado.length,
        PAGINATION.page,
        PAGINATION.totalPages
      );
      renderPagination();
      return;
    }

    // Caso feliz: backend sí paginó y sí filtró
    console.log('✅ [DEBUG] Backend funcionando correctamente, usando paginación server-side');
    setLibros(crudos); // guarda el lote por consistencia (aunque ya venga paginado)
    PAGINATION.totalPages = Math.max(1, Math.ceil(totalBackend / PAGINATION.pageSize));
    STATE.lastVisibles = crudos;            // 👈 asegura re-render al cambiar vista
    renderizarLibros(crudos);           // ya es un slice del backend
    renderPagination();
    actualizarContadorResultados(crudos.length, totalBackend, PAGINATION.page, PAGINATION.totalPages);

    // Scroll al inicio del grid
    document.getElementById('librosGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

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
    actualizarContadorResultados(0, 0, 1, 1);
  }
}

// ✅ NUEVO: renderizar libros en grid 3x3 o lista
function renderizarLibros(libros) {
  console.log('🔍 [DEBUG] renderizarLibros llamado con', libros.length, 'libros');
  const librosGrid = document.getElementById('librosGrid');
  if (!librosGrid) {
    console.error('❌ [DEBUG] Elemento #librosGrid no encontrado en renderizarLibros');
    return;
  }
  
  const isListView = librosGrid.classList.contains('list-group');
  console.log('🔍 [DEBUG] Modo lista:', isListView);
  
  // 👉 Solo fuerza clases de grid si NO estás en lista
  if (!isListView) {
    librosGrid.classList.remove('list-group');
    librosGrid.classList.add('row', 'row-cols-1', 'row-cols-md-3', 'g-3');
  }
  
  if (isListView) {
    // Modo lista
    librosGrid.innerHTML = libros.map(libro => `
      <div class="list-group-item list-group-item-action">
        <div class="d-flex align-items-center">
          <img src="${resolveImg(libro)}"
               class="me-3"
               alt="${libro.titulo}"
               style="width:80px;height:100px;object-fit:cover;">
          <div class="flex-grow-1">
            <h6 class="mb-1">${libro.titulo}</h6>
            <p class="mb-1 small text-muted">${libro.autor || 'Autor desconocido'}</p>
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
    // Modo grid 3x3
    librosGrid.innerHTML = libros.map(libro => `
      <div class="col-12 col-md-6 col-lg-4 mb-3">
        <div class="card h-100 shadow-sm libro-card" data-id="${libro.id}">
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
  
  // ✅ ARREGLADO: Configurar fallback de imágenes y delegación de eventos
  setupImageFallbacks();
  setupEventDelegation();
  
  STATE.lastVisibles = libros; // 👈 siempre reflejar último render
  
  console.log('🔍 [DEBUG] renderizarLibros completado. HTML generado:', librosGrid.innerHTML.substring(0, 200) + '...');
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



// ✅ Función de test debug eliminada - ya no es necesaria

// ✅ ARREGLADO: Cargar bibliotecas reales desde la API
export async function cargarBibliotecas() {
  const bibliotecaSelect = document.getElementById('biblioteca');
  if (!bibliotecaSelect) return;
  
  try {
    console.log('📚 Cargando bibliotecas para el selector...');
    
    // Llamada pública sin autenticación (las bibliotecas son públicas)
    const response = await fetch('/api/bibliotecas');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const bibliotecas = await response.json();
    console.log('📚 Bibliotecas recibidas:', bibliotecas);
    
    // Normalizar el array de bibliotecas
    const bibliotecasArray = Array.isArray(bibliotecas) 
      ? bibliotecas 
      : (bibliotecas?.bibliotecas || bibliotecas?.data || []);
    
    if (!Array.isArray(bibliotecasArray) || bibliotecasArray.length === 0) {
      console.warn('⚠️ No se encontraron bibliotecas, usando solo opción por defecto');
      bibliotecaSelect.innerHTML = '<option value="todas">Todas las bibliotecas</option>';
      return;
    }
    
    // Construir opciones del selector
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
    
    // Fallback: mostrar solo opción por defecto
    bibliotecaSelect.innerHTML = '<option value="todas">Todas las bibliotecas</option>';
    
    // Opcional: mostrar error en la consola
    console.warn('⚠️ Usando opción por defecto debido al error');
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
  
  // ✅ NUEVO: Event listener para ordenamiento automático
  const sortBySelect = document.getElementById('sortBy');
  if (sortBySelect) {
    sortBySelect.addEventListener('change', () => {
      console.log('🔄 Ordenamiento cambiado, aplicando filtros...');
      aplicarFiltros();
    });
  }
  
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
    biblioteca: document.getElementById('biblioteca')?.value || 'todas',
    orden: document.getElementById('sortBy')?.value || 'popularidad'
  };
  
  console.log('🔍 Filtros aplicados:', filtros);
  cargarLibros(filtros, 1); // 👈 siempre desde la página 1
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
  aplicarFiltros(); // Esto ya llama a cargarLibros(filtros, 1)
}

// ✅ NUEVO: Funciones helper para ordenamiento en cliente
function normalizarTexto(v) {
  return String(v || '').toLowerCase().trim();
}

function ordenarDataset(dataset, criterio, filtros = {}) {
  const arr = [...dataset];
  const key = (criterio || 'relevancia').toLowerCase();

  // Atajos: si el backend ya ordenó y trajo LIMIT/OFFSET, no hace falta reordenar
  // (pero mantenemos el orden por si venimos de paginación client-side)
  const byNumDesc = (field) => (a, b) => (Number(b?.[field]) || 0) - (Number(a?.[field]) || 0);

  switch (key) {
    case 'titulo':
      arr.sort((a, b) => normalizarTexto(a.titulo).localeCompare(normalizarTexto(b.titulo)));
      break;

    case 'autor':
      arr.sort((a, b) => normalizarTexto(a.autor).localeCompare(normalizarTexto(b.autor)));
      break;

    case 'recientes':
      arr.sort((a, b) => (b.id || 0) - (a.id || 0));
      break;

    case 'popularidad':
      // 👇 IMPORTANTE: Popularidad es un ORDEN, no un filtro
      // Ordenar por popularidad real del backend (conteo de préstamos)
      arr.sort((a, b) => {
        const getPop = (x) => Number(x?.popularidad ?? 0);
        const pa = getPop(a);
        const pb = getPop(b);
        
        // Si tienen diferente popularidad, ordenar por popularidad descendente
        if (pb !== pa) return pb - pa;
        
        // Si tienen la misma popularidad, ordenar alfabéticamente por título
        return normalizarTexto(a.titulo).localeCompare(normalizarTexto(b.titulo));
      });
      break;

    case 'relevancia':
    default:
      // 👇 primero relevancia del backend; si no viene, cae a popularidad; luego título
      arr.sort((a, b) => {
        const r = byNumDesc('relevancia')(a, b);
        if (r !== 0) return r;
        const p = byNumDesc('popularidad')(a, b);
        if (p !== 0) return p;
        return normalizarTexto(a.titulo).localeCompare(normalizarTexto(b.titulo));
      });

      // (Opcional) si NO hay relevancia/popularidad y sí hay búsqueda de texto, aplica tu heurística:
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
  console.log('🔍 [DEBUG] buildLibrosUrl llamado con filtros:', filtros);
  const params = new URLSearchParams();
  
  // 👈 IMPORTANTE: Siempre enviar orden por defecto
  const orden = filtros.orden || 'popularidad';
  params.set('orden', orden);
  console.log('🔍 [DEBUG] Agregando filtro orden:', orden);
  
  // Parámetros de búsqueda - usar 'q' para búsqueda general
  const titulo = filtros.titulo?.trim();
  const autor = filtros.autor?.trim();
  
  // ✅ Mandamos varios por compatibilidad
  if (titulo && titulo.length >= 2) {
    params.set('q', titulo);
    params.set('titulo', titulo);
    console.log('🔍 [DEBUG] Agregando filtro título:', titulo);
  } else if (autor && autor.length >= 2) {
    params.set('q', autor);
    params.set('autor', autor);
    console.log('🔍 [DEBUG] Agregando filtro autor:', autor);
  }
  
  // Categorías: repetir 'categoria' (como espera tu backend actual)
  if (Array.isArray(filtros.categorias) && filtros.categorias.length > 0) {
    filtros.categorias.forEach(cat => params.append('categoria', cat));
    console.log('🔍 [DEBUG] Agregando filtros categoría (multi):', filtros.categorias);
  }
  
  // Disponibilidad: true/false (como espera tu backend actual)
  if (filtros.disponibilidad && filtros.disponibilidad !== 'todos') {
    params.set('disponibilidad', filtros.disponibilidad === 'disponibles' ? 'true' : 'false');
    console.log('🔍 [DEBUG] Agregando filtro disponibilidad:', params.get('disponibilidad'));
  }
  
  // Biblioteca: usa el nombre que soporte el backend actual
  if (filtros.biblioteca && filtros.biblioteca !== 'todas') {
    params.set('biblioteca', filtros.biblioteca); // o 'biblioteca_id' si tu backend ya lo cambió
    console.log('🔍 [DEBUG] Agregando filtro biblioteca:', filtros.biblioteca);
  }

  // ✅ usa los que llegan por parámetro (importante para filtros)
  const limit = Number.isFinite(filtros.limit) ? filtros.limit : PAGINATION.pageSize;
  const offset = Number.isFinite(filtros.offset) ? filtros.offset : (PAGINATION.page - 1) * PAGINATION.pageSize;
  params.set('limit', String(limit));
  params.set('offset', String(offset));
  
  const url = `/api/libros${params.toString() ? '?' + params.toString() : ''}`;
  
  console.log('🔗 URL construida:', url);
  return url;
}

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

  // Prev
  let html = mkItem('«', page - 1, page === 1);

  // Números (máximo 5 visibles)
  const max = 5;
  let start = Math.max(1, page - Math.floor(max / 2));
  let end = Math.min(totalPages, start + max - 1);
  if (end - start + 1 < max) start = Math.max(1, end - max + 1);

  for (let p = start; p <= end; p++) {
    html += mkItem(String(p), p, false, p === page);
  }

  // Next
  html += mkItem('»', page + 1, page === totalPages);

  ul.innerHTML = html;

  // ✅ Paginador que siempre pide la página correcta
  ul.querySelectorAll('a.page-link').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const target = Number(a.dataset.page);
      if (!Number.isNaN(target)) cargarLibros(filtrosActuales, target);
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

// ✅ ARREGLADO: cambiar vista sin romper el 3×3
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
    grid.classList.add('row', 'row-cols-1', 'row-cols-md-3', 'g-3'); // 👈 3×3 consistente
    viewGrid.classList.add('active'); 
    viewList.classList.remove('active');
  }
  // ✅ Re-render del lote visible actual (no re-fetch)
  const lote = (STATE.lastVisibles && STATE.lastVisibles.length)
    ? STATE.lastVisibles
    : getPageSlice(PAGINATION.page);
  renderizarLibros(lote);
}

// ✅ NUEVO: ordenar libros
export function ordenarLibros(criterio) {
  console.log('📚 Ordenando libros por:', criterio);
  
  // Guarda el criterio en el estado de filtros
  filtrosActuales = { ...(filtrosActuales || {}), orden: criterio || 'popularidad' };
  
  // Recarga con el nuevo criterio (preserva 3×3)
  cargarLibros(filtrosActuales, 1);
}

// ✅ ARREGLADO: función para limpiar filtros
export function limpiarFiltros() {
  const filterForm = document.getElementById('filterForm');
  if (filterForm) {
    filterForm.reset();
  }
  
  // ✅ ARREGLADO: Recargar libros sin filtros
  cargarLibros({}, 1); // 👈 vuelve a página 1
  
  console.log('🧹 Filtros limpiados, recargando todos los libros...');
}
