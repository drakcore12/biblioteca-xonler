#!/usr/bin/env node

/**
 * Script para actualizar todas las páginas guest para usar componentes centralizados
 */

const fs = require('fs');
const path = require('path');

const guestPagesDir = path.join(__dirname, '../public/pages/guest');
const pages = ['contacto.html', 'bibliotecas.html', 'reset-password.html'];

// Template para reemplazar header
const headerReplacement = `    <!-- Header cargado dinámicamente -->
    <div id="guest-header"></div>`;

// Template para reemplazar footer
const footerReplacement = `    <!-- Footer cargado dinámicamente -->
    <div id="guest-footer"></div>`;

// Script de importación a agregar
const importScript = `    import { loadGuestLayout } from '/services/component-loader.services.js';`;

// Función para actualizar una página
function updatePage(pageName) {
  const filePath = path.join(guestPagesDir, pageName);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Archivo no encontrado: ${pageName}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;

  // Determinar página activa basada en el nombre del archivo
  const activePage = pageName.replace('.html', '');

  // Reemplazar header
  const headerRegex = /<header class="bg-dark text-white py-3">[\s\S]*?<\/header>/;
  if (headerRegex.test(content)) {
    content = content.replace(headerRegex, headerReplacement);
    updated = true;
    console.log(`✅ Header actualizado en ${pageName}`);
  }

  // Reemplazar footer
  const footerRegex = /<footer class="bg-dark text-white py-4[\s\S]*?<\/footer>/;
  if (footerRegex.test(content)) {
    content = content.replace(footerRegex, footerReplacement);
    updated = true;
    console.log(`✅ Footer actualizado en ${pageName}`);
  }

  // Agregar import del component loader
  const scriptModuleRegex = /<script type="module">/;
  if (scriptModuleRegex.test(content) && !content.includes('component-loader.services.js')) {
    content = content.replace(scriptModuleRegex, `<script type="module">\n    ${importScript}`);
    updated = true;
    console.log(`✅ Import agregado en ${pageName}`);
  }

  // Agregar loadGuestLayout al DOMContentLoaded
  const domContentLoadedRegex = /document\.addEventListener\('DOMContentLoaded',\s*\(\)\s*=>\s*{/;
  if (domContentLoadedRegex.test(content) && !content.includes('loadGuestLayout')) {
    content = content.replace(
      domContentLoadedRegex,
      `document.addEventListener('DOMContentLoaded', async () => {\n        // Cargar componentes de layout\n        await loadGuestLayout('${activePage}');\n        \n        `
    );
    updated = true;
    console.log(`✅ loadGuestLayout agregado en ${pageName}`);
  }

  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`🎉 ${pageName} actualizado exitosamente`);
  } else {
    console.log(`ℹ️  ${pageName} no necesitaba actualizaciones`);
  }
}

// Ejecutar actualizaciones
console.log('🚀 Actualizando páginas guest para usar componentes centralizados...\n');

pages.forEach(page => {
  updatePage(page);
});

console.log('\n✅ Actualización completada!');
console.log('\n📝 Páginas actualizadas:');
pages.forEach(page => {
  console.log(`   - ${page}`);
});

console.log('\n🔧 Para completar la migración:');
console.log('   1. Verificar que todas las páginas cargan correctamente');
console.log('   2. Probar la navegación entre páginas');
console.log('   3. Verificar que la página activa se marca correctamente');
