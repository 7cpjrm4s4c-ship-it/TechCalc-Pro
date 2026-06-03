import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const runtime = readFileSync(new URL('../js/platform/moduleRuntime/index.js', import.meta.url), 'utf8');
const pipeline = readFileSync(new URL('../js/core/eventPipeline.js', import.meta.url), 'utf8');
const heating = readFileSync(new URL('../js/modules/heating-cooling/index.js', import.meta.url), 'utf8');
const rainwater = readFileSync(new URL('../js/modules/rainwater/controller.js', import.meta.url), 'utf8');
const wastewater = readFileSync(new URL('../js/modules/wastewater/controller.js', import.meta.url), 'utf8');

assert.match(heating, /'saved:load'[\s\S]{0,160}loadLine/, 'baseline: Heizung/Kälte saved dialog must still use direct saved handlers.');
assert.match(heating, /'saved:delete'[\s\S]{0,160}deleteLine/, 'baseline: Heizung/Kälte delete handler must still be direct.');
assert.match(heating, /'saved:toggle'[\s\S]{0,160}toggleLine/, 'baseline: Heizung/Kälte toggle handler must still be direct.');

assert.match(runtime, /createSavedRecordEventBridge/, 'Platform modules need a direct SavedRecord event bridge comparable to Heizung/Kälte.');
assert.match(runtime, /__tcPlatformSavedRecordBridge/, 'Runtime must publish the active SavedRecord bridge on the root.');
assert.match(runtime, /interactiveInsideLoad/, 'Bridge must prevent article-level load from swallowing toggle/delete controls.');
assert.match(runtime, /saved:load' && action !== 'saved:delete' && action !== 'saved:toggle'/, 'Bridge must be restricted to structural saved list actions.');
assert.match(pipeline, /__tcPlatformSavedRecordBridge/, 'Central event pipeline must route saved list actions through the active bridge first.');
assert.match(pipeline, /nested\s+buttons\s+cannot\s+be\s+swallowed/, 'Pipeline must document why saved bridge precedence exists.');

assert.doesNotMatch(rainwater, /data-saved-|loadAttr|toggleAttr|deleteAttr|bindSavedRecord|createSavedRecordActions/, 'Rainwater must not carry module-local SavedRecord patches.');
assert.doesNotMatch(wastewater, /data-saved-|loadAttr|toggleAttr|deleteAttr|bindSavedRecord|createSavedRecordActions/, 'Wastewater must not carry module-local SavedRecord patches.');

console.log('phase17c7 saved-record heating parity regression ok');
