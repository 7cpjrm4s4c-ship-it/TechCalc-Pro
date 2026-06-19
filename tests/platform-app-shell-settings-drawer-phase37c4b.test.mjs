import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const css = fs.readFileSync(path.join(root, 'css/components.css'), 'utf8');
const controller = fs.readFileSync(path.join(root, 'js/platform/shell/settingsController.js'), 'utf8');

assert.match(css, /settings-submenu\[open\][\s\S]*settings-submenu\.is-open/, 'Settings accordion CSS must support native open and explicit is-open state.');
assert.match(css, /settings-submenu\[open\][\s\S]*height:\s*auto/, 'Open settings submenu must use auto height.');
assert.match(css, /settings-submenu\[open\] > \.settings-submenu__content[\s\S]*display:\s*block/, 'Open settings submenu content must be visible in normal block flow.');
assert.match(css, /settings-submenu:not\(\[open\]\):not\(\.is-open\) > \.settings-submenu__content[\s\S]*display:\s*none/, 'Closed settings submenu content must stay hidden.');
assert.match(controller, /function setSubmenuOpenState/, 'Settings controller must synchronize submenu open state.');
assert.match(controller, /classList\.toggle\('is-open'/, 'Settings controller must toggle explicit is-open class.');
assert.match(controller, /aria-expanded/, 'Settings controller must expose expanded state for accessibility.');

console.log('Phase 37C.4B settings accordion body visibility guard passed.');
