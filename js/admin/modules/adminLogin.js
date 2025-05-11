// Módulo para el login de administrador
export default function initAdminLogin() {
  const adminLoginForm = document.getElementById('adminLoginForm');
  if (!adminLoginForm) return;

  adminLoginForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;

    console.log('Intentando iniciar sesión como administrador:', { email });

    // Petición al backend para autenticar
    try {
      const response = await fetch('/api/usuarios/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (data.success && data.usuario && data.usuario.rol === 'admin') {
        alert('Inicio de sesión administrativo exitoso.');
        window.location.href = 'index.html';
      } else if (data.success) {
        alert('No tienes permisos de administrador.');
      } else {
        alert(data.error || 'Credenciales incorrectas');
      }
    } catch (error) {
      alert('Error al conectar con el servidor.');
    }
  });
}