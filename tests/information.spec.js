import { test, expect } from '@playwright/test';

const routes = [
  ['contact', 'Get in touch.'],
  ['terms', 'Terms of use'],
  ['privacy', 'Privacy'],
  ['consent-preferences', 'Consent preferences'],
];
const preferenceKey = 'swan-academy:consent:v1';

test('information pages load directly, preserve the brand and fit narrow screens', async ({ page, baseURL }) => {
  const errors = [];
  const external = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(response.url()); });
  page.on('request', request => {
    if (!request.url().startsWith(baseURL) && !request.url().startsWith('data:')) external.push(request.url());
  });
  for (const [route, heading] of routes) {
    await page.goto(`/${route}/`);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
    await expect(page.locator('h1')).toHaveCSS('color', 'rgb(248, 245, 239)');
    await expect(page.locator('h1')).toHaveCSS('font-family', /Playfair/);
    await expect(page.locator('.brand-monogram')).toHaveCSS('mask-image', /data:image\/svg/);
    await expect(page.locator('.information-links a[aria-current="page"]')).toHaveAttribute('href', `../${route}/`);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      for (const field of await page.locator('.information-field input, select, textarea').all()) {
        await expect(field).toHaveCSS('font-size', '16px');
        const rect = await field.boundingBox();
        expect(rect.x).toBeGreaterThanOrEqual(20);
        expect(rect.x + rect.width).toBeLessThanOrEqual(width - 20);
        expect(rect.height).toBeGreaterThanOrEqual(48);
      }
    }
    await page.getByRole('link', { name: 'Swan Academy — home' }).click();
    await expect(page).toHaveURL(`${baseURL}/`);
  }
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});

test('all website footers expose the four information routes', async ({ page }) => {
  for (const route of ['', 'apply', 'status', 'checkout', ...routes.map(([route]) => route)]) {
    await page.goto(route ? `/${route}/` : '/');
    const links = page.locator('footer .information-links a');
    expect(await links.evaluateAll(nodes => nodes.map(node => new URL(node.href).pathname)))
      .toEqual(routes.map(([route]) => `/${route}/`));
    await links.first().click();
    await expect(page).toHaveURL(/\/contact\/$/);
  }
});

test('contact preview never sends or stores input and privacy requests select the right topic', async ({ page }) => {
  const sent = [];
  page.on('request', request => {
    if (request.method() !== 'GET' || request.url().includes('contact-test')) sent.push(request.url());
  });
  await page.goto('/contact/?topic=privacy');
  await expect(page.getByLabel('Topic', { exact: true })).toHaveValue('privacy');
  await page.getByLabel('Your name', { exact: true }).fill('Contact Test');
  await page.getByLabel('Email address', { exact: true }).fill('contact-test@example.com');
  await page.getByLabel('Your message', { exact: true }).fill('A preview message that must stay on this page.');
  await expect(page.getByRole('button', { name: 'Send message' })).toBeDisabled();
  await page.getByLabel('Email address', { exact: true }).press('Enter');
  await page.locator('form').evaluate(form => form.requestSubmit());
  await expect(page).toHaveURL(/\/contact\/\?topic=privacy$/);
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
  expect(sent).toEqual([]);
  await expect(page.getByRole('link', { name: 'Open Instagram' })).toHaveAttribute('href', 'https://www.instagram.com/jotaswan/');
  await page.goto('/contact/?topic=unrecognized');
  await expect(page.getByLabel('Topic', { exact: true })).toHaveValue('');
});

test('essential-only preference persists, synchronizes tabs and resets only its own record', async ({ page, context }) => {
  await page.goto('/consent-preferences/');
  await expect(page.locator('#consent-status')).toContainText('Essential-only browsing is active');
  for (const input of await page.getByRole('checkbox').all()) {
    await expect(input).toBeDisabled();
    await expect(input).not.toBeChecked();
  }
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  await page.evaluate(() => localStorage.setItem('unrelated', 'keep'));
  const other = await context.newPage();
  await other.goto('/consent-preferences/');
  await page.getByRole('button', { name: 'Save essential-only preference' }).click();
  await expect(other.locator('#consent-status')).toContainText('preference is saved');
  await page.reload();
  await expect(page.locator('#consent-status')).toContainText('preference is saved');
  const record = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), preferenceKey);
  expect(record).toMatchObject({ version: 1, essential: true, analytics: false, advertising: false });
  expect(Number.isFinite(Date.parse(record.savedAt))).toBe(true);
  await page.getByRole('button', { name: 'Reset saved preference' }).click();
  await expect(other.locator('#consent-status')).toContainText('Essential-only browsing is active');
  expect(await page.evaluate(key => [localStorage.getItem(key), localStorage.getItem('unrelated')], preferenceKey)).toEqual([null, 'keep']);
  await other.close();
});

test('invalid or unavailable browser storage never produces a false saved confirmation', async ({ page }) => {
  await page.goto('/consent-preferences/');
  await page.evaluate(key => localStorage.setItem(key, '{broken'), preferenceKey);
  await page.reload();
  await expect(page.locator('#consent-status')).toContainText('Essential-only browsing is active');
  await page.getByRole('button', { name: 'Reset saved preference' }).click();
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } });
  });
  await page.reload();
  await expect(page.locator('#consent-status')).toContainText('storage is unavailable');
  await page.getByRole('button', { name: 'Save essential-only preference' }).click();
  await expect(page.locator('#consent-status')).toContainText('could not be saved');
  await expect(page.getByRole('button', { name: 'Reset saved preference' })).toBeDisabled();
});

test('policy anchors work with the iPhone contained scroller', async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
  });
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}/privacy/`);
    await expect(page.locator('html')).toHaveClass(/contained-scroll/);
    await page.getByRole('link', { name: 'Your privacy requests', exact: true }).click();
    await expect(page.locator('#requests-heading')).toBeInViewport();
    await expect.poll(() => page.locator('#requests-heading').evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThan(100);
    expect(await page.evaluate(() => scrollY)).toBe(0);
    expect(await page.locator('.page-viewport').evaluate(el => el.scrollTop)).toBeGreaterThan(500);
  } finally { await context.close(); }
});

test('contact and consent remain honest and non-submitting without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    const posts = [];
    page.on('request', request => { if (request.method() !== 'GET') posts.push(request.url()); });
    await page.goto(`${baseURL}/contact/`);
    await page.getByLabel('Topic', { exact: true }).selectOption('privacy');
    await page.getByLabel('Your name', { exact: true }).fill('Contact Test');
    await page.getByLabel('Email address', { exact: true }).fill('preview@example.com');
    await page.getByLabel('Your message', { exact: true }).fill('Not sent');
    await page.getByLabel('Email address', { exact: true }).press('Enter');
    await expect(page).toHaveURL(/\/contact\/$/);
    await expect(page.getByRole('button', { name: 'Send message' })).toBeDisabled();
    await page.goto(`${baseURL}/consent-preferences/`);
    await expect(page.locator('#consent-status')).toContainText('Enable JavaScript');
    await expect(page.getByRole('button', { name: 'Save essential-only preference' })).toBeDisabled();
    await expect(page.locator('.brand-monogram')).toHaveCSS('mask-image', /data:image\/svg/);
    expect(posts).toEqual([]);
  } finally { await context.close(); }
});
