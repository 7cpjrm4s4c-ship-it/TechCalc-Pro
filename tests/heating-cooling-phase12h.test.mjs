import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import module from '../js/modules/heating-cooling/index.js';
import config from '../js/modules/heating-cooling/config.js';
import schema from '../js/modules/heating-cooling/schema.js';

const source = readFileSync(new URL('../js/modules/heating-cooling/index.js', import.meta.url), 'utf8');
const viewSource = readFileSync(new URL('../js/modules/heating-cooling/view.js', import.meta.url), 'utf8');
const runtimeSource = readFileSync(new URL('../js/platform/moduleRuntime/index.js', import.meta.url), 'utf8');
const dynamicRendererSource = readFileSync(new URL('../js/platform/dynamicRenderer/index.js', import.meta.url), 'utf8');

assert.match(config.migrationStatus, /phase-12h-final-globalized/);
assert.ok(module.schema, 'module exposes schema');
assert.ok(schema.fields.some(field => field.key === 'mode'), 'mode is schema-defined');
assert.ok(schema.fields.some(field => field.key === 'mediumId' && field.commit === 'immediate'), 'medium commits immediately');
assert.ok(schema.fields.some(field => field.key === 'pipeSystemId' && field.commit === 'immediate'), 'pipe system commits immediately');
assert.match(source, /createPlatformModule/, 'module uses platform lifecycle');
assert.match(source, /createHeatingCoolingDynamicRenderer/, 'dynamic island updater is provided by platform dynamic renderer');
assert.match(source, /action !== 'initial'/, 'non-initial actions use dynamic path');
assert.match(viewSource, /data-hc-dynamic="input-fields"/, 'input fields are dynamic island');
assert.match(viewSource, /data-hc-dynamic="result"/, 'result area is dynamic island');
assert.match(dynamicRendererSource, /line-sections/, 'saved records are dynamic island');
assert.match(runtimeSource, /root\.innerHTML\s*=\s*view\(snapshot\)/, 'full render is owned by platform runtime');
assert.doesNotMatch(source, /addEventListener\(['"]click['"]/, 'module has no local click listener');
assert.doesNotMatch(source, /addEventListener\(['"]touch/, 'module has no local touch listener');

console.log('heating-cooling phase12h final globalization regression ok');
