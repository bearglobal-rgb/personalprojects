import { test, expect, devices } from '@playwright/test';
import { readFileSync } from 'node:fs';

const original = readFileSync(new URL('../reference/original.html', import.meta.url), 'utf8');
const offerCopyChanges = JSON.parse(readFileSync(new URL('../reference/free-system-copy-changes.json', import.meta.url), 'utf8'));
const immersionGeometry = JSON.parse(readFileSync(new URL('../reference/immersion-screen.json', import.meta.url), 'utf8'));

test.beforeEach(async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);
});

test('preserves the original content apart from approved copy and section-label revisions', async ({ page }) => {
  const result = await page.evaluate((html) => {
    const original = new DOMParser().parseFromString(html, 'text/html');
    original.querySelector('#founder p').textContent = 'The founder';
    original.querySelector('#inside p').textContent = 'What’s inside';
    original.querySelector('#top + div').remove();
    original.querySelector('#top').after(original.querySelector('#founder'));
    const rebuilt = document.querySelector('main').cloneNode(true);
    rebuilt.querySelector('.system-intro').remove();
    const normalize = (text) => text.replace(/\s+/g, ' ').trim();
    return { expected: normalize(original.body.textContent), actual: normalize(rebuilt.textContent) };
  }, offerCopyChanges.reduce((html, [before, after]) => html.replaceAll(before, after), original));
  expect(result.actual).toBe(result.expected);
  expect(await page.locator('main > div > section').evaluateAll(sections => sections.map(section => section.id))).toEqual([
    'top', 'founder', 'failure', 'method', 'inside', 'offers', 'faq', 'final-cta',
  ]);
});

