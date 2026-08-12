import { expect, test } from '@playwright/test';

const routes = [
  '/',
  '/play',
  '/about',
  '/devlog',
  '/support',
  '/security',
  '/impressum',
  '/datenschutz',
] as const;

interface NetworkRecord {
  readonly kind: 'request' | 'websocket' | 'worker' | 'service-worker';
  readonly url: string;
}

test('public routes contact only the project-controlled origin', async ({ context, page }) => {
  const records: NetworkRecord[] = [];
  const failedRequests: string[] = [];

  page.on('request', (request) => {
    records.push({ kind: 'request', url: request.url() });
  });
  page.on('requestfailed', (request) => {
    failedRequests.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText ?? 'unknown failure'}`);
  });
  page.on('websocket', (socket) => {
    records.push({ kind: 'websocket', url: socket.url() });
  });
  page.on('worker', (worker) => {
    records.push({ kind: 'worker', url: worker.url() });
  });
  context.on('serviceworker', (worker) => {
    records.push({ kind: 'service-worker', url: worker.url() });
  });

  for (const route of routes) {
    const response = await page.goto(route, { waitUntil: 'networkidle' });
    expect(response?.ok(), `${route} should load successfully`).toBe(true);
  }

  await page.goto('/play');
  await page.getByRole('button', { name: /request archive cross-check/i }).click();
  await page.getByRole('button', { name: /archives$/i }).click();
  await page.getByRole('button', { name: /transmit ax-c03-7/i }).click();
  await page.getByRole('button', { name: /operations$/i }).click();
  await page.getByRole('button', { name: /acknowledge discrepancy/i }).click();

  expect(failedRequests, 'all first-party runtime requests should succeed').toEqual([]);

  const allowedOrigins = new Set([
    new URL('/', page.url()).origin,
    new URL('/', page.url()).origin.replace(/^http/u, 'ws'),
  ]);
  const ignoredProtocols = new Set(['about:', 'blob:', 'data:']);
  const unexpected = records.filter((record) => {
    const parsed = new URL(record.url);
    return !ignoredProtocols.has(parsed.protocol) && !allowedOrigins.has(parsed.origin);
  });

  expect(
    unexpected,
    `unexpected runtime connections: ${JSON.stringify(unexpected, null, 2)}`,
  ).toEqual([]);

  const gameplayConnections = records.filter((record) => {
    if (record.kind !== 'request') return true;
    const { pathname } = new URL(record.url);
    return pathname === '/api' || pathname.startsWith('/api/') || pathname === '/ws' || pathname.startsWith('/ws/');
  });
  expect(gameplayConnections, 'the local protocol test should not open API, WebSocket, worker, or service-worker connections').toEqual([]);
});

test('local protocol interactions leave browser persistence empty', async ({ context, page }) => {
  await page.goto('/play');
  await page.getByRole('button', { name: /request archive cross-check/i }).click();
  await page.getByRole('button', { name: /archives$/i }).click();
  await page.getByRole('button', { name: /transmit ax-c03-7/i }).click();
  await page.getByRole('button', { name: /operations$/i }).click();
  await page.getByRole('button', { name: /acknowledge discrepancy/i }).click();

  const persistence = await page.evaluate(async () => {
    const indexedDatabases = typeof indexedDB.databases === 'function'
      ? (await indexedDB.databases()).map((database) => database.name ?? '(unnamed)')
      : [];
    const cacheNames = await caches.keys();
    const serviceWorkerScopes = 'serviceWorker' in navigator
      ? (await navigator.serviceWorker.getRegistrations()).map((registration) => registration.scope)
      : [];

    return {
      cacheNames,
      cookie: document.cookie,
      indexedDatabases,
      localStorageKeys: Object.keys(localStorage),
      serviceWorkerScopes,
      sessionStorageKeys: Object.keys(sessionStorage),
    };
  });

  expect(persistence).toEqual({
    cacheNames: [],
    cookie: '',
    indexedDatabases: [],
    localStorageKeys: [],
    serviceWorkerScopes: [],
    sessionStorageKeys: [],
  });
  expect(await context.cookies()).toEqual([]);
});
