import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const index = readFileSync('js/modules/pipe-sizing/index.js', 'utf8');
const viewModel = readFileSync('js/modules/pipe-sizing/viewModel.js', 'utf8');
const results = readFileSync('js/modules/pipe-sizing/results.js', 'utf8');

assert.match(viewModel, /renderResultModel/, 'pipe-sizing must use the platform result renderer');
assert.match(viewModel, /buildPipeSizingResultModel/, 'pipe-sizing must build a result model');
assert.doesNotMatch(index, /resultRows/, 'pipe-sizing must not render result rows directly in index.js');
assert.doesNotMatch(index, /pressureBadge/, 'pipe-sizing must not render pressure badges directly in index.js');
assert.doesNotMatch(index, /pipeDimensionCards/, 'pipe-sizing must not keep module-owned result cards in index.js');
assert.match(results, /buildPipeSizingResultModel/, 'pipe-sizing result model must live in results.js');

console.log('pipe-sizing phase21b3 result renderer regression ok');
