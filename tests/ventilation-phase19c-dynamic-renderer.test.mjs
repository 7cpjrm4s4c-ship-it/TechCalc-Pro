import fs from 'node:fs';
import assert from 'node:assert/strict';

const moduleSource = fs.readFileSync('js/modules/ventilation/index.js', 'utf8');
const dynamicRendererSource = fs.readFileSync('js/platform/dynamicRenderer/index.js', 'utf8');
const configSource = fs.readFileSync('js/modules/ventilation/config.js', 'utf8');

assert.match(configSource, /phase-19c-dynamic-renderer/, 'ventilation declares phase 19C dynamic-renderer migration');
assert.match(dynamicRendererSource, /createVentilationDynamicRenderer/, 'platform dynamic renderer factory for ventilation must exist');
assert.match(moduleSource, /createVentilationDynamicRenderer/, 'ventilation must delegate dynamic updates to the platform renderer');
assert.match(moduleSource, /ventilationDynamicRenderer\.update/, 'ventilation dynamic adapter must call the centralized renderer');
assert.match(dynamicRendererSource, /\[data-vent-dynamic="temperatures"\]/, 'ventilation dynamic islands must be owned by the platform renderer');
assert.match(dynamicRendererSource, /\[data-line-dynamic="line-sections"\]/, 'ventilation saved-record island refresh must stay on the neutral line dynamic contract');
assert.doesNotMatch(moduleSource, /function setInner\(/, 'ventilation module must no longer own generic DOM setInner helper');
assert.doesNotMatch(moduleSource, /function setInputValue\(/, 'ventilation module must no longer own generic input synchronization helper');
assert.doesNotMatch(moduleSource, /function updateSegment\(/, 'ventilation module must no longer own generic segment synchronization helper');
assert.doesNotMatch(moduleSource, /function updateCardAccent\(/, 'ventilation module must no longer own generic card accent helper');
assert.doesNotMatch(moduleSource, /root\.__tcVentilationDynamic\s*=/, 'ventilation module must not own dynamic renderer cache writes');

console.log('ventilation phase19c dynamic renderer regression ok');
