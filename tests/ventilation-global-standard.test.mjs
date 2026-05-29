import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import module from '../js/modules/ventilation/index.js';
import config from '../js/modules/ventilation/config.js';
import schema from '../js/modules/ventilation/schema.js';

const source = readFileSync(new URL('../js/modules/ventilation/index.js', import.meta.url), 'utf8');
const docs = readFileSync(new URL('../docs/PHASE_13A_VENTILATION_GLOBALIZATION.md', import.meta.url), 'utf8');

assert.match(config.migrationStatus, /^phase-13[abcd]-ventilation-/, 'ventilation migration status is current phase 13');
assert.ok(module.schema, 'ventilation module exposes schema');
assert.ok(schema.fields.some(field => field.key === 'mode'), 'mode is schema-defined');

const fullRenderMatches = source.match(/root\.innerHTML\s*=\s*view\(/g) || [];
assert.equal(fullRenderMatches.length, 1, 'only initial full render is allowed');
assert.match(source, /function updateVentilationDynamic/, 'dynamic island updater exists');
assert.match(source, /function mountVentilation/, 'custom store-first mount exists');
assert.match(source, /registerCentralActions\(root/, 'saved actions use central event pipeline');
assert.match(source, /data-vent-dynamic="input-fields"/, 'input fields are dynamic island');
assert.match(source, /data-vent-dynamic="result"/, 'result area is dynamic island');
assert.match(source, /data-vent-dynamic="line-sections"/, 'saved records are dynamic island');
assert.match(source, /expandedVentLineSectionId/, 'accordion expanded state is store-backed');
assert.match(source, /shouldSkipDuplicateAction/, 'save/update actions are deduplicated');

assert.match(source, /function derivedDeltaTField/, 'temperature difference is rendered by a dedicated derived field');
assert.match(source, /readonly:\s*true/, 'temperature difference field is read-only');
assert.doesNotMatch(source, /\[\`\$\{prefix\}DeltaT\`\]: firstFilled/, 'stored ventilation records must not hydrate editable deltaT state');
assert.doesNotMatch(source, /addEventListener\(['"]click['"]/, 'module has no local click listener');
assert.doesNotMatch(source, /addEventListener\(['"]touch/, 'module has no local touch listener');
assert.match(docs, /Heizung\/Kälte als Referenzmodul/, 'docs document reference-module basis');

const derivedMatch = source.match(/function derivedDeltaT\(active\) \{[\s\S]*?\n\}/);
assert.ok(derivedMatch, 'derivedDeltaT function exists');
const derivedSource = derivedMatch[0];
assert.match(derivedSource, /mode === 'cooling'/, 'deltaT derivation branches by cooling mode');
assert.match(derivedSource, /room - supply/, 'cooling deltaT is room minus supply');
assert.match(derivedSource, /supply - room/, 'heating deltaT is supply minus room');
assert.doesNotMatch(derivedSource, /Math\.abs/, 'deltaT must not use absolute difference');
assert.match(source, /heatingSupplyTemp/, 'heating temperature inputs are store-separated');
assert.match(source, /coolingSupplyTemp/, 'cooling temperature inputs are store-separated');

console.log('ventilation global-standard regression ok');
