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

test('corner treatments match the original and the layout fits the viewport', async ({ page }) => {
  const result = await page.evaluate((html) => {
    const source = new DOMParser().parseFromString(html, 'text/html');
    const signature = (el) => ({ tag: el.tagName, radius: Array.from(el.classList).find(c => c.startsWith('rounded-')) });
    const elements = Array.from(document.querySelectorAll('main [class*="rounded-"]'));
    const incorrectRadii = elements.filter((el) => {
      const style = getComputedStyle(el);
      const radius = signature(el).radius;
      return ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius'].some(key => {
        const value = parseFloat(style[key]);
        if (radius === 'rounded-full') return value < Math.min(el.offsetWidth, el.offsetHeight) / 2 || value === 0;
        return value !== ({ 'rounded-2xl': 16, 'rounded-xl': 12 })[radius];
      });
    });
    return {
      expected: Array.from(source.querySelectorAll('[class*="rounded-"]')).map(signature),
      actual: elements.map(signature),
      incorrectRadii: incorrectRadii.map(signature),
      expectedIcons: Array.from(source.querySelectorAll('rect[rx]')).map(el => el.getAttribute('rx')),
      actualIcons: Array.from(document.querySelectorAll('main rect[rx]')).map(el => el.getAttribute('rx')),
      overflow: document.documentElement.scrollWidth > window.innerWidth,
    };
  }, original);
  expect(result.actual).toEqual(result.expected);
  expect(result.incorrectRadii).toEqual([]);
  expect(result.actualIcons).toEqual(result.expectedIcons);
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

