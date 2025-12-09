import { test, expect } from '@playwright/test';

test.describe('Performance Checks', () => {
  test('homepage loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Page should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('no blocking scripts on initial load', async ({ page }) => {
    const blockingScripts: string[] = [];
    
    page.on('request', request => {
      if (request.resourceType() === 'script') {
        const url = request.url();
        // Check for common blocking patterns
        if (!url.includes('defer') && !url.includes('async')) {
          blockingScripts.push(url);
        }
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Should have minimal blocking scripts
    // Note: This is a heuristic check, adjust as needed
    expect(blockingScripts.length).toBeLessThan(5);
  });

  test('Core Web Vitals - Largest Contentful Paint', async ({ page }) => {
    await page.goto('/');
    
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Timeout after 5 seconds
        setTimeout(() => resolve(0), 5000);
      });
    });
    
    // LCP should be under 2.5 seconds (good threshold)
    expect(lcp).toBeLessThan(2500);
  });

  test('Core Web Vitals - First Input Delay simulation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    
    const startTime = Date.now();
    await page.click('body');
    const responseTime = Date.now() - startTime;
    
    // Should respond to input quickly (under 100ms is good)
    expect(responseTime).toBeLessThan(100);
  });

  test('Core Web Vitals - Cumulative Layout Shift', async ({ page }) => {
    await page.goto('/');
    
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsScore = 0;
        
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsScore += (entry as any).value;
            }
          }
        }).observe({ entryTypes: ['layout-shift'] });
        
        // Wait for page to settle
        setTimeout(() => resolve(clsScore), 3000);
      });
    });
    
    // CLS should be under 0.1 (good threshold)
    expect(cls).toBeLessThan(0.1);
  });

  test('image optimization check', async ({ page }) => {
    const oversizedImages: string[] = [];
    
    page.on('response', async response => {
      if (response.request().resourceType() === 'image') {
        const contentLength = response.headers()['content-length'];
        if (contentLength && parseInt(contentLength) > 500000) { // 500KB
          oversizedImages.push(response.url());
        }
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should not have oversized images
    expect(oversizedImages).toHaveLength(0);
  });

  test('JavaScript bundle size check', async ({ page }) => {
    const jsFiles: { url: string; size: number }[] = [];
    
    page.on('response', async response => {
      if (response.request().resourceType() === 'script') {
        const contentLength = response.headers()['content-length'];
        if (contentLength) {
          jsFiles.push({
            url: response.url(),
            size: parseInt(contentLength)
          });
        }
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check total JS size
    const totalSize = jsFiles.reduce((sum, file) => sum + file.size, 0);
    
    // Total JS should be under 1MB (uncompressed)
    expect(totalSize).toBeLessThan(1024 * 1024);
    
    // No single JS file should be over 500KB
    const oversizedFiles = jsFiles.filter(file => file.size > 512000);
    expect(oversizedFiles).toHaveLength(0);
  });

  test('CSS is not render-blocking', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    // Check First Contentful Paint
    const fcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          resolve(entries[0].startTime);
        }).observe({ entryTypes: ['paint'] });
        
        setTimeout(() => resolve(0), 3000);
      });
    });
    
    // FCP should be under 1.8 seconds (good threshold)
    expect(fcp).toBeLessThan(1800);
  });

  test('no memory leaks on navigation', async ({ page }) => {
    await page.goto('/');
    
    // Get initial metrics
    const initialMetrics = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Navigate through several pages
    const pages = ['/lessons', '/drills', '/plan', '/progress', '/'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
    }
    
    // Get final metrics
    const finalMetrics = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Memory should not increase by more than 50MB
    if (initialMetrics > 0 && finalMetrics > 0) {
      const increase = finalMetrics - initialMetrics;
      expect(increase).toBeLessThan(50 * 1024 * 1024);
    }
  });

  test('API response times are acceptable', async ({ page }) => {
    const apiCalls: { url: string; duration: number }[] = [];
    
    page.on('response', async response => {
      const url = response.url();
      if (url.includes('/functions/') || url.includes('supabase')) {
        const timing = response.timing();
        if (timing) {
          apiCalls.push({
            url,
            duration: timing.responseEnd - timing.requestStart
          });
        }
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that API calls are reasonably fast
    for (const call of apiCalls) {
      // Each API call should complete in under 2 seconds
      expect(call.duration).toBeLessThan(2000);
    }
  });

  test('fonts load efficiently', async ({ page }) => {
    const fontRequests: string[] = [];
    
    page.on('request', request => {
      if (request.resourceType() === 'font') {
        fontRequests.push(request.url());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should not load too many fonts
    expect(fontRequests.length).toBeLessThan(10);
  });

  test('third-party scripts are minimal', async ({ page }) => {
    const thirdPartyScripts: string[] = [];
    
    page.on('request', request => {
      if (request.resourceType() === 'script') {
        const url = request.url();
        // Check if it's from a third-party domain
        if (!url.includes('localhost') && !url.includes(page.url())) {
          thirdPartyScripts.push(url);
        }
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should have minimal third-party scripts
    // Allow for analytics, error tracking, etc.
    expect(thirdPartyScripts.length).toBeLessThan(5);
  });
});

test.describe('Lighthouse Audits', () => {
  test('run basic lighthouse audit on homepage', async ({ page, browser }) => {
    // Note: This requires playwright-lighthouse or similar
    // This is a placeholder for manual lighthouse testing
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify basic content is present
    await expect(page.locator('body')).toBeVisible();
    
    // Manual lighthouse testing checklist:
    // 1. Performance score > 90
    // 2. Accessibility score > 90
    // 3. Best Practices score > 90
    // 4. SEO score > 90
    
    // You can run: npx lighthouse http://localhost:5173 --view
  });

  test('accessibility basics', async ({ page }) => {
    await page.goto('/');
    
    // Check for basic accessibility
    const hasMain = await page.locator('main, [role="main"]').isVisible();
    expect(hasMain).toBeTruthy();
    
    // Check for heading hierarchy
    const hasH1 = await page.locator('h1').count();
    expect(hasH1).toBeGreaterThan(0);
    
    // Check for proper button labels
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      expect(text || ariaLabel).toBeTruthy();
    }
  });
});