test('corner treatments match the original and the layout fits the viewport', async ({ page }) => {
  const result = await page.evaluate((html) => {
    const source = new DOMParser().parseFromString(html, 'text/html');
    source.querySelector('#top').after(source.querySelector('#founder'));
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

test('hero fills the opening viewport and the next section starts below the fold', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const sizes = testInfo.project.name === 'mobile'
    ? [[320, 568], [390, 844], [414, 896], [768, 1024], [1023, 768]]
    : [[1366, 768], [1440, 900], [1920, 991], [1920, 1080], [2560, 1440]];
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    const layout = await page.locator('#top').evaluate(hero => ({
      heroBottom: hero.getBoundingClientRect().bottom,
      contentInset: hero.querySelector('.hero-content > p').getBoundingClientRect().top - hero.getBoundingClientRect().top,
      dividerWidth: getComputedStyle(hero).borderBottomWidth,
      dividerStyle: getComputedStyle(hero).borderBottomStyle,
      nextTag: hero.nextElementSibling.tagName,
      labelTop: hero.nextElementSibling.querySelector('p').getBoundingClientRect().top,
    }));
    expect(layout.heroBottom).toBeGreaterThanOrEqual(height - 1);
    expect(layout.contentInset).toBe(width >= 1024 ? 152 : width >= 640 ? 112 : 80);
    expect(layout.dividerWidth).toBe('1px');
    expect(layout.dividerStyle).toBe('solid');
    expect(layout.nextTag).toBe('SECTION');
    expect(layout.labelTop).toBeGreaterThanOrEqual(height);
    await expect(page.locator('main').getByText('Portuguese', { exact: true })).toHaveCount(0);
    if (testInfo.project.name === 'desktop') {
      await expect(page.locator('#top h1')).toBeInViewport({ ratio: 1 });
      await expect(page.locator('#top [data-free-system]')).toBeInViewport({ ratio: 1 });
      await expect(page.locator('#top a')).toBeInViewport({ ratio: 1 });
    }
  }
  const nextLabel = page.locator('#top + section p').first();
  await nextLabel.scrollIntoViewIfNeeded();
  await expect(nextLabel).toBeInViewport();
});

test('permanent step labels sit below the copy on mobile and stay in the desktop header', async ({ page }, testInfo) => {
  const mobile = testInfo.project.name === 'mobile';
  for (const width of mobile ? [320, 375, 390, 414, 430, 639] : [1280, 1920]) {
    await page.setViewportSize({ width, height: 896 });
    const labels = await page.locator('.step-permanence').evaluateAll(elements => elements.map(label => {
      const card = label.closest('article');
      const bounds = el => {
        const r = el.getBoundingClientRect();
        return { top: r.top, right: r.right, bottom: r.bottom };
      };
      return { id: card.parentElement.id, label: bounds(label), card: bounds(card), copy: bounds(card.querySelector('p')), header: bounds(label.parentElement) };
    }));
    expect(labels.map(item => item.id)).toEqual(['protocol-02', 'protocol-03', 'protocol-04', 'protocol-06', 'protocol-09']);
    for (const item of labels) {
      if (mobile) {
        expect(item.label.top - item.copy.bottom).toBeGreaterThanOrEqual(24);
        expect(item.card.right - item.label.right).toBeCloseTo(25, 0);
        expect(item.card.bottom - item.label.bottom).toBeCloseTo(25, 0);
      } else {
        expect(item.label.top).toBeGreaterThanOrEqual(item.header.top);
        expect(item.label.bottom).toBeLessThanOrEqual(item.header.bottom);
        expect(item.label.bottom).toBeLessThan(item.copy.top);
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test('the Origin timeline line follows scrolling in both directions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const selector = '[data-timeline="origin"]';
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
});

test('Founder line tracks mobile scrolling directly and retains gentle desktop easing', async ({ page, browser, baseURL }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const context = await browser.newContext({ ...devices['iPhone 11'], reducedMotion: 'no-preference' });
  try {
    const pages = [page];
    if (testInfo.project.name === 'mobile') {
      const iphone = await context.newPage();
      await iphone.goto(baseURL);
      await iphone.evaluate(() => document.fonts.ready);
      pages.push(iphone);
      const fallback = await context.newPage();
      await fallback.addInitScript(() => {
        const supports = CSS.supports.bind(CSS);
        CSS.supports = (...args) => args.some(value => String(value).includes('overflow: clip')) ? false : supports(...args);
      });
      await fallback.goto(baseURL);
      await fallback.evaluate(() => document.fonts.ready);
      await expect(fallback.locator('.origin-timeline')).toHaveAttribute('data-sticky-progress', 'false');
      pages.push(fallback);
    }
    for (const timelinePage of pages) {
      await timelinePage.bringToFront();
      if (testInfo.project.name === 'mobile') {
        // Check native sticky geometry and the older-browser direct fallback.
        const track = () => timelinePage.evaluate(async () => {
          const rail = document.querySelector('.origin-rail');
          const fill = rail.querySelector('[data-progress]');
          const scroller = document.documentElement.classList.contains('contained-scroll') ? document.querySelector('.page-viewport') : window;
          const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          const box = rail.getBoundingClientRect();
          const top = (scroller === window ? scrollY : scroller.scrollTop) + box.top + box.height * .35 - innerHeight / 2;
          scroller.scrollTo({ top, behavior: 'instant' });
          await frames();
          const errors = [];
          const immediateErrors = [];
          const sticky = getComputedStyle(fill).position === 'sticky';
          for (const delta of [4, 12, 30, 50, 180, 250, -4, -12, -30, -50, -180, -250]) {
            scroller.scrollBy({ top: delta, behavior: 'instant' });
            // Read before any animation frame: sticky must never need to catch up.
            const immediate = rail.getBoundingClientRect();
            immediateErrors.push(Math.abs(Math.max(immediate.top, Math.min(immediate.bottom, innerHeight / 2)) - fill.getBoundingClientRect().bottom));
            await frames();
            const r = rail.getBoundingClientRect();
            errors.push(Math.abs(Math.max(r.top, Math.min(r.bottom, innerHeight / 2)) - fill.getBoundingClientRect().bottom));
          }
          const end = fill.getBoundingClientRect().bottom;
          await new Promise(resolve => setTimeout(resolve, 250));
          return { errors, immediateErrors, sticky, driftAfterStop: Math.abs(fill.getBoundingClientRect().bottom - end) };
        });
        for (const preference of ['no-preference', 'reduce']) {
          await timelinePage.emulateMedia({ reducedMotion: preference });
          const result = await track();
          expect(Math.max(...result.errors)).toBeLessThan(1.5);
          if (result.sticky) expect(Math.max(...result.immediateErrors)).toBeLessThan(1.5);
          expect(result.driftAfterStop).toBeLessThan(.5);
        }
        continue;
      }
      // Control animation time so browser-worker load cannot turn an
      // intermediate sample into a settled frame or throttle a background tab.
      await timelinePage.clock.install();
      await timelinePage.clock.pauseAt(new Date());
      const scroll = async (delta, initial = false) => {
        await timelinePage.evaluate(({ delta, initial }) => {
          const scroller = document.documentElement.classList.contains('contained-scroll') ? document.querySelector('.page-viewport') : window;
          if (initial) {
            const box = document.querySelector('.origin-timeline').getBoundingClientRect();
            const top = (scroller === window ? scrollY : scroller.scrollTop) + box.top + box.height * .35 - innerHeight / 2;
            scroller.scrollTo({ top, behavior: 'instant' });
          } else scroller.scrollBy({ top: delta, behavior: 'instant' });
          scroller.dispatchEvent(new Event('scroll'));
        }, { delta, initial });
        await timelinePage.clock.runFor(32);
      };
      const remainingGap = () => timelinePage.locator('.origin-rail').evaluate(rail => {
        const bounds = rail.getBoundingClientRect();
        const target = Math.max(bounds.top, Math.min(bounds.bottom, innerHeight / 2));
        return Math.abs(target - rail.querySelector('[data-progress]').getBoundingClientRect().bottom);
      });
      await scroll(0, true);
      const errors = [];
      for (const delta of [12, 12, 50, 120, 50, 12, -12, -12, -50, -120, -50, -12]) {
        await scroll(delta);
        errors.push(await remainingGap());
      }
      expect(Math.max(...errors)).toBeGreaterThan(.5);
      expect(Math.max(...errors)).toBeLessThan(21);
      await timelinePage.clock.runFor(300);
      expect(await remainingGap()).toBeLessThan(.5);
      await timelinePage.clock.runFor(1000);
      await scroll(20);
      expect(await remainingGap()).toBeGreaterThan(.25);
      await timelinePage.clock.runFor(300);
      expect(await remainingGap()).toBeLessThan(.5);
      await timelinePage.emulateMedia({ reducedMotion: 'reduce' });
      await scroll(80);
      expect(await remainingGap()).toBeLessThan(.5);
    }
  } finally { await context.close(); }
});

test('mobile Founder tip stays anchored through touch restarts with animation frames paused', async ({ browser, baseURL }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile compositor regression');
  const context = await browser.newContext(devices['iPhone 11']);
  try {
    const page = await context.newPage();
    await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('.origin-timeline')).toHaveAttribute('data-sticky-progress', 'true');
    await page.evaluate(() => {
      const scroller = document.querySelector('.page-viewport');
      const rail = document.querySelector('.origin-rail').getBoundingClientRect();
      scroller.scrollTo({ top: scroller.scrollTop + rail.top + rail.height * .45 - innerHeight / 2, behavior: 'instant' });
    });
    await page.clock.install();
    await page.clock.pauseAt(new Date());
    const session = await context.newCDPSession(page);
    const viewport = page.viewportSize();
    const x = Math.round(viewport.width * .7);
    const startY = Math.round(viewport.height * .6);
    const scrollTop = () => page.locator('.page-viewport').evaluate(el => el.scrollTop);
    const tipError = () => page.locator('.origin-rail').evaluate(rail => {
      const r = rail.getBoundingClientRect();
      return Math.abs(Math.max(r.top, Math.min(r.bottom, innerHeight / 2)) - rail.querySelector('[data-progress]').getBoundingClientRect().bottom);
    });
    for (const direction of [-1, 1, -1, 1]) {
      const before = await scrollTop();
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: startY }] });
      expect(await tipError()).toBeLessThan(1.5);
      for (const distance of [12, 40, 80, 120]) {
        await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: startY + distance * direction }] });
        expect(await tipError()).toBeLessThan(1.5);
      }
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await expect.poll(async () => Math.abs(await scrollTop() - before)).toBeGreaterThan(20);
      expect(await tipError()).toBeLessThan(1.5);
    }
  } finally { await context.close(); }
});

