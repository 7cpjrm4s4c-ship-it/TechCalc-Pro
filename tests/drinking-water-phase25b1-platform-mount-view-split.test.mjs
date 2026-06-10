import assert from 'node:assert/strict';
import fs from 'node:fs';

const base = 'js/modules/drinking-water/';
for (const file of ['index.js','controller.js','viewModel.js','view.js','results.js','dynamicRenderer.js','logic.js','schema.js','state.js','config.js']) {
  assert.ok(fs.existsSync(base + file), `missing ${file}`);
}

const index = fs.readFileSync(base + 'index.js', 'utf8');
assert.match(index, /createPlatformModule/, 'drinking-water must use createPlatformModule');
assert.doesNotMatch(index, /mountModule/, 'drinking-water index must not use mountModule');
assert.doesNotMatch(index, /function\s+view\s*\(/, 'index must not own view rendering');
assert.doesNotMatch(index, /function\s+bindDrinkingWater/, 'index must not own controller binding');

const controller = fs.readFileSync(base + 'controller.js', 'utf8');
assert.match(controller, /bindDrinkingWaterActions/, 'controller must expose bindDrinkingWaterActions');
assert.match(controller, /renderUsageUnitRows/, 'controller must render usage unit rows during adapter phase');
assert.match(controller, /renderSingleRows/, 'controller must render single rows during adapter phase');

const view = fs.readFileSync(base + 'view.js', 'utf8');
assert.match(view, /renderModuleShell/, 'view must render module shell');
assert.match(view, /data-dw-dynamic="input"/, 'view must expose input dynamic island');
assert.match(view, /data-dw-dynamic="result"/, 'view must expose result dynamic island');
assert.doesNotMatch(view, /mainResult/, 'view must not use legacy mainResult');

const results = fs.readFileSync(base + 'results.js', 'utf8');
assert.match(results, /buildDrinkingWaterResultModel/, 'results must build result model');

const dynamic = fs.readFileSync(base + 'dynamicRenderer.js', 'utf8');
assert.match(dynamic, /updateDrinkingWaterDynamic/, 'dynamic renderer must be extracted');

const mod = await import('../js/modules/drinking-water/index.js');
assert.equal(mod.default.config.id, 'drinking-water');
assert.equal(typeof mod.default.mount, 'function');

console.log('drinking-water phase25b1 platform mount/view split ok');
