const { test, expect } = require('@playwright/test');

test.describe('Smoke checks', () => {
  test('health endpoint responds OK', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
  });

  test('home page loads', async ({ page }) => {
    const response = await page.goto('/');
    expect(response && response.ok()).toBeTruthy();
    await expect(page).toHaveURL(/\/$/);
  });
});

