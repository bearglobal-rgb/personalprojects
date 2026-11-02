import { test, expect } from '@playwright/test';

test('Black application opens from the homepage and supports direct navigation', async ({ page }) => {
  await page.goto('/');
  await page.locator('#top [data-black-application]').click();
  await expect(page).toHaveURL(/\/apply\/$/);
  await expect(page).toHaveTitle('Apply for Black · Swan Academy');
  await expect(page.getByRole('heading', { name: 'Apply for Black.', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator('#black-application-form')).toBeVisible();
  await page.getByRole('link', { name: 'Swan Academy — home' }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => location.hash)).toBe('');
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(page.locator('#top h1')).toBeInViewport();
});

test('application preview has labeled fields, no payment links, and cannot submit answers', async ({ page }) => {
  const errors = [];
  const sent = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (request.method() !== 'GET' || request.url().includes('preview-test%40') || request.url().includes('preview-test@')) sent.push(request.url());
  });
  await page.goto('/apply/');
  await page.getByLabel('Your name', { exact: true }).fill('Preview Test');
  await page.getByLabel('Email address', { exact: true }).fill('preview-test@example.com');
  await page.getByLabel('Where are you with English right now?').selectOption('intermediate');
  await page.getByLabel('What do you want English to make possible?').fill('Lead meetings in English with confidence.');
  await page.getByLabel('What keeps you stuck right now?').fill('I hesitate when I need to answer quickly.');
  await page.getByLabel('How much time can you consistently dedicate each day?').selectOption('1-2-hours');
  await page.getByLabel('I understand that Black is a paid cohort').check();
  await expect(page.getByRole('button', { name: 'Submit application' })).toBeDisabled();
  await expect(page.locator('#application-status')).toContainText('Nothing is submitted');
  await page.getByLabel('Email address', { exact: true }).press('Enter');
  await page.locator('form').dispatchEvent('submit');
  await expect(page).toHaveURL(/\/apply\/$/);
  await expect(page.locator('a[href*="checkout"], iframe')).toHaveCount(0);
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
  expect(sent).toEqual([]);
  expect(errors).toEqual([]);
});

test('application keeps branded styling and usable fields across screen sizes', async ({ page }) => {
  await page.goto('/apply/');
  await page.evaluate(() => document.fonts.ready);
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator('.brand-monogram').first()).toHaveCSS('background-color', 'rgb(244, 239, 230)');
    await expect(page.locator('h1')).toHaveCSS('color', 'rgb(248, 245, 239)');
    for (const field of await page.locator('.application-field input, select, textarea').all()) {
      await expect(field).toHaveCSS('font-size', '16px');
      const bounds = await field.boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
      expect(bounds.height).toBeGreaterThanOrEqual(48);
    }
    const layout = await page.locator('.application-panel').evaluate(el => ({
      panel: el.getBoundingClientRect().top,
      intro: document.querySelector('.application-intro').getBoundingClientRect().bottom,
    }));
    if (width < 1024) expect(layout.panel).toBeGreaterThan(layout.intro);
  }
  await page.getByLabel('Your name', { exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Email address', { exact: true })).toBeFocused();
  await expect(page.getByLabel('Email address', { exact: true })).toHaveCSS('outline-style', 'solid');
});

test('preview remains non-submittable with JavaScript disabled', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    const posts = [];
    page.on('request', request => { if (request.method() !== 'GET') posts.push(request.url()); });
    await page.goto(`${baseURL}/apply/`);
    await page.getByLabel('Your name', { exact: true }).fill('Preview Test');
    await page.getByLabel('Email address', { exact: true }).fill('preview-test@example.com');
    await page.getByLabel('Email address', { exact: true }).press('Enter');
    await expect(page.getByRole('button', { name: 'Submit application' })).toBeDisabled();
    await expect(page).toHaveURL(/\/apply\/$/);
    expect(posts).toEqual([]);
  } finally { await context.close(); }
});
