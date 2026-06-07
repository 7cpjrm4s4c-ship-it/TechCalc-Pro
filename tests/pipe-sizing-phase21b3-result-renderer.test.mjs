import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildPipeSizingResultModel, pipeDimensionRows } from '../js/modules/pipe-sizing/results.js';

const index = readFileSync('js/modules/pipe-sizing/index.js', 'utf8');
const config = readFileSync('js/modules/pipe-sizing/config.js', 'utf8');

assert.match(index, /renderResultModel/, 'pipe-sizing must use the platform result renderer');
assert.match(index, /buildPipeSizingResultModel/, 'pipe-sizing must build a result model');
assert.doesNotMatch(index, /resultRows/, 'pipe-sizing must not render result rows directly in index.js');
assert.doesNotMatch(index, /pressureBadge/, 'pipe-sizing must not render pressure badges directly in index.js');
assert.doesNotMatch(index, /pipeDimensionCards/, 'pipe-sizing must not keep module-owned result cards in index.js');
assert.match(config, /phase-21b3-result-renderer/, 'pipe-sizing config must record phase 21B.3 migration');

const result = {
  system: { label: 'Stahlrohr' },
  dn: 25,
  velocity: 0.72,
  pressureLoss: 83.4,
  norm: 'DIN EN 10255',
  smaller: { dn: 20, dimension: '26,9 x 2,3', di: 22.3, velocity: 1.1, pressureLoss: 140 },
  larger: { dn: 32, dimension: '42,4 x 2,6', di: 37.2, velocity: 0.45, pressureLoss: 39 }
};

const model = buildPipeSizingResultModel({}, result, 'blue');
assert.equal(model.primary.title, 'Ergebnis — Stahlrohr');
assert.equal(model.primary.primary.value, 'DN 25');
assert.equal(model.groups[0].title, 'Dimensionsvergleich');
assert.equal(pipeDimensionRows(result).length, 3, 'dimension comparison must include smaller/recommended/larger when available');

console.log('pipe-sizing phase21b3 result-renderer regression ok');
