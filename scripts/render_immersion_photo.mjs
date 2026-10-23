// Export the approved composition once; visitors receive a normal responsive PNG.
// Run from the repository root: node scripts/render_immersion_photo.mjs
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const geometry = JSON.parse(await readFile(new URL('../reference/immersion-screen.json', import.meta.url), 'utf8'));
const asset = name => new URL(`../public/assets/${name}`, import.meta.url);
const original = (await readFile(asset('origin-immersion-original.jpg'))).toString('base64');
const screen = (await readFile(asset('origin-immersion-screen.png'))).toString('base64');
const { width, height, screenWidth, screenHeight, polygon, transform } = geometry;
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-color-profile=srgb'],
});

try {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html><head><style>
    html, body { margin: 0; width: ${width}px; height: ${height}px; overflow: hidden; }
    .original { display: block; width: ${width}px; height: ${height}px; }
    svg { position: absolute; inset: 0; width: ${width}px; height: ${height}px; }
  </style></head><body>
    <img class="original" src="data:image/jpeg;base64,${original}">
    <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id="screen"><polygon points="${polygon.map(p => p.join(',')).join(' ')}"/></clipPath></defs>
      <g clip-path="url(#screen)"><foreignObject width="${screenWidth}" height="${screenHeight}">
        <img xmlns="http://www.w3.org/1999/xhtml" src="data:image/png;base64,${screen}"
          style="display:block;width:${screenWidth}px;height:${screenHeight}px;max-width:none;transform-origin:0 0;transform:matrix3d(${transform.join(',')})">
      </foreignObject></g>
    </svg>
  </body></html>`);
  await page.locator('img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
  await page.screenshot({ path: fileURLToPath(asset('origin-immersion-composite.png')), scale: 'css' });
  console.log(`Exported ${width}×${height} lossless immersion photograph.`);
} finally {
  await browser.close();
}
