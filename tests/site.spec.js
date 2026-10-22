import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const original = readFileSync(new URL('../reference/original.html', import.meta.url), 'utf8');

test.beforeEach(async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);
});

test('preserves every word of the supplied main page', async ({ page }) => {
  const result = await page.evaluate((html) => {
    const original = new DOMParser().parseFromString(html, 'text/html');
    const rebuilt = document.querySelector('main').cloneNode(true);
    rebuilt.querySelector('.system-intro').remove();
    const normalize = (text) => text.replace(/\s+/g, ' ').trim();
    return { expected: normalize(original.body.textContent), actual: normalize(rebuilt.textContent) };
  }, original);
  expect(result.actual).toBe(result.expected);
});

test('all UI corners are square and the layout fits the viewport', async ({ page }) => {
  const result = await page.evaluate(() => ({
    rounded: Array.from(document.querySelectorAll('*')).filter((el) => {
      const s = getComputedStyle(el);
      return ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius'].some((key) => parseFloat(s[key]) !== 0);
    }).map((el) => el.tagName),
    overflow: document.documentElement.scrollWidth > window.innerWidth,
  }));
  expect(result.rounded).toEqual([]);
  expect(result.overflow).toBe(false);
});

test('both timeline lines follow scrolling in both directions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const name of ['system', 'origin']) {
    const selector = `[data-timeline="${name}"]`;
    const scrollToProgress = async (fraction) => {
      await page.locator(selector).evaluate((el, fraction) => {
        const r = el.getBoundingClientRect();
        window.scrollTo({ top: window.scrollY + r.top + r.height * fraction - window.innerHeight / 2, behavior: 'instant' });
      }, fraction);
      await expect.poll(async () => Number(await page.locator(selector).getAttribute('data-progress'))).toBeGreaterThan(fraction - .05);
      await expect.poll(async () => Number(await page.locator(selector).getAttribute('data-progress'))).toBeLessThan(fraction + .05);
      return Number(await page.locator(selector).getAttribute('data-progress'));
    };
    const first = await scrollToProgress(.15);
    const second = await scrollToProgress(.75);
    expect(second).toBeGreaterThan(first);
    const reverse = await scrollToProgress(.3);
    expect(reverse).toBeLessThan(second);
  }
});

test('protocol buttons select the matching step and phase', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#protocol-07 > button').click();
  await expect(page.locator('#protocol-07')).toHaveAttribute('data-active', 'true');
  await expect(page.locator('#protocol-07 > button')).toHaveAttribute('aria-current', 'step');
  await expect(page.locator('.phase-link[aria-current="step"]')).toContainText('The Arena');
  await page.locator('#protocol-02 > button').click();
  await expect(page.locator('#protocol-02')).toHaveAttribute('data-active', 'true');
  await expect(page.locator('.phase-link[aria-current="step"]')).toContainText('The Reset');
});

test('FAQ opens and closes with keyboard input', async ({ page }) => {
  const question = page.locator('details').first();
  await question.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(question).toHaveAttribute('open', '');
  await expect(question.locator('p')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(question).not.toHaveAttribute('open', '');
});

test('checkout destinations and internal links are intact', async ({ page }) => {
  const external = await page.locator('a[href^="https:"]').evaluateAll((links) => links.map((a) => a.href));
  expect(new Set(external)).toEqual(new Set([
    'https://whop.com/checkout/plan_kIUSXT7V4Lkag',
    'https://whop.com/checkout/plan_DB7DJLmJ0TIf4',
  ]));
  const missing = await page.locator('a[href^="#"]').evaluateAll((links) => links.filter((a) => !document.getElementById(a.hash.slice(1))).map((a) => a.hash));
  expect(missing).toEqual([]);
});

test('mobile menu opens, navigates, and closes', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile navigation is only shown on narrow screens.');
  const toggle = page.getByRole('button', { name: 'Open navigation' });
  await toggle.click();
  await expect(page.locator('#mobile-menu')).toBeVisible();
  await page.locator('#mobile-menu a[href="#inside"]').click();
  await expect(page.locator('#mobile-menu')).toBeHidden();
  await expect(page).toHaveURL(/#inside$/);
  await toggle.click();
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();
  await expect(page.locator('#mobile-menu')).toBeHidden();
});

test('local branding and both fonts load without JavaScript errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);
  expect(await page.locator('.brand img').evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
  expect(await page.evaluate(() => document.fonts.check('16px "Inter Variable"'))).toBe(true);
  expect(await page.evaluate(() => document.fonts.check('16px "Playfair Display Variable"'))).toBe(true);
  expect(errors).toEqual([]);
});
