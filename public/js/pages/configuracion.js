// configuracion.js - Script modular para la página de configuración
import { requireAuth, requireRole } from '/js/common/guard.js';
import { mostrarAlerta } from '/services/user.services.js';

// ===== VARIABLES GLOBALES =====
let userSvc = null;

// ===== INICIALIZACIÓN =====
async function initPage() {
    await requireAuth();
    requireRole('usuario');
    
    console.log('Usuario autenticado, cargando página de configuración...');
    
    // ✅ ARREGLADO: 1) Evita submits accidentales
    document.querySelectorAll('form').forEach(f => {
        f.addEventListener('submit', e => e.preventDefault());
    });
    
    // ✅ ARREGLADO: 2) Botones seguros
    document.getElementById('btnGuardar')?.setAttribute('type', 'button');
    document.getElementById('btnCancelar')?.setAttribute('type', 'button');
    
    setupEventListeners();
    await loadUserData();
    await loadUserPreferences();
}

// ===== CONFIGURACIÓN DE EVENTOS =====
function setupEventListeners() {
    console.log('Configurando eventos...');
    
    // Eventos principales
    document.getElementById('btnLogout')?.addEventListener('click', logout);
    document.getElementById('btnGuardar')?.addEventListener('click', saveAllChanges);
    document.getElementById('btnCancelar')?.addEventListener('click', handleCancel);
    document.getElementById('passwordForm')?.addEventListener('submit', changePassword);
}

// ===== CARGA DE DATOS =====
async function loadUserData() {
    console.log('Cargando datos del usuario...');
    
    try {
        userSvc = await import('/services/user.services.js');
        const usuario = await userSvc.cargarPerfilCompleto();
        
        if (usuario) {
            populateUserFields(usuario);
            console.log('✅ Datos del usuario cargados correctamente');
        } else {
            handleFallbackData();
        }
        
    } catch (error) {
        console.error('❌ Error cargando datos del usuario:', error);
        handleFallbackData();
    }
}

async function loadUserPreferences() {
    console.log('Cargando preferencias del usuario...');
    
    try {
        if (!userSvc) userSvc = await import('/services/user.services.js');
        const usuario = await userSvc.cargarPerfilCompleto();
        
        if (usuario) {
            populatePreferenceFields(usuario);
            console.log('✅ Preferencias del usuario cargadas correctamente');
        } else {
            setDefaultPreferences();
        }
        
    } catch (error) {
        console.error('❌ Error cargando preferencias:', error);
        setDefaultPreferences();
    }
}

// ===== FUNCIONES HELPER =====
function toDateInputValue(fecha) {
    if (!fecha) return '';                         // vacío si no hay fecha
    const d = new Date(fecha);                     // puede venir con Z
    if (isNaN(d)) return '';                       // fecha inválida
    // ✅ ARREGLADO: Formato más robusto YYYY-MM-DD
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ===== POBLADO DE CAMPOS =====
function populateUserFields(usuario) {
    // Header
    document.getElementById('welcomeNameNav').textContent = usuario.nombre || 'Usuario';
    
    // ✅ ARREGLADO: Usar apellido separado de la base de datos
    const fields = {
        'nombre': usuario.nombre || '',
        'apellido': usuario.apellido || '',
        'email': usuario.email || '',
        'telefono': usuario.telefono || '',
        'genero': usuario.genero || '',
        'direccion': usuario.direccion || '',
        'ciudad': usuario.ciudad || '',
        'codigoPostal': usuario.codigoPostal || ''
    };
    
    Object.entries(fields).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.value = value;
    });
    
    // ✅ ARREGLADO: Manejar fecha de nacimiento correctamente
    const fechaInput = document.getElementById('fechaNacimiento');
    if (fechaInput) {
        fechaInput.value = toDateInputValue(usuario.fecha_nacimiento);
    }
}

function populatePreferenceFields(usuario) {
    // Preferencias generales
    const preferences = {
        'idioma': usuario.idioma || 'es',
        'tema': usuario.tema || 'auto',
        'tamanoFuente': usuario.tamanoFuente || 'medium',
        'maxResultados': usuario.maxResultados || '20'
    };
    
    Object.entries(preferences).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.value = value;
    });
    
    // Categorías favoritas
    if (usuario.categoriasFavoritas && Array.isArray(usuario.categoriasFavoritas)) {
        usuario.categoriasFavoritas.forEach(categoria => {
            const checkbox = document.getElementById(`cat${categoria.charAt(0).toUpperCase() + categoria.slice(1)}`);
            if (checkbox) checkbox.checked = true;
        });
    }
    
    // Notificaciones
    const notifications = {
        'emailPrestamos': usuario.emailPrestamos || false,
        'emailNuevosLibros': usuario.emailNuevosLibros || false,
        'emailEventos': usuario.emailEventos || false,
        'appPrestamos': usuario.appPrestamos || false,
        'appRecomendaciones': usuario.appRecomendaciones || false,
        'appMantenimiento': usuario.appMantenimiento || false
    };
    
    Object.entries(notifications).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.checked = value;
    });
}

