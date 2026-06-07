import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const index = readFileSync('js/modules/unit-converter/index.js', 'utf8');
const viewModel = readFileSync('js/modules/unit-converter/viewModel.js', 'utf8');
const view = readFileSync('js/modules/unit-converter/view.js', 'utf8');
const config = readFileSync('js/modules/unit-converter/config.js', 'utf8');

for (const file of ['viewModel.js', 'view.js', 'results.js']) {
  assert.ok(existsSync(`js/modules/unit-converter/${file}`), `unit-converter must expose ${file}`);
}

assert.match(index, /createPlatformModule/, 'index.js must remain the platform adapter');
assert.match(index, /view,/, 'index.js must delegate view rendering to view.js');
assert.match(index, /renderConversion:\s*conversionContent/, 'index.js must pass conversion view-model renderer to dynamic renderer');
assert.match(index, /renderResult:\s*resultContent/, 'index.js must pass result view-model renderer to dynamic renderer');
assert.doesNotMatch(index, /card\(|field\(|selectField\(|renderModuleShell\(|renderResultModel|unitCategories/, 'index.js must not contain view implementation details');
assert.match(viewModel, /conversionContent|resultContent|createUnitConverterViewModel/, 'viewModel.js must own render fragments');
assert.match(view, /renderModuleShell/, 'view.js must own module layout');
assert.match(config, /phase-22d-platform-contract/, 'config must record phase 22D migration');

console.log('unit-converter phase22d platform contract regression ok');
