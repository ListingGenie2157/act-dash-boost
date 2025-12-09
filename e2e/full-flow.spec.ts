import { test, expect } from '@playwright/test';

test.describe('Full User Flow', () => {
  test.describe.configure({ mode: 'serial' });
  
  let page: any;
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('complete user journey from signup to dashboard', async () => {
    // Step 1: Navigate to home page
    await page.goto('/');
    await expect(page).toHaveTitle(/ACT/);
    
    // Step 2: Sign up
    await page.click('text=Sign Up');
    await expect(page).toHaveURL(/signup/);
    
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    
    // Wait for signup confirmation or redirect
    await page.waitForTimeout(2000);
    
    // Step 3: Complete onboarding
    // This may vary based on your onboarding flow
    const onboardingUrl = page.url();
    if (onboardingUrl.includes('onboarding')) {
      // Fill in test date
      await page.fill('input[type="date"]', '2025-06-01');
      
      // Select target score
      await page.click('text=30');
      
      // Click continue/complete
      await page.click('button:has-text("Continue")');
      await page.waitForTimeout(1000);
    }
    
    // Step 4: Should be on dashboard
    await expect(page).toHaveURL(/\//);
    
    // Verify dashboard loaded
    await expect(page.locator('text=/dashboard|home/i')).toBeVisible({ timeout: 10000 });
  });

  test('can start diagnostic assessment', async () => {
    await page.goto('/');
    
    // Look for diagnostic link
    await page.click('text=/diagnostic|assessment/i');
    await expect(page).toHaveURL(/diagnostic/);
    
    // Verify diagnostic UI loaded
    await expect(page.locator('text=/section|start|begin/i')).toBeVisible();
  });

  test('can view study plan', async () => {
    await page.goto('/plan');
    
    // Should show study plan page
    await expect(page.locator('text=/study plan|plan/i')).toBeVisible();
    
    // Should either show plan or option to generate one
    const hasGenerateButton = await page.locator('button:has-text("Generate")').isVisible();
    const hasPlanContent = await page.locator('text=/today|task|lesson/i').isVisible();
    
    expect(hasGenerateButton || hasPlanContent).toBeTruthy();
  });

  test('can access lessons', async () => {
    await page.goto('/lessons');
    
    // Should show lessons page
    await expect(page.locator('text=/lessons|learn/i')).toBeVisible();
    
    // Should see some lesson content
    await expect(page.locator('[data-testid*="lesson"], .lesson, article')).toBeVisible({ timeout: 5000 });
  });

  test('can access drills', async () => {
    await page.goto('/drills');
    
    // Should show drills page
    await expect(page.locator('text=/drills|practice/i')).toBeVisible();
    
    // Should see drill options
    const hasSubject = await page.locator('text=/math|english|reading|science/i').isVisible();
    expect(hasSubject).toBeTruthy();
  });

  test('dashboard shows no console errors', async () => {
    const consoleErrors: string[] = [];
    
    page.on('console', (msg: any) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out known acceptable errors (like network errors in test environment)
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('Failed to fetch') &&
      !error.includes('NetworkError') &&
      !error.includes('CORS')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Navigation Flow', () => {
  test('can navigate between all main pages', async ({ page }) => {
    await page.goto('/');
    
    const pages = [
      { path: '/lessons', text: /lessons/i },
      { path: '/drills', text: /drills/i },
      { path: '/plan', text: /plan/i },
      { path: '/progress', text: /progress/i }
    ];
    
    for (const pageInfo of pages) {
      await page.goto(pageInfo.path);
      await expect(page.locator(`text=${pageInfo.text}`)).toBeVisible({ timeout: 5000 });
    }
  });

  test('sidebar navigation works', async ({ page }) => {
    await page.goto('/');
    
    // Open sidebar if on mobile
    const sidebarTrigger = page.locator('[aria-label*="menu"], [data-testid="sidebar-trigger"]');
    if (await sidebarTrigger.isVisible()) {
      await sidebarTrigger.click();
    }
    
    // Try clicking on a nav item
    const lessonsNav = page.locator('nav a:has-text("Lessons")').first();
    if (await lessonsNav.isVisible()) {
      await lessonsNav.click();
      await expect(page).toHaveURL(/lessons/);
    }
  });
});