test('System numbers and cards light up in both scroll directions without a line', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.system-timeline > div[aria-hidden="true"]')).toHaveCount(0);
  await expect(page.locator('.system-timeline > ol > li > button')).toHaveCount(10);
  for (const [step, phase] of [['01', '01'], ['06', '06'], ['10', '09'], ['03', '01']]) {
    const item = page.locator(`#protocol-${step}`);
    await item.locator('article').evaluate(el => {
      const r = el.getBoundingClientRect();
      window.scrollTo({ top: scrollY + r.top + r.height / 2 - innerHeight / 2, behavior: 'instant' });
    });
    await expect(item).toHaveAttribute('data-active', 'true');
    await expect(item.locator(':scope > button')).toHaveAttribute('aria-current', 'step');
    await expect(item.locator('article')).toHaveCSS('opacity', '1');
    await expect(page.locator('.system-timeline li[data-active="true"]')).toHaveCount(1);
    await expect(page.locator('.phase-link[aria-current="step"]')).toHaveAttribute('href', `#protocol-${phase}`);
    await expect(page.locator('.system-timeline li[data-active="false"] article').first()).toHaveCSS('opacity', '0.38');
  }
});

test('inactive System step numbers remain readable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#protocol-05 > button').click();
  const readings = await page.locator('.system-timeline li[data-active="false"]').evaluateAll(items => {
    const context = document.createElement('canvas').getContext('2d');
    const rgba = color => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      const p = [...context.getImageData(0, 0, 1, 1).data];
      p[3] /= 255;
      return p;
    };
    const over = (a, b) => {
      const alpha = a[3] + b[3] * (1 - a[3]);
      return alpha ? [...a.slice(0, 3).map((v, i) => (v * a[3] + b[i] * b[3] * (1 - a[3])) / alpha), alpha] : [0, 0, 0, 0];
    };
    const luminance = p => p.slice(0, 3).map(v => {
      v /= 255;
      return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
    }).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
    return items.flatMap(item => [...item.querySelectorAll(':scope > button')].map(el => {
      const pixel = text => {
        let color = text ? rgba(getComputedStyle(el).color) : [0, 0, 0, 0];
        for (let node = el; node; node = node.parentElement) {
          const css = getComputedStyle(node);
          color = over(color, rgba(css.backgroundColor));
          color[3] *= Number(css.opacity);
        }
        return over(color, [255, 255, 255, 1]);
      };
      const a = luminance(pixel(true)), b = luminance(pixel(false));
      return {
        text: el.textContent.trim(),
        contrast: (Math.max(a, b) + .05) / (Math.min(a, b) + .05),
        target: parseFloat(getComputedStyle(el).fontSize) >= 24 ? 3 : 4.5,
      };
    }));
  });
  expect(readings).toHaveLength(9);
  for (const reading of readings) expect(reading.contrast, reading.text).toBeGreaterThanOrEqual(reading.target);
});

test('every phase lands on its first card with matching highlighting', async ({ page }) => {
  for (const reducedMotion of ['reduce', 'no-preference']) {
    await page.emulateMedia({ reducedMotion });
    for (const step of ['01', '04', '06', '07', '09']) {
      await page.locator(`.phase-link[href="#protocol-${step}"]`).click();
      const card = page.locator(`#protocol-${step} article`);
      await expect.poll(() => card.evaluate(el => {
        const r = el.getBoundingClientRect();
        return Math.abs(r.top + r.height / 2 - innerHeight / 2);
      })).toBeLessThan(2);
      await expect(page.locator(`#protocol-${step}`)).toHaveAttribute('data-active', 'true');
      await expect(page.locator('.phase-link[aria-current="step"]')).toHaveAttribute('href', `#protocol-${step}`);
      await expect(page.locator('.system-timeline li[data-active="true"]')).toHaveCount(1);
    }
  }
});

test('only active mobile phase labels return to a single selected phase with cards dimmed', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  if (testInfo.project.name === 'desktop') {
    await page.locator('#protocol-05 > button').click();
    for (const label of await page.locator('.step-phase-label').all()) await expect(label).toBeDisabled();
    return;
  }
  for (const [step, first] of [['03', '01'], ['05', '04'], ['06', '06'], ['08', '07'], ['10', '09']]) {
    await page.locator(`#protocol-${step} > button`).click();
    const label = page.locator(`#protocol-${step} .step-phase-label`);
    await expect(label).toBeEnabled();
    await expect(page.locator('.step-phase-label:enabled')).toHaveCount(1);
    // A click on a neighboring inactive label cannot navigate, even if dispatched directly.
    const before = await page.evaluate(() => scrollY);
    await page.locator('.step-phase-label:disabled').first().dispatchEvent('click');
    expect(await page.evaluate(() => scrollY)).toBe(before);
    await label.tap();
    const phase = page.locator(`.phase-link[href="#protocol-${first}"]`);
    await expect(phase).toBeFocused();
    await expect(page.locator('.phase-link[aria-current="step"]')).toHaveCount(1);
    await expect(phase).toHaveAttribute('aria-current', 'step');
    await expect(page.locator('.system-timeline li[data-active="true"]')).toHaveCount(0);
    for (const card of await page.locator('.step-card').all()) await expect(card).toHaveCSS('opacity', '0.38');
    const nav = await page.locator('nav[aria-label="System phases"]').boundingBox();
    const header = await page.locator('.site-header').boundingBox();
    expect(nav.y).toBeGreaterThanOrEqual(header.y + header.height);
    expect(nav.y + nav.height).toBeLessThan(page.viewportSize().height);
    // Browser layout/scroll events alone must not switch the selected phase to The Reset.
    await page.evaluate(() => {
      dispatchEvent(new Event('resize'));
      window.scrollBy({ top: 1, behavior: 'instant' });
    });
    await expect(phase).toHaveAttribute('aria-current', 'step');
    await expect(page.locator('.system-timeline li[data-active="true"]')).toHaveCount(0);
    // Choosing a phase exits list mode and restores its first card.
    await phase.tap();
    await expect(page.locator(`#protocol-${first}`)).toHaveAttribute('data-active', 'true');
  }
});

