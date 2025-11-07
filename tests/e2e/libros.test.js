const { test, expect } = require('@playwright/test');

test.describe('Pruebas de Gestión de Libros', () => {
  
  test('debe cargar la página de libros (guest)', async ({ page }) => {
    await page.goto('/pages/guest/libros.html');
    
    // Verificar que la página carga
    await expect(page).toHaveURL(/libros/);
    
    // Verificar que hay contenido
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('debe mostrar formulario de búsqueda si existe', async ({ page }) => {
    await page.goto('/pages/guest/libros.html');
    
    // Buscar inputs de búsqueda
    const searchInput = page.locator('input[type="search"], input[placeholder*="buscar"], input[name*="buscar"]').first();
    
    if (await searchInput.count() > 0) {
      await expect(searchInput).toBeVisible();
    }
  });
});

