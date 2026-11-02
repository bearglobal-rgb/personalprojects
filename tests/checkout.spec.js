import { test, expect } from '@playwright/test';

test('approved example links to checkout preview without enabling payment', async ({ page }) => {
  await page.goto('/status/?preview=approved');
  await expect(page.getByRole('button', { name: 'Continue to checkout' })).toBeDisabled();
  await page.getByRole('link', { name: 'Preview the checkout page' }).click();
  await expect(page).toHaveURL(/\/checkout\/$/);
  await expect(page.getByRole('heading', { name: 'Complete your enrollment.' })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Checkout preview' })).toContainText('no payment details are collected');
  await expect(page.getByRole('button', { name: 'Confirm & pay' })).toBeDisabled();
  await expect(page.locator('input, select, textarea, form, iframe')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Confirm & pay' })).toBeDisabled();
  await page.getByRole('link', { name: 'Back to status preview' }).click();
  await expect(page.locator('#status-heading')).toHaveText('You’re invited to Black.');
  await page.getByRole('link', { name: 'Preview the checkout page' }).click();
  await page.getByRole('link', { name: 'Back to Academy', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
});

test('checkout ignores URL payment claims and does not send or store payment data', async ({ page }) => {
  const requests = [];
  const errors = [];
  page.on('request', request => requests.push({ url: request.url(), method: request.method() }));
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/checkout/?status=approved&paid=true&price=1&email=someone@example.com&_ptxn=txn_example');
  await expect(page.getByRole('button', { name: 'Confirm & pay' })).toBeDisabled();
  await expect(page.locator('.checkout-total')).toContainText('To be confirmed');
  await expect(page.locator('body')).not.toContainText('someone@example.com');
  await expect(page.locator('#checkout-payment-note')).toContainText('No charge can be made');
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
  expect(requests.every(request => request.method === 'GET' && new URL(request.url).origin === new URL(page.url()).origin)).toBe(true);
  expect(errors).toEqual([]);
});

test('checkout fits narrow screens and preserves accessible navigation without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}/checkout/`);
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      for (const selector of ['.checkout-summary', '.checkout-payment']) {
        const box = await page.locator(selector).boundingBox();
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
      }
      const summary = await page.locator('.checkout-summary').boundingBox();
      const payment = await page.locator('.checkout-payment').boundingBox();
      if (width < 1024) expect(payment.y).toBeGreaterThan(summary.y + summary.height);
      else expect(payment.y).toBe(summary.y);
    }
    await expect(page.getByRole('button', { name: 'Confirm & pay' })).toBeDisabled();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to checkout' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#checkout-page$/);
    await expect(page.locator('h1')).toHaveCSS('color', 'rgb(248, 245, 239)');
  } finally { await context.close(); }
});
