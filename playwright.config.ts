import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 3000);

export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: false, // tests share one SQLite file
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    timezoneId: 'Asia/Singapore',
    locale: 'en-SG',
    trace: 'retain-on-failure',
  },
  // Virtual WebAuthn authenticators use the Chrome DevTools Protocol, so Chromium only.
  // Set PW_CHANNEL=chrome to use an installed Google Chrome instead of Playwright's Chromium.
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: process.env.PW_CHANNEL || undefined },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_PATH: 'data/test.db',
      JWT_SECRET: 'playwright-test-secret-at-least-32-characters',
    },
  },
});
