// js/frontend/libros.js

// Módulo para la página de libros
export default function initLibrosPage() {
  console.log('Página de libros inicializada');

  // Inicializar la visualización
  initLibrosVisualizacion();

  // Inicializar filtros y cargar bibliotecas
  initLibrosFiltros();

  // Cargar libros al iniciar la página
  cargarLibros();
}

// Estado global para paginación
let allBooks = [];
const pageSize = 9;
let currentPage = 1;

// Función principal para cargar libros desde el backend y mostrarlos (con filtros opcionales)
function cargarLibros(filtros = {}) {
  const librosGrid = document.getElementById('librosGrid');
  if (!librosGrid) return;

  // Construir URL con query params según filtros
  let url = '/api/libros';
  const params = [];
  if (filtros.titulo) params.push(`titulo=${encodeURIComponent(filtros.titulo)}`);
  if (filtros.autor) params.push(`autor=${encodeURIComponent(filtros.autor)}`);
  if (filtros.categorias?.length) params.push(`categorias=${filtros.categorias.join(',')}`);
  if (filtros.disponibilidad) params.push(`disponibilidad=${encodeURIComponent(filtros.disponibilidad)}`);
  if (filtros.biblioteca) params.push(`biblioteca=${encodeURIComponent(filtros.biblioteca)}`);
  if (params.length) url += '?' + params.join('&');

  // Mostrar loader
  librosGrid.innerHTML = '<div class="text-center my-5">Cargando libros...</div>';
  const resultCount = document.getElementById('resultCount');
  if (resultCount) resultCount.textContent = '';

  fetch(url)
    .then(res => res.json())
    .then(libros => {
      if (!Array.isArray(libros) || !libros.length) {
        librosGrid.innerHTML = '<div class="alert alert-warning">No se encontraron libros.</div>';
        if (resultCount) resultCount.textContent = 'Mostrando 0 libros';
        const pagination = document.getElementById('pagination');
        if (pagination) pagination.innerHTML = '';
        return;
      }
      allBooks = libros;
      currentPage = 1;
      renderBooksPage();
    })
    .catch(err => {
      console.error('Error al cargar libros:', err);
      librosGrid.innerHTML = '<div class="alert alert-danger">Error al cargar los libros.</div>';
      if (resultCount) resultCount.textContent = 'Mostrando 0 libros';
      const pagination = document.getElementById('pagination');
      if (pagination) pagination.innerHTML = '';
    });
}

// Renderiza una página de libros
function renderBooksPage() {
  const librosGrid = document.getElementById('librosGrid');
  const start = (currentPage - 1) * pageSize;
  const pageItems = allBooks.slice(start, start + pageSize);

  librosGrid.innerHTML = '';
  pageItems.forEach(libro => {
    const col = document.createElement('div');
    col.className = 'col-md-4 mb-4';
    col.innerHTML = `
      <div class="card h-100 book-card"
           data-bs-toggle="modal"
           data-bs-target="#bookDetailModal"
           data-id="${libro.id}"
           style="cursor:pointer;">
        <img src="${libro.imagen_url || '/assets/images/libro-placeholder.jpg'}"
             class="card-img-top"
             alt="${libro.titulo}">
        <div class="card-body">
          <h5 class="card-title">${libro.titulo}</h5>
          <p class="card-text">Autor: ${libro.autor}</p>
          <p class="card-text"><small class="text-muted">ISBN: ${libro.isbn || 'N/A'}</small></p>
          <span class="badge bg-secondary">${libro.categoria}</span>
        </div>
        <div class="card-footer">
          <small class="text-${libro.disponibilidad ? 'success' : 'danger'}">
            ${libro.disponibilidad ? 'Disponible' : 'Prestado'}
          </small>
        </div>
      </div>
    `;
    librosGrid.appendChild(col);
  });

  renderPagination();
  const resultCount = document.getElementById('resultCount');
  if (resultCount) resultCount.textContent = `Mostrando ${pageItems.length} de ${allBooks.length} libros`;
}

// Paginación simple
function renderPagination() {
  const totalPages = Math.ceil(allBooks.length / pageSize);
  const pagination = document.getElementById('pagination');
  if (!pagination) return;
  pagination.innerHTML = '';

  const makeLi = (label, disabled, onClick) => {
    const li = document.createElement('li');
    li.className = `page-item ${disabled ? 'disabled' : ''}`;
    li.innerHTML = `<a class="page-link" href="#">${label}</a>`;
    if (!disabled) li.onclick = onClick;
    return li;
  };

  // Anterior
  pagination.appendChild(makeLi('Anterior', currentPage === 1, e => {
    e.preventDefault(); currentPage--; renderBooksPage();
  }));

  // Números
  for (let p = 1; p <= totalPages; p++) {
    pagination.appendChild(makeLi(p, p === currentPage, e => {
      e.preventDefault(); currentPage = p; renderBooksPage();
    }));
  }

  // Siguiente
  pagination.appendChild(makeLi('Siguiente', currentPage === totalPages, e => {
    e.preventDefault(); currentPage++; renderBooksPage();
  }));
}

