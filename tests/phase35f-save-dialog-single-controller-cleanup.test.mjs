import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const modules = ['pressure-holding', 'wastewater', 'rainwater'];

for (const moduleId of modules) {
  const controller = read(`js/modules/${moduleId}/controller.js`);
  assert.match(controller, /createLineSectionController\s*\(/, `${moduleId} must use createLineSectionController as the single save controller`);
  assert.doesNotMatch(controller, /savedRecords\s*:\s*\{/, `${moduleId} must not keep legacy controller.savedRecords configuration`);
  assert.doesNotMatch(controller, /enabled\s*:\s*false/, `${moduleId} must not keep disabled legacy savedRecords stubs`);
  assert.doesNotMatch(controller, /createSavedRecordActions|savedRecordReducer|renderSavedRecordPanel|registerCentralActions/, `${moduleId} must not reference old saved-record action/render internals`);
}

const wastewaterIndex = read('js/modules/wastewater/index.js');
assert.match(wastewaterIndex, /bindWastewaterPlatform/, 'wastewater bind entry should be named as platform bind, not legacy saved action bind');
assert.doesNotMatch(wastewaterIndex, /bindWastewaterSavedActions/, 'wastewater must not expose legacy saved action bind naming');

const rainwaterIndex = read('js/modules/rainwater/index.js');
assert.match(rainwaterIndex, /bindRainwaterPlatform/, 'rainwater bind entry should be named as platform bind, not legacy saved action bind');
assert.doesNotMatch(rainwaterIndex, /bindRainwaterSavedActions/, 'rainwater must not expose legacy saved action bind naming');

const pressureView = read('js/modules/pressure-holding/view.js');
assert.ok(
  pressureView.indexOf("card('Berechnungsart'") < pressureView.indexOf('holdingOptionsTitle'),
  'pressure holding options must stay directly after Berechnungsart in the input column'
);
assert.ok(
  pressureView.indexOf('holdingOptionsTitle') < pressureView.indexOf("card('Anlagenvolumen'"),
  'pressure holding options must appear before Anlagenvolumen'
);

console.log('Phase 35F save-dialog single-controller cleanup verified.');
