import { chromium } from '@playwright/test';
import { createServer } from 'node:net';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { preview } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const appRoot = join(root, 'apps', 'web');
const output = join(root, 'docs', 'assets', 'readme-home.png');

function reserveLoopbackPort() {
  return new Promise((resolve, reject) => {
    const reservation = createServer();
    reservation.once('error', reject);
    reservation.listen(0, '127.0.0.1', () => {
      const address = reservation.address();
      if (address === null || typeof address === 'string') {
        reservation.close();
        reject(new Error('Could not reserve a loopback port.'));
        return;
      }
      reservation.close((error) => {
        if (error) reject(error);
        else resolve(address.port);
      });
    });
  });
}

const port = await reserveLoopbackPort();
const server = await preview({
  root: appRoot,
  logLevel: 'silent',
  preview: {
    host: '127.0.0.1',
    port,
    strictPort: true,
  },
});
const channel = process.env.PLAYWRIGHT_CHANNEL;
const browser = await chromium.launch({
  headless: true,
  ...(channel ? { channel } : {}),
});

try {
  const page = await browser.newPage({
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    viewport: { width: 1_440, height: 900 },
  });
  await page.goto(`http://127.0.0.1:${String(port)}/`, { waitUntil: 'networkidle' });
  await page.screenshot({
    path: output,
    animations: 'disabled',
    fullPage: false,
  });
  console.log(`captured ${output}`);
} finally {
  await browser.close();
  await server.close();
}
