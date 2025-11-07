const { test, expect } = require('@playwright/test');

test.describe('Pruebas de Login', () => {
  
  test('debe mostrar la página de login', async ({ page }) => {
    await page.goto('/');
    
    // Verificar que estamos en la página de login
    await expect(page).toHaveURL(/login|index/);
    
    // Verificar que existen los campos de usuario y contraseña
    const usuarioInput = page.locator('input[name="usuario"], input[id="usuario"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[id="password"], input[type="password"]').first();
    
    await expect(usuarioInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('debe mostrar error con credenciales inválidas', async ({ page }) => {
    await page.goto('/');
    
    // Llenar formulario con credenciales inválidas
    const usuarioInput = page.locator('input[name="usuario"], input[id="usuario"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[id="password"], input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"], button:has-text("Iniciar"), button:has-text("Login")').first();
    
    await usuarioInput.fill('usuario_inexistente@test.com');
    await passwordInput.fill('password_incorrecto');
    await submitButton.click();
    
    // Esperar respuesta (puede ser mensaje de error o redirección)
    await page.waitForTimeout(2000);
    
    // Verificar que no se redirigió al dashboard (o que muestra error)
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/dashboard');
  });

  test('debe navegar correctamente a la página de registro', async ({ page }) => {
    await page.goto('/');
    
    // Buscar enlace de registro
    const registroLink = page.locator('a:has-text("Registro"), a:has-text("Registrarse"), a[href*="registro"]').first();
    
    if (await registroLink.count() > 0) {
      await registroLink.click();
      await page.waitForTimeout(1000);
      
      // Verificar que estamos en la página de registro
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/registro|register/i);
    }
  });
});

test.describe('Pruebas de Navegación', () => {
  
  test('debe cargar la página principal', async ({ page }) => {
    await page.goto('/');
    
    // Verificar que la página carga sin errores 500
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(500);
    
    // Verificar que hay contenido en la página
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('debe tener elementos de Bootstrap cargados', async ({ page }) => {
    await page.goto('/');
    
    // Verificar que Bootstrap está cargado (buscar clases comunes)
    const bootstrapElements = page.locator('.container, .btn, .form-control, .navbar').first();
    
    if (await bootstrapElements.count() > 0) {
      await expect(bootstrapElements).toBeVisible();
    }
  });
});

