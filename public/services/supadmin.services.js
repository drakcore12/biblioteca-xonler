// Servicio para Super Administrador
import { get, post, put, del } from './common/api-client.js';

class SupAdminService {
  baseURL = '/api';

  async safeRequest(action, context) {
    try {
      return await action();
    } catch (error) {
      console.error(`[SupAdminService] Error ${context}:`, error);
      throw error;
    }
  }

  // ===== GESTIÓN DE USUARIOS =====

  // Obtener todos los usuarios del sistema
  async obtenerUsuarios(filtros = {}) {
    return this.safeRequest(() => get(`${this.baseURL}/usuarios`, filtros), 'obteniendo usuarios');
  }

  // Obtener usuario por ID
  async obtenerUsuarioPorId(id) {
    return this.safeRequest(() => get(`${this.baseURL}/usuarios/${id}`), 'obteniendo usuario');
  }

  // Crear nuevo usuario
  async crearUsuario(datos) {
    return this.safeRequest(() => post(`${this.baseURL}/usuarios`, datos), 'creando usuario');
  }

  // Actualizar usuario existente
  async actualizarUsuario(id, datos) {
    return this.safeRequest(() => put(`${this.baseURL}/usuarios/${id}`, datos), 'actualizando usuario');
  }

  // Eliminar usuario
  async eliminarUsuario(id) {
    return this.safeRequest(() => del(`${this.baseURL}/usuarios/${id}`), 'eliminando usuario');
  }

  // Obtener roles disponibles
  async obtenerRoles() {
    return this.safeRequest(() => get(`${this.baseURL}/roles`), 'obteniendo roles');
  }

  // ===== GESTIÓN DE BIBLIOTECAS =====

  // Obtener todas las bibliotecas del sistema
  async obtenerBibliotecas(filtros = {}) {
    return this.safeRequest(() => get(`${this.baseURL}/bibliotecas`, filtros), 'obteniendo bibliotecas');
  }

  // Obtener biblioteca por ID
  async obtenerBibliotecaPorId(id) {
    return this.safeRequest(() => get(`${this.baseURL}/bibliotecas/${id}`), 'obteniendo biblioteca');
  }

  // Crear nueva biblioteca
  async crearBiblioteca(datos) {
    return this.safeRequest(() => post(`${this.baseURL}/bibliotecas`, datos), 'creando biblioteca');
  }

  // Actualizar biblioteca existente
  async actualizarBiblioteca(id, datos) {
    return this.safeRequest(() => put(`${this.baseURL}/bibliotecas/${id}`, datos), 'actualizando biblioteca');
  }

  // Eliminar biblioteca
  async eliminarBiblioteca(id) {
    return this.safeRequest(() => del(`${this.baseURL}/bibliotecas/${id}`), 'eliminando biblioteca');
  }

  // Obtener colegios disponibles
  async obtenerColegios() {
    return this.safeRequest(() => get(`${this.baseURL}/colegios`), 'obteniendo colegios');
  }

  // Cambiar rol de usuario
  async cambiarRolUsuario(id, nuevoRolId) {
    return this.safeRequest(
      () => put(`${this.baseURL}/usuarios/${id}/rol`, { rol_id: nuevoRolId }),
      'cambiando rol de usuario'
    );
  }

  // Asignar administrador a biblioteca
  async asignarAdminBiblioteca(usuarioId, bibliotecaId) {
    return this.safeRequest(
      () => post(`${this.baseURL}/admin-bibliotecas`, {
        usuario_id: usuarioId,
        biblioteca_id: bibliotecaId
      }),
      'asignando admin a biblioteca'
    );
  }

  // Remover administrador de biblioteca
  async removerAdminBiblioteca(usuarioId, bibliotecaId) {
    return this.safeRequest(
      () => del(`${this.baseURL}/admin-bibliotecas/${usuarioId}/${bibliotecaId}`),
      'removiendo admin de biblioteca'
    );
  }

  // ===== GESTIÓN DE COLEGIOS =====

  // Crear nuevo colegio
  async crearColegio(datosColegio) {
    return this.safeRequest(() => post(`${this.baseURL}/colegios`, datosColegio), 'creando colegio');
  }

  // ===== ESTADÍSTICAS GLOBALES =====

  // Obtener estadísticas globales del sistema
  async obtenerEstadisticasGlobales() {
    return this.safeRequest(() => get(`${this.baseURL}/supadmin/estadisticas`), 'obteniendo estadísticas globales');
  }

  // Obtener actividad reciente del sistema
  async obtenerActividadReciente(filtros = {}) {
    return this.safeRequest(
      () => get(`${this.baseURL}/supadmin/actividad`, filtros),
      'obteniendo actividad reciente'
    );
  }

  // ===== LOGS Y AUDITORÍA =====

  // Obtener logs del sistema
  async obtenerLogs(filtros = {}) {
    return this.safeRequest(() => get(`${this.baseURL}/supadmin/logs`, filtros), 'obteniendo logs');
  }

  // ===== MONITOREO DE SEGURIDAD =====

  // Obtener métricas de seguridad
  async obtenerMetricasSeguridad() {
    return this.safeRequest(
      () => get(`${this.baseURL}/security/monitoring/simple`),
      'obteniendo métricas de seguridad'
    );
  }

  // Ejecutar backup del sistema
  async ejecutarBackup() {
    return this.safeRequest(() => post(`${this.baseURL}/security/backup`), 'ejecutando backup');
  }

  // Rotar claves JWT
  async rotarClavesJWT() {
    return this.safeRequest(() => post(`${this.baseURL}/security/rotate-jwt`), 'rotando claves JWT');
  }
}

// Instancia singleton del servicio
const supadminService = new SupAdminService();

// Hacer disponible globalmente
if (typeof globalThis !== 'undefined') {
  globalThis.supadminService = supadminService;
}