test('mobile return selection survives smooth scrolling and resumes on a deliberate swipe', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile return interaction');
  await page.locator('#protocol-10 > button').click();
  await expect.poll(() => page.locator('#protocol-10 article').evaluate(el => {
    const r = el.getBoundingClientRect();
    return Math.abs(r.top + r.height / 2 - innerHeight / 2);
  })).toBeLessThan(2);
  await page.locator('#protocol-10 .step-phase-label').tap();
  await expect.poll(() => page.locator('nav[aria-label="System phases"]').evaluate(el =>
    Math.abs(el.getBoundingClientRect().top - document.querySelector('.site-header').getBoundingClientRect().bottom - 20)
  )).toBeLessThan(2);
  await expect(page.locator('.phase-link[aria-current="step"]')).toHaveAttribute('href', '#protocol-09');
  await expect(page.locator('.system-timeline li[data-active="true"]')).toHaveCount(0);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 350, y: 620 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 350, y: 570 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.locator('#protocol-01')).toHaveAttribute('data-active', 'true');
  await expect(page.locator('.phase-link[aria-current="step"]')).toHaveAttribute('href', '#protocol-01');
  await expect(page.locator('.system-timeline li[data-active="true"]')).toHaveCount(1);
  await cdp.detach();
});

test('the immersion still changes only the laptop display', async ({ page }) => {
  const figure = page.locator('.immersion-photo');
  await figure.scrollIntoViewIfNeeded();
  const photo = figure.locator('img');
  await photo.evaluate(img => img.decode());
  const source = await photo.getAttribute('src');
  const differences = await page.evaluate(async ({ source, geometry }) => {
    const { polygon, width, height } = geometry;
    const frame = [[247, 440], [260, 510], [268, 550], [320, 562], [400, 551], [470, 540]];
    // Compare at native resolution, avoiding browser-specific JPEG/PNG downsampling.
    async function pixels(src) {
      const image = new Image();
      image.src = src;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      return context.getImageData(0, 0, canvas.width, canvas.height);
    }
    const before = await pixels(new URL('./assets/origin-immersion-original.jpg', location.href).href);
    const after = await pixels(source);
    let changedInside = 0;
    let changedOutside = 0;
    for (let y = 0; y < before.height; y++) {
      for (let x = 0; x < before.width; x++) {
        const offset = (y * before.width + x) * 4;
        if (before.data.slice(offset, offset + 4).every((v, i) => v === after.data[offset + i])) continue;
        // Allow one native pixel for antialiasing along the screen edge.
        const inside = polygon.every(([ax, ay], i) => {
          const [bx, by] = polygon[(i + 1) % polygon.length];
          return (bx - ax) * (y - ay) - (by - ay) * (x - ax) >= -Math.hypot(bx - ax, by - ay);
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
    const preservedFrame = frame.map(([x, y]) => {
      const offset = (Math.round(y) * before.width + Math.round(x)) * 4;
      return [0, 1, 2, 3].every(channel => before.data[offset + channel] === after.data[offset + channel]);
    });
    return { changedInside, changedOutside, filledEdges, preservedFrame };
  }, { source, geometry: immersionGeometry });
  expect(differences.changedInside).toBeGreaterThan(100);
  expect(differences.changedOutside).toBe(0);
  expect(differences.filledEdges).toEqual(Array(6).fill(true));
  expect(differences.preservedFrame).toEqual(Array(6).fill(true));
});

test('immersion photo matches neighboring images and keeps its text unobscured', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const figure = page.locator('.immersion-photo');
  const copy = figure.locator('..').locator('h3, p');
  await expect(copy).toHaveText([
    'I stopped studying English. I started living inside it.',
    'Devices. Media. Thought. Switched. Mimicry until the mouth owned the sound. Reading out loud. Sparring until easy vocabulary died.',
    'No drills. If I did not enjoy it, I would not have stuck. That became the law.',
  ]);
  for (const width of [320, 390, 430, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 844 });
    await figure.scrollIntoViewIfNeeded();
    await figure.locator('img').evaluate(img => img.decode());
    const layout = await figure.evaluate(el => {
      const image = el.querySelector('img');
      const photo = image.getBoundingClientRect();
      const position = getComputedStyle(image).objectPosition;
      const scale = Math.max(photo.width / image.naturalWidth, photo.height / image.naturalHeight);
      const cropLeft = (image.naturalWidth - photo.width / scale) * parseFloat(position) / 100;
      const article = el.parentElement;
      const neighbor = article.previousElementSibling.querySelector('figure img').getBoundingClientRect();
      return {
        width: photo.width, height: photo.height, neighborWidth: neighbor.width,
        bottom: photo.bottom, textTop: article.querySelector('h3').getBoundingClientRect().top,
        overflow: document.documentElement.scrollWidth > innerWidth,
        position, cropLeft, cropRight: cropLeft + photo.width / scale,
      };
    });
    expect(layout.width).toBeLessThanOrEqual(width);
    expect(Math.abs(layout.width - layout.neighborWidth)).toBeLessThan(1);
    expect(layout.width / layout.height).toBeCloseTo(width < 1024 ? 4 / 3 : .8, 2);
    expect(layout.overflow).toBe(false);
    if (width >= 1024) {
      // Native-image bounds of the laptop, including a little breathing room.
      expect(layout.cropLeft).toBeLessThan(215);
      expect(layout.cropRight).toBeGreaterThan(720);
    } else {
      expect(layout.position).toBe('50% 50%');
    }
    if (width < 1024) expect(layout.textTop).toBeGreaterThan(layout.bottom);
    for (const text of await copy.all()) {
      await text.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await expect(text).toBeInViewport({ ratio: .95 });
      expect(await text.evaluate(el => {
        const r = el.getBoundingClientRect();
        return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
      })).toBe(true);
    }
  }
});

test('compact Origin alternates smaller photos beside a continuous scroll-driven timeline', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const timeline = page.locator('.origin-timeline');
  const chapters = timeline.locator('.origin-chapter');
  for (const width of [320, 375, 390, 414, 430, 768, 1023]) {
    await page.setViewportSize({ width, height: 896 });
    await expect(timeline.locator('.origin-rail')).toBeVisible();
    const layout = await chapters.evaluateAll(elements => elements.map(el => {
      const box = node => {
        const r = node.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
      };
      return { card: box(el), image: box(el.querySelector('img')), heading: box(el.querySelector('h3')), copy: box(el.querySelector('h3 + div')) };
    }));
    expect(layout).toHaveLength(5);
    layout.forEach((item, index) => {
      expect(item.image.height).toBeLessThanOrEqual(240);
      expect(item.image.width / item.image.height).toBeCloseTo(4 / 3, 2);
      expect(item.heading.left - item.card.left).toBeCloseTo(28, 0);
      expect(item.heading.top - item.image.bottom).toBeCloseTo(20, 0);
      expect(item.copy.top).toBeGreaterThan(item.heading.bottom);
      if (index % 2 === 0) expect(item.image.left).toBeCloseTo(item.heading.left, 0);
      else expect(item.image.right).toBeCloseTo(item.card.right, 0);
      if (index > 0) expect(item.card.top - layout[index - 1].card.bottom).toBeCloseTo(56, 0);
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 414, height: 896 });
  const scrollPastChapter = async index => {
    await chapters.nth(index).evaluate(el => window.scrollTo({ top: scrollY + el.getBoundingClientRect().top + 32 - innerHeight / 2, behavior: 'instant' }));
    await expect(chapters.nth(index)).toHaveAttribute('data-reached', 'true');
    await expect(chapters.nth(index + 1)).toHaveAttribute('data-reached', 'false');
    return Number(await timeline.getAttribute('data-progress'));
  };
  const start = await scrollPastChapter(0);
  const later = await scrollPastChapter(3);
  expect(later).toBeGreaterThan(start);
  expect(await scrollPastChapter(0)).toBeLessThan(later);
});

test('Origin markers align with the rail and fill in both scroll directions', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const mobile = testInfo.project.name === 'mobile';
  const chapters = page.locator('.origin-chapter');
  for (const width of mobile ? [390, 414] : [1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 896 });
    const geometry = await chapters.evaluateAll(elements => elements.map(el => {
      const css = getComputedStyle(el, '::before');
      const rect = el.getBoundingClientRect();
      const rail = document.querySelector('.origin-rail').getBoundingClientRect();
      const transform = new DOMMatrixReadOnly(css.transform);
      return {
        content: css.content, width: css.width, height: css.height,
        center: rect.left + parseFloat(css.left) + transform.m41 + parseFloat(css.width) / 2,
        railCenter: rail.left + rail.width / 2,
        inset: parseFloat(css.top),
      };
    }));
    for (const marker of geometry) {
      expect(marker.content).toBe('""');
      expect([marker.width, marker.height]).toEqual(['9px', '9px']);
      expect(Math.abs(marker.center - marker.railCenter)).toBeLessThan(.6);
      expect(marker.inset).toBe(mobile ? 16 : 32);
    }
    const chapter = chapters.nth(2);
    for (const reached of [false, true, false]) {
      await chapter.evaluate((el, { inset, reached }) => window.scrollTo({
        top: scrollY + el.getBoundingClientRect().top + inset - innerHeight / 2 + (reached ? 12 : -12),
        behavior: 'instant',
      }), { inset: mobile ? 16 : 32, reached });
      await expect(chapter).toHaveAttribute('data-reached', String(reached));
      await expect.poll(() => chapter.evaluate(el => getComputedStyle(el, '::before').backgroundColor)).toBe(reached ? 'rgb(244, 239, 230)' : 'rgb(5, 5, 5)');
    }
  }
});

