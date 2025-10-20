import { test, expect, Page } from '@playwright/test';
import { setupAuth } from './helpers/auth';
import { currencyFormatter } from '../src/shared/lib/formatCurrency';
import dealsFixture from './fixtures/deals.json';
import usersFixture from './fixtures/users.json';

type DealRecord = Record<string, unknown> & {
  id: string;
  title?: string;
  assigneeId?: string | null;
  contact?: Record<string, unknown> | null;
  assignee?: Record<string, unknown> | null;
  creator?: Record<string, unknown> | null;
  potentialValue?: number | string | null;
};

type UserRecord = Record<string, unknown> & {
  id: string;
};

const cloneDeal = (deal: DealRecord): DealRecord => ({
  ...deal,
  contact: deal.contact ? { ...deal.contact } : null,
  assignee: deal.assignee ? { ...deal.assignee } : null,
  creator: deal.creator ? { ...deal.creator } : null,
  appointments: Array.isArray(deal.appointments)
    ? [...(deal.appointments as unknown[])]
    : [],
});

let dealsData: DealRecord[] = [];
let usersData: UserRecord[] = [];

const getAssignee = (assigneeId?: string | null) =>
  usersData.find((user) => user.id === assigneeId) || null;

async function setupRoutes(page: Page) {
  // Setup authentication
  await setupAuth(page);

  dealsData = (dealsFixture as DealRecord[]).map((deal) => cloneDeal(deal));
  usersData = (usersFixture as UserRecord[]).map((user) => ({ ...user }));

  await page.route('**/api/deals*', async (route) => {
    const url = route.request().url();
    if (url.includes('/archived')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(dealsData),
      });
    }
  });

  await page.route(/\/api\/deals\/[A-Za-z0-9-]+$/, async (route) => {
    const url = route.request().url();
    const dealId = url.split('/').pop();
    const deal = dealsData.find((item) => item.id === dealId);
    
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(deal || dealsData[0]),
      });
    } else if (route.request().method() === 'PUT') {
      const index = dealsData.findIndex((d) => d.id === dealId);
      const now = new Date().toISOString();

      if (index === -1) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Deal not found' }),
        });
        return;
      }

      const requestBody = route.request().postDataJSON();
      const potentialValue = requestBody?.potentialValue;
      const parsedPotentialValue =
        typeof potentialValue === 'string'
          ? Number(potentialValue.replace(/[^0-9.]/g, ''))
          : (potentialValue ?? dealsData[index]?.potentialValue ?? null);

      const updatedDeal: DealRecord = {
        ...dealsData[index],
        ...requestBody,
        potentialValue: parsedPotentialValue,
        contact: {
          ...(dealsData[index]?.contact || {}),
          ...(requestBody?.contact || {}),
        },
        assigneeId: requestBody?.assigneeId || dealsData[index]?.assigneeId,
        assignee:
          getAssignee(requestBody?.assigneeId) ||
          (dealsData[index]?.assignee as Record<string, unknown> | null) ||
          null,
        creator:
          (requestBody?.creator as Record<string, unknown> | null | undefined) ??
          (dealsData[index]?.creator as Record<string, unknown> | null) ??
          null,
        updatedAt: now,
      };

      dealsData[index] = cloneDeal(updatedDeal);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(updatedDeal),
      });
    }
  });

  await page.route('**/api/users', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(usersData),
    });
  });

  await page.route('**/api/deals', async (route) => {
    if (route.request().method() === 'POST') {
      const requestBody = route.request().postDataJSON();
      const now = new Date().toISOString();
      const potentialValue = requestBody?.potentialValue;
      const parsedPotentialValue =
        typeof potentialValue === 'string'
          ? Number(potentialValue.replace(/[^0-9.]/g, ''))
          : (potentialValue ?? null);

      const newDeal: DealRecord = {
        id: `deal-${Date.now()}`,
        ...requestBody,
        potentialValue: parsedPotentialValue,
        contact: requestBody?.contact || null,
        assigneeId: requestBody?.assigneeId || null,
        assignee: getAssignee(requestBody?.assigneeId),
        creator: requestBody?.creator || null,
        stage: requestBody?.stage || 'QUALIFIED',
        createdAt: now,
        updatedAt: now,
      };

      dealsData = [...dealsData, cloneDeal(newDeal)];

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(newDeal),
      });
    } else {
      // Let other routes handle GET requests (like the wildcard route above)
      await route.fallback();
    }
  });
}

