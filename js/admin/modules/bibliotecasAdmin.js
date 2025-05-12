// js/bibliotecasAdmin.js
// Elimina o comenta esta línea:
// import { Modal } from 'bootstrap';

export default function initBibliotecasAdmin() {
  cargarColegios();
  initFiltroForm();
  cargarTablaBibliotecas(); // carga inicial sin filtros
}

// Carga lista de colegios en el select de filtros y en los formularios de modal
async function cargarColegios() {
  try {
    const res = await fetch('/api/colegios');
    const colegios = await res.json();
    const selFiltro  = document.getElementById('colegio');
    const selAgregar = document.getElementById('nuevaBibliotecaColegio');
    const selEditar  = document.getElementById('editBibliotecaColegio');
    [selFiltro, selAgregar, selEditar].forEach(sel => {
      if (!sel) return;
      sel.innerHTML = '<option value="">Sin filtro</option>';
      colegios.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.nombre;
        sel.appendChild(opt);
      });
    });
  } catch (err) {
    console.error('Error cargando colegios:', err);
  }
}

// Inicia el formulario de filtros
function initFiltroForm() {
  const form = document.getElementById('filtroForm');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const params = new URLSearchParams(new FormData(form));
    cargarTablaBibliotecas(params);
  });
  form.addEventListener('reset', () => {
    // tras limpiar, recarga todo
    setTimeout(() => cargarTablaBibliotecas(), 0);
  });
}

// Carga la tabla de bibliotecas, opcionalmente filtrada
async function cargarTablaBibliotecas(params = new URLSearchParams()) {
  const tbody = document.querySelector('#bibliotecasTable tbody');
  const url = '/api/bibliotecas' + (params.toString() ? `?${params}` : '');
  tbody.innerHTML = '<tr><td colspan="7" class="text-center py-3">Cargando...</td></tr>';
  
  try {
    const res = await fetch(url);
    const bibliotecas = await res.json();
    if (!Array.isArray(bibliotecas) || bibliotecas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center py-3">No se encontraron bibliotecas.</td></tr>';
      return;
    }
    tbody.innerHTML = bibliotecas.map(b => `
      <tr>
        <td>${b.id}</td>
        <td>${b.nombre}</td>
        <td>${b.direccion}</td>
        <td>${b.colegio_nombre}</td>
        <td>${b.libros_disponibles}</td>
        <td>${b.prestamos_activos}</td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary" data-bs-toggle="modal"
                    data-bs-target="#verBibliotecaModal" data-id="${b.id}" title="Ver">
              <i class="bi bi-eye"></i>
            </button>
            <button class="btn btn-outline-secondary" data-bs-toggle="modal"
                    data-bs-target="#editarBibliotecaModal" data-id="${b.id}" title="Editar">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-outline-danger" data-id="${b.id}" title="Eliminar">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
    
    // Aquí podrías asignar listeners para ver/editar/eliminar...
  } catch (err) {
    console.error('Error al cargar bibliotecas:', err);
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error cargando datos.</td></tr>';
  }
}

// Cuando necesites usar Modal, usa:
document
  .querySelectorAll('button[data-bs-target="#verBibliotecaModal"]')
  .forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      // 1) Obtén el elemento del modal
      const modalEl = document.getElementById('verBibliotecaModal');
      // 2) Carga los detalles desde la API
      const res = await fetch(`/api/bibliotecas/${id}`);
      const b = await res.json();
      // 3) Rellena los campos del modal (ajusta ids según tu HTML)
      modalEl.querySelector('#verBibliotecaModalLabel').textContent = b.nombre;
      modalEl.querySelector('.modal-body p#modalDireccion').textContent = b.direccion;
      modalEl.querySelector('.modal-body p#modalColegio').textContent = b.colegio_nombre;
      // ... más asignaciones ...
      // 4) Inicializa/abre con Bootstrap
      const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
      modal.show();
    });
  });

// Llama a la función de inicialización automáticamente al cargar el módulo
initBibliotecasAdmin();
