import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import module from '../js/modules/ventilation/index.js';
import config from '../js/modules/ventilation/config.js';
import schema from '../js/modules/ventilation/schema.js';

const indexSource = readFileSync(new URL('../js/modules/ventilation/index.js', import.meta.url), 'utf8');
const controllerSource = readFileSync(new URL('../js/modules/ventilation/controller.js', import.meta.url), 'utf8');
const viewSource = readFileSync(new URL('../js/modules/ventilation/view.js', import.meta.url), 'utf8');
const viewModelSource = readFileSync(new URL('../js/modules/ventilation/viewModel.js', import.meta.url), 'utf8');
const source = `${indexSource}\n${controllerSource}\n${viewSource}\n${viewModelSource}`;
const dynamicRendererSource = readFileSync(new URL('../js/platform/dynamicRenderer/index.js', import.meta.url), 'utf8');
const docs = readFileSync(new URL('../docs/PHASE_13A_VENTILATION_GLOBALIZATION.md', import.meta.url), 'utf8');

assert.match(config.migrationStatus, /^phase-13[a-e]-ventilation-/, 'ventilation migration status is current phase 13');
assert.ok(module.schema, 'ventilation module exposes schema');
assert.ok(schema.fields.some(field => field.key === 'mode'), 'mode is schema-defined');

assert.match(indexSource, /createPlatformModule\(\{/, 'ventilation uses platform module runtime');
assert.doesNotMatch(source, /function mountVentilation/, 'legacy custom mount has been removed');
assert.doesNotMatch(source, /root\.innerHTML\s*=\s*view\(/, 'module no longer owns full-render innerHTML');
assert.match(source, /function updateVentilationDynamic/, 'dynamic island updater exists as platform adapter');
assert.match(indexSource, /bind:\s*bindVentilationPlatform/, 'saved-line binding is provided through platform bind hook');
assert.match(controllerSource, /createLineSectionController\(\{/, 'saved actions use central line-section controller');
assert.match(source, /data-vent-dynamic="input-fields"/, 'input fields are dynamic island');
assert.match(source, /data-vent-dynamic="result"/, 'result area is dynamic island');
assert.match(source + dynamicRendererSource, /data-line-dynamic=\"line-sections\"|data-line-dynamic="line-sections"/, 'saved records use neutral line-section dynamic island');
assert.match(source, /expandedVentLineSectionId/, 'accordion expanded state is store-backed');
assert.doesNotMatch(source, /shouldSkipDuplicateAction/, 'save/update dedupe is no longer module-owned');

assert.match(source, /function derivedDeltaTField/, 'temperature difference is rendered by a dedicated derived field');
assert.match(source, /readonly:\s*true/, 'temperature difference field is read-only');
assert.doesNotMatch(source, /\[\`\$\{prefix\}DeltaT\`\]: firstFilled/, 'stored ventilation records must not hydrate editable deltaT state');
assert.doesNotMatch(source, /addEventListener\(['"]click['"]/, 'module has no local click listener');
assert.doesNotMatch(source, /addEventListener\(['"]touch/, 'module has no local touch listener');
assert.match(docs, /Heizung\/Kälte als Referenzmodul/, 'docs document reference-module basis');

const derivedMatch = source.match(/function derivedDeltaT\(active(?:\s*=\s*\{\})?\) \{[\s\S]*?\n\}/);
assert.ok(derivedMatch, 'derivedDeltaT function exists');
const derivedSource = derivedMatch[0];
assert.match(derivedSource, /mode === 'cooling'/, 'deltaT derivation branches by cooling mode');
assert.match(derivedSource, /room - supply/, 'cooling deltaT is room minus supply');
assert.match(derivedSource, /supply - room/, 'heating deltaT is supply minus room');
assert.doesNotMatch(derivedSource, /Math\.abs/, 'deltaT must not use absolute difference');
assert.match(source, /heatingSupplyTemp/, 'heating temperature inputs are store-separated');
assert.match(source, /coolingSupplyTemp/, 'cooling temperature inputs are store-separated');

console.log('ventilation global-standard regression ok');
