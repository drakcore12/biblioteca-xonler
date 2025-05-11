// Módulo para la página de bibliotecas
export default function initBibliotecasPage() {
  console.log('Página de bibliotecas inicializada');
  
  // Manejar clic en elementos de la lista de bibliotecas
  initBibliotecasList();
  
  // Inicializar búsqueda y filtros
  initBibliotecasSearch();
}

// Función para inicializar la lista de bibliotecas
function initBibliotecasList() {
  const bibliotecasList = document.getElementById('bibliotecasList');
  if (!bibliotecasList) return;
  
  const bibliotecasItems = bibliotecasList.querySelectorAll('.list-group-item');
  
  bibliotecasItems.forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      const bibliotecaId = this.getAttribute('data-id');
      
      // Marcar el elemento seleccionado
      bibliotecasItems.forEach(i => i.classList.remove('active'));
      this.classList.add('active');
      
      // Mostrar detalles de la biblioteca seleccionada
      document.getElementById('defaultMessage').style.display = 'none';
      document.getElementById('detailsContent').style.display = 'block';
      
      // Actualizar título con el nombre de la biblioteca
      const bibliotecaNombre = this.querySelector('h5').textContent;
      document.getElementById('bibliotecaTitle').textContent = bibliotecaNombre;
      
      // Aquí se cargarían datos reales de la biblioteca
      document.getElementById('detailName').textContent = bibliotecaNombre;
      document.getElementById('detailAddress').textContent = this.querySelector('p').textContent;
      
      // Simular carga de datos
      console.log(`Cargando datos para biblioteca ID: ${bibliotecaId}`);
    });
  });
}

// Función para inicializar la búsqueda de bibliotecas
function initBibliotecasSearch() {
  const searchBtn = document.getElementById('searchBtn');
  if (!searchBtn) return;
  
  searchBtn.addEventListener('click', function() {
    const nombreBusqueda = document.getElementById('searchName').value.toLowerCase();
    const ubicacionBusqueda = document.getElementById('searchLocation').value.toLowerCase();
    
    const bibliotecasItems = document.querySelectorAll('#bibliotecasList .list-group-item');
    
    bibliotecasItems.forEach(item => {
      const nombre = item.querySelector('h5').textContent.toLowerCase();
      const ubicacion = item.querySelector('p').textContent.toLowerCase();
      
      const coincideNombre = nombre.includes(nombreBusqueda);
      const coincideUbicacion = ubicacion.includes(ubicacionBusqueda);
      
      if ((nombreBusqueda === '' || coincideNombre) && 
          (ubicacionBusqueda === '' || coincideUbicacion)) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
  });
}