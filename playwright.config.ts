import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end tests in a real Chromium browser.
 *
 * - Locally:  `npm run test:e2e` builds the app and serves it with `vite preview`.
 * - In CI:    E2E_BASE_URL points at the freshly built production Docker image
 *             (nginx + real security headers), so we test exactly what ships.
 */
const externalBaseURL = process.env.E2E_BASE_URL
const baseURL = externalBaseURL ?? 'http://localhost:4173'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: externalBaseURL
    ? undefined
    : {
        command: 'npm run build && npm run preview -- --port 4173 --strictPort',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
