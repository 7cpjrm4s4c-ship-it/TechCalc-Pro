import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../js/modules/rainwater/index.js', import.meta.url), 'utf8');
const config = readFileSync(new URL('../js/modules/rainwater/config.js', import.meta.url), 'utf8');

assert.doesNotMatch(source, /rainwater-surface-list|rainwater-surface-row|rainwater-result-list|rainwater-result-group|rainwater-kostra-link/, 'Rainwater must not render module-specific rainwater UI classes.');
assert.doesNotMatch(source, /dw-consumer-|wastewater-fixture-|ph-warning|ph-formula|ph-saved-list/, 'Rainwater must not reuse legacy module UI classes.');
assert.doesNotMatch(source, /__rainwaterOutsideBound|rainwater:outside-clear/, 'Rainwater must not clear edit state on arbitrary outside clicks.');
assert.doesNotMatch(source, /function saveCard\(/, 'Rainwater must not keep the dormant duplicate calculation-save card.');
assert.match(config, /phase-14d-rainwater-global-ux/, 'Rainwater migration status must reflect Phase 14D.');

console.log('rainwater phase14d global UX regression ok');
