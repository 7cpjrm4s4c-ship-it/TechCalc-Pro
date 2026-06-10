import fs from 'node:fs';
import assert from 'node:assert/strict';

const mount = fs.readFileSync('js/core/mount.js', 'utf8');
const coordinator = fs.readFileSync('js/core/renderCoordinator.js', 'utf8');

assert.match(mount, /createRenderCoordinator/, 'mountModule must use the central render coordinator.');
assert.doesNotMatch(mount, /safeReplaceContent/, 'mountModule must not own DOM replacement directly.');
assert.match(coordinator, /shouldPreserveScroll/, 'render coordinator must centralize scroll-preservation decisions.');
assert.match(coordinator, /FIELD_ACTION_RE/, 'field commits must be distinguished from structural renders.');
assert.match(coordinator, /STRUCTURAL_ACTION_RE/, 'structural actions must use explicit scroll preservation.');
assert.match(coordinator, /afterRender/, 'render coordinator must own post-render lifecycle invocation.');

console.log('phase 11E render coordinator regression ok');
