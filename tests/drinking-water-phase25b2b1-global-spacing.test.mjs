import assert from 'node:assert/strict';
import fs from 'node:fs';

const view = fs.readFileSync(new URL('../js/modules/drinking-water/view.js', import.meta.url), 'utf8');
const results = fs.readFileSync(new URL('../js/modules/drinking-water/results.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../css/components.css', import.meta.url), 'utf8');

assert(!view.includes('class="tc-accordion dw-accordion'), 'view must not use module-specific dw accordion spacing classes');
assert(!view.includes('class="dw-accordion'), 'view must not use module-specific dw accordion spacing classes');
assert(view.includes('tc-accordion__body tc-stack'), 'accordion bodies must use global tc-stack spacing');
assert(!results.includes('dw-consumer-list'), 'result consumer lists must use global list classes');
assert(!results.includes('dw-fixture-list'), 'fixture lists must use global list classes');
assert(css.includes('Phase 25B.2B.1'), 'CSS must include the spacing hardening marker');

console.log('drinking-water phase25b2b1 global spacing ok');
