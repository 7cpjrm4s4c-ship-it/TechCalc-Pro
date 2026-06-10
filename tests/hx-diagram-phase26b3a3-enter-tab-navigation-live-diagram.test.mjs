import assert from 'node:assert/strict';
import fs from 'node:fs';
import config from '../js/modules/hx-diagram/config.js';
import { state } from '../js/modules/hx-diagram/state.js';
import { calculate } from '../js/modules/hx-diagram/logic.js';
import { createViewModel } from '../js/modules/hx-diagram/viewModel.js';

const comparablePath = path => path.map(point => ({
  label: point.label,
  tempC: Number(point.tempC.toFixed(3)),
  humidityRatioGkg: Number(point.humidityRatioGkg.toFixed(3))
}));

assert.ok(['phase-26b3a3-enter-tab-navigation-and-live-diagram', 'phase-26c1-diagram-renderer-extraction', 'phase-26c2-single-render-pipeline', 'phase-26c3-view-purification', 'phase-26d-final-platform-cleanup'].includes(config.migrationStatus));

state.replace({
  tempC: '20',
  rhPercent: '50',
  targetTempC: '8',
  targetRhPercent: '90',
  process: 'cool',
  activeProcessId: 'saved-process-1',
  savedProcesses: [],
  processes: [],
  expandedProcessId: null,
  activePath: calculate({ tempC: '20', rhPercent: '50', targetTempC: '8', targetRhPercent: '90', process: 'cool' }).processPath,
  points: []
}, { notify: false });

const stalePath = state.get().activePath;
const nextState = { ...state.get(), process: 'cool-dehumidify' };
const expectedLivePath = calculate(nextState).processPath;
state.set({ process: 'cool-dehumidify' }, { action: 'segment:select', notify: false });

const vm = createViewModel(state.get());
assert.equal(vm.state.activeProcessId, 'saved-process-1');
assert.equal(vm.state.process, 'cool-dehumidify');
assert.deepEqual(comparablePath(vm.activePath), comparablePath(expectedLivePath), 'selected saved process must render a live preview path from current state');
assert.notDeepEqual(comparablePath(vm.activePath), comparablePath(stalePath), 'view model must not keep the old saved record path after process changes');

const eventPipeline = fs.readFileSync(new URL('../js/core/eventPipeline.js', import.meta.url), 'utf8');
assert.match(eventPipeline, /focusNextPlatformField/, 'central event pipeline must provide Enter-to-next-field focus handling');
assert.match(eventPipeline, /field:enter/, 'central event pipeline must keep explicit Enter commits');
assert.match(eventPipeline, /requestAnimationFrame\(applyFocus\)/, 'next focus must be deferred until after possible render work');

console.log('hx diagram phase 26B.3A.3 enter navigation and live diagram source ok');