test('rooms carousel exposes every card without overflowing the mobile page', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const track = page.locator('.rooms-carousel');
  const cards = track.locator(':scope > article');
  const dots = page.locator('[data-rooms-slide]');
  await expect(cards.locator('h3')).toHaveText(['The map', 'Live walkthroughs', 'The sequence', 'The hub', 'English Mastery']);
  for (const width of [320, 390, 414, 768, 1023]) {
    await page.setViewportSize({ width, height: 896 });
    await track.scrollIntoViewIfNeeded();
    await dots.first().click();
    await expect(dots.first()).toHaveAttribute('aria-current', 'true');
    await expect(page.getByRole('button', { name: 'Previous room', exact: true })).toBeDisabled();
    const layout = await track.evaluate(el => {
      const box = el.getBoundingClientRect();
      return { scrollable: el.scrollWidth > el.clientWidth, right: box.right, cards: [...el.children].map(card => { const r = card.getBoundingClientRect(); return { top: r.top, left: r.left, right: r.right }; }) };
    });
    expect(layout.scrollable).toBe(true);
    expect(layout.cards.every(card => card.top === layout.cards[0].top)).toBe(true);
    expect(layout.cards[1].left).toBeLessThan(layout.right);
    expect(layout.cards[1].right).toBeGreaterThan(layout.right);
    for (let index = 1; index < 5; index++) {
      await page.getByRole('button', { name: 'Next room', exact: true }).click();
      await expect(dots.nth(index)).toHaveAttribute('aria-current', 'true');
      await expect(cards.nth(index)).toBeInViewport({ ratio: .99 });
    }
    await expect(page.getByRole('button', { name: 'Next room', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: 'Previous room', exact: true }).click();
    await expect(dots.nth(3)).toHaveAttribute('aria-current', 'true');
    await dots.nth(1).click();
    await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true');
    await track.focus();
    await page.keyboard.press('End');
    await expect(dots.last()).toHaveAttribute('aria-current', 'true');
    await page.keyboard.press('Home');
    await expect(dots.first()).toHaveAttribute('aria-current', 'true');
    await page.keyboard.press('ArrowRight');
    await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 1440, height: 1080 });
  await expect(page.locator('.rooms-controls')).toBeHidden();
  await expect(track).not.toHaveAttribute('tabindex');
  expect(await track.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  expect(await track.evaluate(el => getComputedStyle(el).display)).toBe('grid');
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

test('Black links open the application and every free CTA opens the signup form', async ({ page }) => {
  await expect(page.locator('header nav, header button, .menu-toggle')).toHaveCount(0);
  const external = await page.locator('header a[href^="https:"], main a[href^="https:"]').evaluateAll((links) => links.map((a) => a.href));
  expect(external).toEqual([]);
  await expect(page.locator('[data-black-application]')).toHaveCount(4);
  for (const link of await page.locator('[data-black-application]').all()) await expect(link).toHaveAttribute('href', './apply/');
  const missing = await page.locator('a[href^="#"]').evaluateAll((links) => links.filter((a) => !document.getElementById(a.hash.slice(1))).map((a) => a.hash));
  expect(missing).toEqual([]);
  await expect(page.locator('[data-free-system]')).toHaveCount(5);
  await expect(page.locator('a[href*="plan_kIUSXT7V4Lkag"]')).toHaveCount(0);
  for (const button of await page.locator('main [data-free-system]').all()) {
    await button.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Close signup form' }).click();
    await expect(button).toBeFocused();
  }
});

test('signup draft fits phones, traps focus, and preserves the page position', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const trigger = page.locator('#top [data-free-system]');
  const dialog = page.getByRole('dialog');
  for (const width of [320, 390, 414, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await trigger.scrollIntoViewIfNeeded();
    const scrollY = await page.evaluate(() => window.scrollY);
    await trigger.click();
    await expect(page.getByLabel('Email address', { exact: true })).toBeFocused();
    const bounds = await dialog.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    expect(bounds.height).toBeLessThanOrEqual(812);
    await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('button', { name: 'Close signup form' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Email address', { exact: true })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    expect(await page.evaluate(() => window.scrollY)).toBeCloseTo(scrollY, 0);
  }
});

test('signup does not collect or claim to deliver email before the provider is connected', async ({ page }) => {
  const posts = [];
  page.on('request', request => { if (request.method() === 'POST') posts.push(request.url()); });
  await page.locator('#top [data-free-system]').click();
  await page.getByLabel('Email address', { exact: true }).fill('preview@example.test');
  await expect(page.getByRole('button', { name: 'Send me the system' })).toBeDisabled();
  await page.locator('#free-system-form').evaluate(form => form.requestSubmit());
  await expect(page.getByRole('status')).toHaveText('Coming soon. Email signup isn’t available yet.');
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(posts).toEqual([]);
});

test('floating signup preserves scroll and returns focus to its button', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#founder').evaluate(el => window.scrollTo({ top: el.offsetTop, behavior: 'instant' }));
  const trigger = page.locator('.floating-cta [data-free-system]');
  await expect(trigger).toBeVisible();
  const position = await page.evaluate(() => scrollY);
  await trigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(position, 0);
});

test('footer retains its original responsive layout and wordmark', async ({ page }, testInfo) => {
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
      logo: [brand.querySelector('.brand-monogram').getBoundingClientRect().width, brand.querySelector('.brand-monogram').getBoundingClientRect().height],
      name: getComputedStyle(brand.querySelector('.font-serif')).fontSize,
      social: getComputedStyle(el.querySelector('nav')).fontSize,
      copyright: getComputedStyle(el.querySelector('p')).fontSize,
      direction: style.flexDirection,
      centerOffsets: [...row.children].map(child => {
        const bounds = child.getBoundingClientRect();
        const footerBounds = el.getBoundingClientRect();
        return bounds.x + bounds.width / 2 - footerBounds.x - footerBounds.width / 2;
      }),
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
    for (const offset of dimensions.centerOffsets) expect(Math.abs(offset)).toBeLessThan(1);
  }
});

test('compact monogram header stays sticky with glass and rounded bottom corners', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => window.scrollTo(0, 900));
  const header = page.locator('.site-header');
  await expect(header.getByRole('link', { name: 'Swan Academy — home' })).toBeVisible();
  const style = await header.evaluate(el => {
    const css = getComputedStyle(el);
    const glass = innerWidth < 640 ? getComputedStyle(el, '::before') : css;
    const context = document.createElement('canvas').getContext('2d');
    context.fillStyle = glass.backgroundColor;
    context.fillRect(0, 0, 1, 1);
    return { top: el.getBoundingClientRect().top, position: css.position, alpha: context.getImageData(0, 0, 1, 1).data[3] / 255, blur: glass.backdropFilter, opacity: css.opacity, width: el.getBoundingClientRect().width, corners: [css.borderTopLeftRadius, css.borderTopRightRadius, css.borderBottomLeftRadius, css.borderBottomRightRadius] };
  });
  expect(style.top).toBe(0);
  expect(style.position).toBe('sticky');
  expect(style.alpha).toBeCloseTo(.8, 2);
  expect(style.width).toBeLessThanOrEqual(90);
  expect(style.corners).toEqual(['0px', '0px', '16px', '16px']);
  expect(style.blur).toBe('blur(24px) saturate(1.3)');
  expect(style.opacity).toBe('1');
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /viewport-fit=cover/);
  await page.addStyleTag({ content: ':root { --safe-area-top: 44px; }' });
  const mobile = page.viewportSize().width < 640;
  await expect(header).toHaveCSS('top', mobile ? '0px' : '44px');
  expect(await header.evaluate(el => el.getBoundingClientRect().top)).toBe(mobile ? 0 : 44);
  expect(await header.evaluate(el => el.getBoundingClientRect().bottom)).toBe(117);
  if (mobile) {
    await expect(header.locator('.site-header-inner')).toHaveCSS('padding-top', '44px');
    expect(await header.locator('.brand-monogram').evaluate(el => el.getBoundingClientRect().top)).toBe(64);
  }
  const fade = await page.evaluate(() => {
    const css = getComputedStyle(document.body, '::before');
    return { height: css.height, background: css.backgroundImage, mask: css.maskImage, filter: css.backdropFilter, pointerEvents: css.pointerEvents };
  });
  expect(fade.height).toBe('172px');
  expect(fade.background).toContain('linear-gradient');
  expect(fade.mask).toBe('none');
  expect(fade.filter).toBe('none');
  expect(fade.pointerEvents).toBe('none');
});

