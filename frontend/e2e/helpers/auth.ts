import { Page } from '@playwright/test';

export const mockUser = {
  id: "63b0819c-08ea-4a66-9166-769760db12c1",
  email: "test.client@example.com",
  firstName: "Test",
  lastName: "User",
  role: "ADMIN",
};

const SESSION_COOKIE = "crm_session";

export async function setupAuth(page: Page) {
  // Mock authentication endpoints (cookie session — no token in JSON)
  await page.route('**/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {
        'Set-Cookie': `${SESSION_COOKIE}=test-token; Path=/; HttpOnly; SameSite=Lax`,
      },
      body: JSON.stringify({
        success: true,
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

  // Inject HttpOnly-equivalent session cookie for the test origin
  await page.context().addCookies([
    {
      name: SESSION_COOKIE,
      value: 'test-token',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}