// ===== FALLBACKS =====
function handleFallbackData() {
    const userName = localStorage.getItem('userName') || sessionStorage.getItem('userName') || 'Usuario';
    document.getElementById('welcomeNameNav').textContent = userName;
    
    // ✅ ARREGLADO: Usar mostrarAlerta del servicio directamente
    mostrarAlerta('warning', 'No se pudieron cargar los datos del usuario. Usando datos por defecto.');
}

function setDefaultPreferences() {
    const defaults = {
        'idioma': 'es',
        'tema': 'auto',
        'tamanoFuente': 'medium',
        'maxResultados': '20'
    };
    
    Object.entries(defaults).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.value = value;
    });
    
    console.log('⚠️ Usando preferencias por defecto');
}

// ===== GUARDADO DE CAMBIOS =====
async function saveAllChanges() {
    console.log('Guardando cambios...');
    
    try {
        if (!userSvc) userSvc = await import('/services/user.services.js');
        
        if (!validateForms()) return;
        
        const btnGuardar = document.getElementById('btnGuardar');
        const originalText = btnGuardar.textContent;
        btnGuardar.disabled = true;
        btnGuardar.textContent = 'Guardando...';
        
        // Recopilar datos
        const datosPerfil = collectProfileData();
        const preferencias = collectPreferenceData();
        
        // Guardar
        const resultadoPerfil = await userSvc.actualizarPerfil(datosPerfil);
        if (!resultadoPerfil.success) {
            throw new Error(`Error al guardar perfil: ${resultadoPerfil.error}`);
        }
        
        const resultadoPreferencias = await userSvc.guardarPreferencias(preferencias);
        if (!resultadoPreferencias.success) {
            throw new Error(`Error al guardar preferencias: ${resultadoPreferencias.error}`);
        }
        
        // Restaurar botón y mostrar éxito
        btnGuardar.disabled = false;
        btnGuardar.textContent = originalText;
        
        showSuccessMessage('Cambios guardados correctamente');
        
        // ✅ ARREGLADO: NO redirigir automáticamente
        // El usuario permanece en la página de configuración
        
    } catch (error) {
        console.error('❌ Error guardando cambios:', error);
        handleSaveError(error);
    }
}

function collectProfileData() {
    return {
        nombre: document.getElementById('nombre').value,
        apellido: document.getElementById('apellido').value,
        email: document.getElementById('email').value,
        telefono: document.getElementById('telefono').value,
        fechaNacimiento: document.getElementById('fechaNacimiento').value,
        genero: document.getElementById('genero').value,
        direccion: document.getElementById('direccion').value,
        ciudad: document.getElementById('ciudad').value,
        codigoPostal: document.getElementById('codigoPostal').value
    };
}

function collectPreferenceData() {
    const prefs = {
        idioma: document.getElementById('idioma')?.value || 'es',
        tema: document.getElementById('tema')?.value || 'auto',
        tamanoFuente: document.getElementById('tamanoFuente')?.value || 'medium',
        maxResultados: document.getElementById('maxResultados')?.value || '20',
        categoriasFavoritas: obtenerCategoriasSeleccionadas(),
        emailPrestamos: document.getElementById('emailPrestamos')?.checked || false,
        emailNuevosLibros: document.getElementById('emailNuevosLibros')?.checked || false,
        emailEventos: document.getElementById('emailEventos')?.checked || false,
        appPrestamos: document.getElementById('appPrestamos')?.checked || false,
        appRecomendaciones: document.getElementById('appRecomendaciones')?.checked || false,
        appMantenimiento: document.getElementById('appMantenimiento')?.checked || false
    };

    // Validar que todos los valores requeridos estén presentes
    if (!prefs.idioma || !prefs.tema || !prefs.tamanoFuente || !prefs.maxResultados) {
        throw new Error('Faltan campos requeridos en las preferencias');
    }

    // Validar que categoriasFavoritas sea un array
    if (!Array.isArray(prefs.categoriasFavoritas)) {
        prefs.categoriasFavoritas = [];
    }

    console.log('🔍 Preferencias recolectadas:', prefs);
    return prefs;
}

