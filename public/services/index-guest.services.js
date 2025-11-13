// Servicio para la página principal como invitado
export function initIndexGuestPage() {
  console.log('Página principal (invitado) inicializada');
  
  // Mostrar mensaje de bienvenida
  mostrarMensajeBienvenida();
  
  // Configurar eventos de navegación
  setupNavigationEvents();
  
  // Configurar botones de acción
  setupActionButtons();
}

// Mostrar mensaje de bienvenida
function mostrarMensajeBienvenida() {
  const mainSection = document.querySelector('main section:first-child');
  if (!mainSection) return;
  
  // Verificar si ya existe un mensaje
  if (mainSection.querySelector('.welcome-alert')) return;
  
  const welcomeAlert = document.createElement('div');
  welcomeAlert.className = 'alert alert-info alert-dismissible fade show welcome-alert mb-4';
  welcomeAlert.innerHTML = `
    <i class="bi bi-info-circle me-2"></i>
    <strong>¡Bienvenido a Xonler!</strong> Explora nuestras bibliotecas y descubre miles de libros. 
    Para acceder al catálogo completo y realizar préstamos, 
    <a href="/pages/guest/login.html" class="alert-link">inicia sesión</a> o 
    <a href="/pages/guest/login.html" class="alert-link">crea una cuenta</a>.
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  // Insertar después del título principal
  const title = mainSection.querySelector('h2');
  if (title) {
    title.parentNode.insertBefore(welcomeAlert, title.nextSibling);
  }
  
  // Auto-remover después de 15 segundos
  setTimeout(() => {
    if (welcomeAlert.parentNode) {
      welcomeAlert.remove();
    }
  }, 15000);
}

// Configurar eventos de navegación
function setupNavigationEvents() {
  // Navegación del header
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
  for (const link of navLinks) {
    link.addEventListener('click', (e) => {
      // Remover clase active de todos los links
      for (const l of navLinks) {
        l.classList.remove('active');
      }
      // Agregar clase active al link clickeado
      link.classList.add('active');
    });
  }
  
  // Navegación de acceso rápido
  const quickAccessLinks = document.querySelectorAll('.list-group-item a');
  for (const link of quickAccessLinks) {
    link.addEventListener('click', (e) => {
      // Agregar efecto visual al hacer clic
      link.style.transform = 'scale(0.95)';
      setTimeout(() => {
        link.style.transform = '';
      }, 150);
    });
  }
}

// Configurar botones de acción
function setupActionButtons() {
  // Botón de inicio de sesión principal
  const loginBtn = document.querySelector('a[href="login.html"]');
  if (loginBtn) {
    loginBtn.addEventListener('click', (e) => {
      // Agregar efecto de carga
      const originalText = loginBtn.textContent;
      loginBtn.textContent = 'Redirigiendo...';
      loginBtn.disabled = true;
      
      // Simular delay de navegación
      setTimeout(() => {
        loginBtn.textContent = originalText;
        loginBtn.disabled = false;
      }, 1000);
    });
  }
  
  // Botón de contacto
  const contactBtn = document.querySelector('a[href="contacto.html"]');
  if (contactBtn) {
    contactBtn.addEventListener('click', (e) => {
      // Agregar efecto de carga
      const originalText = contactBtn.textContent;
      contactBtn.textContent = 'Abriendo...';
      contactBtn.disabled = true;
      
      // Simular delay de navegación
      setTimeout(() => {
        contactBtn.textContent = originalText;
        contactBtn.disabled = false;
      }, 1000);
    });
  }
  
  // Botón de bibliotecas
  const bibliotecasBtn = document.querySelector('a[href="bibliotecas.html"]');
  if (bibliotecasBtn) {
    bibliotecasBtn.addEventListener('click', (e) => {
      // Agregar efecto de carga
      const originalText = bibliotecasBtn.textContent;
      bibliotecasBtn.textContent = 'Abriendo...';
      bibliotecasBtn.disabled = true;
      
      // Simular delay de navegación
      setTimeout(() => {
        bibliotecasBtn.textContent = originalText;
        bibliotecasBtn.disabled = false;
      }, 1000);
    });
  }
}

// Función para mostrar estadísticas básicas (opcional)
export async function mostrarEstadisticasBasicas() {
  try {
    // Intentar obtener estadísticas básicas de la API
    const response = await fetch('/api/bibliotecas');
    if (response.ok) {
      const bibliotecas = await response.json();
      
      // Mostrar contador de bibliotecas si existe el elemento
      const statsContainer = document.querySelector('.stats-container');
      if (statsContainer && bibliotecas.length > 0) {
        statsContainer.innerHTML = `
          <div class="row text-center">
            <div class="col-md-4">
              <div class="card border-0 bg-light">
                <div class="card-body">
                  <h3 class="text-primary">${bibliotecas.length}</h3>
                  <p class="mb-0">Bibliotecas</p>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card border-0 bg-light">
                <div class="card-body">
                  <h3 class="text-success">+1000</h3>
                  <p class="mb-0">Libros</p>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card border-0 bg-light">
                <div class="card-body">
                  <h3 class="text-info">+500</h3>
                  <p class="mb-0">Usuarios</p>
                </div>
              </div>
            </div>
          </div>
        `;
      }
    }
  } catch (error) {
    console.log('No se pudieron cargar estadísticas básicas:', error);
  }
}

// Función para mostrar noticias o anuncios (opcional)
export function mostrarNoticias() {
  const noticiasContainer = document.querySelector('.noticias-container');
  if (!noticiasContainer) return;
  
  const noticias = [
    {
      titulo: 'Nueva biblioteca agregada',
      descripcion: 'Se ha agregado una nueva biblioteca técnica a nuestra red.',
      fecha: '2025-01-15',
      tipo: 'info'
    },
    {
      titulo: 'Mantenimiento programado',
      descripcion: 'El sistema estará en mantenimiento el próximo domingo de 2:00 AM a 6:00 AM.',
      fecha: '2025-01-20',
      tipo: 'warning'
    },
    {
      titulo: 'Nuevos libros disponibles',
      descripcion: 'Se han agregado más de 50 nuevos títulos a nuestro catálogo.',
      fecha: '2025-01-10',
      tipo: 'success'
    }
  ];
  
  noticiasContainer.innerHTML = `
    <h4 class="mb-3">Últimas noticias</h4>
    <div class="row">
      ${noticias.map(noticia => `
        <div class="col-md-4 mb-3">
          <div class="card border-0 shadow-sm">
            <div class="card-body">
              <div class="d-flex align-items-center mb-2">
                <span class="badge bg-${noticia.tipo} me-2">${noticia.tipo}</span>
                <small class="text-muted">${noticia.fecha}</small>
              </div>
              <h6 class="card-title">${noticia.titulo}</h6>
              <p class="card-text small">${noticia.descripcion}</p>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// Función para inicializar efectos visuales
export function initVisualEffects() {
  // Efecto de aparición gradual para las tarjetas
  const cards = document.querySelectorAll('.card');
  let index = 0;
  for (const card of cards) {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    
    setTimeout(() => {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, index * 100);
    index += 1;
  }
  
  // Efecto hover para los botones
  const buttons = document.querySelectorAll('.btn');
  for (const button of buttons) {
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = '';
      button.style.boxShadow = '';
    });
  }
}