test('iPhone scrolling remains natively clipped during abrupt jumps and viewport changes', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ ...devices['iPhone 11'], reducedMotion: 'reduce' });
  const page = await context.newPage();
  try {
    for (const route of ['/', '/apply/', '/status/?preview=approved', '/checkout/']) {
      await page.goto(baseURL + route);
      await expect(page.locator('html')).toHaveClass(/contained-scroll/);
      await page.addStyleTag({ content: ':root { --safe-area-top: 44px; } body::before, body::after { display: none !important; }' });
      for (const height of [844, 680, 844]) {
        await page.setViewportSize({ width: 390, height });
        const result = await page.locator('.page-viewport').evaluate(viewport => {
          const clipped = [];
          for (const top of [500, 4000, 800, 12000, 500]) {
            viewport.scrollTo({ top, behavior: 'instant' });
            clipped.push(!document.querySelector('main').contains(document.elementFromPoint(20, 30)) && window.scrollY === 0);
          }
          return { clipped, clip: getComputedStyle(viewport).clipPath, contentVisible: document.querySelector('main').contains(document.elementFromPoint(20, 200)) };
        });
        expect(result.clipped).toEqual([true, true, true, true, true]);
        expect(result.clip).toBe('inset(92px 0px 0px)');
        expect(result.contentVisible).toBe(true);
      }
    }
  } finally { await context.close(); }
});

