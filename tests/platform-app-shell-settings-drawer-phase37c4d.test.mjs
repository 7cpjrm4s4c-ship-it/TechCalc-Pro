import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const components = fs.readFileSync(path.join(root, 'css/components.css'), 'utf8');

function assertContains(fragment, message) {
  assert.ok(components.includes(fragment), message);
}

assertContains('.settings-panel__body { position: relative; isolation: isolate;', 'settings body must isolate stacking contexts');
assertContains('.settings-submenu { position: relative; z-index: 1; isolation: isolate;', 'closed settings submenu must remain below open cards and isolate pseudo-elements');
assertContains('.settings-submenu > summary { position: relative; z-index: 3;', 'settings submenu summary must keep its own chevron contained');
assertContains(".settings-submenu > summary::after { position: relative; z-index: 1;", 'settings submenu chevron must not overpaint open bodies');
assertContains('.settings-submenu__content { position: relative; z-index: 4;', 'settings submenu content must paint above closed sibling chevrons');
assertContains('.settings-submenu.is-open { z-index: 6; height: auto; max-height: none; overflow: hidden; }', 'open settings submenu must paint above closed siblings and clip chevron bleed-through');
assert.match(components, /\.settings-submenu > summary \{[^}]*background:\s*linear-gradient\([^;]*rgb\(/, 'settings submenu summary must have an opaque background');

console.log('Phase 37C.4D settings accordion chevron layer guard passed.');
