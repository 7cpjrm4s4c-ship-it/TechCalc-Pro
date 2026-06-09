import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const moduleDir = path.resolve('js/modules/drinking-water');
const viewJs = fs.readFileSync(path.join(moduleDir, 'view.js'), 'utf8');
const resultsJs = fs.readFileSync(path.join(moduleDir, 'results.js'), 'utf8');
const configJs = fs.readFileSync(path.join(moduleDir, 'config.js'), 'utf8');

assert.ok(resultsJs.includes("renderResultModel"), 'results.js must own the platform result renderer integration');
assert.ok(resultsJs.includes("buildDrinkingWaterResultModel"), 'results.js must build the drinking-water result model');
assert.ok(resultsJs.includes("renderDrinkingWaterResultModel"), 'results.js must expose a dedicated renderer wrapper');
assert.ok(!viewJs.includes("platform/resultRenderer"), 'view.js must not import the platform result renderer directly');
assert.ok(!viewJs.includes("mainResult"), 'view.js must not use legacy mainResult');
assert.ok(!viewJs.includes("resultCard"), 'view.js must not use legacy resultCard');
assert.ok(!viewJs.includes("resultRows"), 'view.js must not use legacy resultRows');
assert.ok(!resultsJs.includes("mainResult"), 'results.js must not use legacy mainResult directly');
assert.ok(!resultsJs.includes("resultCard"), 'results.js must not use legacy resultCard directly');
assert.ok(!resultsJs.includes("resultRows"), 'results.js must not use legacy resultRows directly');
assert.ok(configJs.includes("phase-25b3-result-renderer-migration"), 'config migrationStatus must be updated');

const { buildDrinkingWaterResultModel, renderDrinkingWaterResultModel } = await import('../js/modules/drinking-water/results.js');

const emptyModel = buildDrinkingWaterResultModel({}, { usageUnits: [], singleGroups: [], rawSingles: [], house: {}, peakFlow: 0 }, 'blue');
assert.equal(emptyModel.primary.primary.value, '—', 'empty startup result must stay blank');
assert.equal(emptyModel.groups[0].rows[0].value, '—', 'empty house connection must stay blank');

const populatedModel = buildDrinkingWaterResultModel({}, {
  usageUnits: [{ consumers: [{ label: 'Dusche', vr: 0.15, count: 2, hotWater: true }]}],
  singleGroups: [],
  rawSingles: [],
  neSumFlow: 0.3,
  nePeakSum: 0.3,
  singleSumFlow: 0,
  totalSumFlow: 0.3,
  peakFlow: 0.2,
  house: { flowM3h: 0.72, dn: 'DN 25', meter: 'Q3 4', q3: 4 }
}, 'blue');
const html = renderDrinkingWaterResultModel(populatedModel, 'blue');
assert.ok(html.includes('Ergebnis'), 'rendered result model must contain the result card');
assert.ok(html.includes('Zusammenstellung'), 'rendered result model must contain fixture summary');

console.log('drinking-water phase25b3 result renderer contract ok');
