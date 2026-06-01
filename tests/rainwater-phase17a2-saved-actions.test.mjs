import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../js/modules/rainwater/index.js', import.meta.url), 'utf8');
const controller = readFileSync(new URL('../js/core/savedRecordController.js', import.meta.url), 'utf8');
const config = readFileSync(new URL('../js/modules/rainwater/config.js', import.meta.url), 'utf8');

assert.match(controller, /export function createSavedRecordActions/, 'Platform must expose reusable saved-record action factories.');
assert.match(source, /createSavedRecordActions\(/, 'Rainwater must delegate saved-record actions to the platform controller.');
assert.match(source, /'saved:add'/, 'Rainwater save action must use platform action names.');
assert.match(source, /'saved:update'/, 'Rainwater update action must use platform action names.');
assert.match(source, /loadAttr:\s*'data-saved-load'/, 'Rainwater list must use platform load attributes.');
assert.doesNotMatch(source, /rainwater:surface-add|rainwater:surface-update|rainwater:surface-select|rainwater:surface-delete|rainwater:surface-toggle/, 'Rainwater must not keep module-local saved action names.');
assert.match(config, /phase-17a2-rainwater-saved-actions/, 'Rainwater migration status must include Phase 17A.2.');

console.log('rainwater phase17a.2 saved action decoupling ok');
