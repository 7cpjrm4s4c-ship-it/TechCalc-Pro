import assert from 'node:assert/strict';
import config from '../js/modules/hx-diagram/config.js';
import { state } from '../js/modules/hx-diagram/state.js';
import { calculate } from '../js/modules/hx-diagram/logic.js';
import { createViewModel } from '../js/modules/hx-diagram/viewModel.js';
import { isDynamicHxDiagramAction, updateHxDiagramDynamic } from '../js/modules/hx-diagram/dynamicRenderer.js';

const comparablePath = path => path.map(point => ({
  label: point.label,
  tempC: Number(point.tempC.toFixed(3)),
  humidityRatioGkg: Number(point.humidityRatioGkg.toFixed(3))
}));

assert.ok(['phase-26b3a2-process-immediate-render', 'phase-26b3a3-enter-tab-navigation-and-live-diagram', 'phase-26c1-diagram-renderer-extraction', 'phase-26c2-single-render-pipeline'].includes(config.migrationStatus));

state.replace({
  tempC: '20',
  rhPercent: '50',
  targetTempC: '8',
  targetRhPercent: '90',
  process: 'cool',
  activeProcessId: 'hx-test-active',
  activePath: [],
  savedProcesses: [],
  processes: [],
  expandedProcessId: null,
  points: []
}, { notify: false });

const coolPath = calculate(state.get()).processPath;
assert.ok(coolPath.length >= 2);

const nextState = { ...state.get(), process: 'cool-dehumidify' };
const nextPath = calculate(nextState).processPath;
state.set({ process: 'cool-dehumidify', activePath: nextPath, points: [] }, { action: 'hx:process', notify: false });

const vm = createViewModel(state.get());
assert.equal(vm.state.process, 'cool-dehumidify');
assert.deepEqual(comparablePath(vm.activePath), comparablePath(nextPath));
assert.notDeepEqual(comparablePath(vm.activePath), comparablePath(coolPath));

assert.equal(isDynamicHxDiagramAction({ action: 'hx:process' }), true);
assert.equal(isDynamicHxDiagramAction({ action: 'hx:line:update' }), true);
assert.equal(isDynamicHxDiagramAction({ action: 'platform:field:tempC' }), true);
assert.equal(updateHxDiagramDynamic(), true);

console.log('hx diagram phase 26B.3A.2 process immediate render ok');
