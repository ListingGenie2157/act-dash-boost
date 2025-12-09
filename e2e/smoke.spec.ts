import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/ACT/);
  });

  test('can navigate to login page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Login');
    await expect(page).toHaveURL(/login/);
  });

  test('no console errors on homepage', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(consoleErrors.length).toBe(0);
  });

  test('key pages load without errors', async ({ page }) => {
    const pages = ['/lessons', '/plan', '/weak-areas'];
    
    for (const path of pages) {
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto(path);
      await page.waitForLoadState('networkidle');
      
      // Allow some pages to require auth (redirect to login)
      const currentUrl = page.url();
      if (!currentUrl.includes('/login')) {
        expect(consoleErrors.length).toBe(0);
      }
    }
  });
});