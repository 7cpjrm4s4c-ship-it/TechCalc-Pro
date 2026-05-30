import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../js/modules/rainwater/index.js', import.meta.url), 'utf8');
const config = readFileSync(new URL('../js/modules/rainwater/config.js', import.meta.url), 'utf8');

assert.match(config, /phase-14g-rainwater-global-standard/, 'Rainwater migration status must reflect Phase 14G.');
assert.doesNotMatch(source, /function savedSnapshot|function savedRows|function surfaceDimensionCards/, 'Rainwater must remove duplicate calculation save and bespoke surface result render paths.');
assert.doesNotMatch(source, /rainwater:save|rainwater:update|rainwater:saved-load|rainwater:saved-delete|rainwater:saved-toggle/, 'Rainwater must not keep calculation-level saved-record actions.');
assert.match(source, /renderSavedRecordList\(items, \{/, 'Rainwater surfaces must keep the global saved-record renderer.');
assert.match(source, /data-rainwater-surface-select/, 'Rainwater surface records must stay selectable through explicit saved-record attributes.');

console.log('rainwater phase14g global standard regression ok');
