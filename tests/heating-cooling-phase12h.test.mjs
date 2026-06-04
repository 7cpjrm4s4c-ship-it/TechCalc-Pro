import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import module from '../js/modules/heating-cooling/index.js';
import config from '../js/modules/heating-cooling/config.js';
import schema from '../js/modules/heating-cooling/schema.js';

const source = readFileSync(new URL('../js/modules/heating-cooling/index.js', import.meta.url), 'utf8');

assert.match(config.migrationStatus, /phase-12h-final-globalized/);
assert.ok(module.schema, 'module exposes schema');
assert.ok(schema.fields.some(field => field.key === 'mode'), 'mode is schema-defined');
assert.ok(schema.fields.some(field => field.key === 'mediumId' && field.commit === 'immediate'), 'medium commits immediately');
assert.ok(schema.fields.some(field => field.key === 'pipeSystemId' && field.commit === 'immediate'), 'pipe system commits immediately');

const fullRenderMatches = source.match(/root\.innerHTML\s*=\s*view\(/g) || [];
assert.equal(fullRenderMatches.length, 1, 'only initial full module render is allowed');
assert.match(source, /function updateHeatingCoolingDynamic/, 'dynamic island updater exists');
assert.match(source, /action !== 'initial'/, 'non-initial actions use dynamic path');
assert.match(source, /data-hc-dynamic="input-fields"/, 'input fields are dynamic island');
assert.match(source, /data-hc-dynamic="result"/, 'result area is dynamic island');
assert.match(source, /data-hc-dynamic="line-sections"/, 'saved records are dynamic island');
assert.doesNotMatch(source, /addEventListener\(['"]click['"]/, 'module has no local click listener');
assert.doesNotMatch(source, /addEventListener\(['"]touch/, 'module has no local touch listener');

console.log('heating-cooling phase12h final globalization regression ok');
