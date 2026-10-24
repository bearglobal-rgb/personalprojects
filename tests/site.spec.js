import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const original = readFileSync(new URL('../reference/original.html', import.meta.url), 'utf8');
const offerCopyChanges = JSON.parse(readFileSync(new URL('../reference/free-system-copy-changes.json', import.meta.url), 'utf8'));
const immersionGeometry = JSON.parse(readFileSync(new URL('../reference/immersion-screen.json', import.meta.url), 'utf8'));

test.beforeEach(async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);
});

test('preserves the original content apart from the revised offer and removed language strip', async ({ page }) => {
  const result = await page.evaluate((html) => {
    const original = new DOMParser().parseFromString(html, 'text/html');
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
  for (const width of [320, 390, 430, 768, 1024]) {
    await page.setViewportSize({ width, height: 844 });
    await figure.scrollIntoViewIfNeeded();
    await figure.locator('img').evaluate(img => img.decode());
    const layout = await figure.evaluate(el => {
      const photo = el.querySelector('img').getBoundingClientRect();
      const article = el.parentElement;
      const neighbor = article.previousElementSibling.querySelector('figure img').getBoundingClientRect();
      return {
        width: photo.width, height: photo.height, neighborWidth: neighbor.width,
        bottom: photo.bottom, textTop: article.querySelector('h3').getBoundingClientRect().top,
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    expect(layout.width).toBeLessThanOrEqual(width);
    expect(Math.abs(layout.width - layout.neighborWidth)).toBeLessThan(1);
    expect(layout.width / layout.height).toBeCloseTo(width < 1024 ? 4 / 3 : .8, 2);
    expect(layout.overflow).toBe(false);
    if (width < 1024) expect(layout.textTop).toBeGreaterThan(layout.bottom);
    for (const text of await copy.all()) {
      await text.scrollIntoViewIfNeeded();
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

test('Black checkout remains intact and every free CTA opens the signup form', async ({ page }) => {
  const external = await page.locator('header a[href^="https:"], main a[href^="https:"]').evaluateAll((links) => links.map((a) => a.href));
  expect(new Set(external)).toEqual(new Set([
    'https://whop.com/checkout/plan_DB7DJLmJ0TIf4',
  ]));
  const missing = await page.locator('a[href^="#"]').evaluateAll((links) => links.filter((a) => !document.getElementById(a.hash.slice(1))).map((a) => a.hash));
  expect(missing).toEqual([]);
  await expect(page.locator('[data-free-system]')).toHaveCount(6);
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

test('mobile-menu signup closes the menu and returns focus to its toggle', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.locator('#mobile-menu [data-free-system]').click();
  await expect(page.locator('#mobile-menu')).toBeHidden();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Close signup form' }).click();
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeFocused();
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
      centerOffsets: [...row.children].map(child => {
        const bounds = child.getBoundingClientRect();
        return bounds.x + bounds.width / 2 - window.innerWidth / 2;
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
  const typography = await page.locator('#mobile-menu').evaluate(menu => {
    const read = element => {
      const style = getComputedStyle(element);
      return Object.fromEntries(['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textTransform'].map(property => [property, style[property]]));
    };
    return {
      free: read(menu.querySelector('[data-free-system]')),
      black: read(menu.querySelector('a[href*="plan_DB7DJLmJ0TIf4"]')),
    };
  });
  expect(typography.free).toEqual(typography.black);
  expect(typography.free.textTransform).toBe('uppercase');
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
