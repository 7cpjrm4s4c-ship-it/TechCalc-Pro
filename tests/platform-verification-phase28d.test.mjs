import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { PlatformScrollManager } from '../js/core/scrollManager.js';
import { PlatformFocusManager } from '../js/core/focusManager.js';
import { createEventScope, getActiveEventListenerCount, snapshotEventListeners } from '../js/core/eventManager.js';

const root = process.cwd();
const requiredReports = [
  'platform-scroll-audit-phase28a1.json',
  'platform-scroll-service-phase28a2.json',
  'platform-scroll-saved-records-phase28a3.json',
  'platform-scroll-module-switch-phase28a4.json',
  'platform-focus-service-phase28b1.json',
  'platform-enter-navigation-phase28b2.json',
  'platform-tab-navigation-phase28b3.json',
  'platform-dynamic-input-focus-phase28b4.json',
  'platform-event-system-cleanup-phase28c.json'
];

for (const file of requiredReports) {
  assert.equal(fs.existsSync(path.join(root, file)), true, `${file} fehlt`);
}

for (const fn of [
  'capturePosition',
  'restorePosition',
  'runWithoutScrollJump',
  'preserveSavedRecordMutation',
  'preserveModuleSwitchScroll'
]) {
  assert.equal(typeof PlatformScrollManager[fn], 'function', `ScrollManager.${fn} fehlt`);
}

for (const fn of [
  'safeFocus',
  'handleEnterNavigation',
  'handleTabNavigation',
  'handlePlatformFieldNavigation',
  'preserveFocusDuring',
  'captureActiveField',
  'restoreCapturedField'
]) {
  assert.equal(typeof PlatformFocusManager[fn], 'function', `FocusManager.${fn} fehlt`);
}

assert.equal(typeof createEventScope, 'function');
assert.equal(typeof getActiveEventListenerCount, 'function');
assert.equal(typeof snapshotEventListeners, 'function');
const scope = createEventScope('phase28d-verification');
assert.equal(scope.size, 0);
scope.add(() => {});
assert.equal(scope.size, 1);
scope.dispose();
assert.equal(scope.size, 0);

const runtimeSource = fs.readFileSync(path.join(root, 'js/core/moduleRuntime.js'), 'utf8');
assert.match(runtimeSource, /preserveModuleSwitchScroll/);

console.log('Phase 28D Platform Verification Test bestanden.');
