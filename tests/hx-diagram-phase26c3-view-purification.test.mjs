import assert from 'node:assert/strict';
import fs from 'node:fs';
import config from '../js/modules/hx-diagram/config.js';
import { renderView } from '../js/modules/hx-diagram/view.js';
import { renderHxInputCard } from '../js/modules/hx-diagram/formRenderer.js';
import { createViewModel } from '../js/modules/hx-diagram/viewModel.js';

const base = 'js/modules/hx-diagram/';
const view = fs.readFileSync(base + 'view.js', 'utf8');
const formRenderer = fs.readFileSync(base + 'formRenderer.js', 'utf8');

assert.ok(['phase-26c3-view-purification', 'phase-26d-final-platform-cleanup'].includes(config.migrationStatus));
assert.ok(fs.existsSync(base + 'formRenderer.js'), 'formRenderer.js must exist');

assert.match(view, /renderHxInputCard/, 'view must compose the input card through the form renderer');
assert.match(view, /renderHxLayout/, 'view keeps only h,x layout composition');
assert.match(view, /data-hx-dynamic="\$\{HX_DYNAMIC\.results\}"/, 'view must keep result slot only');
assert.match(view, /data-hx-dynamic="\$\{HX_DYNAMIC\.savedProcesses\}"/, 'view must keep saved process slot only');
assert.match(view, /data-hx-dynamic="\$\{HX_DYNAMIC\.diagram\}"/, 'view must keep diagram slot only');
assert.doesNotMatch(view, /signedTempField|fmtInput|field\(/, 'view must not render individual form controls');
assert.doesNotMatch(view, /renderProcessSelection/, 'view must not own process-selection rendering');
assert.doesNotMatch(view, /chartCard|renderHxSvg|buildStateSegments|humidityRatioKgKg|STATIC_HX_BACKGROUND/, 'view must not own diagram rendering');
assert.doesNotMatch(view, /hxProcessCard|hxProcessController/, 'view must not own saved-record rendering');

assert.match(formRenderer, /signedTempField/, 'form renderer owns h,x signed temperature inputs');
assert.match(formRenderer, /renderProcessSelection/, 'form renderer owns the process selection island content');
assert.match(formRenderer, /data-hx-clear/, 'form renderer preserves clear diagram action');

const snapshot = { tempC: '20', rhPercent: '50', targetTempC: '8', targetRhPercent: '90', process: 'cool-dehumidify', savedProcesses: [] };
const vm = createViewModel(snapshot);
const inputHtml = renderHxInputCard(vm);
const html = renderView(snapshot);

assert.match(inputHtml, /Luftzustand erfassen/, 'form renderer must preserve input card title');
assert.match(inputHtml, /Luftbehandlung wählen/, 'form renderer must preserve process selection');
assert.match(html, /hx-layout__left/, 'view must preserve left layout column');
assert.match(html, /hx-layout__right/, 'view must preserve right layout column');
assert.match(html, /h,x-Diagramm/, 'view must preserve diagram output through renderer slots');
assert.match(html, /Automatische Zustandsänderung/, 'view must preserve result output through renderer slots');

console.log('hx diagram phase 26C.3 view purification ok');
