export default async function initDashboard() {
  try {
    const res = await fetch('/api/dashboard');
    const data = await res.json();

    if (data.counts) {
      const { libros, bibliotecas, prestamos, usuarios } = data.counts;
      document.getElementById('totalLibros').textContent = libros;
      document.getElementById('totalBibliotecas').textContent = bibliotecas;
      document.getElementById('totalPrestamos').textContent = prestamos;
      document.getElementById('totalUsuarios').textContent = usuarios;
    }

    if (Array.isArray(data.prestamosRecientes)) {
      const tbody = document.getElementById('prestamosRecientesBody');
      tbody.innerHTML = data.prestamosRecientes.map(p => `
        <tr>
          <td>${p.id}</td>
          <td>${p.usuario}</td>
          <td>${p.libro}</td>
          <td>${p.biblioteca}</td>
          <td>${p.fecha_prestamo}</td>
          <td>${p.fecha_devolucion || ''}</td>
          <td><span class="badge ${p.estado === 'Vencido' ? 'bg-danger' : p.estado === 'Activo' ? 'bg-success' : 'bg-secondary'}">${p.estado}</span></td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Error cargando dashboard:', err);
  }
}

document.addEventListener('DOMContentLoaded', initDashboard);
