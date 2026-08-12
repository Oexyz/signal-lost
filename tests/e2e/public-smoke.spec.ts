import { expect, test } from '@playwright/test';

const applicationRoutes = [
  ['/', 'SIGNAL//LOST'],
  ['/play', 'Protocol Test // SIGNAL//LOST'],
  ['/about', 'About // SIGNAL//LOST'],
  ['/devlog', 'Devlog // SIGNAL//LOST'],
  ['/support', 'Support // SIGNAL//LOST'],
  ['/security', 'Security // SIGNAL//LOST'],
] as const;

test('public application routes render from the production build', async ({ page }) => {
  for (const [path, title] of applicationRoutes) {
    const response = await page.goto(path);

    expect(response?.ok(), `${path} should return a successful document`).toBe(true);
    expect(response?.headers()['content-type']).toContain('text/html');
    await expect(page).toHaveTitle(title);
    await expect(page.locator('main')).toBeVisible();
  }
});

test('landing call to action and direct legal links work', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('YOU ARE ALL LOOKING', { exact: false })).toBeVisible();
  await expect(page.locator('footer a[href="/impressum"]')).toHaveCount(1);
  await expect(page.locator('footer a[href="/datenschutz"]')).toHaveCount(1);

  await page.getByRole('link', { name: /enter signal/i }).click();
  await expect(page).toHaveURL(/\/play$/u);
  await expect(page.locator('main')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'C03 PROTOCOL TEST' })).toBeFocused();
  await expect(page.getByRole('link', { name: 'Protocol test' })).toHaveAttribute('aria-current', 'page');
});

test('route changes announce their destination through heading focus', async ({ page }) => {
  await page.goto('/play');

  await page.getByRole('link', { name: 'About' }).click();
  await expect(page).toHaveURL(/\/about$/u);
  await expect(page.getByRole('heading', { level: 1, name: 'A mystery made of viewpoints.' })).toBeFocused();
  await expect(page.getByRole('link', { name: 'About' })).toHaveAttribute('aria-current', 'page');

  await page.goBack();
  await expect(page).toHaveURL(/\/play$/u);
  await expect(page.getByRole('heading', { level: 1, name: 'C03 PROTOCOL TEST' })).toBeFocused();
});

test('local C03 handoff completes and resets without pretending to create a session', async ({ page }) => {
  await page.goto('/play');

  await expect(page.getByText('LOCAL / ONE DEVICE / NO NETWORK SESSION')).toBeVisible();
  await expect(page.getByText('01 / 04')).toBeVisible();
  await page.getByRole('button', { name: /request archive cross-check/i }).click();
  await expect(page.getByText(/archive cross-check requested/i)).toBeVisible();

  await page.getByRole('button', { name: /archives$/i }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'ARCHIVES' })).toBeVisible();
  await page.getByRole('button', { name: /transmit ax-c03-7/i }).click();
  await expect(page.getByText(/record ax-c03-7 transmitted/i)).toBeVisible();

  await page.getByRole('button', { name: /operations$/i }).click();
  await page.getByRole('button', { name: /acknowledge discrepancy/i }).click();
  await expect(page.locator('.complete-mark')).toHaveText(/sequence \/ complete/i);
  await expect(page.getByText('04 / 04')).toBeVisible();

  await page.getByRole('button', { name: 'RESET LOCAL TEST' }).click();
  await expect(page.getByText('01 / 04')).toBeVisible();
  await expect(page.getByRole('button', { name: /request archive cross-check/i })).toBeVisible();
  await expect(page.getByText(/archive cross-check requested/i)).toHaveCount(0);
});

test('legal pages remain readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  try {
    for (const [path, heading] of [
      ['/impressum', 'Impressum'],
      ['/datenschutz', 'Datenschutz'],
    ] as const) {
      const response = await page.goto(path);

      expect(response?.ok(), `${path} should return a successful static page`).toBe(true);
      expect(response?.headers()['content-type']).toContain('text/html');
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    }
  } finally {
    await context.close();
  }
});
