import { test, expect } from '@playwright/test';
import { setupAuth } from './helpers/auth';

test.describe.skip('Lead Management E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);

    // Visit the leads page (default locale de) with SSR disabled for testing
    await page.goto('/de/leads?disableSsr=on');
    await page.waitForLoadState('load');
  });

  test('should display leads page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Leads');
    await expect(page.getByTestId('leads-table')).toBeVisible();
  });

  test('should open lead edit dialog when clicking edit button', async ({ page }) => {
    // Assuming there's a lead edit button
    await page.getByTestId('lead-edit-btn').first().click();
    
    // Check if dialog opens
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('[role="dialog"]')).toContainText('Edit Lead');
  });

  test('should close lead edit dialog when clicking close button', async ({ page }) => {
    // Open dialog first
    await page.getByTestId('lead-edit-btn').first().click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Close dialog
    await page.locator('[aria-label="close"]').click();
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should create new lead when clicking add button', async ({ page }) => {
    // Click add new lead button
    await page.getByTestId('add-lead-btn').click();
    
    // Check if dialog opens for creation
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('[role="dialog"]')).toContainText('New Lead');
  });

  test('should validate form fields when submitting empty form', async ({ page }) => {
    // Open create dialog
    await page.getByTestId('add-lead-btn').click();
    
    // Try to submit empty form
    await page.getByTestId('save-btn').click();
    
    // Check for validation errors
    await expect(page.locator('.MuiFormHelperText-root')).toContainText('required');
  });

  test('should successfully create a new lead with valid data', async ({ page }) => {
    // Intercept API call
    await page.route('**/api/leads', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'new-lead-id' }),
        });
      }
    });
    
    // Open create dialog
    await page.getByTestId('add-lead-btn').click();
    
    // Fill form
    await page.locator('input[name="firstName"]').fill('John');
    await page.locator('input[name="lastName"]').fill('Doe');
    await page.locator('input[name="email"]').fill('john.doe@example.com');
    await page.locator('input[name="phone"]').fill('+1234567890');
    
    // Submit form
    const createPromise = page.waitForResponse(resp => 
      resp.url().includes('/api/leads') && resp.request().method() === 'POST'
    );
    await page.getByTestId('save-btn').click();
    await createPromise;
    
    // Check if dialog closes
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should filter leads by search term', async ({ page }) => {
    // Type in search field
    await page.getByTestId('search-input').fill('John');
    
    // Check if table updates
    await expect(page.getByTestId('leads-table')).toContainText('John');
  });

  test('should sort leads by column', async ({ page }) => {
    // Click on name column header to sort
    await page.getByTestId('sort-name').click();
    
    // Check if table is sorted (this would depend on your implementation)
    await expect(page.getByTestId('leads-table').locator('tbody tr').first()).toContainText('A');
  });

  test('should archive a lead', async ({ page }) => {
    // Intercept API call
    await page.route(/\/api\/leads\/.*\/archive/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });
    
    // Click archive button
    await page.getByTestId('archive-lead-btn').first().click();
    
    // Confirm in dialog
    await page.getByTestId('confirm-archive').click();
    
    // Wait for API call
    await page.waitForResponse(resp => 
      resp.url().includes('/archive')
    );
    
    // Check if lead is removed from list
    await expect(page.getByTestId('leads-table')).not.toContainText('archived-lead');
  });
});
