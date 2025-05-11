// Módulo para la gestión de bibliotecas en el panel de administración
export function initAgregarBiblioteca() {
  const agregarBibliotecaForm = document.getElementById('agregarBibliotecaForm');
  if (!agregarBibliotecaForm) return;

  agregarBibliotecaForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const nombre = document.getElementById('nuevaBibliotecaNombre').value;
    const colegio = document.getElementById('nuevaBibliotecaColegio').value;
    const direccion = document.getElementById('nuevaBibliotecaDireccion').value;

    console.log('Agregando nueva biblioteca:', {
      nombre,
      colegio,
      direccion
    });

    alert('Biblioteca agregada correctamente.');
    const modal = bootstrap.Modal.getInstance(document.getElementById('agregarBibliotecaModal'));
    modal.hide();
    location.reload();
  });
}

export function initEditarBiblioteca() {
  const editarBibliotecaForm = document.getElementById('editarBibliotecaForm');
  if (!editarBibliotecaForm) return;

  editarBibliotecaForm.addEventListener('submit', function(e) {
    e.preventDefault();

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

    alert('Biblioteca actualizada correctamente.');
    const modal = bootstrap.Modal.getInstance(document.getElementById('editarBibliotecaModal'));
    modal.hide();
    location.reload();
  });
}