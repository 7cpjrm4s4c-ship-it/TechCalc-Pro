import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const controller = readFileSync('js/modules/drinking-water/controller.js', 'utf8');
const scrollManager = readFileSync('js/core/scrollManager.js', 'utf8');

assert.match(scrollManager, /let\s+touchScrollActive\s*=\s*false/, 'ScrollManager must track active mobile touch scrolling.');
assert.match(scrollManager, /export function isTouchScrollActive\(\)/, 'ScrollManager must expose the touch-scroll activity state.');
assert.match(scrollManager, /skipDuringActiveTouch\s*=\s*options\.skipDuringActiveTouch\s*===\s*true/, 'runWithoutScrollJump must support opt-in restore suppression during active touch.');
assert.match(scrollManager, /if\s*\(skipDuringActiveTouch\s*&&\s*isTouchScrollActive\(\)\)\s*return/, 'Scroll restore must be skipped while active touch scrolling is detected.');

assert.doesNotMatch(controller, /frames:\s*1[24]/, 'Drinking Water must not use aggressive 12/14 frame scroll restoration.');
assert.doesNotMatch(controller, /420|800|820/, 'Drinking Water must not schedule long delayed scroll restores.');
assert.match(controller, /frames:\s*2,\s*delays:\s*\[0,\s*40,\s*100\],\s*skipDuringActiveTouch:\s*true/, 'Drinking Water refresh must use the reduced mobile-safe scroll restore preset.');
const optInCount = (controller.match(/skipDuringActiveTouch:\s*true/g) || []).length;
assert.ok(optInCount >= 5, `Expected all Drinking Water restore paths to opt into active-touch suppression, got ${optInCount}.`);

console.log('phase37c2b drinking-water mobile scroll restore dampening guard passed');
