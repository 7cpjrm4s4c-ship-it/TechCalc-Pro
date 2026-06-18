import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const dynamicRenderer = readFileSync('js/modules/drinking-water/dynamicRenderer.js', 'utf8');
const controller = readFileSync('js/modules/drinking-water/controller.js', 'utf8');

assert.match(dynamicRenderer, /function shouldIgnoreSurfaceConfirm\(meta = \{\}\)/, 'Drinking-water dynamic renderer must define a surface-confirm guard.');
assert.match(dynamicRenderer, /action !== 'surface:confirm'/, 'Surface-confirm guard must target surface:confirm only.');
assert.match(dynamicRenderer, /return !hasAnyChanged\(changed, DYNAMIC_KEYS\)/, 'Surface-confirm guard must ignore events without drinking-water relevant changed keys.');
assert.match(dynamicRenderer, /if \(shouldIgnoreSurfaceConfirm\(meta\)\) return false;/, 'Dynamic update must exit before preserveScroll for irrelevant surface-confirm events.');
assert.match(dynamicRenderer, /\{ skipDuringActiveTouch: true \}/, 'Dynamic update preserveScroll must skip restores during active touch scrolling.');
assert.match(dynamicRenderer, /if \(shouldIgnoreSurfaceConfirm\(meta\)\) return false;\s*return String\(meta.action \|\| ''\) !== 'initial';/s, 'isDynamicDrinkingWaterAction must reject irrelevant surface-confirm events.');
assert.doesNotMatch(controller, /if \(!ignored\) \{\s*refreshDrinkingWater\(root\);\s*clearActiveEdit\(root\);\s*\}/, 'Passive drinking-water background clicks must not force a full refresh.');
assert.match(controller, /if \(!ignored\) \{\s*clearActiveEdit\(root\);\s*\}/, 'Passive drinking-water background clicks may only clear active edits.');

console.log('phase37c2d drinking-water surface-confirm isolation guard passed');
