// Frame the original vector artwork without changing its path geometry.
// Run manually after changing favicon artwork: node scripts/build_favicon.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const assets = new URL('../public/assets/', import.meta.url);
const source = await readFile(new URL('Swan-Academy-Monogram-White-Master.svg', assets), 'utf8');
const artwork = source.match(/<g\b[\s\S]*<\/g>/)?.[0];
if (!artwork) throw new Error('Original SVG artwork not found');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="64" height="64" rx="12" fill="#000000"/>
  <svg x="6" y="6" width="52" height="52" viewBox="0 0 623.0459 556" preserveAspectRatio="xMidYMid meet">
    ${artwork}
  </svg>
</svg>
`;
await writeFile(new URL('Swan-Academy-Favicon.svg', assets), svg);

// Raster fallback for browsers without SVG favicons; the master remains vector.
const sizes = [16, 32, 48, 64];
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
try {
  const page = await browser.newPage();
  const data = await page.evaluate(async ({ svg, sizes }) => {
    const icon = new Image();
    icon.src = `data:image/svg+xml;base64,${btoa(svg)}`;
    await icon.decode();
    return sizes.map(size => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      canvas.getContext('2d').drawImage(icon, 0, 0, size, size);
      return canvas.toDataURL('image/png').split(',')[1];
    });
  }, { svg, sizes });
  const images = data.map(value => Buffer.from(value, 'base64'));
  const directory = Buffer.alloc(6 + 16 * sizes.length);
  directory.writeUInt16LE(1, 2);
  directory.writeUInt16LE(sizes.length, 4);
  let offset = directory.length;
  sizes.forEach((size, index) => {
    const entry = 6 + 16 * index;
    directory[entry] = directory[entry + 1] = size;
    directory.writeUInt16LE(1, entry + 4);
    directory.writeUInt16LE(32, entry + 6);
    directory.writeUInt32LE(images[index].length, entry + 8);
    directory.writeUInt32LE(offset, entry + 12);
    offset += images[index].length;
  });
  await writeFile(new URL('Swan-Academy-Favicon.ico', assets), Buffer.concat([directory, ...images]));
} finally {
  await browser.close();
}
