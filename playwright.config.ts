import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 30_000 },
  reporter: [
  ['html'],
  ['json', { outputFile: 'playwright-report/report.json' }],
],

 /*   use: {
    baseURL: 'https://stg.sfshop.id',
    screenshot: 'on',
    video: 'on',
    trace: 'on',
  },*/

 use: {
    baseURL: 'https://stg.sfshop.id',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },

  projects: [
    // =========================
    // Desktop Firefox
    // =========================
    {
      name: 'firefox-desktop',
      use: {
        ...devices['Desktop Firefox'],
      },
    },

    // =========================
    // Chromium - Galaxy Note 20 (REAL mobile emulation)
    // =========================
    {
      name: 'chromium-galaxy-note-20',
      use: {
        ...devices['Galaxy Note 20'],
        browserName: 'chromium',
        baseURL: 'https://stg.sfshop.id',
        trace: 'on',
        screenshot: 'on',
        video: 'on',
      },
    },

    /*// =========================
    // Firefox - Galaxy Note 20 (Mobile Web Simulation)
    // =========================
    {
      name: 'firefox-galaxy-note-20',
      use: {
        browserName: 'firefox',

        // Viewport Galaxy Note 20
        viewport: { width: 384, height: 854 },

        // Mobile behavior
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2.75,

        // Android UA (penting untuk responsive)
        userAgent:
          'Mozilla/5.0 (Linux; Android 11; SM-N981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0 Mobile Safari/537.36',

        baseURL: 'https://stg.sfshop.id',

        trace: 'on',
        screenshot: 'on',
        video: 'on',
      },
    },*/
  ],
});