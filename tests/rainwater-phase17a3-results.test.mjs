import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rainwaterIndex = readFileSync('js/modules/rainwater/index.js', 'utf8');
const rainwaterResults = readFileSync('js/modules/rainwater/results.js', 'utf8');
const platformResults = readFileSync('js/core/resultRenderer.js', 'utf8');

assert.match(platformResults, /export function renderResultModel/, 'platform resultRenderer must expose renderResultModel');
assert.match(rainwaterIndex, /renderResultModel\(buildRainwaterResultModel/, 'rainwater must render result cards through the platform result model renderer');
assert.doesNotMatch(rainwaterIndex, /function resultRowsForRainwater/, 'rainwater index must not own result-row construction');
assert.doesNotMatch(rainwaterIndex, /function normHintCard/, 'rainwater index must not own notice-card rendering');
assert.doesNotMatch(rainwaterIndex, /renderPrimaryResultCard/, 'rainwater index must not call card-specific platform helpers directly');
assert.match(rainwaterResults, /export function buildRainwaterResultModel/, 'rainwater result data model must be isolated in results.js');
assert.match(rainwaterResults, /notices:/, 'rainwater result model must provide notices as data');

console.log('rainwater phase17a.3 result decoupling ok');
