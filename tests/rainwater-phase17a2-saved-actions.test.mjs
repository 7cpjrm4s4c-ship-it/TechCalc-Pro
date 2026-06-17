import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../js/modules/rainwater/index.js', import.meta.url), 'utf8');
const lineController = readFileSync(new URL('../js/platform/lineSectionController/index.js', import.meta.url), 'utf8');
const controller = readFileSync(new URL('../js/modules/rainwater/controller.js', import.meta.url), 'utf8');
const config = readFileSync(new URL('../js/modules/rainwater/config.js', import.meta.url), 'utf8');

assert.match(controller, /createLineSectionController\s*\(/, 'Rainwater must use the central line-section saved-record controller.');
assert.match(lineController, /'line:save'/, 'Rainwater save action must be owned by the central line-section controller.');
assert.match(lineController, /'line:update'/, 'Rainwater update action must be owned by the central line-section controller.');
assert.match(lineController, /loadAttr:\s*'data-line-select'/, 'Line-section controller must use Heizung/Kälte line-select attributes.');
assert.doesNotMatch(source, /rainwater:surface-add|rainwater:surface-update|rainwater:surface-select|rainwater:surface-delete|rainwater:surface-toggle/, 'Rainwater must not keep module-local saved action names.');
assert.match(config, /phase-17a2-rainwater-saved-actions/, 'Rainwater migration status must include Phase 17A.2.');

console.log('rainwater phase17a.2 saved action decoupling ok');
