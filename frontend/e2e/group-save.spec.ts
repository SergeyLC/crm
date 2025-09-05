import { test, expect, type Route } from '@playwright/test';

test.describe('Group save under slow network', () => {
  test('shows saving state and toast after replace members', async ({ page }) => {
  // (debug logging removed)
    // Adjust base URL if your dev server runs on a different port
    const base = process.env.PW_BASE_URL || 'http://localhost:3000/en/groups';

    // Stub authentication: AuthProvider may call /auth/me or /api/auth/me depending on env
  const fulfillAuth = (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, user: { id: 'u-admin', name: 'Test Admin', role: 'ADMIN' } }),
      });

    await page.route('**/auth/me', (route) => {
      const req = route.request();
      if (req.resourceType() === 'document') return route.continue();
      return fulfillAuth(route);
    });
    await page.route('**/api/auth/me', (route) => {
      const req = route.request();
      if (req.resourceType() === 'document') return route.continue();
      return fulfillAuth(route);
    });

    // Stub groups list so page shows data without backend
    const groupsPayload = JSON.stringify([
      {
        id: 'g-1',
        name: 'Team Alpha',
        leaderId: 'u-admin',
        leader: { id: 'u-admin', name: 'Test Admin' },
        members: [{ id: 'm-1', userId: 'u-1', user: { id: 'u-1', name: 'User One' } }],
      },
    ]);

    // Only stub API endpoints (avoid matching the page navigation '/en/groups')
    await page.route('**/api/groups', (route) => {
      const req = route.request();
      if (req.resourceType() === 'document') return route.continue();
      return route.fulfill({ status: 200, contentType: 'application/json', body: groupsPayload });
    });

    // Stub users list so AddMembersDialog shows available users
    const usersPayload = JSON.stringify([
      { id: 'u-1', name: 'User One', email: 'one@example.com' },
      { id: 'u-2', name: 'User Two', email: 'two@example.com' },
    ]);
    await page.route('**/api/users', (route) => {
      const req = route.request();
      if (req.resourceType() === 'document') return route.continue();
      return route.fulfill({ status: 200, contentType: 'application/json', body: usersPayload });
    });

  // Intercept the replace members request and delay response to simulate slow network
    await page.route('**/api/groups/*/members/batch', async (route) => {
      const req = route.request();
      if (req.resourceType() === 'document') return route.continue();
      // delay to simulate slowness
      await new Promise((r) => setTimeout(r, 2000));
      // return a successful final members payload
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          members: [{ id: 'm-1', userId: 'u-1', user: { id: 'u-1', name: 'User One' } }],
        }),
      });
    });

    // Ensure token is present in localStorage so AuthProvider will call /auth/me
    await page.addInitScript(() => {
      localStorage.setItem('token', 'test-token');
    });

  // (fetch instrumentation and page console logging removed)

  // Navigate and wait for the stubbed group's name to appear in the table
  await page.goto(base, { waitUntil: 'networkidle' });
  await expect(page.locator('text=Team Alpha')).toBeVisible({ timeout: 10_000 });
  // Ensure the table is visible
  await expect(page.locator('table[aria-label="groups table"]')).toBeVisible({ timeout: 5000 });

  // Click the edit button for our stubbed group (data-testid added)
  const editBtn = page.locator('[data-testid="group-edit-g-1"]');
  await expect(editBtn).toBeVisible({ timeout: 5000 });
  await editBtn.click();

    // Dialog should open
    const dialog = page.locator('role=dialog');
    await expect(dialog).toBeVisible();

    // Click "Add Member" to open dialog and confirm adding if button present
    const addButton = dialog.locator('[data-testid="group-add-members"]');
    if (await addButton.count() > 0) {
      await addButton.click();
      // target the Add Members dialog specifically by its title text
      const addDialog = page.locator('role=dialog').filter({ hasText: /Add Members/i }).first();
      await expect(addDialog).toBeVisible({ timeout: 3000 });

      // select the first available list item in the add dialog (triggers onToggleUser)
      const firstListItem = addDialog.locator('role=listitem').first();
      if (await firstListItem.count() > 0) {
        await firstListItem.click();
      }

      // Confirm add: find the Add button in the add dialog actions and click it
      const addConfirm = addDialog.locator('button').filter({ hasText: /Add Selected Members|Add \d+ Member|Add Members|Add Selected|Add/i }).last();
      await expect(addConfirm).toBeEnabled({ timeout: 3000 });
      await addConfirm.click();

  // wait for the add dialog to close
  await expect(addDialog).toBeHidden({ timeout: 3000 });
    }

    // Click Save All Changes
    const saveBtn = dialog.locator('[data-testid="group-save-all"]');
    await expect(saveBtn).toBeVisible();

    // Ensure the Save button becomes enabled (there are unsaved changes)
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });

  // Create request waiter before clicking Save so we don't miss the request
  const requestPromise = page.waitForRequest('**/members/batch', { timeout: 15_000 });
  await saveBtn.click();
  await requestPromise;

  // Wait for notistack toast to appear
  await expect(page.locator('[class*="notistack"]').filter({ hasText: /Group members updated|Group updated|Group created|Failed to save changes/i }).first()).toBeVisible({ timeout: 10_000 });
  });
});
