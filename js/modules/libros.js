// Módulo para la página de libros
export default function initLibrosPage() {
  console.log('Página de libros inicializada');
  
  // Inicializar la visualización
  initLibrosVisualizacion();
  
  // Inicializar filtros
  initLibrosFiltros();

  // Cargar libros al iniciar la página
  cargarLibros();
}

// Función para cargar libros desde el backend y mostrarlos
function cargarLibros(filtros = {}) {
  const librosGrid = document.getElementById('librosGrid');
  if (!librosGrid) return;

  // Construir la URL con filtros si existen
  let url = '/api/libros';
  const params = [];
  if (filtros.titulo) params.push(`titulo=${encodeURIComponent(filtros.titulo)}`);
  if (filtros.autor) params.push(`autor=${encodeURIComponent(filtros.autor)}`);
  if (filtros.categorias && filtros.categorias.length > 0) params.push(`categorias=${filtros.categorias.join(',')}`);
  if (filtros.disponibilidad) params.push(`disponibilidad=${encodeURIComponent(filtros.disponibilidad)}`);
  if (filtros.biblioteca) params.push(`biblioteca=${encodeURIComponent(filtros.biblioteca)}`);
  if (params.length > 0) url += '?' + params.join('&');

  // Mostrar cargando
  librosGrid.innerHTML = '<div class="text-center my-5">Cargando libros...</div>';

  fetch(url)
    .then(res => res.json())
    .then(libros => {
      if (!Array.isArray(libros) || libros.length === 0) {
        librosGrid.innerHTML = '<div class="alert alert-warning">No se encontraron libros.</div>';
        document.getElementById('resultCount').textContent = 'Mostrando 0 libros';
        return;
      }
      // Renderizar los libros
      librosGrid.innerHTML = libros.map(libro => `
        <div class="col-md-4 mb-4">
          <div class="card h-100">
            <img src="${libro.imagen || 'img/default-book.png'}" class="card-img-top" alt="${libro.titulo}">
            <div class="card-body">
              <h5 class="card-title">${libro.titulo}</h5>
              <p class="card-text">Autor: ${libro.autor}</p>
              <p class="card-text"><small class="text-muted">ISBN: ${libro.isbn || 'N/A'}</small></p>
            </div>
          </div>
        </div>
      `).join('');
      document.getElementById('resultCount').textContent = `Mostrando ${libros.length} libros`;
    })
    .catch(() => {
      librosGrid.innerHTML = '<div class="alert alert-danger">Error al cargar los libros.</div>';
      document.getElementById('resultCount').textContent = 'Mostrando 0 libros';
    });
}

// Función para manejar cambios en la visualización (cuadrícula vs lista)
function initLibrosVisualizacion() {
  const viewGridBtn = document.getElementById('viewGrid');
  const viewListBtn = document.getElementById('viewList');
  const librosGrid = document.getElementById('librosGrid');
  
  if (!viewGridBtn || !viewListBtn || !librosGrid) return;
  
  viewGridBtn.addEventListener('click', function() {
    librosGrid.className = 'row';
    viewGridBtn.classList.add('active');
    viewListBtn.classList.remove('active');
    
    // Cambiar la clase de los items para vista en cuadrícula
    const items = librosGrid.querySelectorAll('.col-md-4, .col-12');
    items.forEach(item => {
      item.className = 'col-md-4 mb-4';
      
      // Restaurar estilo de tarjetas
      const card = item.querySelector('.card');
      if (card) {
        card.className = 'card h-100';
        
        const img = card.querySelector('img');
        if (img) {
          img.className = 'card-img-top';
          img.style.width = '';
          img.style.height = '';
        }
      }
    });
  });
  
  viewListBtn.addEventListener('click', function() {
    librosGrid.className = 'list-view';
    viewListBtn.classList.add('active');
    viewGridBtn.classList.remove('active');
    
    // Cambiar la clase de los items para vista en lista
    const items = librosGrid.querySelectorAll('.col-md-4, .col-12');
    items.forEach(item => {
      item.className = 'col-12 mb-3';
      
      // Reorganizar elementos para vista de lista
      const card = item.querySelector('.card');
      if (card) {
        card.className = 'card flex-row';
        
        const img = card.querySelector('img');
        if (img) {
          img.style.width = '150px';
          img.style.height = 'auto';
        }
      }
    });
  });
}

// Función para inicializar los filtros de libros
function initLibrosFiltros() {
  const applyFiltersBtn = document.getElementById('applyFiltersBtn');
  if (!applyFiltersBtn) return;
  
  applyFiltersBtn.addEventListener('click', function() {
    const titulo = document.getElementById('searchTitle').value.toLowerCase();
    const autor = document.getElementById('searchAuthor').value.toLowerCase();
    const disponibilidad = document.getElementById('disponibilidad').value;
    const biblioteca = document.getElementById('biblioteca').value;
    
    // Categorías seleccionadas
    const categorias = [];
    document.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
      categorias.push(checkbox.value);
    });

    // Llamar a cargarLibros con los filtros seleccionados
    cargarLibros({
      titulo,
      autor,
      categorias,
      disponibilidad,
      biblioteca
    });
  });
}