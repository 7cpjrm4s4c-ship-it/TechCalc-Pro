import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const heating = readFileSync('js/modules/heating-cooling/index.js', 'utf8');
const rainwaterController = readFileSync('js/modules/rainwater/controller.js', 'utf8');
const rainwaterResults = readFileSync('js/modules/rainwater/results.js', 'utf8');
const wastewaterController = readFileSync('js/modules/wastewater/controller.js', 'utf8');
const wastewaterResults = readFileSync('js/modules/wastewater/results.js', 'utf8');
const pipeline = readFileSync('js/core/eventPipeline.js', 'utf8');
const runtime = readFileSync('js/platform/moduleRuntime/index.js', 'utf8');

assert.match(heating, /data-line-select/, 'baseline: Heizung/Kälte uses data-line-select.');
assert.match(heating, /data-line-toggle/, 'baseline: Heizung/Kälte uses data-line-toggle.');
assert.match(heating, /data-line-delete/, 'baseline: Heizung/Kälte uses data-line-delete.');

for (const [name, controller, results] of [
  ['rainwater', rainwaterController, rainwaterResults],
  ['wastewater', wastewaterController, wastewaterResults]
]) {
  assert.match(controller, /createLineSectionController\s*\(/, `${name} controller must use the heating-style line-section saved controller.`);
  assert.doesNotMatch(controller, /attrs:\s*\{/, `${name} controller must not keep legacy saved attr configuration.`);
  assert.match(results, /loadAttr:\s*'data-line-select'/, `${name} result model must render heating-style load attr.`);
  assert.match(results, /toggleAttr:\s*'data-line-toggle'/, `${name} result model must render heating-style toggle attr.`);
  assert.match(results, /deleteAttr:\s*'data-line-delete'/, `${name} result model must render heating-style delete attr.`);
  assert.doesNotMatch(controller, /addEventListener\([^)]*saved|bindSavedRecordWorkflow|bindSavedRecordList/, `${name} must not add module-local saved listeners.`);
}

assert.doesNotMatch(pipeline, /__tcPlatformSavedRecordBridge[\s\S]{0,220}handle/, 'Saved actions must not be intercepted by the former bridge.');
assert.match(pipeline, /same direct\s+central-action path as the proven Heizung\/Kälte/, 'Pipeline must document direct heating-style path.');
assert.match(runtime, /__tcPlatformSavedRecordBridge\s*=\s*null/, 'Runtime must deactivate the former bridge path.');
assert.match(runtime, /settled-timeout/, 'Rainwater segment updates need a settled render fallback.');

console.log('phase17c8 saved-record heating contract regression ok');
