// Processor para Artillery - funciones personalizadas si se necesitan

module.exports = {
  // Ejemplo: generar datos dinámicos para pruebas
  generateRandomEmail: () => {
    return `test${Math.random().toString(36).substring(7)}@example.com`;
  },
  
  // Ejemplo: generar ID aleatorio
  generateRandomId: () => {
    return Math.floor(Math.random() * 1000);
  }
};

