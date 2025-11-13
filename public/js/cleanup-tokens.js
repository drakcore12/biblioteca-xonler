
// Limpiar tokens inválidos
console.log('🧹 Limpiando tokens inválidos...');

// Limpiar localStorage
const localStorageKeys = ['token', 'user', 'role', 'lastActivity'];
for (const key of localStorageKeys) {
  if (localStorage.getItem(key)) {
    localStorage.removeItem(key);
    console.log('✅ Removido de localStorage:', key);
  }
}

// Limpiar sessionStorage
const sessionStorageKeys = ['token', 'user', 'role', 'lastActivity'];
for (const key of sessionStorageKeys) {
  if (sessionStorage.getItem(key)) {
    sessionStorage.removeItem(key);
    console.log('✅ Removido de sessionStorage:', key);
  }
}

console.log('🎉 Limpieza completada. Por favor, inicia sesión nuevamente.');
alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
globalThis?.location?.replace?.('/pages/guest/login.html');
