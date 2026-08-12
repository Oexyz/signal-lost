import { defineConfig, devices } from '@playwright/test';

const localBrowserChannel = process.env.PLAYWRIGHT_CHANNEL;
const previewPortValue = process.env.PLAYWRIGHT_PORT ?? '4174';
if (!/^\d{1,5}$/u.test(previewPortValue)) {
  throw new Error('PLAYWRIGHT_PORT must be a numeric TCP port');
}
const previewPort = Number(previewPortValue);
if (previewPort < 1 || previewPort > 65_535) {
  throw new Error('PLAYWRIGHT_PORT must be between 1 and 65535');
}
const previewOrigin = `http://127.0.0.1:${String(previewPort)}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: previewOrigin,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(localBrowserChannel ? { channel: localBrowserChannel } : {}),
      },
    },
  ],
  webServer: {
    command: `pnpm --filter @signal-lost/web preview --port ${String(previewPort)} --strictPort`,
    url: previewOrigin,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