// Modo vista grid/list
function initLibrosVisualizacion() {
  const viewGridBtn = document.getElementById('viewGrid');
  const viewListBtn = document.getElementById('viewList');
  const librosGrid  = document.getElementById('librosGrid');
  if (!viewGridBtn || !viewListBtn || !librosGrid) return;

  viewGridBtn.onclick = () => {
    librosGrid.className = 'row';
    viewGridBtn.classList.add('active');
    viewListBtn.classList.remove('active');
  };
  viewListBtn.onclick = () => {
    librosGrid.className = 'list-view';
    viewListBtn.classList.add('active');
    viewGridBtn.classList.remove('active');
  };
}

// Carga bibliotecas dinámicamente
function cargarBibliotecasEnSelect() {
  const sel = document.getElementById('biblioteca');
  if (!sel) return;
  sel.innerHTML = '<option value="todas">Todas las bibliotecas</option>';
  fetch('/api/bibliotecas')
    .then(r => r.json())
    .then(bibs => bibs.forEach(b => {
      const o = document.createElement('option');
      o.value = b.id; o.textContent = b.nombre;
      sel.appendChild(o);
    }))
    .catch(err => console.error('Error libs:', err));
}

// Inicializar filtros y manejar envío
function initLibrosFiltros() {
  cargarBibliotecasEnSelect();
  const btn = document.getElementById('applyFiltersBtn');
  const titulo = document.getElementById('searchTitle');
  const autor  = document.getElementById('searchAuthor');
  const disp   = document.getElementById('disponibilidad');
  const bib    = document.getElementById('biblioteca');
  const cats   = ['catFiccion','catCiencia','catHistoria','catLiteratura','catOtro']
                    .map(id => document.getElementById(id));

  btn.onclick = () => {
    const filters = {};
    if (titulo.value) filters.titulo = titulo.value.trim();
    if (autor.value)  filters.autor  = autor.value.trim();
    const selCats = cats.filter(c=>c.checked).map(c=>c.value);
    if (selCats.length) filters.categorias = selCats;
    if (disp.value !== 'todos') filters.disponibilidad = disp.value;
    if (bib.value !== 'todas') filters.biblioteca = bib.value;
    cargarLibros(filters);
  };
}

// Modal detalles libro
document.addEventListener('DOMContentLoaded', () => {
  const modalEl = document.getElementById('bookDetailModal');
  if (!modalEl) return;

  modalEl.addEventListener('show.bs.modal', async e => {
    const id = e.relatedTarget.getAttribute('data-id');
    const fields = {
      title: modalEl.querySelector('.modal-title'),
      author: modalEl.querySelector('#modalBookAuthor'),
      isbn: modalEl.querySelector('#modalBookISBN'),
      img: modalEl.querySelector('#modalBookImg'),
      desc: modalEl.querySelector('#modalBookDescription'),
      cat: modalEl.querySelector('#modalBookCategory'),
      avail: modalEl.querySelector('#modalBookAvailability')
    };

    Object.values(fields).forEach(f => { if(f) f.textContent=''; });
    fields.img.src = '/assets/images/libro-placeholder.jpg';

    try {
      const r = await fetch(`/api/libros/${id}`);
      if(!r.ok) throw new Error(r.status);
      const b = await r.json();
      fields.title.textContent = b.titulo;
      fields.author.textContent= b.autor;
      fields.isbn.textContent  = b.isbn||'N/A';
      fields.img.src           = b.imagen_url||fields.img.src;
      fields.desc.textContent  = b.descripcion||'Sin descripción.';
      fields.cat.textContent   = b.categoria;
      fields.avail.textContent = b.disponibilidad?'Disponible':'Prestado';
    } catch(err) {
      console.error('Modal err:', err);
      fields.title.textContent='Error';
      fields.desc.textContent='No se pudo cargar.';
    }
  });

  modalEl.addEventListener('shown.bs.modal', ()=>{
    modalEl.querySelector('.btn-close')?.blur();
  });
  modalEl.addEventListener('hidden.bs.modal', ()=>{
    modalEl.querySelector('.btn-close')?.blur();
  });
});
