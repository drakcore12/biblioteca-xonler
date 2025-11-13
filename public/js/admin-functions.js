// Funciones adicionales para el admin dashboard

// Variables globales (si no están definidas)
let librosPaginacion = { current: 1, total: 0, limit: 20 };
if (typeof globalThis !== 'undefined') {
  if (globalThis.librosPaginacion === undefined) {
    globalThis.librosPaginacion = librosPaginacion;
  } else {
    librosPaginacion = globalThis.librosPaginacion;
  }
}

let prestamosPaginacion = { current: 1, total: 0, limit: 20 };
if (typeof globalThis !== 'undefined') {
  if (globalThis.prestamosPaginacion === undefined) {
    globalThis.prestamosPaginacion = prestamosPaginacion;
  } else {
    prestamosPaginacion = globalThis.prestamosPaginacion;
  }
}

let prestamosChart;

// Funciones de utilidad
function mostrarLoading(mostrar = true) {
  const spinner = document.getElementById('loading-spinner');
  if (spinner) {
    spinner.style.display = mostrar ? 'block' : 'none';
  }
}

function mostrarError(mensaje) {
  const errorDiv = document.getElementById('error-message');
  const errorText = document.getElementById('error-text');
  if (errorDiv && errorText) {
    errorText.textContent = mensaje;
    errorDiv.style.display = 'block';
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 5000);
  }
}

// Cargar libros
async function cargarLibros(filtros = {}) {
  try {
    mostrarLoading(true);
    
    const response = await adminBibliotecaService.obtenerLibros({
      ...filtros,
      limit: librosPaginacion.limit,
      offset: (librosPaginacion.current - 1) * librosPaginacion.limit
    });

    librosPaginacion.total = response.paginacion.total;
    mostrarTablaLibros(response.data);
    mostrarPaginacionLibros();

  } catch (error) {
    console.error('Error cargando libros:', error);
    mostrarError('Error cargando libros: ' + error.message);
  } finally {
    mostrarLoading(false);
  }
}

