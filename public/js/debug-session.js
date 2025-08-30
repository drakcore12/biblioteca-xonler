// Archivo de debug para verificar el estado de la sesión
// Úsalo en la consola del navegador para diagnosticar problemas

export function debugSession() {
  console.log('=== DEBUG SESSION ===');
  
  // Verificar storage
  const localToken = localStorage.getItem('token');
  const sessionToken = sessionStorage.getItem('token');
  const localRole = localStorage.getItem('role');
  const sessionRole = sessionStorage.getItem('role');
  const localUserName = localStorage.getItem('userName');
  const sessionUserName = sessionStorage.getItem('userName');
  
  console.log('🔑 Token (local):', localToken ? '✅ Presente' : '❌ Ausente');
  console.log('🔑 Token (session):', sessionToken ? '✅ Presente' : '❌ Ausente');
  console.log('👤 Role (local):', localRole || '❌ Ausente');
  console.log('👤 Role (session):', sessionRole || '❌ Ausente');
  console.log('📝 UserName (local):', localUserName || '❌ Ausente');
  console.log('📝 UserName (session):', sessionUserName || '❌ Ausente');
  
  // Verificar ruta actual
  console.log('📍 Ruta actual:', window.location.pathname);
  console.log('🔍 Parámetros:', window.location.search);
  
  // Verificar si hay sesión activa
  const hasToken = localToken || sessionToken;
  const hasRole = localRole || sessionRole;
  
  console.log('🎯 Estado sesión:', hasToken && hasRole ? '✅ Activa' : '❌ Inactiva');
  
  if (hasToken && hasRole) {
    console.log('🚀 Usuario autenticado como:', (localRole || sessionRole)?.toLowerCase());
  } else {
    console.log('⚠️  Usuario NO autenticado');
  }
  
  console.log('=====================');
  
  return {
    hasToken,
    hasRole,
    role: (localRole || sessionRole)?.toLowerCase(),
    userName: localUserName || sessionUserName
  };
}

// Función para limpiar sesión (útil para testing)
export function clearSession() {
  console.log('🧹 Limpiando sesión...');
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('userName');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('role');
  sessionStorage.removeItem('userName');
  console.log('✅ Sesión limpiada');
  
  // Recargar página para aplicar cambios
  window.location.reload();
}

// Función para simular login (útil para testing)
export function simulateLogin(role = 'usuario', remember = false) {
  console.log(`🔐 Simulando login como: ${role} (remember: ${remember})`);
  
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem('token', 'fake-token-' + Date.now());
  storage.setItem('role', role.toLowerCase());
  storage.setItem('userName', 'Usuario Test');
  
  console.log('✅ Login simulado');
  console.log('🔄 Recargando página...');
  
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

// Función para verificar guardas
export async function testGuards() {
  console.log('🧪 Probando guardas...');
  
  try {
    const { requireAuth, requireRole } = await import('/js/common/guard.js');
    
    console.log('1️⃣ Probando requireAuth...');
    await requireAuth();
    console.log('✅ requireAuth pasó');
    
    console.log('2️⃣ Probando requireRole("usuario")...');
    requireRole('usuario');
    console.log('✅ requireRole pasó');
    
    console.log('🎉 Todas las guardas funcionan correctamente');
    
  } catch (error) {
    console.error('❌ Error en guardas:', error);
  }
}

// Función para mostrar ayuda
export function showHelp() {
  console.log(`
🔧 COMANDOS DE DEBUG DISPONIBLES:

📊 debugSession()     - Ver estado actual de la sesión
🧹 clearSession()     - Limpiar sesión y recargar
🔐 simulateLogin()    - Simular login para testing
🧪 testGuards()       - Probar funcionamiento de guardas
❓ showHelp()         - Mostrar esta ayuda

💡 EJEMPLOS:
• debugSession()                    // Ver estado actual
• simulateLogin('admin', true)      // Login como admin con remember
• clearSession()                    // Limpiar y recargar
• testGuards()                     // Probar guardas
  `);
}

// Auto-exportar funciones globales para uso en consola
if (typeof window !== 'undefined') {
  window.debugSession = debugSession;
  window.clearSession = clearSession;
  window.simulateLogin = simulateLogin;
  window.testGuards = testGuards;
  window.showHelp = showHelp;
  
  console.log('🔧 Debug tools cargados. Escribe showHelp() para ver comandos disponibles.');
}
