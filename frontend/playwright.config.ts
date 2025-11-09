import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10000 },
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PW_BASE_URL || 'http://localhost:3000',
    headless: true,
    viewport: { width: 1280, height: 800 },
    actionTimeout: 0,
    navigationTimeout: 30_000,
  },
  webServer: {
    // Start the dev server before running tests. If you use a custom script, set
    // PLAYWRIGHT_DEV_COMMAND env var. Defaults to `pnpm run dev`.
    command: process.env.PLAYWRIGHT_DEV_COMMAND || 'pnpm run dev',
    url: process.env.PW_BASE_URL || 'http://localhost:3000',
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