test('tab uses the framed vector favicon and site monograms match their ivory wordmarks', async ({ page, request }) => {
  const favicon = await page.locator('link[rel="icon"][type="image/svg+xml"]').getAttribute('href');
  expect(favicon).toMatch(/Swan-Academy-Favicon\.svg$/);
  const response = await request.get(favicon);
  expect(response.ok()).toBe(true);
  expect(await response.text()).toBe(readFileSync(new URL('../public/assets/Swan-Academy-Favicon.svg', import.meta.url), 'utf8'));
  const fallback = await page.locator('link[rel="icon"][type="image/x-icon"]').getAttribute('href');
  expect((await request.get(fallback)).ok()).toBe(true);
  await expect(page).toHaveTitle('Swan Academy · English Mastery');
  await expect(page.locator('header .brand')).toHaveText('');
  await expect(page.locator('header .brand-monogram')).toHaveCSS('width', page.viewportSize().width < 640 ? '32px' : '40px');
  await expect(page.locator('header .brand-monogram')).toHaveCSS('height', page.viewportSize().width < 640 ? '32px' : '40px');
  for (const selector of ['.brand .brand-monogram', 'footer .brand-monogram', '.signup-brand .brand-monogram']) {
    const logo = await page.locator(selector).evaluate(el => ({
      color: getComputedStyle(el).backgroundColor,
      wordmark: el.nextElementSibling ? getComputedStyle(el.nextElementSibling).color : null,
      mask: getComputedStyle(el).maskImage,
    }));
    expect(logo.color).toBe('rgb(244, 239, 230)');
    if (logo.wordmark) expect(logo.color).toBe(logo.wordmark);
    expect(logo.mask).toContain('Swan-Academy-Monogram-White-Master.svg');
  }
  await expect(page.locator('#top h1')).toHaveCSS('color', 'rgb(248, 245, 239)');
  await expect(page.locator('#top .text-body')).toHaveCSS('color', 'rgb(178, 171, 160)');
  await expect(page.locator('#top p').first()).toHaveCSS('color', 'rgb(168, 160, 148)');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(5, 5, 5)');
});

test('floating CTAs follow the reading sections in both scroll directions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const banner = page.locator('.floating-cta');
  for (const section of ['top', 'offers']) {
    for (const [fraction, visible] of [[.7, false], [.9, true], [.7, false]]) {
      await page.locator('#' + section).evaluate((el, fraction) => {
        const headerBottom = document.querySelector('header').getBoundingClientRect().bottom;
        const target = Math.max(...[...el.querySelectorAll('[data-free-system], [data-black-application]')].map(button => {
          const r = button.getBoundingClientRect();
          return scrollY + r.top + r.height * fraction - headerBottom;
        }));
        window.scrollTo({ top: target, behavior: 'instant' });
      }, fraction);
      await expect(banner).toHaveAttribute('aria-hidden', String(!visible));
      await expect(banner).toBeVisible({ visible });
    }
  }
  for (const [id, visible] of [['top', false], ['founder', true], ['failure', true], ['method', true], ['inside', true], ['offers', false], ['faq', true], ['final-cta', false], ['faq', true], ['offers', false], ['inside', true], ['founder', true], ['top', false]]) {
    await page.locator('#' + id).evaluate(el => window.scrollTo({ top: el.offsetTop, behavior: 'instant' }));
    await expect(banner).toHaveAttribute('aria-hidden', String(!visible));
    await expect(banner).toBeVisible({ visible });
    expect(await banner.evaluate(el => el.inert)).toBe(!visible);
  }
  for (const id of ['offers', 'final-cta']) {
    for (const [offset, visible] of [[8, true], [0, false], [-8, false], [8, true]]) {
      await page.locator('#' + id).evaluate((section, offset) => {
        const banner = document.querySelector('.floating-cta');
        const edge = innerHeight - parseFloat(getComputedStyle(banner).bottom);
        const firstButtonTop = Math.min(...[...section.querySelectorAll('[data-free-system], [data-black-application]')].map(el => scrollY + el.getBoundingClientRect().top));
        window.scrollTo({ top: firstButtonTop - edge - offset, behavior: 'instant' });
      }, offset);
      await expect(banner).toHaveAttribute('aria-hidden', String(!visible));
    }
  }
  await page.locator('#founder').evaluate(el => window.scrollTo({ top: el.offsetTop, behavior: 'instant' }));
  await page.reload();
  await expect(banner).toBeVisible();
  await banner.getByRole('link', { name: 'Apply Black' }).click();
  await expect(page).toHaveURL(/\/apply\/$/);
});

