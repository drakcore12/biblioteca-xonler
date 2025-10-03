
// Limpiar tokens inválidos
console.log('🧹 Limpiando tokens inválidos...');

// Limpiar localStorage
const localStorageKeys = ['token', 'user', 'role', 'lastActivity'];
localStorageKeys.forEach(key => {
  if (localStorage.getItem(key)) {
    localStorage.removeItem(key);
    console.log('✅ Removido de localStorage:', key);
  }
});

// Limpiar sessionStorage
const sessionStorageKeys = ['token', 'user', 'role', 'lastActivity'];
sessionStorageKeys.forEach(key => {
  if (sessionStorage.getItem(key)) {
    sessionStorage.removeItem(key);
    console.log('✅ Removido de sessionStorage:', key);
  }
});

console.log('🎉 Limpieza completada. Por favor, inicia sesión nuevamente.');
alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
window.location.href = '/pages/guest/login.html';
