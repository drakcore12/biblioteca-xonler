import { cargaBibliotecas } from './modules/bibliotecas.js';
import initUtils from './common/utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    const isAdmin = window.location.pathname.startsWith('/admin');

    // Utils siempre
    initUtils();

    // Si página es bibliotecas
    if (path === 'bibliotecas.html' && !isAdmin) {
        cargaBibliotecas().catch(console.error);
    }

    // Cargar módulo según página
    const map = {
        'index.html': './modules/home.js',
        'libros.html': './modules/libros.js',
        'contacto.html': './modules/contacto.js',
        'login.html': './modules/login.js'
    };
    if (map[path] && !isAdmin) {
        import(map[path])
            .then(m => m.default())
            .catch(console.error);
    }

    // Si es admin
    if (isAdmin) {
        import('../js/admin/modules/admin.js')
            .then(m => m.default())
            .catch(console.error);
    }

    // Modal de libro
    const modalEl = document.getElementById('bookDetailModal');
    if (modalEl) {
        modalEl.addEventListener('show.bs.modal', async e => {
            const id = e.relatedTarget?.dataset.id;
            const title = modalEl.querySelector('.modal-title');
            const author = modalEl.querySelector('#modalBookAuthor');
            const isbn = modalEl.querySelector('#modalBookISBN');
            const img = modalEl.querySelector('#modalBookImg');
            const desc = modalEl.querySelector('#modalBookDescription');
            title.textContent = 'Cargando...';
            author.textContent = isbn.textContent = '';
            img.src = '/assets/images/libro-placeholder.jpg';
            desc.textContent = '';
            if (!id) return;
            try {
                const r = await fetch(`/api/libros/${id}`);
                if (!r.ok) throw new Error('No encontrado');
                const lib = await r.json();
                title.textContent = lib.titulo;
                author.textContent = lib.autor;
                isbn.textContent = lib.isbn;
                img.src = lib.imagen_url;
                desc.textContent = lib.descripcion;
            } catch (err) {
                title.textContent = 'Error';
                desc.textContent = err.message;
            }
        });
    }
});
