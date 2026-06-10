import assert from 'node:assert/strict';
import fs from 'node:fs';
import config from '../js/modules/hx-diagram/config.js';
import { state } from '../js/modules/hx-diagram/state.js';
import { createViewModel } from '../js/modules/hx-diagram/viewModel.js';
import { buildHxResultModel, renderHxResultModel } from '../js/modules/hx-diagram/results.js';
import { renderView } from '../js/modules/hx-diagram/view.js';

assert.ok(['phase-26b3-result-renderer', 'phase-26b3a2-process-immediate-render', 'phase-26b3a3-enter-tab-navigation-and-live-diagram', 'phase-26c1-diagram-renderer-extraction', 'phase-26c2-single-render-pipeline'].includes(config.migrationStatus));

state.replace({
  label: 'Result Test',
  tempC: '20',
  rhPercent: '50',
  targetTempC: '30',
  targetRhPercent: '40',
  process: 'heat',
  activeProcessId: null,
  activePath: [],
  savedProcesses: [],
  processes: [],
  expandedProcessId: null,
  points: []
}, { notify: false });

const vm = createViewModel(state.get());
assert.ok(vm.resultModel);
assert.ok(vm.resultModel.primary);
assert.ok(Array.isArray(vm.resultModel.groups));
assert.ok(vm.resultModel.groups.length >= 3);

const model = buildHxResultModel(vm);
assert.equal(model.primary.title, 'Automatische Zustandsänderung');
assert.ok(model.groups.some(group => group.title === 'Berechnete Zustandspunkte'));
assert.ok(model.groups.some(group => group.title === 'Ausgang'));
assert.ok(model.groups.some(group => group.title === 'Ziel'));

const resultHtml = renderHxResultModel(vm);
assert.match(resultHtml, /Automatische Zustandsänderung/);
assert.match(resultHtml, /Berechnete Zustandspunkte/);
assert.match(resultHtml, /Ausgang/);
assert.match(resultHtml, /Ziel/);

const viewHtml = renderView(state.get());
assert.match(viewHtml, /Automatische Zustandsänderung/);
assert.match(viewHtml, /h,x-Diagramm/);

const viewSource = fs.readFileSync(new URL('../js/modules/hx-diagram/view.js', import.meta.url), 'utf8');
assert.doesNotMatch(viewSource, /mainResult/);
assert.doesNotMatch(viewSource, /resultRows/);
assert.doesNotMatch(viewSource, /readonlyStateCard/);
assert.doesNotMatch(viewSource, /processPathCard/);
assert.match(viewSource, /renderHxResultModel/);

console.log('hx diagram phase 26B.3 result renderer contract ok');