test('floating banner stays painted through its exit and survives a reversed exit', async ({ browser, baseURL }, testInfo) => {
  const mobile = testInfo.project.name === 'mobile';
  const context = await browser.newContext(mobile ? { ...devices['iPhone 11'] } : { viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  try {
    await page.goto(baseURL);
    await page.evaluate(() => document.fonts.ready);
    const banner = page.locator('.floating-cta');
    const scrollTo = id => page.locator('#' + id).evaluate(section => {
      const scroller = document.documentElement.classList.contains('contained-scroll') ? document.querySelector('.page-viewport') : window;
      const top = (scroller === window ? scrollY : scroller.scrollTop) + section.getBoundingClientRect().top;
      scroller.scrollTo({ top, behavior: 'instant' });
    });
    await scrollTo('founder');
    await expect(banner).toHaveAttribute('data-visible', 'true');
    await expect.poll(() => banner.evaluate(el => el.getAnimations().length)).toBe(0);
    const restingTop = await banner.evaluate(el => el.getBoundingClientRect().top);
    await scrollTo('top');
    await expect(banner).toHaveAttribute('data-visible', 'false');
    const exiting = await banner.evaluate(el => {
      const animation = el.getAnimations().find(animation => animation.transitionProperty === 'transform');
      if (!animation) throw new Error('The exit must animate its transform');
      animation.pause();
      animation.currentTime = 160;
      const midway = { top: el.getBoundingClientRect().top, visibility: getComputedStyle(el).visibility, opacity: getComputedStyle(el).opacity, inert: el.inert, viewport: innerHeight };
      // Sample and finish atomically: a paused test animation must not race
      // the real-time cleanup fallback on a busy browser worker.
      animation.finish();
      return midway;
    });
    expect(exiting.top).toBeGreaterThan(restingTop);
    expect(exiting.top).toBeLessThan(exiting.viewport);
    expect(exiting.visibility).toBe('visible');
    expect(exiting.opacity).toBe('1');
    expect(exiting.inert).toBe(true);
    await expect(banner).toBeHidden();
    expect(await banner.evaluate(el => el.getBoundingClientRect().top >= innerHeight)).toBe(true);
    await scrollTo('founder');
    await expect(banner).toHaveAttribute('data-visible', 'true');
    await expect.poll(() => banner.evaluate(el => el.getAnimations().length)).toBe(0);
    await scrollTo('top');
    await expect(banner).toHaveAttribute('data-visible', 'false');
    await scrollTo('founder');
    await expect(banner).toHaveAttribute('data-visible', 'true');
    await page.waitForTimeout(450); // Outlast the canceled exit's cleanup timer.
    await expect(banner).toBeVisible();
    expect(await banner.evaluate(el => el.inert)).toBe(false);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await scrollTo('top');
    await expect(banner).toBeHidden();
    expect(await banner.evaluate(el => el.getAnimations().length)).toBe(0);
  } finally { await context.close(); }
});

test('hero fonts start loading before the stylesheet arrives and are reused', async ({ page, browser, baseURL }) => {
  const context = await browser.newContext({ viewport: page.viewportSize() });
  const fresh = await context.newPage();
  const fonts = [];
  fresh.on('request', request => {
    if (request.url().endsWith('.woff2')) fonts.push(request.url());
  });
  let releaseStyles;
  let stylesheetHeld = false;
  const gate = new Promise(resolve => { releaseStyles = resolve; });
  await fresh.route('**/*.css', async route => {
    stylesheetHeld = true;
    await gate;
    await route.continue();
  });
  const navigation = fresh.goto(baseURL, { waitUntil: 'load' });
  try {
    try {
      await expect.poll(() => stylesheetHeld).toBe(true);
      await expect.poll(() => fonts.length).toBe(3);
    } finally {
      releaseStyles();
      await navigation;
    }
    await fresh.evaluate(() => document.fonts.ready);
    expect(fonts).toHaveLength(3);
    expect(new Set(fonts).size).toBe(3);
    const preloaded = await fresh.locator('link[rel="preload"][as="font"]').evaluateAll(links => links.map(link => link.href));
    expect(new Set(fonts)).toEqual(new Set(preloaded));
    expect(fonts.some(url => /playfair-display-latin-wght-italic/.test(url))).toBe(true);
    expect(await fresh.evaluate(() => document.fonts.check('italic 400 72px "Playfair Display Variable"'))).toBe(true);
  } finally {
    await context.close();
  }
});

test('local branding and both fonts load without JavaScript errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);
  expect(await page.locator('.brand-monogram').first().evaluate(async el => {
    const image = new Image();
    image.src = getComputedStyle(el).maskImage.slice(5, -2);
    await image.decode();
    return image.naturalWidth > 0;
  })).toBe(true);
  expect(await page.evaluate(() => document.fonts.check('16px "Inter Variable"'))).toBe(true);
  expect(await page.evaluate(() => document.fonts.check('16px "Playfair Display Variable"'))).toBe(true);
  expect(errors).toEqual([]);
});
