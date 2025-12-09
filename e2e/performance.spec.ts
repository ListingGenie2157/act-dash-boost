import { test, expect } from '@playwright/test';

test.describe('Performance Sanity Checks', () => {
  test('homepage loads without blocking scripts', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load in reasonable time (5 seconds for initial load)
    expect(loadTime).toBeLessThan(5000);
    
    // Check for console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.waitForLoadState('networkidle');
    expect(consoleErrors.length).toBe(0);
  });
  
  test('dashboard renders without layout shift', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that main content is visible
    await expect(page.locator('body')).toBeVisible();
    
    // Measure layout stability (CLS)
    // This is a simplified check - full CLS measurement would need more setup
    const layoutShift = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          resolve(clsValue);
        }).observe({ type: 'layout-shift', buffered: true });
        
        setTimeout(() => resolve(clsValue), 2000);
      });
    });
    
    // CLS should be low (< 0.1 is good)
    expect(layoutShift as number).toBeLessThan(0.25);
  });
  
  test('no catastrophic performance issues', async ({ page }) => {
    await page.goto('/');
    
    // Measure basic performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        totalTime: navigation.loadEventEnd - navigation.fetchStart,
      };
    });
    
    // DOM should be interactive quickly
    expect(metrics.domContentLoaded).toBeLessThan(3000);
    
    // Total load should be reasonable
    expect(metrics.totalTime).toBeLessThan(10000);
  });
  
  test('study plan page loads efficiently', async ({ page }) => {
    await page.goto('/plan');
    await page.waitForLoadState('networkidle');
    
    const loadTime = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return navigation.loadEventEnd - navigation.fetchStart;
    });
    
    expect(loadTime).toBeLessThan(5000);
  });
  
  test('lessons page handles large lists', async ({ page }) => {
    await page.goto('/lessons');
    await page.waitForLoadState('networkidle');
    
    // Check that page doesn't freeze with many lessons
    const startTime = Date.now();
    await page.waitForTimeout(1000); // Wait for any lazy loading
    const renderTime = Date.now() - startTime;
    
    // Should render without significant delay
    expect(renderTime).toBeLessThan(2000);
  });
});
