export default function initBibliotecasPage() {
  console.log('Página de bibliotecas inicializada');
  cargaBibliotecas(); // ✅ ARREGLADO: ahora coincide con el nombre exportado
  initBibliotecasSearch();
}

// ✅ ARREGLADO: función unificada sin duplicados
export async function cargaBibliotecas() {
  const bibliotecasList = document.getElementById('bibliotecasList');
  if (!bibliotecasList) {
    console.warn('Elemento #bibliotecasList no encontrado');
    return;
  }
  
  bibliotecasList.innerHTML = '<div class="text-center my-3">Cargando bibliotecas...</div>';
  
  try {
    // ✅ ARREGLADO: añadido headers de autenticación
    const res = await fetch('/api/bibliotecas', { 
      headers: { ...authHeaders() } 
    });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const bibliotecas = await res.json();
    console.log('📚 Bibliotecas recibidas:', bibliotecas);
    
    if (!Array.isArray(bibliotecas) || bibliotecas.length === 0) {
      bibliotecasList.innerHTML = '<div class="alert alert-warning">No se encontraron bibliotecas.</div>';
      return;
    }
    
    // ✅ ARREGLADO: renderizado unificado
    bibliotecasList.innerHTML = bibliotecas.map(b => `
      <li class="list-group-item" data-id="${b.id}">
        <h5>${b.nombre}</h5>
        <p>${b.direccion}</p>
        <small class="text-muted">${b.colegio}</small>
      </li>
    `).join('');
    
    initBibliotecasList();
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

function initBibliotecasList() {
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

  // ✅ ARREGLADO: limpiar listeners previos para evitar duplicados
  items.forEach(item => {
    // Remover listeners previos
    item.replaceWith(item.cloneNode(true));
  });
  
  // Obtener items frescos después del reemplazo
  const freshItems = bibliotecasList.querySelectorAll('.list-group-item');
  
  // Asignar manejador de clic a cada item
  freshItems.forEach(item => {
    console.log('🔗 Adjuntar listener a biblioteca:', item.dataset.id, '->', item.querySelector('h5').textContent);
    item.addEventListener('click', () => {
      // Eliminar 'active' de todos los items antes de asignar al seleccionado
      freshItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      cargarLibros(item, container);
    });
  });

  // Confirmar que la inicialización terminó
  console.log('↪ initBibliotecasList completa, items count:', freshItems.length);

  // ✅ ARREGLADO: auto-cargar la primera biblioteca solo si hay items
  if (freshItems.length > 0) {
    console.log('↪ Auto-cargando primera biblioteca ID:', freshItems[0].dataset.id);
    cargarLibros(freshItems[0], container);
    // Marcar visualmente
    freshItems[0].classList.add('active');
    
    // ✅ ARREGLADO: verificar que los elementos existen antes de usarlos
    const defaultMessage = document.getElementById('defaultMessage');
    const detailsContent = document.getElementById('detailsContent');
    
    if (defaultMessage) defaultMessage.style.display = 'none';
    if (detailsContent) detailsContent.style.display = 'block';
  }
}

async function cargarLibros(item, container) {
  const bibliotecaId = item.dataset.id;
  console.log('↪ Cargando libros para biblioteca ID:', bibliotecaId);

  // ✅ ARREGLADO: verificar que el container existe
  if (!container) {
    console.warn('Container de libros no encontrado');
    return;
  }

  // Mostrar detalles
  const nombre = item.querySelector('h5').textContent;
  const direccion = item.querySelector('p').textContent;

  // ✅ ARREGLADO: actualizar elementos solo si existen
  const bibliotecaTitle = document.getElementById('bibliotecaTitle');
  const detailName = document.getElementById('detailName');
  const detailAddress = document.getElementById('detailAddress');
  
  if (bibliotecaTitle) bibliotecaTitle.textContent = nombre;
  if (detailName) detailName.textContent = nombre;
  if (detailAddress) detailAddress.textContent = direccion;

  // ✅ ARREGLADO: llamar showLibraryMap solo si hay dirección
  if (direccion) {
    showLibraryMap(direccion);
  }

  // Mostrar mensaje de carga
  container.innerHTML = '<div class="text-center my-3">Cargando libros…</div>';
  
  try {
    // ✅ ARREGLADO: añadido headers de autenticación
    const response = await fetch(`/api/bibliotecas/${bibliotecaId}/libros`, {
      headers: { ...authHeaders() }
    });
    
    console.log('📥 Status respuesta:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const libros = await response.json();
    console.log('📚 Libros recibidos:', libros);

    if (!Array.isArray(libros) || libros.length === 0) {
      container.innerHTML = '<div class="alert alert-warning">No hay libros para esta biblioteca.</div>';
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

function initBibliotecasSearch() {
  const searchBtn = document.getElementById('searchBtn');
  if (!searchBtn) {
    console.warn('Botón de búsqueda no encontrado');
    return;
  }

  // ✅ ARREGLADO: limpiar listeners previos para evitar duplicados
  const newSearchBtn = searchBtn.cloneNode(true);
  searchBtn.parentNode.replaceChild(newSearchBtn, searchBtn);

  newSearchBtn.addEventListener('click', () => {
    const nombreBusqueda = document.getElementById('searchName')?.value?.toLowerCase() || '';
    const ubicacionBusqueda = document.getElementById('searchLocation')?.value?.toLowerCase() || '';
    const bibliotecasItems = document.querySelectorAll('#bibliotecasList .list-group-item');

    console.log('🔍 Búsqueda:', { nombre: nombreBusqueda, ubicacion: ubicacionBusqueda });

    bibliotecasItems.forEach(item => {
      const nombre = item.querySelector('h5')?.textContent?.toLowerCase() || '';
      const ubicacion = item.querySelector('p')?.textContent?.toLowerCase() || '';
      const visible = (nombreBusqueda === '' || nombre.includes(nombreBusqueda))
                    && (ubicacionBusqueda === '' || ubicacion.includes(ubicacionBusqueda));
      item.style.display = visible ? 'block' : 'none';
    });
    
    console.log(`🔍 Búsqueda completada: ${Array.from(bibliotecasItems).filter(i => i.style.display !== 'none').length} resultados`);
  });
}

function showLibraryMap(address) {
  // ✅ ARREGLADO: verificar que el elemento del mapa existe
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
