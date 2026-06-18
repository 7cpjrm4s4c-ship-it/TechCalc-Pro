import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const css = fs.readFileSync(path.join(root, 'css/components.css'), 'utf8');

function block(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'm'));
  assert.ok(match, `${selector} block must exist`);
  return match[1];
}

const panelBody = block('.settings-panel__body');
const submenu = block('.settings-submenu');
const content = block('.settings-submenu__content');
const openMatch = css.match(/\.settings-submenu\[open\] > \.settings-submenu__content,\n\.settings-submenu\.is-open > \.settings-submenu__content \{([^}]*)\}/m);
assert.ok(openMatch, 'open settings submenu content block must exist');
const openContent = openMatch[1];

assert.match(panelBody, /display:\s*block/, 'settings drawer body must use block flow so open accordions reserve height');
assert.match(submenu, /display:\s*block/, 'settings submenu must use normal block flow');
assert.match(content, /position:\s*static/, 'settings submenu content must not overlay following accordions');
assert.match(openContent, /position:\s*static/, 'open settings content must remain in document flow');
assert.match(openContent, /display:\s*block/, 'open settings content must be visible as a block');
assert.match(css, /settings-panel__body > \.settings-submenu \+ \.settings-submenu\s*\{[^}]*margin-top:\s*var\(--tc-gap\)/, 'settings submenu siblings must be spaced by normal margin');
assert.doesNotMatch(content, /position:\s*absolute|position:\s*fixed/, 'settings content must never be absolutely layered');

console.log('Phase 37C.4F settings accordion stack flow guard passed.');
