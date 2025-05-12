document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('adminLoginForm');
  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value.trim().toLowerCase();
    const password = document.getElementById('adminPassword').value;

    // Limpia mensajes anteriores
    let errorDiv = document.getElementById('adminLoginError');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.id = 'adminLoginError';
      errorDiv.className = 'alert alert-danger mt-3';
      form.appendChild(errorDiv);
    }
    errorDiv.textContent = '';
    errorDiv.style.display = 'none';

    try {
      const response = await fetch('/api/usuarios/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (data.success && data.usuario && data.usuario.rol === 'admin') {
        window.location.href = '/admin/index.html';
      } else if (data.success) {
        errorDiv.textContent = 'No tienes permisos de administrador.';
        errorDiv.style.display = 'block';
      } else {
        errorDiv.textContent = data.error || 'Credenciales incorrectas';
        errorDiv.style.display = 'block';
      }
    } catch (err) {
      errorDiv.textContent = 'Error al conectar con el servidor.';
      errorDiv.style.display = 'block';
    }
  });
});