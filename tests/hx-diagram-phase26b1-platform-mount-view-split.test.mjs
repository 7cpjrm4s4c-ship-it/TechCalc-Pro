import assert from 'node:assert/strict';
import fs from 'node:fs';

const base = 'js/modules/hx-diagram/';
for (const file of ['index.js','controller.js','viewModel.js','view.js','results.js','dynamicRenderer.js','logic.js','schema.js','state.js','config.js']) {
  assert.ok(fs.existsSync(base + file), `missing ${file}`);
}

const index = fs.readFileSync(base + 'index.js', 'utf8');
assert.match(index, /createPlatformModule/, 'hx-diagram must use createPlatformModule');
assert.doesNotMatch(index, /mountModule/, 'hx-diagram index must not use mountModule');
assert.doesNotMatch(index, /function\s+view\s*\(/, 'index must not own view rendering');
assert.doesNotMatch(index, /function\s+bindActions\s*\(/, 'index must not own controller binding');
assert.doesNotMatch(index, /renderHxSvg/, 'index must not own chart rendering');

const controller = fs.readFileSync(base + 'controller.js', 'utf8');
assert.match(controller, /bindHxDiagramActions/, 'controller must expose bindHxDiagramActions');
assert.match(controller, /createLineSectionController/, 'controller must use platform saved-record controller after 26B.2');

const view = fs.readFileSync(base + 'view.js', 'utf8');
assert.match(view, /renderModuleShell/, 'view must render module shell');
assert.match(view, /renderHxSvg/, 'view owns chart rendering during 26B.1');
assert.doesNotMatch(view, /bindActions/, 'view must not own action binding');

const results = fs.readFileSync(base + 'results.js', 'utf8');
assert.match(results, /renderResultCard/, 'results must expose renderResultCard');
assert.match(results, /mainResult/, 'results may use legacy-compatible mainResult during 26B.1');

const dynamic = fs.readFileSync(base + 'dynamicRenderer.js', 'utf8');
assert.match(dynamic, /updateHxDiagramDynamic/, 'dynamic renderer must be extracted');

const mod = await import('../js/modules/hx-diagram/index.js');
assert.equal(mod.default.config.id, 'hx-diagram');
assert.equal(typeof mod.default.mount, 'function');

console.log('hx-diagram phase26b1 platform mount/view split ok');
