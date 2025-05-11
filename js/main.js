// Punto de entrada principal para cargar los módulos JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // Detectar la página actual basada en la URL
  const currentPath = window.location.pathname;
  const currentPage = currentPath.split('/').pop() || 'index.html';
  const isAdmin = currentPath.includes('/admin/');
  
  console.log('Página actual:', currentPage, '| Es admin:', isAdmin);
  
  // Cargar módulos comunes para todas las páginas
  import('./common/utils.js')
    .then(module => {
      module.default();
    })
    .catch(error => console.error('Error al cargar utils.js:', error));
  
  // Cargar el módulo específico para el área de administración si es necesario
  if (isAdmin) {
    import('./modules/admin.js')
      .then(module => {
        module.default();
      })
      .catch(error => console.error('Error al cargar admin.js:', error));
      
    // Manejar casos específicos para páginas de administración
    if (currentPage === 'login.html') {
      // Página de login específica para administradores
      console.log('Cargando módulo de login de administrador');
    }
  }
  
  // Cargar el módulo específico para la página actual
  switch(currentPage) {
    case 'index.html':
      // No cargar home.js si estamos en el panel de administración
      if (!isAdmin) {
        import('./modules/home.js')
          .then(module => {
            module.default();
          })
          .catch(error => console.error('Error al cargar home.js:', error));
      }
      break;
    case 'bibliotecas.html':
      import('./modules/bibliotecas.js')
        .then(module => {
          module.default();
        })
        .catch(error => console.error('Error al cargar bibliotecas.js:', error));
      break;
    case 'libros.html':
      import('./modules/libros.js')
        .then(module => {
          module.default();
        })
        .catch(error => console.error('Error al cargar libros.js:', error));
      break;
    case 'contacto.html':
      import('./modules/contacto.js')
        .then(module => {
          module.default();
        })
        .catch(error => console.error('Error al cargar contacto.js:', error));
      break;
    case 'login.html':
      // Solo cargar el módulo de login para usuarios si no estamos en el área de administración
      if (!isAdmin) {
        import('./modules/login.js')
          .then(module => {
            module.default();
          })
          .catch(error => console.error('Error al cargar login.js:', error));
      }
      break;
  }
});