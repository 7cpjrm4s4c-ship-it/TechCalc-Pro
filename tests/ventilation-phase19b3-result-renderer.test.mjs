import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ventilationSource = readFileSync(new URL('../js/modules/ventilation/index.js', import.meta.url), 'utf8');
const resultsSource = readFileSync(new URL('../js/modules/ventilation/results.js', import.meta.url), 'utf8');
const configSource = readFileSync(new URL('../js/modules/ventilation/config.js', import.meta.url), 'utf8');

assert.match(configSource, /phase-19b3-result-renderer/, 'ventilation declares phase 19B.3 result-renderer migration');
assert.match(ventilationSource, /renderResultModel\(/, 'ventilation renders primary results through the platform result model renderer');
assert.match(ventilationSource, /renderResultGroup\(/, 'ventilation renders result groups through the platform result group renderer');
assert.match(resultsSource, /buildVentilationResultModel/, 'ventilation exposes a dedicated result model builder');
assert.match(resultsSource, /airStatsRows/, 'ventilation exposes air-stat rows for platform result groups');
assert.doesNotMatch(ventilationSource, /mainResult\(/, 'ventilation no longer renders own main result cards');
assert.doesNotMatch(ventilationSource, /inlineStats\(/, 'ventilation no longer renders own inline stats cards for results');
assert.doesNotMatch(ventilationSource, /const resultDetails = \[/, 'ventilation no longer assembles ad-hoc result detail arrays in the view');
assert.doesNotMatch(ventilationSource, /function targetMain/, 'ventilation result main mapping is moved out of the view module');

console.log('ventilation phase19b3 result renderer regression ok');