// Mostrar tabla de libros
function mostrarTablaLibros(libros) {
  const tbody = document.querySelector('#libros-table tbody');
  
  if (libros.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay libros en tu biblioteca</td></tr>';
    return;
  }

  tbody.innerHTML = libros.map(libro => `
    <tr>
      <td>
        <div class="d-flex align-items-center">
          <img src="${libro.imagen_url || '/assets/images/libro-placeholder.jpg'}" 
               class="me-3" style="width: 40px; height: 60px; object-fit: cover;">
          <div>
            <h6 class="mb-0">${libro.titulo}</h6>
            <small class="text-muted">${libro.isbn || 'Sin ISBN'}</small>
          </div>
        </div>
      </td>
      <td>${libro.autor}</td>
      <td><span class="badge bg-secondary">${libro.categoria}</span></td>
      <td>
        <span class="badge bg-${libro.disponible ? 'success' : 'warning'}">
          ${libro.disponible ? 'Disponible' : 'Prestado'}
        </span>
      </td>
      <td>${libro.total_prestamos}</td>
      <td>
        <button class="btn btn-sm btn-outline-danger" 
                onclick="confirmarRemoverLibro(${libro.biblioteca_libro_id}, '${libro.titulo}')">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// Mostrar paginación de libros
function mostrarPaginacionLibros() {
  const container = document.getElementById('pagination-libros');
  const totalPages = Math.ceil(librosPaginacion.total / librosPaginacion.limit);
  
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let pagination = '<li class="page-item' + (librosPaginacion.current === 1 ? ' disabled' : '') + '">';
  pagination += '<a class="page-link" href="#" onclick="cambiarPaginaLibros(' + (librosPaginacion.current - 1) + ')">Anterior</a></li>';

  for (let i = 1; i <= totalPages; i++) {
    if (i === librosPaginacion.current) {
      pagination += '<li class="page-item active"><span class="page-link">' + i + '</span></li>';
    } else {
      pagination += '<li class="page-item"><a class="page-link" href="#" onclick="cambiarPaginaLibros(' + i + ')">' + i + '</a></li>';
    }
  }

  pagination += '<li class="page-item' + (librosPaginacion.current === totalPages ? ' disabled' : '') + '">';
  pagination += '<a class="page-link" href="#" onclick="cambiarPaginaLibros(' + (librosPaginacion.current + 1) + ')">Siguiente</a></li>';

  container.innerHTML = pagination;
}

// Cambiar página de libros
function cambiarPaginaLibros(pagina) {
  if (pagina < 1 || pagina > Math.ceil(librosPaginacion.total / librosPaginacion.limit)) return;
  librosPaginacion.current = pagina;
  cargarLibros();
}

// Filtrar libros
function filtrarLibros() {
  const filtros = {
    q: document.getElementById('filtro-busqueda').value,
    categoria: document.getElementById('filtro-categoria').value,
    disponibilidad: document.getElementById('filtro-disponibilidad').value
  };
  librosPaginacion.current = 1;
  cargarLibros(filtros);
}

// Cargar préstamos
async function cargarPrestamos(filtros = {}) {
  try {
    mostrarLoading(true);
    
    const response = await adminBibliotecaService.obtenerPrestamos({
      ...filtros,
      limit: prestamosPaginacion.limit,
      offset: (prestamosPaginacion.current - 1) * prestamosPaginacion.limit
    });

    prestamosPaginacion.total = response.paginacion.total;
    mostrarTablaPrestamos(response.data);
    mostrarPaginacionPrestamos();

  } catch (error) {
    console.error('Error cargando préstamos:', error);
    mostrarError('Error cargando préstamos: ' + error.message);
  } finally {
    mostrarLoading(false);
  }
}

// Mostrar tabla de préstamos
function mostrarTablaPrestamos(prestamos) {
  const tbody = document.querySelector('#prestamos-table tbody');
  
  if (prestamos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay préstamos</td></tr>';
    return;
  }

  tbody.innerHTML = prestamos.map(prestamo => {
    const estado = adminBibliotecaService.obtenerEstadoPrestamo(prestamo);
    const isDevuelto = Boolean(prestamo.fecha_devolucion);
    const accionHtml = isDevuelto
      ? '<span class="text-muted">Devuelto</span>'
      : `<button class="btn btn-sm btn-success" onclick="marcarDevuelto(${prestamo.id})">
              <i class="bi bi-check-circle"></i> Marcar Devuelto
            </button>`;
    return `
      <tr>
        <td>${prestamo.usuario_nombre}</td>
        <td>${prestamo.libro_titulo}</td>
        <td>${adminBibliotecaService.formatearFecha(prestamo.fecha_prestamo)}</td>
        <td>${adminBibliotecaService.formatearFecha(prestamo.fecha_devolucion)}</td>
        <td><span class="badge bg-${estado.clase}">${estado.texto}</span></td>
        <td>
          ${accionHtml}
        </td>
      </tr>
    `;
  }).join('');
}

// Mostrar paginación de préstamos
function mostrarPaginacionPrestamos() {
  const container = document.getElementById('pagination-prestamos');
  const totalPages = Math.ceil(prestamosPaginacion.total / prestamosPaginacion.limit);
  
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let pagination = '<li class="page-item' + (prestamosPaginacion.current === 1 ? ' disabled' : '') + '">';
  pagination += '<a class="page-link" href="#" onclick="cambiarPaginaPrestamos(' + (prestamosPaginacion.current - 1) + ')">Anterior</a></li>';

  for (let i = 1; i <= totalPages; i++) {
    if (i === prestamosPaginacion.current) {
      pagination += '<li class="page-item active"><span class="page-link">' + i + '</span></li>';
    } else {
      pagination += '<li class="page-item"><a class="page-link" href="#" onclick="cambiarPaginaPrestamos(' + i + ')">' + i + '</a></li>';
    }
  }

  pagination += '<li class="page-item' + (prestamosPaginacion.current === totalPages ? ' disabled' : '') + '">';
  pagination += '<a class="page-link" href="#" onclick="cambiarPaginaPrestamos(' + (prestamosPaginacion.current + 1) + ')">Siguiente</a></li>';

  container.innerHTML = pagination;
}

// Cambiar página de préstamos
function cambiarPaginaPrestamos(pagina) {
  if (pagina < 1 || pagina > Math.ceil(prestamosPaginacion.total / prestamosPaginacion.limit)) return;
  prestamosPaginacion.current = pagina;
  cargarPrestamos();
}

// Filtrar préstamos
function filtrarPrestamos() {
  const filtros = {
    estado: document.getElementById('filtro-estado-prestamos').value
  };
  prestamosPaginacion.current = 1;
  cargarPrestamos(filtros);
}

// Cargar estadísticas
async function cargarEstadisticas() {
  try {
    mostrarLoading(true);
    
    const stats = await adminBibliotecaService.obtenerEstadisticas();
    
    // Crear gráfico de préstamos por mes
    crearGraficoPrestamos(stats.prestamos_mensuales || []);
    
    // Mostrar libros populares
    mostrarLibrosPopulares(stats.libros_populares || []);

  } catch (error) {
    console.error('Error cargando estadísticas:', error);
    mostrarError('Error cargando estadísticas: ' + error.message);
  } finally {
    mostrarLoading(false);
  }
}

// Crear gráfico de préstamos
function crearGraficoPrestamos(datos) {
  const ctx = document.getElementById('prestamosChart').getContext('2d');
  
  if (prestamosChart) {
    prestamosChart.destroy();
  }

  const labels = datos.map(d => new Date(d.mes).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }));
  const values = datos.map(d => d.cantidad);

  prestamosChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Préstamos',
        data: values,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// Mostrar libros populares
function mostrarLibrosPopulares(libros) {
  const container = document.getElementById('libros-populares');
  
  if (libros.length === 0) {
    container.innerHTML = '<p class="text-muted">No hay datos disponibles</p>';
    return;
  }

  container.innerHTML = libros.map((libro, index) => `
    <div class="d-flex justify-content-between align-items-center mb-2">
      <div>
        <h6 class="mb-0">${index + 1}. ${libro.titulo}</h6>
        <small class="text-muted">${libro.autor}</small>
      </div>
      <span class="badge bg-primary">${libro.total_prestamos}</span>
    </div>
  `).join('');
}

// Cargar información de biblioteca
async function cargarBiblioteca() {
  try {
    mostrarLoading(true);
    
    const biblioteca = await adminBibliotecaService.obtenerBibliotecaAsignada();
    
    const container = document.getElementById('biblioteca-detalles');
    container.innerHTML = `
      <div class="row">
        <div class="col-md-6">
          <h5>Información General</h5>
          <table class="table table-borderless">
            <tr>
              <td><strong>Nombre:</strong></td>
              <td>${biblioteca.nombre}</td>
            </tr>
            <tr>
              <td><strong>Dirección:</strong></td>
              <td>${biblioteca.direccion || 'No especificada'}</td>
            </tr>
            <tr>
              <td><strong>Institución:</strong></td>
              <td>${biblioteca.colegio_nombre}</td>
            </tr>
            <tr>
              <td><strong>Dirección Institución:</strong></td>
              <td>${biblioteca.colegio_direccion}</td>
            </tr>
          </table>
        </div>
        <div class="col-md-6">
          <h5>Estadísticas Rápidas</h5>
          <div class="row text-center">
            <div class="col-6">
              <div class="card bg-light">
                <div class="card-body">
                  <h3 class="text-primary" id="total-libros-biblio">-</h3>
                  <p class="mb-0">Libros</p>
                </div>
              </div>
            </div>
            <div class="col-6">
              <div class="card bg-light">
                <div class="card-body">
                  <h3 class="text-success" id="prestamos-activos-biblio">-</h3>
                  <p class="mb-0">Préstamos Activos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Cargar estadísticas para mostrar en la vista de biblioteca
    const stats = await adminBibliotecaService.obtenerEstadisticas();
    document.getElementById('total-libros-biblio').textContent = stats.estadisticas.total_libros || 0;
    document.getElementById('prestamos-activos-biblio').textContent = stats.estadisticas.prestamos_activos || 0;

  } catch (error) {
    console.error('Error cargando biblioteca:', error);
    mostrarError('Error cargando información de biblioteca: ' + error.message);
  } finally {
    mostrarLoading(false);
  }
}

