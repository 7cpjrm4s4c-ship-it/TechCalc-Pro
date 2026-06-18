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

const panel = block('.settings-panel');
const submenu = block('.settings-submenu');
const submenuContent = block('.settings-submenu__content');

assert.match(panel, /background:\s*linear-gradient\([^;]*rgb\(/, 'settings-panel must use an opaque rgb background surface');
assert.match(panel, /backdrop-filter:\s*none;/, 'settings-panel must disable backdrop-filter to prevent module bleed-through');
assert.match(submenu, /background:\s*linear-gradient\([^;]*rgb\(/, 'settings-submenu headers must use opaque rgb surfaces');
assert.match(submenuContent, /background:\s*linear-gradient\([^;]*rgb\(/, 'settings-submenu content must use an opaque rgb surface');
assert.doesNotMatch(panel, /background:\s*rgba\([^)]*,\s*\.(?:[0-8]\d*|9[0-4])/, 'settings-panel must not use low-alpha translucent backgrounds');

console.log('Phase 37C.4C settings drawer surface opacity guard passed.');