test.describe('Deal Edit Dialog', () => {
  test.beforeEach(async ({ page }) => {
    await setupRoutes(page);
    await page.goto('/en/deals?disableSsr=on');
    await page.waitForLoadState('load');
  });

  test.describe('Create Deal', () => {
    test('should create a new deal successfully', async ({ page }) => {
      // Open create dialog
      await page.getByTestId('create-deal-button').click();

      // Verify dialog is open
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      await expect(page.locator('[role="dialog"]').locator('.MuiDialogTitle-root')).toContainText('Create Deal');

      // Fill form fields
      await page.getByTestId('title-input').fill('Test Deal from Playwright');
      await page.getByTestId('product-input').fill('Test Product');
      await page.getByTestId('potential-value-input').fill('5000');
      await page.getByTestId('name-input').fill('Test Client');
      await page.getByTestId('email-input').locator('input').fill('test.client@example.com');
      await page.getByTestId('user-select').click();
      await page.getByTestId('user-option-user-1').click();

      const createPromise = page.waitForResponse(resp => 
        resp.url().includes('/api/deals') && resp.request().method() === 'POST'
      );
      
      await page.getByTestId('submit-button').click();
      const response = await createPromise;
      
      expect(response.status()).toBe(201);

      // Verify success
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
      await expect(page.getByText('Test Deal from Playwright')).toBeVisible();

      // Verify success notification
      await expect(page.getByTestId('success-notification')).toBeVisible();
      await expect(page.getByTestId('success-notification')).toContainText('Deal created successfully');
    });

    test('should show validation errors for required fields', async ({ page }) => {
      await page.getByTestId('create-deal-button').click();

      // Try to submit without required fields
      await page.getByTestId('submit-button').click();

      // Check for validation errors
      await expect(page.getByText("Please enter the client's name.")).toBeVisible();
      await expect(page.getByTestId('name-input')).toHaveAttribute('required');

      // Dialog should still be open
      await expect(page.locator('[role="dialog"]')).toBeVisible();
    });

    test('should close dialog when cancel is clicked', async ({ page }) => {
      await page.getByTestId('create-deal-button').click();
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      await page.getByTestId('cancel-button').click();
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    });

    test('should close dialog when close icon is clicked', async ({ page }) => {
      await page.getByTestId('create-deal-button').click();
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      await page.locator('[aria-label="close"]').click();
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    });
  });

  test.describe('Update Deal', () => {
    test.beforeEach(async () => {
      const now = new Date().toISOString();
      const seedDeal: DealRecord = {
        id: 'deal-to-update',
        title: 'Deal to Update',
        productInterest: 'Original Product',
        potentialValue: 5000,
        stage: 'QUALIFIED',
        assigneeId: 'user-1',
        assignee: {
          id: 'user-1',
          name: 'Test Client',
          email: 'test.client@example.com',
        },
        creator: {
          id: 'user-1',
          name: 'Test Client',
          email: 'test.client@example.com',
        },
        contact: {
          id: 'contact-1',
          name: 'Test Client',
          email: 'test.client@example.com',
          phone: '+1234567890',
        },
        appointments: [],
        createdAt: now,
        updatedAt: now,
      };

      dealsData = [
        ...dealsData.filter((deal) => deal.id !== seedDeal.id),
        cloneDeal(seedDeal),
      ];
    });

    test('should update an existing deal successfully', async ({ page }) => {
      const dealId = 'deal-to-update';

      await page.getByTestId(`table-row-${dealId}`).getByTestId(`action-cell-button-${dealId}`).click();
      await page.getByTestId(`action-menu-${dealId}-item-edit`).click();

      await page.waitForResponse(resp => 
        resp.url().includes(`/api/deals/${dealId}`) && resp.request().method() === 'GET'
      );

      await expect(page.locator('[role="dialog"]')).toBeVisible();
      await expect(page.locator('[role="dialog"]').locator('.MuiDialogTitle-root')).toContainText('Edit Deal');

      await expect(page.getByTestId('title-input')).toHaveValue('Deal to Update');
      await expect(page.getByTestId('product-input')).toHaveValue('Original Product');
      await expect(page.getByTestId('potential-value-input')).toHaveValue('5000');

      await page.getByTestId('title-input').fill('Updated Deal Title');
      await page.getByTestId('product-input').fill('Updated Product');
      const newPotentialValue = 55555;
      await page.getByTestId('potential-value-input').fill(newPotentialValue.toString());

      const updatePromise = page.waitForResponse(resp => 
        resp.url().includes(`/api/deals/${dealId}`) && resp.request().method() === 'PUT'
      );

      await page.getByTestId('submit-button').click();
      const response = await updatePromise;

      expect(response.status()).toBe(200);

      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
      await expect(page.getByText('Updated Deal Title')).toBeVisible();
      
      const formattedValue = currencyFormatter(newPotentialValue)?.replace(/\u00A0/g, ' ') || '';
      await expect(page.getByText(formattedValue)).toBeVisible();
    });

    test('should show loading state while fetching deal data', async ({ page }) => {
      const dealId = 'deal-to-update';

      await page.route(`**/api/deals/${dealId}`, async (route) => {
        if (route.request().method() === 'GET') {
          await page.waitForTimeout(2000);
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(dealsData.find(d => d.id === dealId)),
          });
        }
      });

      await page.getByTestId(`table-row-${dealId}`).getByTestId(`action-cell-button-${dealId}`).click();
      await page.getByTestId(`action-menu-${dealId}-item-edit`).click();

      // Verify loading state
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      await expect(page.getByTestId('deal-loading-spinner')).toBeVisible();

      // Wait for data to load
      await page.waitForResponse(resp => 
        resp.url().includes(`/api/deals/${dealId}`)
      );

      // Verify form is populated
      await expect(page.getByTestId('deal-loading-spinner')).not.toBeVisible();
      await expect(page.getByTestId('title-input')).toBeVisible();
    });

    test('should handle update errors gracefully', async ({ page }) => {
      const dealId = 'deal-to-update';

      await page.route(`**/api/deals/${dealId}`, async (route) => {
        if (route.request().method() === 'PUT') {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Internal server error' }),
          });
        } else {
          await route.fallback();
        }
      });

      await page.getByTestId(`table-row-${dealId}`).getByTestId(`action-cell-button-${dealId}`).click();
      await page.getByTestId(`action-menu-${dealId}-item-edit`).click();

      // Wait for the GET request to load the deal data
      await page.waitForResponse(resp => 
        resp.url().includes(`/api/deals/${dealId}`) && resp.request().method() === 'GET'
      );

      await expect(page.locator('[role="dialog"]')).toBeVisible();
      await expect(page.getByTestId('title-input')).toBeVisible();
      
      // Verify the form is populated with existing data
      await expect(page.getByTestId('title-input')).toHaveValue('Deal to Update');
      
      // Just fill without clearing - fill() replaces the content automatically
      await page.getByTestId('title-input').fill('This will fail');
      
      // Verify the title was changed
      await expect(page.getByTestId('title-input')).toHaveValue('This will fail');
      
      // Check if submit button is enabled
      const submitButton = page.getByTestId('submit-button');
      await expect(submitButton).toBeEnabled();
      
      const [response] = await Promise.all([
        page.waitForResponse(resp => 
          resp.url().includes(`/api/deals/${dealId}`) && resp.request().method() === 'PUT'
        ),
        submitButton.click(),
      ]);

      expect(response.status()).toBe(500);

      // Dialog should remain open
      await expect(page.locator('[role="dialog"]')).toBeVisible();
    });
  });

  test.describe('Form Interactions', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByTestId('create-deal-button').click();
    });

    test('should handle form field interactions correctly', async ({ page }) => {
      // Close any open menus first
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);

      // Test text input
      await page.getByTestId('title-input').fill('Test Deal Title');
      await expect(page.getByTestId('title-input')).toHaveValue('Test Deal Title');

      // Test number input
      await page.getByTestId('potential-value-input').fill('1500.50');
      await expect(page.getByTestId('potential-value-input')).toHaveValue('1500.50');

      // Test autocomplete/select fields
      await page.getByTestId('user-select').click();
      await page.locator('[role="presentation"]').getByTestId('user-option-user-1').click();
      await expect(page.getByTestId('user-select')).toContainText('Test Client');
    });

    test('should handle appointments section', async ({ page }) => {
      // Add appointment
      await page.getByTestId('add-appointment-button').click();

      await page.getByTestId('appointment-note-0').fill('Initial meeting with client');
      await page.getByTestId('appointment-datetime-input-0').locator('input').fill('12.15.2025 10:00');

      await page.getByTestId('appointment-type-select-0').click();
      await page.getByTestId('appointment-type-MEETING').click();

      // Verify appointment is added
      await expect(page.getByTestId('appointment-type-select-0')).toBeVisible();

      // Remove appointment
      await page.getByTestId('remove-appointment-0').click();
      await expect(page.getByTestId('appointment-note-0')).not.toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByTestId('create-deal-button').click();
    });

    test('should be accessible via keyboard navigation', async ({ page }) => {
      await page.getByTestId('product-input').focus();
      await expect(page.getByTestId('product-input')).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.getByTestId('potential-value-input')).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.getByTestId('title-input')).toBeFocused();

      // Test escape key closes dialog
      await page.keyboard.press('Escape');
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    });

    test('should have proper ARIA labels and roles', async ({ page }) => {
      await expect(page.locator('[role="dialog"]')).toHaveAttribute('aria-labelledby', /.+/);
      await expect(page.locator('[aria-label="close"]')).toBeVisible();
      await expect(page.locator('form')).toHaveAttribute('id', 'deal-upsert-form');
      await expect(page.locator('[type="submit"]')).toHaveAttribute('form', 'deal-upsert-form');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      await page.route('**/api/deals', async (route) => {
        if (route.request().method() === 'POST') {
          await route.abort('failed');
        } else {
          await route.fallback();
        }
      });

      await page.getByTestId('create-deal-button').click();

      await page.getByTestId('title-input').fill('Network Error Test');
      await page.getByTestId('name-input').fill('Test Client');
      await page.getByTestId('submit-button').click();

      // Should show error message
      await expect(page.getByTestId('error-notification')).toBeVisible();
      await expect(page.getByTestId('error-notification')).toContainText('Failed to create deal');

      // Dialog should remain open
      await expect(page.locator('[role="dialog"]')).toBeVisible();
    });

    test('should handle validation errors from server', async ({ page }) => {
      await page.route('**/api/deals', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              errors: {
                title: ['Title is required'],
                potentialValue: ['Must be a positive number'],
              },
            }),
          });
        } else {
          await route.fallback();
        }
      });

      await page.getByTestId('create-deal-button').click();

      await page.getByTestId('title-input').fill('Network Error Test');
      await page.getByTestId('name-input').fill('Test Client');
      await page.getByTestId('submit-button').click();

      await page.waitForTimeout(1000);

      // Should display server validation errors in form helper text
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog.getByText('Title is required')).toBeVisible();
      await expect(dialog.getByText('Must be a positive number')).toBeVisible();
    });
  });

  test.describe('Data Persistence', () => {
    test('should preserve form data when switching between fields', async ({ page }) => {
      await page.getByTestId('create-deal-button').click();

      // Fill multiple fields
      await page.getByTestId('title-input').fill('Persistent Data Test');
      await page.getByTestId('product-input').fill('Test Product');
      await page.getByTestId('potential-value-input').fill('3000');

      // Navigate away and back to first field
      await page.getByTestId('product-input').focus();
      await page.getByTestId('title-input').focus();

      // Data should still be there
      await expect(page.getByTestId('title-input')).toHaveValue('Persistent Data Test');
      await expect(page.getByTestId('product-input')).toHaveValue('Test Product');
      await expect(page.getByTestId('potential-value-input')).toHaveValue('3000');
    });

    test('should not lose data when validation fails', async ({ page }) => {
      await page.route('**/api/deals', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Validation failed' }),
          });
        } else {
          await route.fallback();
        }
      });

      await page.getByTestId('create-deal-button').click();

      await page.getByTestId('title-input').fill('Data Persistence Test');
      await page.getByTestId('product-input').fill('Test Product');
      await page.getByTestId('name-input').fill('Test Client');

      const [response] = await Promise.all([
        page.waitForResponse(resp => 
          resp.url().includes('/api/deals') && resp.request().method() === 'POST'
        ),
        page.getByTestId('submit-button').click(),
      ]);

      expect(response.status()).toBe(400);

      // Form data should still be present after failed submission
      await expect(page.getByTestId('title-input')).toHaveValue('Data Persistence Test');
      await expect(page.getByTestId('product-input')).toHaveValue('Test Product');
    });
  });
});