test('the immersion still changes only the laptop display', async ({ page }) => {
  const figure = page.locator('.immersion-photo');
  await figure.scrollIntoViewIfNeeded();
  await figure.locator(':scope > img').evaluate(img => img.decode());
  await figure.locator('.immersion-screen-content').evaluate(img => img.decode());
  const polygon = await figure.evaluate(el => {
    const bounds = el.getBoundingClientRect();
    const svg = el.querySelector('svg');
    return [...el.querySelector('polygon').points].map(point => {
      const transformed = new DOMPoint(point.x, point.y).matrixTransform(svg.getScreenCTM());
      return [transformed.x - bounds.x, transformed.y - bounds.y];
    });
  });
  const edited = (await figure.screenshot()).toString('base64');
  await figure.locator('svg').evaluate(el => { el.style.visibility = 'hidden'; });
  const original = (await figure.screenshot()).toString('base64');
  await figure.locator('svg').evaluate(el => { el.style.visibility = ''; });
  const differences = await page.evaluate(async ({ edited, original, polygon }) => {
    async function pixels(data) {
      const image = new Image();
      image.src = `data:image/png;base64,${data}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      return context.getImageData(0, 0, canvas.width, canvas.height);
    }
    const before = await pixels(original);
    const after = await pixels(edited);
    let changedInside = 0;
    let changedOutside = 0;
    for (let y = 0; y < before.height; y++) {
      for (let x = 0; x < before.width; x++) {
        const offset = (y * before.width + x) * 4;
        if (before.data.slice(offset, offset + 4).every((v, i) => v === after.data[offset + i])) continue;
        // Allow two pixels along the screen edge for clipping and screenshot rounding.
        const inside = polygon.every(([ax, ay], i) => {
          const [bx, by] = polygon[(i + 1) % polygon.length];
          return (bx - ax) * (y - ay) - (by - ay) * (x - ax) >= -2 * Math.hypot(bx - ax, by - ay);
        });
        if (inside) changedInside++;
        else changedOutside++;
      }
    }
    // The top and bottom must contain the scene, rather than untouched letterbox bands.
    const filledEdges = [];
    for (const v of [.025, .975]) {
      for (const u of [.25, .5, .75]) {
        const weights = [(1 - u) * (1 - v), u * (1 - v), u * v, (1 - u) * v];
        const x = Math.round(polygon.reduce((sum, point, i) => sum + point[0] * weights[i], 0));
        const y = Math.round(polygon.reduce((sum, point, i) => sum + point[1] * weights[i], 0));
        const offset = (y * before.width + x) * 4;
        filledEdges.push([0, 1, 2].some(channel => Math.abs(before.data[offset + channel] - after.data[offset + channel]) > 8));
      }
    }
    return { changedInside, changedOutside, filledEdges };
  }, { edited, original, polygon });
  expect(differences.changedInside).toBeGreaterThan(100);
  expect(differences.changedOutside).toBe(0);
  expect(differences.filledEdges).toEqual(Array(6).fill(true));
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
  const external = await page.locator('header a[href^="https:"], main a[href^="https:"]').evaluateAll((links) => links.map((a) => a.href));
  expect(new Set(external)).toEqual(new Set([
    'https://whop.com/checkout/plan_kIUSXT7V4Lkag',
    'https://whop.com/checkout/plan_DB7DJLmJ0TIf4',
  ]));
  const missing = await page.locator('a[href^="#"]').evaluateAll((links) => links.filter((a) => !document.getElementById(a.hash.slice(1))).map((a) => a.hash));
  expect(missing).toEqual([]);
});

test('footer preserves the original proportions and links to the social profiles', async ({ page }, testInfo) => {
  const footer = page.locator('footer');
  await footer.scrollIntoViewIfNeeded();
  await expect(footer.getByText('English mastery', { exact: true })).toHaveCount(0);
  await expect(footer.getByRole('link', { name: 'Swan Academy — back to top' })).toHaveText('Swan Academy');
  await expect(footer.getByText('© 2026 Swan Academy', { exact: true })).toBeVisible();
  expect(await footer.locator('nav a').evaluateAll(links => links.map(link => ({ text: link.textContent, href: link.href })))).toEqual([
    { text: 'X', href: 'https://x.com/jotaswan' },
    { text: 'Instagram', href: 'https://www.instagram.com/jotaswan/' },
    { text: 'YouTube', href: 'https://www.youtube.com/@JotaSwan' },
  ]);
  const dimensions = await footer.evaluate(el => {
    const row = el.firstElementChild;
    const brand = row.firstElementChild;
    const style = getComputedStyle(row);
    return {
      height: el.getBoundingClientRect().height,
      padding: [style.paddingTop, style.paddingBottom],
      logo: [brand.querySelector('img').width, brand.querySelector('img').height],
      name: getComputedStyle(brand.querySelector('.font-serif')).fontSize,
      social: getComputedStyle(el.querySelector('nav')).fontSize,
      copyright: getComputedStyle(el.querySelector('p')).fontSize,
      direction: style.flexDirection,
    };
  });
  expect(dimensions.padding).toEqual(['48px', '48px']);
  expect(dimensions.logo).toEqual([32, 32]);
  expect(dimensions.name).toBe('18px');
  expect(dimensions.social).toBe('12px');
  expect(dimensions.copyright).toBe('12px');
  if (testInfo.project.name === 'desktop') {
    expect(dimensions.height).toBeGreaterThanOrEqual(140);
    expect(dimensions.height).toBeLessThanOrEqual(144);
    expect(dimensions.direction).toBe('row');
  } else {
    expect(dimensions.height).toBeGreaterThanOrEqual(240);
    expect(dimensions.height).toBeLessThanOrEqual(244);
    expect(dimensions.direction).toBe('column');
  }
});

test('header stays readable and sticky with subtle transparency and blur', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => window.scrollTo(0, 900));
  const header = page.locator('.site-header');
  await expect(header.getByRole('link', { name: 'Swan Academy — home' })).toBeVisible();
  const style = await header.evaluate(el => {
    const css = getComputedStyle(el);
    const context = document.createElement('canvas').getContext('2d');
    context.fillStyle = css.backgroundColor;
    context.fillRect(0, 0, 1, 1);
    return { top: el.getBoundingClientRect().top, position: css.position, alpha: context.getImageData(0, 0, 1, 1).data[3] / 255, blur: css.backdropFilter, opacity: css.opacity };
  });
  expect(style.top).toBe(0);
  expect(style.position).toBe('sticky');
  expect(style.alpha).toBeGreaterThanOrEqual(.85);
  expect(style.alpha).toBeLessThan(.98);
  expect(style.blur).toMatch(/blur\([1-9][\d.]*px\)/);
  expect(style.opacity).toBe('1');
});

test('tab uses the black monogram while the site keeps white logos', async ({ page, request }) => {
  const favicon = await page.locator('link[rel="icon"]').getAttribute('href');
  expect(favicon).toMatch(/Swan-Academy-Monogram-Black-Master\.svg$/);
  const response = await request.get(favicon);
  expect(response.ok()).toBe(true);
  expect(await response.text()).toBe(readFileSync(new URL('../public/assets/Swan-Academy-Monogram-Black-Master.svg', import.meta.url), 'utf8'));
  for (const selector of ['.brand img', 'footer img']) {
    await expect(page.locator(selector)).toHaveAttribute('src', /Swan-Academy-Monogram-White-Master\.svg$/);
    expect(await page.locator(selector).evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  }
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
