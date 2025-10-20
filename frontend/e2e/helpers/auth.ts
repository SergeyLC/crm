import { Page } from '@playwright/test';

export const mockUser = {
  id: "63b0819c-08ea-4a66-9166-769760db12c1",
  email: "test.client@example.com",
  firstName: "Test",
  lastName: "User",
  role: "ADMIN",
};

export async function setupAuth(page: Page) {
  // Mock authentication endpoints
  await page.route('**/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        token: 'test-token',
        user: mockUser,
      }),
    });
  });

  await page.route('**/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        user: mockUser,
      }),
    });
  });

  // Set authentication token in localStorage
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'test-token');
  });
}
