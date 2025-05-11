// Módulo principal para el área de administración
import initAdminLogin from './adminLogin.js';
import { initAgregarBiblioteca, initEditarBiblioteca } from './bibliotecasAdmin.js';

export default function initAdminArea() {
  console.log('Área de administración inicializada');

  // Inicializar login de administrador
  initAdminLogin();

  // Inicializar gestión de bibliotecas
  initAgregarBiblioteca();
  initEditarBiblioteca();
}

// Función para manejar el login de administrador
function initAdminLogin() {
  const adminLoginForm = document.getElementById('adminLoginForm');
  if (!adminLoginForm) return;
  
  adminLoginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    
    console.log('Intentando iniciar sesión como administrador:', { email });
    
    // Aquí se realizaría la autenticación del administrador
    alert('Inicio de sesión administrativo exitoso.');
    window.location.href = 'index.html';
  });
}

// Función para manejar el formulario de agregar biblioteca
function initAgregarBiblioteca() {
  const agregarBibliotecaForm = document.getElementById('agregarBibliotecaForm');
  if (!agregarBibliotecaForm) return;
  
  agregarBibliotecaForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Recoger datos del formulario
    const nombre = document.getElementById('nuevaBibliotecaNombre').value;
    const colegio = document.getElementById('nuevaBibliotecaColegio').value;
    const direccion = document.getElementById('nuevaBibliotecaDireccion').value;
    
    console.log('Agregando nueva biblioteca:', {
      nombre,
      colegio,
      direccion
    });
    
    // Aquí se enviaría la información al servidor
    alert('Biblioteca agregada correctamente.');
    
    // Cerrar el modal y actualizar la tabla de bibliotecas
    const modal = bootstrap.Modal.getInstance(document.getElementById('agregarBibliotecaModal'));
    modal.hide();
    
    // Actualizar la tabla (en una aplicación real, se recargarian los datos)
    // Por simplicidad, aquí solo recargamos la página
    location.reload();
  });
}

// Función para manejar el formulario de editar biblioteca
function initEditarBiblioteca() {
  const editarBibliotecaForm = document.getElementById('editarBibliotecaForm');
  if (!editarBibliotecaForm) return;
  
  editarBibliotecaForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Recoger datos del formulario
    const id = document.getElementById('editBibliotecaId').value;
    const nombre = document.getElementById('editBibliotecaNombre').value;
    const colegio = document.getElementById('editBibliotecaColegio').value;
    const direccion = document.getElementById('editBibliotecaDireccion').value;
    
    console.log('Actualizando biblioteca:', {
      id,
      nombre,
      colegio,
      direccion
    });
    
    // Aquí se enviaría la información al servidor
    alert('Biblioteca actualizada correctamente.');
    
    // Cerrar el modal y actualizar la tabla de bibliotecas
    const modal = bootstrap.Modal.getInstance(document.getElementById('editarBibliotecaModal'));
    modal.hide();
    
    // Actualizar la tabla (en una aplicación real, se recargarian los datos)
    // Por simplicidad, aquí solo recargamos la página
    location.reload();
  });
}