// Mostrar modal para agregar libro
function mostrarModalAgregarLibro() {
  const modal = new bootstrap.Modal(document.getElementById('modalAgregarLibro'));
  modal.show();
  
  // Limpiar búsqueda anterior
  document.getElementById('buscar-libro-input').value = '';
  document.getElementById('resultados-busqueda-libros').innerHTML = '';
  
  // Configurar búsqueda en tiempo real
  document.getElementById('buscar-libro-input').addEventListener('input', buscarLibrosParaAgregar);
}

// Buscar libros para agregar
async function buscarLibrosParaAgregar() {
  const query = document.getElementById('buscar-libro-input').value.trim();
  const container = document.getElementById('resultados-busqueda-libros');
  
  if (query.length < 2) {
    container.innerHTML = '';
    return;
  }

  try {
    const response = await adminBibliotecaService.obtenerTodosLosLibros({ q: query, limit: 10 });
    
    if (response.data.length === 0) {
      container.innerHTML = '<p class="text-muted">No se encontraron libros</p>';
      return;
    }

    container.innerHTML = response.data.map(libro => `
      <div class="card mb-2">
        <div class="card-body">
          <div class="row align-items-center">
            <div class="col-md-8">
              <h6 class="mb-1">${libro.titulo}</h6>
              <p class="mb-1 text-muted">${libro.autor}</p>
              <small class="text-muted">${libro.categoria} • ${libro.isbn || 'Sin ISBN'}</small>
            </div>
            <div class="col-md-4 text-end">
              <button class="btn btn-primary btn-sm" onclick="agregarLibroABiblioteca(${libro.id})">
                <i class="bi bi-plus-circle me-1"></i>Agregar
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error('Error buscando libros:', error);
    container.innerHTML = '<p class="text-danger">Error buscando libros</p>';
  }
}

// Agregar libro a la biblioteca
async function agregarLibroABiblioteca(libroId) {
  try {
    await adminBibliotecaService.agregarLibro(libroId);
    
    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalAgregarLibro'));
    modal.hide();
    
    // Recargar lista de libros si estamos en esa sección
    if (document.getElementById('libros-section').style.display !== 'none') {
      cargarLibros();
    }
    
    // Mostrar mensaje de éxito
    alert('Libro agregado exitosamente a la biblioteca');
    
  } catch (error) {
    console.error('Error agregando libro:', error);
    alert('Error agregando libro: ' + error.message);
  }
}

// Confirmar remover libro
function confirmarRemoverLibro(bibliotecaLibroId, titulo) {
  document.getElementById('mensaje-confirmacion').textContent = 
    `¿Estás seguro de que quieres remover "${titulo}" de tu biblioteca?`;
  
  document.getElementById('btn-confirmar-accion').onclick = () => removerLibroDeBiblioteca(bibliotecaLibroId);
  
  const modal = new bootstrap.Modal(document.getElementById('modalConfirmacion'));
  modal.show();
}

// Remover libro de la biblioteca
async function removerLibroDeBiblioteca(bibliotecaLibroId) {
  try {
    await adminBibliotecaService.removerLibro(bibliotecaLibroId);
    
    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalConfirmacion'));
    modal.hide();
    
    // Recargar lista de libros
    cargarLibros();
    
    // Mostrar mensaje de éxito
    alert('Libro removido exitosamente de la biblioteca');
    
  } catch (error) {
    console.error('Error removiendo libro:', error);
    alert('Error removiendo libro: ' + error.message);
  }
}

// Marcar préstamo como devuelto
async function marcarDevuelto(prestamoId) {
  try {
    await adminBibliotecaService.marcarPrestamoDevuelto(prestamoId);
    
    // Recargar lista de préstamos
    cargarPrestamos();
    
    // Mostrar mensaje de éxito
    alert('Préstamo marcado como devuelto exitosamente');
    
  } catch (error) {
    console.error('Error marcando préstamo como devuelto:', error);
    alert('Error marcando préstamo como devuelto: ' + error.message);
  }
}

// Cargar categorías para filtros
async function cargarCategorias() {
  try {
    const categorias = await adminBibliotecaService.obtenerCategorias();
    const select = document.getElementById('filtro-categoria');
    
    if (select) {
      select.innerHTML = '<option value="">Todas las categorías</option>' +
        categorias.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    }
  } catch (error) {
    console.error('Error cargando categorías:', error);
  }
}

// ===== FUNCIONES ADICIONALES PARA PÁGINAS SEPARADAS =====

// Función para actualizar libro (usada en libros.html)
async function actualizarLibro(libroId, datos) {
  try {
    // Esta función debería implementarse en el backend
    // Por ahora, simulamos la actualización
    console.log('Actualizando libro:', libroId, datos);
    alert('Funcionalidad de actualización de libros pendiente de implementar');
  } catch (error) {
    console.error('Error actualizando libro:', error);
    alert('Error actualizando libro: ' + error.message);
  }
}

// Función para crear préstamo (usada en prestamos.html)
async function crearPrestamo(datos) {
  try {
    // Esta función debería implementarse en el backend
    // Por ahora, simulamos la creación
    console.log('Creando préstamo:', datos);
    alert('Funcionalidad de creación de préstamos pendiente de implementar');
  } catch (error) {
    console.error('Error creando préstamo:', error);
    alert('Error creando préstamo: ' + error.message);
  }
}

// Función para buscar usuarios (usada en prestamos.html)
async function buscarUsuarios(query) {
  try {
    // Esta función debería implementarse en el backend
    // Por ahora, simulamos la búsqueda
    console.log('Buscando usuarios:', query);
    return [];
  } catch (error) {
    console.error('Error buscando usuarios:', error);
    return [];
  }
}

// Función para exportar estadísticas (usada en estadisticas.html)
function exportarEstadisticas() {
  try {
    // Crear un objeto con las estadísticas actuales
    const stats = {
      totalLibros: document.getElementById('total-libros')?.textContent || '0',
      prestamosActivos: document.getElementById('prestamos-activos')?.textContent || '0',
      totalPrestamos: document.getElementById('total-prestamos')?.textContent || '0',
      usuariosUnicos: document.getElementById('usuarios-unicos')?.textContent || '0',
      fechaExportacion: new Date().toLocaleString('es-ES')
    };

    // Crear y descargar archivo JSON
    const dataStr = JSON.stringify(stats, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `estadisticas-biblioteca-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  } catch (error) {
    console.error('Error exportando estadísticas:', error);
    alert('Error exportando estadísticas: ' + error.message);
  }
}
