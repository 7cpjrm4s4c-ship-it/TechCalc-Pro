import fs from 'node:fs';

const css = fs.readFileSync('css/modules.css', 'utf8');
const sw = fs.readFileSync('service-worker.js', 'utf8');
const view = fs.readFileSync('js/modules/buffer-storage/view.js', 'utf8');

const required = [
  `.module-view[data-module='buffer-storage'] [data-buffer-dynamic=\"input-blocks\"] { display: flex; flex-direction: column; gap: var(--tc-gap); align-content: start; }`,
  `.buffer-compare-sections { display: flex; flex-direction: column; gap: var(--tc-gap); align-content: start; }`,
  `[data-buffer-dynamic=\"input-blocks\"] > .card + .card`,
  `.buffer-compare-sections > .card + .card`,
  `margin-top: var(--tc-gap) !important;`
];

const missing = required.filter(token => !css.includes(token));
if (missing.length) {
  console.error('Phase 38D.3 spacing guard failed. Missing CSS tokens:', missing);
  process.exit(1);
}

if (!view.includes('class="buffer-compare-sections"')) {
  console.error('Phase 38D.3 spacing guard failed: compare wrapper missing in buffer-storage view.');
  process.exit(1);
}

if (!sw.includes(`const CACHE_NAME = 'techcalc-pro-1.3.0-rc.1';`) || !sw.includes(`const CACHE_REVISION = 'phase38d3-buffer-spacing';`)) {
  console.error('Phase 38D.3 cache guard failed: service worker byte revision is missing.');
  process.exit(1);
}

console.log('Phase 38D.3 buffer compare spacing and cache invalidation guard passed.');
