import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const components = fs.readFileSync(path.join(root, 'css/components.css'), 'utf8');

function block(selector) {
  const pattern = new RegExp(`${selector.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\s*\\{([\\s\\S]*?)\\n\\}`, 'm');
  const match = components.match(pattern);
  assert.ok(match, `${selector} block must exist`);
  return match[1];
}

const submenu = block('.settings-submenu');
const summary = block('.settings-submenu > summary');
const content = block('.settings-submenu__content');

assert.match(submenu, /display:\s*block/, 'settings submenu must participate in normal block flow');
assert.match(submenu, /overflow:\s*hidden/, 'settings submenu must clip its own chevron/background bleed');
assert.match(summary, /z-index:\s*1/, 'settings summary chevron must stay local to its own header');
assert.match(content, /position:\s*static/, 'settings submenu content must not form an overlay layer');
assert.match(content, /background:\s*linear-gradient\([^;]*rgb\(/, 'settings submenu content must have an opaque background');
assert.doesNotMatch(submenu, /z-index:\s*[3-9]/, 'settings submenu must not use aggressive stacking above siblings');

console.log('Phase 37C.4D settings accordion layer regression guard passed.');
