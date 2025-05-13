export default function initBibliotecasPage() {
  console.log('Página de bibliotecas inicializada');
  cargarBibliotecas();
  initBibliotecasSearch();
}

export async function cargaBibliotecas() {
    const res = await fetch('/api/bibliotecas');
    const data = await res.json();
    const bibliotecasList = document.getElementById('bibliotecasList');
    if (!bibliotecasList) return;
    
    bibliotecasList.innerHTML = '<div class="text-center my-3">Cargando bibliotecas...</div>';
    
    fetch('/api/bibliotecas')
      .then(response => response.json())
      .then(bibliotecas => {
        if (!Array.isArray(bibliotecas) || bibliotecas.length === 0) {
          bibliotecasList.innerHTML = '<div class="alert alert-warning">No se encontraron bibliotecas.</div>';
          return;
        }
        // Renderizar las bibliotecas
        bibliotecasList.innerHTML = bibliotecas.map(b => `
          <li class="list-group-item" data-id="${b.id}">
            <h5>${b.nombre}</h5>
            <p>${b.direccion}</p>
            <small class="text-muted">${b.colegio}</small>
          </li>
        `).join('');
        initBibliotecasList();
      })
      .catch(() => {
        bibliotecasList.innerHTML = '<div class="alert alert-danger">Error al cargar las bibliotecas.</div>';
      });
}

function initBibliotecasList() {
  const bibliotecasList = document.getElementById('bibliotecasList');
  const container = document.getElementById('bibliotecaLibros');
  if (!bibliotecasList || !container) return;

  const items = bibliotecasList.querySelectorAll('.list-group-item');
  console.log('📋 bibliotecasItems count:', items.length);

  // Asignar manejador de clic a cada item
  items.forEach(item => {
    console.log('🔗 Adjuntar listener a biblioteca:', item.dataset.id, '->', item.querySelector('h5').textContent);
    item.addEventListener('click', () => {
      // Eliminar 'active' de todos los items antes de asignar al seleccionado
      items.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      cargarLibros(item, container);
    });
  });

  // Confirmar que la inicialización terminó
  console.log('↪ initBibliotecasList completa, items count:', items.length);

  // Auto-cargar la primera biblioteca
  if (items.length > 0) {
    console.log('↪ Auto-cargando primera biblioteca ID:', items[0].dataset.id);
    cargarLibros(items[0], container);
    // Marcar visualmente
    items[0].classList.add('active');
    document.getElementById('defaultMessage').style.display = 'none';
    document.getElementById('detailsContent').style.display = 'block';
  }
}

async function cargarLibros(item, container) {
  const bibliotecaId = item.dataset.id;
  console.log('↪ Cargando libros para biblioteca ID:', bibliotecaId);

  // Mostrar detalles
  const nombre    = item.querySelector('h5').textContent;
  const direccion = item.querySelector('p').textContent; // 1. lee la dirección del DOM

  document.getElementById('bibliotecaTitle').textContent = nombre;
  document.getElementById('detailName').textContent     = nombre;
  document.getElementById('detailAddress').textContent  = direccion;

  showLibraryMap(direccion); // 2. pasa la dirección al mapa

  // Mostrar mensaje de carga…
  container.innerHTML = '<div class="text-center my-3">Cargando libros…</div>';
  try {
    const response = await fetch(`/api/bibliotecas/${bibliotecaId}/libros`);
    console.log('📥 Status respuesta:', response.status);
    const libros = await response.json();
    console.log('📚 Libros recibidos:', libros);

    if (!Array.isArray(libros) || libros.length === 0) {
      container.innerHTML = '<div class="alert alert-warning">No hay libros para esta biblioteca.</div>';
    } else {
      container.innerHTML = libros.map(l => `
        <div class="col-md-4 mb-3">
          <div class="card h-100">
            <img src="${l.imagen_url || '/assets/images/libro-placeholder.jpg'}" class="card-img-top" alt="${l.titulo}">
            <div class="card-body">
              <h6 class="card-title">${l.titulo}</h6>
              <p class="card-text small">${l.autor}</p>
            </div>
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Error cargando libros de la biblioteca:', err);
    container.innerHTML = '<div class="alert alert-danger">Error al cargar libros.</div>';
  }
}

function initBibliotecasSearch() {
  const searchBtn = document.getElementById('searchBtn');
  if (!searchBtn) return;

  searchBtn.addEventListener('click', () => {
    const nombreBusqueda = document.getElementById('searchName').value.toLowerCase();
    const ubicacionBusqueda = document.getElementById('searchLocation').value.toLowerCase();
    const bibliotecasItems = document.querySelectorAll('#bibliotecasList .list-group-item');

    bibliotecasItems.forEach(item => {
      const nombre = item.querySelector('h5').textContent.toLowerCase();
      const ubicacion = item.querySelector('p').textContent.toLowerCase();
      const visible = (nombreBusqueda === '' || nombre.includes(nombreBusqueda))
                    && (ubicacionBusqueda === '' || ubicacion.includes(ubicacionBusqueda));
      item.style.display = visible ? 'block' : 'none';
    });
  });
}

function showLibraryMap(address) {
  const apiKey = 'AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao';
  const base   = 'https://www.google.com/maps/embed/v1/place';
  const url    = `${base}?key=${apiKey}&q=${encodeURIComponent(address)}`;
  document.getElementById('mapIframe').src = url;
}
