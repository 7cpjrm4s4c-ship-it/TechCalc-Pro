import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const config = readFileSync('js/modules/unit-converter/config.js', 'utf8');
const index = readFileSync('js/modules/unit-converter/index.js', 'utf8');
const viewModel = readFileSync('js/modules/unit-converter/viewModel.js', 'utf8');
const view = readFileSync('js/modules/unit-converter/view.js', 'utf8');
const results = readFileSync('js/modules/unit-converter/results.js', 'utf8');
const dynamicIndex = readFileSync('js/platform/dynamicRenderer/index.js', 'utf8');

for (const file of ['config.js', 'schema.js', 'state.js', 'logic.js', 'results.js', 'viewModel.js', 'view.js', 'index.js']) {
  assert.ok(existsSync(`js/modules/unit-converter/${file}`), `unit-converter contract file missing: ${file}`);
}

assert.match(config, /phase-22e-hardening/, 'config must record phase 22E hardening');
assert.doesNotMatch(config, /CENTRAL_SAVED_RECORDS/, 'unit converter intentionally has no saved-record capability');
assert.match(index, /createPlatformModule/, 'unit converter must use platform module runtime');
assert.match(index, /createUnitConverterDynamicRenderer/, 'unit converter must use platform dynamic renderer');
assert.doesNotMatch(index, /mountModule|bindSavedRecordWorkflow|createSavedRecordActions|createLineSectionController/, 'unit converter index must not use legacy mount or saved-record controllers');
assert.doesNotMatch(viewModel, /bindSavedRecordWorkflow|createSavedRecordActions|createLineSectionController/, 'unit converter view model must remain free of saved-record paths');
assert.doesNotMatch(view + viewModel + results, /resultRows|mainResult|resultCard|pressureBadge/, 'unit converter must not use legacy result renderer helpers');
assert.match(viewModel, /renderResultModel/, 'unit converter result must render through platform result renderer');
assert.match(view, /data-unit-dynamic="conversion"/, 'conversion island must exist');
assert.match(view, /data-unit-dynamic="result"/, 'result island must exist');
assert.match(dynamicIndex, /createUnitConverterDynamicRenderer/, 'dynamic renderer export must include unit converter renderer');

console.log('unit-converter phase22e hardening regression ok');
