import { test, expect } from '@playwright/test';

test('homepage loads successfully', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/ACT/);
});

test('can navigate to login page', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Login');
  await expect(page).toHaveURL(/login/);
});

test('landing page has call-to-action buttons', async ({ page }) => {
  await page.goto('/');
  const cta = page.locator('a[href*="login"], a[href*="pricing"], button:has-text("Start"), button:has-text("Get Started")');
  await expect(cta.first()).toBeVisible();
});

test('pricing page loads and shows plan options', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page.locator('text=/month/i').first()).toBeVisible();
});

test('login page shows email input', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first()).toBeVisible();
});

test('404 page renders for invalid routes', async ({ page }) => {
  await page.goto('/this-route-does-not-exist-12345');
  await expect(page.locator('text=/not found|404/i').first()).toBeVisible();
});
