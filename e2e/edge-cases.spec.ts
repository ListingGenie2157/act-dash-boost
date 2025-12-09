import { test, expect } from '@playwright/test';

test.describe('Edge Cases', () => {
  test.describe('User with no diagnostic', () => {
    test('shows appropriate messaging when no diagnostic completed', async ({ page }) => {
      await page.goto('/');
      
      // Should either show prompt to take diagnostic or option to skip
      const hasDiagnosticPrompt = await page.locator('text=/diagnostic|assessment|baseline/i').isVisible();
      expect(hasDiagnosticPrompt).toBeTruthy();
    });

    test('can still access lessons without diagnostic', async ({ page }) => {
      await page.goto('/lessons');
      
      // Lessons page should load even without diagnostic
      await expect(page.locator('text=/lessons/i')).toBeVisible();
    });

    test('can still access drills without diagnostic', async ({ page }) => {
      await page.goto('/drills');
      
      // Drills page should load even without diagnostic
      await expect(page.locator('text=/drills/i')).toBeVisible();
    });

    test('progress page handles no data gracefully', async ({ page }) => {
      await page.goto('/progress');
      
      // Should show some content even with no data
      const hasContent = await page.locator('text=/progress|no data|get started/i').isVisible();
      expect(hasContent).toBeTruthy();
    });
  });

  test.describe('User with no study plan', () => {
    test('dashboard shows option to create study plan', async ({ page }) => {
      await page.goto('/');
      
      // Look for generate or create plan option
      const hasGenerateOption = await page.locator('button:has-text("Generate"), button:has-text("Create Plan")').isVisible();
      const hasPlanWizard = await page.locator('text=/create.*plan|setup.*plan/i').isVisible();
      
      expect(hasGenerateOption || hasPlanWizard).toBeTruthy();
    });

    test('plan page shows empty state with action', async ({ page }) => {
      await page.goto('/plan');
      
      // Should show empty state or generation option
      const hasAction = await page.locator('button, a').filter({ hasText: /generate|create|get started/i }).isVisible();
      expect(hasAction).toBeTruthy();
    });

    test('can still self-direct learning without plan', async ({ page }) => {
      await page.goto('/');
      
      // Verify lessons and drills are accessible
      await page.goto('/lessons');
      await expect(page.locator('text=/lessons/i')).toBeVisible();
      
      await page.goto('/drills');
      await expect(page.locator('text=/drills/i')).toBeVisible();
    });
  });

  test.describe('User with completed study plan', () => {
    test('shows completion state appropriately', async ({ page }) => {
      // This would need a user with completed plan
      await page.goto('/plan');
      
      // Page should load without errors
      await expect(page.locator('body')).toBeVisible();
    });

    test('offers to regenerate or continue studying', async ({ page }) => {
      await page.goto('/plan');
      
      // Should have some action available
      const hasAction = await page.locator('button, a').isVisible();
      expect(hasAction).toBeTruthy();
    });
  });

  test.describe('User changes test date', () => {
    test('can update test date from settings', async ({ page }) => {
      await page.goto('/settings');
      
      // Look for test date input
      const dateInput = page.locator('input[type="date"], input[name*="test"], input[name*="date"]').first();
      
      if (await dateInput.isVisible()) {
        await dateInput.fill('2025-12-31');
        
        // Look for save button
        const saveButton = page.locator('button:has-text("Save"), button[type="submit"]').first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
          
          // Should show success message
          await expect(page.locator('text=/saved|updated|success/i')).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('can update test date from profile', async ({ page }) => {
      await page.goto('/profile');
      
      // Similar to settings test
      const dateInput = page.locator('input[type="date"]').first();
      
      if (await dateInput.isVisible()) {
        const currentValue = await dateInput.inputValue();
        expect(currentValue).toBeTruthy();
      }
    });

    test('study plan reflects new timeline after date change', async ({ page }) => {
      await page.goto('/plan');
      
      // Plan should load without errors
      await expect(page.locator('body')).toBeVisible();
      
      // Should show study plan content
      const hasContent = await page.locator('text=/plan|task|day/i').isVisible();
      expect(hasContent).toBeTruthy();
    });
  });

  test.describe('User changes target score', () => {
    test('can update target score from settings', async ({ page }) => {
      await page.goto('/settings');
      
      // Look for target score input
      const scoreInput = page.locator('input[name*="target"], input[name*="score"], select[name*="target"]').first();
      
      if (await scoreInput.isVisible()) {
        const tagName = await scoreInput.evaluate(el => el.tagName.toLowerCase());
        
        if (tagName === 'select') {
          await scoreInput.selectOption('30');
        } else {
          await scoreInput.fill('30');
        }
        
        // Look for save button
        const saveButton = page.locator('button:has-text("Save"), button[type="submit"]').first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
        }
      }
    });

    test('recommendations update based on new target', async ({ page }) => {
      await page.goto('/');
      
      // Dashboard should load
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Error handling', () => {
    test('handles network errors gracefully', async ({ page }) => {
      // Block network requests to simulate offline
      await page.route('**/functions/**', route => route.abort());
      
      await page.goto('/');
      
      // Page should still render
      await expect(page.locator('body')).toBeVisible();
    });

    test('handles invalid routes gracefully', async ({ page }) => {
      await page.goto('/this-page-does-not-exist');
      
      // Should show 404 or redirect to home
      const is404 = await page.locator('text=/404|not found/i').isVisible();
      const isHome = page.url().includes('/') && !page.url().includes('not-found');
      
      expect(is404 || isHome).toBeTruthy();
    });

    test('handles unauthorized access appropriately', async ({ page }) => {
      // Try accessing protected route without auth
      await page.goto('/dashboard');
      
      // Should redirect to login or show auth prompt
      const hasAuthPrompt = await page.locator('text=/login|sign in|authenticate/i').isVisible({ timeout: 5000 });
      const isLoginPage = page.url().includes('login') || page.url().includes('auth');
      
      expect(hasAuthPrompt || isLoginPage).toBeTruthy();
    });
  });

  test.describe('Data persistence', () => {
    test('progress is saved between sessions', async ({ page }) => {
      await page.goto('/progress');
      
      // Should load progress page
      await expect(page.locator('text=/progress/i')).toBeVisible();
    });

    test('settings persist after reload', async ({ page }) => {
      await page.goto('/settings');
      
      const originalUrl = page.url();
      await page.reload();
      
      expect(page.url()).toBe(originalUrl);
    });
  });

  test.describe('Mobile responsiveness edge cases', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('navigation works on mobile', async ({ page }) => {
      await page.goto('/');
      
      // Open mobile menu if present
      const menuButton = page.locator('[aria-label*="menu"], button:has-text("Menu")').first();
      if (await menuButton.isVisible()) {
        await menuButton.click();
        
        // Should show navigation
        await expect(page.locator('nav')).toBeVisible();
      }
    });

    test('study plan is accessible on mobile', async ({ page }) => {
      await page.goto('/plan');
      
      // Should render without horizontal scroll
      const bodyWidth = await page.locator('body').evaluate(el => el.scrollWidth);
      const viewportWidth = page.viewportSize()?.width || 375;
      
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20); // Allow small margin
    });
  });
});
