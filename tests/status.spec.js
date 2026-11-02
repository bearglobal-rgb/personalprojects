import { test, expect } from '@playwright/test';

test('application links to an explicitly labeled status preview without submitting', async ({ page }) => {
  const posts = [];
  page.on('request', request => { if (request.method() !== 'GET') posts.push(request.url()); });
  await page.goto('/apply/');
  await page.getByLabel('Your name', { exact: true }).fill('Preview Visitor');
  await page.getByRole('link', { name: 'Preview the status page' }).click();
  await expect(page).toHaveURL(/\/status\/\?preview=received$/);
  await expect(page.locator('.status-preview')).toContainText('not live decisions');
  await expect(page.locator('#status-heading')).toHaveText('Application received.');
  await expect(page.locator('body')).not.toContainText('Preview Visitor');
  await page.reload();
  await expect(page.locator('#status-preview-select')).toHaveValue('received');
  await page.getByRole('link', { name: 'Swan Academy — home', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  expect(posts).toEqual([]);
});

test('every example displays the right decision and progress without offering real payment', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/status/');
  await expect(page.locator('#status-heading')).toHaveText('No application loaded.');
  const select = page.getByLabel('Preview a status');
  for (const [state, heading, current] of [
    ['received', 'Application received.', 'Received'],
    ['under-review', 'Your application is under review.', 'Review'],
    ['approved', 'You’re invited to Black.', 'Decision'],
    ['not-accepted', 'An update on your application.', 'Decision'],
    ['enrolled', 'Your place is confirmed.', 'Enrollment'],
    ['expired', 'This link has expired.', null],
    ['unavailable', 'We can’t load your status right now.', null],
    ['none', 'No application loaded.', null],
  ]) {
    await select.selectOption(state);
    await expect(page.locator('#status-heading')).toHaveText(heading);
    await expect(page.locator('.status-preview')).toContainText('No application is connected');
    await expect(page.locator('.status-bottom')).toContainText('does not submit an application');
    if (current) {
      await expect(page.locator('.status-progress')).toBeVisible();
      await expect(page.locator('[aria-current="step"]')).toHaveCount(1);
      await expect(page.locator('[aria-current="step"] .status-stage-label')).toHaveText(current);
    } else {
      await expect(page.locator('.status-progress')).toBeHidden();
      await expect(page.locator('[aria-current="step"]')).toHaveCount(0);
    }
    await expect(page.locator('.status-checkout')).toBeVisible({ visible: state === 'approved' });
    if (state === 'approved') {
      await expect(page.getByRole('button', { name: 'Continue to checkout' })).toBeDisabled();
      await expect(page.locator('#status-payment-note')).toContainText('No payment can be made');
    }
    await expect(page.locator('.status-decision-note')).toBeVisible({ visible: state === 'not-accepted' });
    if (state === 'not-accepted') {
      await expect(page.locator('.status-decision-note')).toContainText('No reason has been assigned');
      await expect(page.locator('[data-stage="3"]')).toBeHidden();
    }
  }
  await expect(page.locator('iframe, form')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Preview the checkout page' })).toHaveCount(0);
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
  expect(errors).toEqual([]);
});

test('URL claims cannot load a real applicant or unlock checkout', async ({ page }) => {
  for (const query of [
    '?status=approved&email=someone@example.com',
    '?preview=__proto__&status=approved',
    '?preview=unknown&checkout=https://example.com/pay',
    '?preview=%3Cimg%20src=x%20onerror=alert(1)%3E',
  ]) {
    await page.goto(`/status/${query}`);
    await expect(page.locator('#status-heading')).toHaveText('No application loaded.');
    await expect(page.locator('.status-checkout')).toBeHidden();
    await expect(page.locator('.status-card img')).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText('someone@example.com');
  }
  await page.getByLabel('Preview a status').selectOption('approved');
  await expect(page).toHaveURL(/\/status\/\?preview=approved$/);
  await expect(page.getByRole('button', { name: 'Continue to checkout' })).toBeDisabled();
  await expect(page.locator('.status-preview')).toContainText('example states');
});

test('status page remains readable and keyboard accessible at desktop and mobile widths', async ({ page }) => {
  await page.goto('/status/?preview=approved');
  await page.evaluate(() => document.fonts.ready);
  const select = page.getByLabel('Preview a status');
  await select.focus();
  await page.keyboard.press('ArrowDown');
  await expect(select).toBeFocused();
  await expect(select).toHaveCSS('font-size', '16px');
  await expect(select).toHaveCSS('outline-style', 'solid');
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    for (const state of ['approved', 'not-accepted', 'under-review', 'unavailable']) {
      await select.selectOption(state);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const box = await page.locator('.status-card').boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
    }
  }
  await expect(page.locator('.brand-monogram').first()).toHaveCSS('background-color', 'rgb(244, 239, 230)');
  await expect(page.locator('h1')).toHaveCSS('color', 'rgb(248, 245, 239)');
  await expect(page.locator('.status-description')).toHaveCSS('color', 'rgb(178, 171, 160)');
});

test('JavaScript-disabled status page does not claim an approval', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}/status/?preview=approved`);
    await expect(page.locator('#status-heading')).toHaveText('No application loaded.');
    await expect(page.locator('.status-preview-control')).toBeHidden();
    await expect(page.locator('noscript p')).toBeVisible();
    await expect(page.locator('noscript p')).toContainText('No live application status');
    await expect(page.getByRole('button', { name: 'Continue to checkout' })).toHaveCount(0);
  } finally { await context.close(); }
});
