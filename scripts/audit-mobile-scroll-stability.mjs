import { readFileSync } from 'node:fs';

const renderer = readFileSync('js/core/renderer.js', 'utf8');
const mount = readFileSync('js/core/mount.js', 'utf8');
const css = readFileSync('css/components.css', 'utf8');

const checks = [
  ['mobile viewport detection', /function isMobileViewport\(\)/.test(renderer)],
  ['anchor based viewport snapshot', /anchor:\s*anchorInfo/.test(renderer) && /querySelector\(snapshot\.anchor\.selector\)/.test(renderer)],
  ['mobile blur guard', /blurActive && !mobile/.test(renderer)],
  ['touchstart passive capture', /touchstart.+passive:\s*true/s.test(renderer)],
  ['mount uses mobile restore profile', /isMobileViewport\(\) \? \{ frames: 10/.test(mount)],
  ['mobile css disables focus smooth scroll', /html:focus-within\s*\{\s*scroll-behavior:\s*auto;/s.test(css)],
  ['saved cards act as anchors', /\[data-line-card\]/.test(css) && /overflow-anchor:\s*auto/.test(css)]
];

let failed = false;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'ok' : 'FAIL'} ${label}`);
  failed ||= !ok;
}

if (failed) process.exit(1);
