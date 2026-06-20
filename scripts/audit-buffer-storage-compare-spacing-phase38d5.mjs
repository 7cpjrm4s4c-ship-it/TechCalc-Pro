import fs from 'node:fs';

const view = fs.readFileSync('js/modules/buffer-storage/view.js', 'utf8');
const css = fs.readFileSync('css/modules.css', 'utf8');
const sw = fs.readFileSync('service-worker.js', 'utf8');

const failures = [];
if (!view.includes('class="buffer-input-blocks" data-buffer-dynamic="input-blocks"')) {
  failures.push('buffer input island lacks explicit buffer-input-blocks class');
}
if (!view.includes('buffer-compare-sections')) {
  failures.push('compare mode lacks stable buffer-compare-sections wrapper');
}
if (!/\.buffer-input-blocks[\s\S]*display:\s*flex\s*!important/.test(css)) {
  failures.push('buffer-input-blocks does not enforce flex stack layout');
}
if (!/\.buffer-compare-sections[\s\S]*gap:\s*var\(--space-2\)\s*!important/.test(css)) {
  failures.push('buffer compare sections do not enforce explicit gap');
}
if (!css.includes('margin-top: var(--space-2) !important')) {
  failures.push('adjacent card fallback margin is missing');
}
if (!sw.includes("const CACHE_NAME = 'techcalc-pro-1.3.0-rc.1'") || !sw.includes('phase38d5-buffer-compare-spacing')) {
  failures.push('service worker cache revision was not advanced for mobile clients');
}

if (failures.length) {
  console.error('Phase 38D.5 audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('Phase 38D.5 audit passed');
