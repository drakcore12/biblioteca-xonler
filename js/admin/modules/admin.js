// js/modules/admin.js

// Función principal para el área de administración
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
export function initAgregarBiblioteca() {
  const agregarForm = document.getElementById('agregarBibliotecaForm');
  if (!agregarForm) return;

  agregarForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const nombre    = document.getElementById('nuevaBibliotecaNombre').value;
    const colegio   = document.getElementById('nuevaBibliotecaColegio').value;
    const direccion = document.getElementById('nuevaBibliotecaDireccion').value;

    console.log('Agregando nueva biblioteca:', { nombre, colegio, direccion });

    // Envío al servidor (fetch POST) iría aquí

    alert('Biblioteca agregada correctamente.');

    const modal = bootstrap.Modal.getInstance(document.getElementById('agregarBibliotecaModal'));
    modal.hide();

    location.reload();
  });
}

// Función para manejar el formulario de editar biblioteca
export function initEditarBiblioteca() {
  const editarForm = document.getElementById('editarBibliotecaForm');
  if (!editarForm) return;

  editarForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const id        = document.getElementById('editBibliotecaId').value;
    const nombre    = document.getElementById('editBibliotecaNombre').value;
    const colegio   = document.getElementById('editBibliotecaColegio').value;
    const direccion = document.getElementById('editBibliotecaDireccion').value;

    console.log('Actualizando biblioteca:', { id, nombre, colegio, direccion });

    // Envío al servidor (fetch PUT) iría aquí

    alert('Biblioteca actualizada correctamente.');

    const modal = bootstrap.Modal.getInstance(document.getElementById('editarBibliotecaModal'));
    modal.hide();

    location.reload();
  });
}

// Al cargar la página, invocamos initAdminArea
document.addEventListener('DOMContentLoaded', initAdminArea);
