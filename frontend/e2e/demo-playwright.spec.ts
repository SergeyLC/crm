import { test, expect } from '@playwright/test';

test.describe('Demo E2E Test (No Server Required)', () => {
  test('should verify Playwright configuration is working', async ({ page }) => {
    // Visit a simple static page
    await page.goto('https://example.com');
    
    // Basic assertions to prove Playwright works
    await expect(page).toHaveTitle(/Example Domain/);
    await expect(page.locator('h1')).toContainText('Example Domain');
    
    // Test that we can interact with elements
    await expect(page.locator('body')).toBeVisible();
  });

  test('should test localStorage functionality', async ({ page }) => {
    await page.goto('https://example.com');
    
    // Test localStorage operations
    await page.evaluate(() => {
      window.localStorage.setItem('test-key', 'test-value');
    });
    
    const value = await page.evaluate(() => {
      return window.localStorage.getItem('test-key');
    });
    
    expect(value).toBe('test-value');
  });

  test('should test basic DOM interactions', async ({ page }) => {
    await page.goto('https://example.com');
    
    // Test that we can find and interact with elements
    await page.locator('body').click();
    await expect(page.locator('h1')).toBeVisible();
    
    // Test viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('body')).toBeVisible();
  });
});
