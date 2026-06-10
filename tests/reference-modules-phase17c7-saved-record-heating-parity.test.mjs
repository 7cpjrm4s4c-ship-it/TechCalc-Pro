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
assert.doesNotMatch(pipeline, /__tcPlatformSavedRecordBridge[\s\S]{0,220}handle/, 'Central event pipeline must no longer route saved actions through the old bridge.');
assert.match(pipeline, /same direct\s+central-action path as the proven Heizung\/Kälte/, 'Pipeline must document direct heating-style saved action handling.');

assert.doesNotMatch(rainwater, /data-saved-|bindSavedRecord|createSavedRecordActions/, 'Rainwater must not carry module-local SavedRecord listeners or legacy attrs.');
assert.doesNotMatch(wastewater, /data-saved-|bindSavedRecord|createSavedRecordActions/, 'Wastewater must not carry module-local SavedRecord listeners or legacy attrs.');

console.log('phase17c7 saved-record heating parity regression ok');
