import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const themeController = readFileSync('js/platform/shell/themeController.js', 'utf8');
const renderer = readFileSync('js/core/renderer.js', 'utf8');
const app = readFileSync('js/core/app.js', 'utf8');

assert.match(themeController, /let\s+themeControllerInitialized\s*=\s*false/, 'ThemeController must have an idempotent initialization guard.');
assert.match(themeController, /if\s*\(themeControllerInitialized\)\s*return/, 'ThemeController must not bind duplicate click listeners.');
assert.match(app, /initializeThemeController\(\{\s*root:\s*settingsPanel\s*\|\|\s*document\s*\}\)/, 'App shell must keep ThemeController initialized from the settings root only.');

assert.match(renderer, /MOVE_CANCEL_PX\s*=\s*8/, 'No-click scroll guard must define a touch/pointer movement cancellation threshold.');
assert.match(renderer, /root\.addEventListener\('pointermove',\s*cancelIfMoved,\s*\{\s*capture:\s*true,\s*passive:\s*true\s*\}\)/, 'Pointer movement must cancel pending viewport restore snapshots.');
assert.match(renderer, /root\.addEventListener\('touchmove',\s*cancelIfMoved,\s*\{\s*capture:\s*true,\s*passive:\s*true\s*\}\)/, 'Touch movement must cancel pending viewport restore snapshots.');
assert.match(renderer, /root\.addEventListener\('scroll',\s*cancelOnScroll,\s*\{\s*capture:\s*true,\s*passive:\s*true\s*\}\)/, 'Native scroll must cancel pending viewport restore snapshots.');
assert.match(renderer, /snapshot\s*=\s*null;\s*\n\s*startPoint\s*=\s*null;/, 'The restore snapshot and start point must be cleared together after movement/scroll cancellation.');

console.log('phase37c2a theme extraction regression guard passed');
