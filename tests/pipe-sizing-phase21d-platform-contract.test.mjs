import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const index = readFileSync('js/modules/pipe-sizing/index.js', 'utf8');
const controller = readFileSync('js/modules/pipe-sizing/controller.js', 'utf8');
const viewModel = readFileSync('js/modules/pipe-sizing/viewModel.js', 'utf8');
const view = readFileSync('js/modules/pipe-sizing/view.js', 'utf8');
const config = readFileSync('js/modules/pipe-sizing/config.js', 'utf8');

for (const file of ['controller.js', 'viewModel.js', 'view.js', 'results.js']) {
  assert.ok(existsSync(`js/modules/pipe-sizing/${file}`), `pipe-sizing must expose ${file}`);
}

assert.match(index, /createPlatformModule/, 'index.js must remain the platform adapter');
assert.match(index, /bind:\s*bindPipeSizingActions/, 'index.js must delegate bindings to controller.js');
assert.match(index, /view,/, 'index.js must delegate view rendering to view.js');
assert.match(index, /renderInput:\s*inputContent/, 'index.js must pass view-model input renderer to dynamic renderer');
assert.match(index, /renderSavedPanel:\s*pipeSaveCard/, 'index.js must pass controller saved panel to dynamic renderer');
assert.match(index, /renderResult:\s*resultContent/, 'index.js must pass view-model result renderer to dynamic renderer');
assert.doesNotMatch(index, /card\(|field\(|selectField\(|renderModuleShell\(|createLineSectionController|pipeSystems|renderResultModel/, 'index.js must not contain view/controller implementation details');
assert.match(controller, /createLineSectionController/, 'controller.js must own saved-record controller setup');
assert.match(viewModel, /inputContent|resultContent|createPipeSizingViewModel/, 'viewModel.js must own render fragments');
assert.match(view, /renderModuleShell/, 'view.js must own module layout');
assert.match(config, /phase-21d-platform-contract/, 'config must record phase 21D migration');

console.log('pipe-sizing phase21d platform contract regression ok');
