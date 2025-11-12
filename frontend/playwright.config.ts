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
    // Use production server for tests to avoid lock conflicts with dev server
    // Assumes app is already built (run 'pnpm run build' first)
    command: 'pnpm run test:start',
    url: process.env.PW_BASE_URL || 'http://localhost:3001',
    reuseExistingServer: !process.env.CI, // In CI always start fresh, locally reuse
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
