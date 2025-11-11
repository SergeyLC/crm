import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10000 },
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PW_BASE_URL || 'http://localhost:3001',
    headless: true,
    viewport: { width: 1280, height: 800 },
    actionTimeout: 0,
    navigationTimeout: 30_000,
  },
  webServer: {
    // Start the dev server before running tests without cleaning cache
    // Use dev:test which doesn't run predev hook
    command: process.env.PLAYWRIGHT_DEV_COMMAND || 'PORT=3001 pnpm run dev:test',
    url: process.env.PW_BASE_URL || 'http://localhost:3001',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
