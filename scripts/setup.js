#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { testConnection } = require('../src/config/database');

console.log('🚀 Configurando Biblioteca Xonler...\n');

// Verificar si existe el archivo .env
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', 'env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    console.log('📝 Creando archivo .env desde env.example...');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Archivo .env creado. Por favor, edítalo con tus credenciales de PostgreSQL.\n');
  } else {
    console.log('❌ No se encontró env.example. Por favor, crea manualmente el archivo .env');
    process.exit(1);
  }
} else {
  console.log('✅ Archivo .env ya existe.\n');
}

// Verificar conexión a la base de datos
console.log('🔌 Probando conexión a la base de datos...');
testConnection()
  .then((success) => {
    if (success) {
      console.log('✅ Conexión a la base de datos exitosa!\n');
      console.log('🎉 Configuración completada. Puedes ejecutar:');
      console.log('   npm run dev    # Para desarrollo');
      console.log('   npm start      # Para producción\n');
    } else {
      console.log('❌ Error conectando a la base de datos.');
      console.log('   Verifica que:');
      console.log('   1. PostgreSQL esté corriendo');
      console.log('   2. Las credenciales en .env sean correctas');
      console.log('   3. La base de datos xonler exista');
      console.log('   4. Ejecutes database/schema.sql\n');
    }
  })
  .catch((error) => {
    console.error('❌ Error durante la configuración:', error.message);
    process.exit(1);
  });
