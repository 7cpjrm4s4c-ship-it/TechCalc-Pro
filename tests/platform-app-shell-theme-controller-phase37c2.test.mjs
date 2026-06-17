import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const report = JSON.parse(fs.readFileSync(path.join(root, 'docs/audits/json/app-shell-theme-controller-phase37c2.json'), 'utf8'));
const appSource = fs.readFileSync(path.join(root, 'js/core/app.js'), 'utf8');
const controllerSource = fs.readFileSync(path.join(root, 'js/platform/shell/themeController.js'), 'utf8');

assert.equal(report.phase, '37C.2');
assert.equal(report.policy.runtimeBehaviorChanged, false);
assert.equal(report.policy.moduleCodeChanged, false);
assert.equal(report.totals.failed, 0);
assert.ok(report.totals.appJsLineCount < 616, 'app.js should be smaller after theme extraction.');
assert.match(appSource, /initializeThemeController\(\{ root: settingsPanel \|\| document \}\);/);
assert.doesNotMatch(appSource, /function applyThemeMode\(/);
assert.doesNotMatch(appSource, /function getStoredThemeMode\(/);
assert.match(controllerSource, /export function initializeThemeController/);
assert.match(controllerSource, /export function applyTheme/);
assert.match(controllerSource, /export function toggleTheme/);
assert.match(controllerSource, /export function getCurrentTheme/);

const store = new Map();
globalThis.localStorage = {
  getItem: key => store.get(`local:${key}`) || null,
  setItem: (key, value) => store.set(`local:${key}`, String(value))
};
globalThis.sessionStorage = {
  getItem: key => store.get(`session:${key}`) || null,
  setItem: (key, value) => store.set(`session:${key}`, String(value))
};

const rootElement = {
  attributes: new Map(),
  setAttribute(name, value) { this.attributes.set(name, String(value)); },
  removeAttribute(name) { this.attributes.delete(name); },
  getAttribute(name) { return this.attributes.get(name) || null; }
};

const buttons = ['system', 'light', 'dark'].map(theme => ({
  dataset: { theme },
  classList: {
    active: false,
    toggle(name, active) {
      assert.equal(name, 'is-active');
      this.active = active;
    }
  },
  aria: {},
  listeners: {},
  setAttribute(name, value) { this.aria[name] = value; },
  addEventListener(name, handler) { this.listeners[name] = handler; }
}));

globalThis.document = {
  documentElement: rootElement,
  querySelectorAll(selector) {
    assert.equal(selector, '.theme-switch__option');
    return buttons;
  }
};

const theme = await import('../js/platform/shell/themeController.js');
assert.equal(theme.applyTheme('dark'), 'dark');
assert.equal(rootElement.getAttribute('data-theme'), 'dark');
assert.equal(store.get('local:techcalc-theme-mode'), 'dark');
assert.equal(buttons.find(button => button.dataset.theme === 'dark').classList.active, true);

assert.equal(theme.applyTheme('system'), 'system');
assert.equal(rootElement.getAttribute('data-theme'), null);

const scope = { querySelectorAll: () => buttons };
theme.initializeThemeController({ root: scope });
buttons.find(button => button.dataset.theme === 'light').listeners.click();
assert.equal(rootElement.getAttribute('data-theme'), 'light');
assert.equal(theme.getCurrentTheme(), 'light');
assert.equal(theme.toggleTheme(), 'dark');
assert.equal(rootElement.getAttribute('data-theme'), 'dark');

console.log('Phase 37C.2 theme controller runtime contract verified.');