// ===== CAMBIO DE CONTRASEÑA =====
async function changePassword() {
    console.log('Cambiando contraseña...');
    
    try {
        if (!userSvc) userSvc = await import('/services/user.services.js');
        
        const passwordData = collectPasswordData();
        
        if (!validatePasswordChange(passwordData)) return;
        
        const resultado = await userSvc.cambiarContraseña({
            passwordActual: passwordData.actual,
            passwordNueva: passwordData.nueva
        });
        
        if (resultado.success) {
            showSuccessMessage('Contraseña cambiada correctamente');
            document.getElementById('passwordForm').reset();
        } else {
            showErrorMessage(`Error al cambiar contraseña: ${resultado.error}`);
        }
        
    } catch (error) {
        console.error('❌ Error cambiando contraseña:', error);
        showErrorMessage(`Error al cambiar contraseña: ${error.message}`);
    }
}

function collectPasswordData() {
    return {
        actual: document.getElementById('passwordActual').value,
        nueva: document.getElementById('passwordNueva').value,
        confirmar: document.getElementById('passwordConfirmar').value
    };
}

function validatePasswordChange(data) {
    if (data.nueva !== data.confirmar) {
        showErrorMessage('Las contraseñas no coinciden');
        return false;
    }
    
    if (data.nueva.length < 8) {
        showErrorMessage('La nueva contraseña debe tener al menos 8 caracteres');
        return false;
    }
    
    return true;
}

// ===== VALIDACIÓN =====
function validateForms() {
    const perfilForm = document.getElementById('perfilForm');
    const passwordForm = document.getElementById('passwordForm');
    
    if (!perfilForm.checkValidity()) {
        perfilForm.reportValidity();
        return false;
    }
    
    const passwordActual = document.getElementById('passwordActual').value;
    if (passwordActual && !passwordForm.checkValidity()) {
        passwordForm.reportValidity();
        return false;
    }
    
    return true;
}

// ===== FUNCIONES HELPER =====
function obtenerCategoriasSeleccionadas() {
    const categorias = [];
    const checkboxes = document.querySelectorAll('input[name="categoriasFavoritas"]:checked');
    checkboxes.forEach(checkbox => categorias.push(checkbox.value));
    return categorias;
}

function handleCancel(e) {
    e.preventDefault();
    if (confirm('¿Estás seguro de que quieres cancelar? Los cambios no guardados se perderán.')) {
        // ✅ ARREGLADO: Usar history.back() en lugar de redirección forzada
        history.back();
    }
}

function handleSaveError(error) {
    const btnGuardar = document.getElementById('btnGuardar');
    btnGuardar.disabled = false;
    btnGuardar.textContent = 'Guardar Cambios';
    
    // ✅ ARREGLADO: Usar mostrarAlerta del servicio directamente
    mostrarAlerta('danger', `Error al guardar: ${error.message}`);
}

// ===== MENSAJES =====
function showSuccessMessage(message) {
    // ✅ ARREGLADO: Usar mostrarAlerta del servicio directamente
    mostrarAlerta('success', message);
}

function showErrorMessage(message) {
    // ✅ ARREGLADO: Usar mostrarAlerta del servicio directamente
    mostrarAlerta('danger', message);
}

function showFallbackAlert(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        <i class="bi bi-exclamation-triangle me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const firstCard = document.querySelector('.card');
    if (firstCard) {
        firstCard.parentNode.insertBefore(alertDiv, firstCard);
    } else {
        document.body.insertBefore(alertDiv, document.body.firstChild);
    }
    
    setTimeout(() => {
        if (alertDiv.parentNode) alertDiv.remove();
    }, 5000);
    
    return alertDiv;
}

// ===== LOGOUT =====
function logout() {
    ['localStorage', 'sessionStorage'].forEach(storage => {
        const st = window[storage];
        st.removeItem('token');
        st.removeItem('role');
        st.removeItem('userName');
        st.removeItem('userId');
    });
    
    window.location.href = '/pages/guest/login.html';
}

// ===== EXPORTAR FUNCIONES =====
export {
    initPage,
    setupEventListeners,
    loadUserData,
    loadUserPreferences,
    saveAllChanges,
    changePassword,
    logout,
    showFallbackAlert
};
