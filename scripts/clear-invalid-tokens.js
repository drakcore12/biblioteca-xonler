#!/usr/bin/env node

/**
 * Script para limpiar tokens inválidos del frontend
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 LIMPIANDO TOKENS INVÁLIDOS DEL FRONTEND\n');

// Función para limpiar localStorage/sessionStorage
const clearStorageScript = `
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
`;

// Crear archivo de limpieza
const cleanupPath = path.join(process.cwd(), 'public', 'js', 'cleanup-tokens.js');
fs.writeFileSync(cleanupPath, clearStorageScript);

console.log('✅ Script de limpieza creado:', cleanupPath);
console.log('📋 Para usar:');
console.log('   1. Abre las herramientas de desarrollador (F12)');
console.log('   2. Ve a la consola');
console.log('   3. Ejecuta: localStorage.clear(); sessionStorage.clear();');
console.log('   4. Recarga la página');
console.log('   5. Inicia sesión nuevamente');

// Crear página de limpieza automática
const cleanupPage = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Limpieza de Tokens - Xonler</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <div class="container mt-5">
        <div class="row justify-content-center">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-body text-center">
                        <h2 class="card-title">🧹 Limpieza de Tokens</h2>
                        <p class="card-text">Se detectaron tokens inválidos. Se procederá a limpiarlos automáticamente.</p>
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Limpiando...</span>
                        </div>
                        <p class="mt-3">Redirigiendo al login...</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
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
        
        console.log('🎉 Limpieza completada.');
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
            window.location.href = '/pages/guest/login.html';
        }, 2000);
    </script>
</body>
</html>`;

const cleanupPagePath = path.join(process.cwd(), 'public', 'cleanup-tokens.html');
fs.writeFileSync(cleanupPagePath, cleanupPage);

console.log('✅ Página de limpieza creada:', cleanupPagePath);
console.log('🌐 Accede a: http://localhost:3000/cleanup-tokens.html');

console.log('\n🎯 SOLUCIÓN RÁPIDA:');
console.log('   1. Ve a: http://localhost:3000/cleanup-tokens.html');
console.log('   2. Espera a que se complete la limpieza');
console.log('   3. Serás redirigido al login');
console.log('   4. Inicia sesión nuevamente');

console.log('\n🔧 SOLUCIÓN MANUAL:');
console.log('   1. Abre las herramientas de desarrollador (F12)');
console.log('   2. Ve a la consola');
console.log('   3. Ejecuta: localStorage.clear(); sessionStorage.clear();');
console.log('   4. Recarga la página');
console.log('   5. Inicia sesión nuevamente');
