import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const css = readFileSync(join(root, 'css', 'components.css'), 'utf8');
const controller = readFileSync(join(root, 'js', 'platform', 'shell', 'settingsController.js'), 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(css.includes('.settings-panel {'), 'settings-panel CSS missing');
assert(/\.settings-panel\s*\{[\s\S]*bottom:\s*max\(18px,\s*env\(safe-area-inset-bottom\)\)/.test(css), 'settings-panel must be bottom-bound on desktop');
assert(/\.settings-panel\s*\{[\s\S]*max-height:\s*none/.test(css), 'settings-panel must not rely on fixed max-height');
assert(/\.settings-panel__body\s*\{[\s\S]*overflow-y:\s*auto/.test(css), 'settings body must be the vertical scroll host');
assert(/\.settings-panel__body\s*\{[\s\S]*touch-action:\s*pan-y/.test(css), 'settings body must allow vertical touch panning');
assert(/\.settings-panel__body\s*\{[\s\S]*scroll-padding-bottom:\s*max\(128px/.test(css), 'settings body needs bottom scroll padding for hosted preview overlays');
assert(/@media \(max-width: 767px\)[\s\S]*\.settings-panel__body\s*\{[\s\S]*padding-bottom:\s*max\(144px/.test(css), 'mobile settings body needs larger bottom padding');

assert(controller.includes('function scrollSubmenuIntoView'), 'settings controller must expose submenu scroll compensation');
assert(controller.includes("scrollSubmenuIntoView(openSubmenu, 'start')"), 'restored submenu must be scrolled into view when drawer opens');
assert(controller.includes("scrollSubmenuIntoView(details, 'nearest')"), 'opened submenu must be scrolled into view on toggle');
assert(!controller.includes("scrollIntoView({ block: 'start', behavior: 'smooth' })"), 'native viewport scrollIntoView must not be used for inner drawer scrolling');
assert(!controller.includes("behavior: 'smooth'"), 'settings drawer compensation should not use smooth scrolling before layout settles');

console.log('Phase 37C.4A settings drawer scroll guard passed.');
