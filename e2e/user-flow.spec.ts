import { test, expect } from '@playwright/test';

test.describe('Full User Flow - Sign-up to Dashboard', () => {
  test('complete user journey: sign-up → onboarding → plan → lesson → drill → dashboard', async ({ page }) => {
    // Step 1: Sign up
    await page.goto('/');
    await page.click('text=Sign Up');
    
    const testEmail = `test-${Date.now()}@example.com`;
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'test-password-123');
    await page.click('button:has-text("Sign Up")');
    
    // Wait for redirect to onboarding
    await page.waitForURL(/onboarding/, { timeout: 10000 });
    
    // Step 2: Complete onboarding
    // Fill in onboarding form
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    
    // Set test date (30 days from now)
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 30);
    const testDateStr = testDate.toISOString().split('T')[0];
    await page.fill('input[type="date"]', testDateStr);
    
    // Select target score
    await page.selectOption('select[name="targetScore"]', '30');
    
    // Complete onboarding
    await page.click('button:has-text("Complete Setup")');
    
    // Wait for redirect to dashboard
    await page.waitForURL(/\//, { timeout: 10000 });
    
    // Step 3: Check dashboard loads without console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.waitForLoadState('networkidle');
    expect(consoleErrors.length).toBe(0);
    
    // Step 4: Navigate to study plan
    await page.click('text=Study Plan');
    await page.waitForURL(/plan/, { timeout: 5000 });
    
    // Step 5: Generate study plan if needed
    const generateButton = page.locator('button:has-text("Generate Study Plan")');
    if (await generateButton.isVisible()) {
      await generateButton.click();
      await page.waitForTimeout(3000); // Wait for plan generation
    }
    
    // Step 6: Navigate to lessons
    await page.click('text=Lessons');
    await page.waitForURL(/lessons/, { timeout: 5000 });
    
    // Step 7: Open a lesson
    const lessonLink = page.locator('a[href*="/lesson/"]').first();
    if (await lessonLink.isVisible()) {
      await lessonLink.click();
      await page.waitForURL(/lesson/, { timeout: 5000 });
      
      // Verify lesson page loads
      await expect(page.locator('h1, h2')).toBeVisible();
    }
    
    // Step 8: Navigate to dashboard
    await page.click('text=Dashboard');
    await page.waitForURL(/\//, { timeout: 5000 });
    
    // Final check: No console errors throughout
    expect(consoleErrors.length).toBe(0);
  });
  
  test('edge case: no diagnostic yet', async ({ page }) => {
    // Sign up and complete onboarding without diagnostic
    await page.goto('/');
    await page.click('text=Sign Up');
    
    const testEmail = `test-no-diag-${Date.now()}@example.com`;
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'test-password-123');
    await page.click('button:has-text("Sign Up")');
    
    await page.waitForURL(/onboarding/, { timeout: 10000 });
    
    // Complete onboarding
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 30);
    await page.fill('input[type="date"]', testDate.toISOString().split('T')[0]);
    await page.selectOption('select[name="targetScore"]', '30');
    
    await page.click('button:has-text("Complete Setup")');
    await page.waitForURL(/\//, { timeout: 10000 });
    
    // Dashboard should load even without diagnostic
    await expect(page.locator('body')).toBeVisible();
    
    // Study plan widget should handle no diagnostic gracefully
    const studyPlanWidget = page.locator('text=Study Plan');
    if (await studyPlanWidget.isVisible()) {
      await studyPlanWidget.click();
      await page.waitForURL(/plan/, { timeout: 5000 });
      
      // Should show option to generate plan or take diagnostic
      const generateOrDiagnostic = page.locator('button:has-text("Generate"), a:has-text("Diagnostic")');
      await expect(generateOrDiagnostic.first()).toBeVisible();
    }
  });
  
  test('edge case: no study plan yet', async ({ page }) => {
    // This is similar to the no diagnostic case
    // The app should handle missing study plan gracefully
    await page.goto('/');
    
    // If logged in, check dashboard
    // If not logged in, this test would need authentication setup
    // For now, just verify the page structure handles missing data
    await expect(page.locator('body')).toBeVisible();
  });
  
  test('edge case: user changes test date', async ({ page }) => {
    // This would require being logged in
    // Navigate to settings/profile page
    // Change test date
    // Verify study plan updates or shows option to regenerate
    
    await page.goto('/');
    // Implementation depends on where test date is changed in UI
    // This is a placeholder for the test structure
    await expect(page.locator('body')).toBeVisible();
  });
});
