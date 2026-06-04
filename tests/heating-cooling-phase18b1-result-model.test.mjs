import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildHeatingCoolingResultModel, buildPipeRecommendationModel, mediumRows } from '../js/modules/heating-cooling/results.js';

const indexSource = readFileSync('js/modules/heating-cooling/index.js', 'utf8');
const resultsSource = readFileSync('js/modules/heating-cooling/results.js', 'utf8');
const platformRendererSource = readFileSync('js/platform/resultRenderer/index.js', 'utf8');

assert.match(indexSource, /platform\/resultRenderer/, 'heating/cooling must render result areas through the platform result renderer.');
assert.match(indexSource, /buildHeatingCoolingResultModel/, 'heating/cooling result data must be provided as a result model.');
assert.match(indexSource, /buildPipeRecommendationModel/, 'pipe recommendation must be provided as a result model.');
assert.doesNotMatch(indexSource, /inlineStats|mainResult/, 'heating/cooling module must no longer call legacy inline result/card render helpers directly.');
assert.doesNotMatch(indexSource, /function\s+(targetMain|mediumStats|pipeDetails|renderRecommendationBody)/, 'result presentation helpers must be extracted from the module mount file.');
assert.match(resultsSource, /export function buildHeatingCoolingResultModel/, 'heating/cooling result model builder must be exported.');
assert.match(resultsSource, /export function buildPipeRecommendationModel/, 'heating/cooling pipe recommendation model builder must be exported.');
assert.match(platformRendererSource, /export function renderRecommendationCard/, 'platform result renderer must expose a reusable recommendation card renderer.');

const model = buildHeatingCoolingResultModel({ calcTarget: 'power' }, {
  powerKw: 12.3,
  massFlowKgh: 1050,
  volumeFlowM3h: 1.05,
  deltaT: 10,
  medium: { label: 'Wasser', density: 998 }
}, 'orange');
assert.equal(model.primary.title, 'Ergebnis — Leistung');
assert.equal(model.primary.primary.label, 'Berechnete Leistung');
assert.ok(model.primary.rows.some(row => row.label === 'Massenstrom'), 'secondary result rows must be data, not HTML.');

const recommendation = buildPipeRecommendationModel({ pipe: { dn: 32, system: { label: 'Stahl' }, velocity: 0.72, pressureLoss: 110, norm: 'DIN' } });
assert.equal(recommendation.primary.value, 'DN 32');
assert.ok(recommendation.rows.some(row => row.label === 'Druckverlust'), 'pipe recommendation rows must remain platform-renderable data.');
assert.ok(mediumRows({ density: 998, cpWhKgK: 1.163 }).some(row => row.label === 'Dichte ρ'), 'medium stats must be exported as rows.');

console.log('heating-cooling phase18b1 result-model regression ok');
