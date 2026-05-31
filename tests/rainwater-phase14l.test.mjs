import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../js/modules/rainwater/index.js', import.meta.url), 'utf8');
const logic = readFileSync(new URL('../js/modules/rainwater/logic.js', import.meta.url), 'utf8');
const router = readFileSync(new URL('../js/core/router.js', import.meta.url), 'utf8');

assert.match(router, /Promise\.resolve\(renderCallback\(id\)\)/, 'Navigation must render the target route immediately, not only after hashchange.');
assert.match(source, /modeDefaultsPatch/, 'Rainwater surfaceMode switch must hydrate dependent mode defaults in one store patch.');
assert.match(source, /propertyRainIntensity/, 'Rainwater must keep property r(5,2) separate from roof r(5,5).');
assert.doesNotMatch(source, /rainwater:surface-clear-selection/, 'Rainwater must not render or bind a separate clear-selection button.');
assert.match(source, /Gewählte Breite je Notüberlauf/, 'Emergency overflow details must show the chosen overflow width, not an unexplained back-calculated width only.');
assert.match(logic, /requiredCount = capacity > 0 \? Math\.ceil\(qNot \/ capacity\)/, 'Emergency overflow count must derive from required flow and selected overflow capacity.');

console.log('rainwater phase14l reference completion regression ok');
