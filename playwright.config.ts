import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for SFShop Testing
 * Multi-Device Support: Mobile & Desktop
 * 
 * Environment Variables:
 * - CI: Set to true in CI/CD pipeline
 * - BASE_URL: Override base URL (default: https://stg.sfshop.id)
 * - WORKERS: Override worker count (default: 1)
 * - PROJECT: Run specific project (e.g., mobile-chromium, desktop-chromium)
 * - SEND_EMAIL_REPORT: Enable/disable email reporting (default: true)
 * - EMAIL_ON_FAILURES_ONLY: Send email only on failures (default: false)
 * - GMAIL_USER: Gmail address for sending reports (optional if using email-config.json)
 * - GMAIL_APP_PASSWORD: Gmail app password (optional if using email-config.json)
 * - EMAIL_RECIPIENTS: Comma-separated recipient emails (optional if using email-config.json)
 */

export default defineConfig({
  // =========================
  // Test Directory & Execution
  // =========================
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.WORKERS ? parseInt(process.env.WORKERS) : 1,

  // =========================
  // Timeouts
  // =========================
  timeout: 180_000, // 3 minutes per test (payment flows need time)
  expect: { 
    timeout: 30_000, // 30s for assertions
  },

  // =========================
  // Reporting
  // =========================
  reporter: [
    ['html', { open: 'never' }], // Don't auto-open in CI
    ['json', { outputFile: 'playwright-report/report.json' }],
    ['list'], // Console output with project names
    ...(process.env.CI 
      ? [['github'] as const] // GitHub Actions integration
      : []
    ),
  ],

  // =========================
  // Global Settings (Applied to all projects)
  // =========================
  use: {
    baseURL: process.env.BASE_URL || 'https://stg.sfshop.id',
    
    // Recording settings (optimized for CI)
    screenshot: 'on',
    video: 'on',
    trace: 'on',
    
    // Network & Performance
    actionTimeout: 15_000, // 15s for actions like click, fill
    navigationTimeout: 60_000, // 1 minute for page loads
    
    // Locale & Timezone (Indonesia)
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
  },

  // =========================
  // Projects (Test Environments)
  // BOTH TESTS WILL RUN ON ALL PROJECTS
  // =========================
  projects: [
    // ==========================================
    // MOBILE DEVICES
    // ==========================================
    
    {
      name: 'mobile-chromium',
      use: {
        ...devices['Galaxy Note 20'],
        browserName: 'chromium',
      },
      testMatch: '**/*.spec.ts',
    },

   //  {
     // name: 'mobile-firefox',
      //use: {
       // browserName: 'firefox',
       // viewport: { width: 384, height: 854 },
       // isMobile: true,
       // hasTouch: true,
       // deviceScaleFactor: 2.75,
       // userAgent:
        //  'Mozilla/5.0 (Linux; Android 11; SM-N981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0 Mobile Safari/537.36',
     // },
     // testMatch: '**/*.spec.ts',
    //},a

    // ==========================================
    // DESKTOP DEVICES
    // ==========================================
    
    {
      name: 'desktop-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
      testMatch: '**/*.spec.ts',
    },

//    {
  //    name: 'desktop-firefox',
    //  use: {
      //  ...devices['Desktop Firefox'],
      //  viewport: { width: 1920, height: 1080 },
     // },
     // testMatch: '**/*.spec.ts',
    //},

    // ==========================================
    // OPTIONAL: Additional Devices
    // ==========================================
    
    // {
    //   name: 'mobile-iphone-13',
    //   use: {
    //     ...devices['iPhone 13'],
    //   },
    //   testMatch: '**/*.spec.ts',
    // },

    // {
    //   name: 'mobile-pixel-5',
    //   use: {
    //     ...devices['Pixel 5'],
    //   },
    //   testMatch: '**/*.spec.ts',
    // },

    // {
    //   name: 'desktop-safari',
    //   use: {
    //     ...devices['Desktop Safari'],
    //     viewport: { width: 1920, height: 1080 },
    //   },
    //   testMatch: '**/*.spec.ts',
    // },
  ],

  // =========================
  // Output Directories
  // =========================
  outputDir: 'test-results',
  
  // =========================
  // Global Setup & Teardown (Optional)
  // =========================
  // globalSetup: require.resolve('./global-setup'),
  globalTeardown: require.resolve('./global-teardown'),
});