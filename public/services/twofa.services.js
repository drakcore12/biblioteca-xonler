// Servicio para manejo de 2FA (Two-Factor Authentication)

// Helper para obtener headers de autenticación
function getAuthHeaders() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) {
    throw new Error('No hay token de autenticación');
  }
  
  return { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

// Helper para mostrar alertas
function showAlert(type, message) {
  // Buscar si ya existe una alerta
  let alertDiv = document.getElementById('twofaAlert');
  if (alertDiv) {
    alertDiv.remove();
  }

  alertDiv = document.createElement('div');
  alertDiv.id = 'twofaAlert';
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
  let iconClass = 'info-circle';
  if (type === 'success') {
    iconClass = 'check-circle';
  } else if (type === 'danger') {
    iconClass = 'exclamation-triangle';
  }
  
  alertDiv.innerHTML = `
    <i class="bi bi-${iconClass} me-2"></i>
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
  `;
  
  // Insertar al inicio del card body
  const cardBody = document.querySelector('#seguridad-2fa .card-body');
  if (cardBody) {
    cardBody.insertBefore(alertDiv, cardBody.firstChild);
  }

  // Auto-ocultar después de 5 segundos
  setTimeout(() => {
    if (alertDiv?.parentNode) {
      alertDiv.remove();
    }
  }, 5000);
}

// Obtener estado actual de 2FA
export async function get2FAStatus() {
  try {
    console.log('🔐 [2FA] Obteniendo estado 2FA...');
    const headers = getAuthHeaders();
    console.log('🔐 [2FA] Headers:', headers);
    
    const response = await fetch('/api/usuarios/2fa/status', {
      method: 'GET',
      headers: headers
    });

    console.log('🔐 [2FA] Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔐 [2FA] Error response:', errorText);
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('🔐 [2FA] Data received:', data);
    return data;
  } catch (error) {
    console.error('Error obteniendo estado 2FA:', error);
    throw error;
  }
}

// Configurar 2FA (generar QR)
export async function setup2FA() {
  try {
    const response = await fetch('/api/usuarios/2fa/setup', {
      method: 'POST',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error configurando 2FA:', error);
    throw error;
  }
}

// Verificar código y activar 2FA
export async function verify2FA(code) {
  try {
    const response = await fetch('/api/usuarios/2fa/verify', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ code })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error verificando 2FA:', error);
    throw error;
  }
}

// Desactivar 2FA
export async function disable2FA(code) {
  try {
    const response = await fetch('/api/usuarios/2fa/disable', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ code })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error desactivando 2FA:', error);
    throw error;
  }
}

// Inicializar UI de 2FA
export function init2FAUI() {
  console.log('🔐 Inicializando UI de 2FA...');

  // Cargar estado inicial
  load2FAStatus();

  // Event listeners
  setupEventListeners();
}

// Cargar estado de 2FA
async function load2FAStatus() {
  try {
    const status = await get2FAStatus();
    update2FAUI(status);
  } catch (error) {
    console.error('Error cargando estado 2FA:', error);
    showAlert('danger', 'Error cargando estado de 2FA');
  }
}

// Actualizar UI según estado
function update2FAUI(status) {
  const statusDiv = document.getElementById('twofaStatus');
  const setupDiv = document.getElementById('twofaSetup');
  const qrDiv = document.getElementById('twofaQR');
  const enabledDiv = document.getElementById('twofaEnabled');

  // Ocultar todos los divs
  for (const div of [statusDiv, setupDiv, qrDiv, enabledDiv]) {
    if (div) div.style.display = 'none';
  }

  if (status.enabled) {
    // 2FA está activado
    if (enabledDiv) enabledDiv.style.display = 'block';
  } else if (setupDiv) {
    // 2FA no está activado
    setupDiv.style.display = 'block';
  }
}

// Configurar event listeners
function setupEventListeners() {
  // Botón para iniciar configuración 2FA
  const btnStart2FA = document.getElementById('btnStart2FA');
  if (btnStart2FA) {
    btnStart2FA.addEventListener('click', handleStart2FA);
  }

  // Botón para verificar código 2FA
  const btnVerify2FA = document.getElementById('btnVerify2FA');
  if (btnVerify2FA) {
    btnVerify2FA.addEventListener('click', handleVerify2FA);
  }

  // Botón para cancelar configuración 2FA
  const btnCancel2FA = document.getElementById('btnCancel2FA');
  if (btnCancel2FA) {
    btnCancel2FA.addEventListener('click', handleCancel2FA);
  }

  // Botón para desactivar 2FA
  const btnDisable2FA = document.getElementById('btnDisable2FA');
  if (btnDisable2FA) {
    btnDisable2FA.addEventListener('click', handleDisable2FA);
  }

  // Botón para confirmar desactivación 2FA
  const btnConfirmDisable2FA = document.getElementById('btnConfirmDisable2FA');
  if (btnConfirmDisable2FA) {
    btnConfirmDisable2FA.addEventListener('click', handleConfirmDisable2FA);
  }

  // Auto-submit en campos de código
  const codeInputs = ['twofaCode', 'disableTwofaCode'];
  for (const inputId of codeInputs) {
    const input = document.getElementById(inputId);
    if (!input) continue;
    
    input.addEventListener('input', (e) => {
      const value = e.target.value.replaceAll(/\D/g, ''); // Solo números
      e.target.value = value;
      
      if (value.length === 6) {
        // Auto-submit después de un breve delay
        setTimeout(() => {
          if (inputId === 'twofaCode') {
            handleVerify2FA();
          } else if (inputId === 'disableTwofaCode') {
            handleConfirmDisable2FA();
          }
        }, 100);
      }
    });
  }
}

// Manejar inicio de configuración 2FA
async function handleStart2FA() {
  const btn = document.getElementById('btnStart2FA');
  if (!btn) return;
  
  const originalText = btn.innerHTML;
  
  try {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Generando QR...';

    const data = await setup2FA();
    
    // Mostrar QR
    const qrImage = document.getElementById('qrImage');
    if (qrImage) {
      qrImage.src = data.qrcodeDataURL;
    }

    // Mostrar sección de QR
    const setupDiv = document.getElementById('twofaSetup');
    const qrDiv = document.getElementById('twofaQR');
    
    if (setupDiv) setupDiv.style.display = 'none';
    if (qrDiv) qrDiv.style.display = 'block';

    // Focus en el input de código
    const codeInput = document.getElementById('twofaCode');
    if (codeInput) {
      setTimeout(() => codeInput.focus(), 100);
    }

    showAlert('info', 'Escanea el código QR con tu aplicación autenticadora');

  } catch (error) {
    console.error('Error iniciando 2FA:', error);
    showAlert('danger', `Error: ${error.message}`);
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

// Manejar verificación de código 2FA
async function handleVerify2FA() {
  const btn = document.getElementById('btnVerify2FA');
  if (!btn) return;
  
  const originalText = btn.innerHTML;
  
  try {
    const code = document.getElementById('twofaCode').value.trim();
    
    if (code.length !== 6) {
      showAlert('warning', 'Por favor ingresa un código de 6 dígitos');
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Verificando...';

    await verify2FA(code);
    
    showAlert('success', '2FA activado correctamente. Tu cuenta está ahora protegida.');
    
    // Recargar estado
    await load2FAStatus();

  } catch (error) {
    console.error('Error verificando 2FA:', error);
    showAlert('danger', `Error: ${error.message}`);
    
    // Limpiar input
    const codeInput = document.getElementById('twofaCode');
    if (codeInput) {
      codeInput.value = '';
      codeInput.focus();
    }
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

// Manejar cancelación de configuración 2FA
function handleCancel2FA() {
  const setupDiv = document.getElementById('twofaSetup');
  const qrDiv = document.getElementById('twofaQR');
  
  if (setupDiv) setupDiv.style.display = 'block';
  if (qrDiv) qrDiv.style.display = 'none';
  
  // Limpiar input
  const codeInput = document.getElementById('twofaCode');
  if (codeInput) {
    codeInput.value = '';
  }
}

// Manejar desactivación de 2FA
function handleDisable2FA() {
  const modal = new bootstrap.Modal(document.getElementById('disable2FAModal'));
  modal.show();
  
  // Focus en el input
  const codeInput = document.getElementById('disableTwofaCode');
  if (codeInput) {
    setTimeout(() => codeInput.focus(), 100);
  }
}

// Manejar confirmación de desactivación 2FA
async function handleConfirmDisable2FA() {
  const btn = document.getElementById('btnConfirmDisable2FA');
  if (!btn) return;
  
  const originalText = btn.innerHTML;
  
  try {
    const code = document.getElementById('disableTwofaCode').value.trim();
    
    if (code.length !== 6) {
      showAlert('warning', 'Por favor ingresa un código de 6 dígitos');
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Desactivando...';

    await disable2FA(code);
    
    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('disable2FAModal'));
    if (modal) modal.hide();
    
    showAlert('success', '2FA desactivado correctamente');
    
    // Recargar estado
    await load2FAStatus();

  } catch (error) {
    console.error('Error desactivando 2FA:', error);
    showAlert('danger', `Error: ${error.message}`);
    
    // Limpiar input
    const codeInput = document.getElementById('disableTwofaCode');
    if (codeInput) {
      codeInput.value = '';
      codeInput.focus();
    }
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}
