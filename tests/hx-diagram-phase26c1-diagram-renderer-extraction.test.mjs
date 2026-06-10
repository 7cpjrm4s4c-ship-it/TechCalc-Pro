import assert from 'node:assert/strict';
import fs from 'node:fs';
import config from '../js/modules/hx-diagram/config.js';
import { chartCard, renderHxSvg, buildStateSegments } from '../js/modules/hx-diagram/diagramRenderer.js';
import { calculate } from '../js/modules/hx-diagram/logic.js';

const base = 'js/modules/hx-diagram/';
const view = fs.readFileSync(base + 'view.js', 'utf8');
const diagram = fs.readFileSync(base + 'diagramRenderer.js', 'utf8');

assert.equal(config.migrationStatus, 'phase-26c1-diagram-renderer-extraction');
assert.ok(fs.existsSync(base + 'diagramRenderer.js'), 'diagramRenderer.js must exist');
assert.match(view, /from '\.\/diagramRenderer\.js'/, 'view must import the extracted diagram renderer');
assert.match(view, /chartCard\(vm\.activePath, vm\.targetReached\)/, 'view must compose chart output from view model data only');
assert.doesNotMatch(view, /humidityRatioKgKg/, 'view must not own psychrometric curve calculations');
assert.doesNotMatch(view, /STATIC_HX_BACKGROUND/, 'view must not own static SVG background generation');
assert.doesNotMatch(view, /function\s+buildStateSegments/, 'view must not own state path segment generation');
assert.match(diagram, /humidityRatioKgKg/, 'diagram renderer owns chart psychrometric curve rendering');
assert.match(diagram, /export function renderHxSvg/, 'diagram renderer exports renderHxSvg');
assert.match(diagram, /export function chartCard/, 'diagram renderer exports chartCard');

const result = calculate({ tempC: '20', rhPercent: '50', targetTempC: '8', targetRhPercent: '90', process: 'cool-dehumidify' });
const segments = buildStateSegments(result.processPath);
const svg = renderHxSvg(result.processPath);
const card = chartCard(result.processPath, result.targetReached);

assert.match(segments, /hx-state-path/, 'diagram renderer must render process path segments');
assert.match(svg, /<svg class="hx-chart"/, 'diagram renderer must render the h,x SVG');
assert.match(svg, /Feuchtegehalt x/, 'diagram renderer must preserve x-axis title');
assert.match(card, /h,x-Diagramm/, 'chartCard must preserve diagram card title');
assert.match(card, /hx-chart-wrap/, 'chartCard must wrap the SVG for existing CSS');

console.log('hx diagram phase 26C.1 diagram renderer extraction ok');
