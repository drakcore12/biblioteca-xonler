// main.js
import { cargaBibliotecas } from './modules/bibliotecas.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1) Detectar la página actual y si es área de admin
  const currentPath = window.location.pathname;
  const currentPage = currentPath.split('/').pop() || 'index.html';
  const isAdmin = currentPath.startsWith('/admin');

  console.log('Página actual:', currentPath, '| Es admin:', isAdmin);

  // 2) Inicializar carga de bibliotecas en todas las páginas que sean bibliotecas
  if (currentPage === 'bibliotecas.html' && !isAdmin) {
    cargaBibliotecas().catch(err =>
      console.error('Error al cargar bibliotecas:', err)
    );
  }

  // 3) Import único de admin.js si estamos en /admin
  if (isAdmin) {
    import('../js/admin/modules/admin.js')
      .then(({ default: initAdmin }) => initAdmin())
      .catch(err =>
        console.error('Error al cargar admin.js:', err)
      );
  }

  // 4) Import de utilidades comunes
  import('./common/utils.js')
    .then(({ default: initUtils }) => initUtils())
    .catch(err =>
      console.error('Error al cargar utils.js:', err)
    );

  // 5) Import de módulo según página
  const pageModules = {
    'index.html': './modules/home.js',
    'libros.html': './modules/libros.js',
    'contacto.html': './modules/contacto.js',
    'login.html': './modules/login.js'
  };

  const modulePath = pageModules[currentPage];
  if (modulePath && !isAdmin) {
    import(modulePath)
      .then(({ default: initPage }) => initPage())
      .catch(err =>
        console.error(`Error al cargar ${currentPage}:`, err)
      );
  }

  // 6) Configuración del modal de detalle de libro
  const modalEl = document.getElementById('bookDetailModal');
  if (modalEl) {
    modalEl.addEventListener('show.bs.modal', async event => {
      const trigger = event.relatedTarget;
      const bookId = trigger?.getAttribute('data-id');
      const titleEl = modalEl.querySelector('.modal-title');
      const authorEl = modalEl.querySelector('#modalBookAuthor');
      const isbnEl = modalEl.querySelector('#modalBookISBN');
      const imgEl = modalEl.querySelector('#modalBookImg');
      const descEl = modalEl.querySelector('#modalBookDescription');

      titleEl.textContent = 'Cargando...';
      authorEl.textContent = '';
      isbnEl.textContent = '';
      imgEl.src = '/assets/images/libro-placeholder.jpg';
      imgEl.alt = 'Portada';
      descEl.textContent = '';

      if (!bookId) return;

      try {
        const res = await fetch(`/api/libros/${bookId}`);
        if (!res.ok) throw new Error('No encontrado');
        const libro = await res.json();
        titleEl.textContent = libro.titulo || 'Sin título';
        authorEl.textContent = libro.autor || 'Desconocido';
        isbnEl.textContent = libro.isbn || 'N/A';
        imgEl.src = libro.imagen_url || imgEl.src;
        imgEl.alt = libro.titulo || 'Portada';
        descEl.textContent = libro.descripcion || 'Sin descripción.';
      } catch (err) {
        titleEl.textContent = 'Error';
        descEl.textContent = err.message;
      }
    });
  }
});
