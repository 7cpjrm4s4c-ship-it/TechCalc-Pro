import assert from 'node:assert/strict';
import config from '../js/modules/hx-diagram/config.js';
import { state } from '../js/modules/hx-diagram/state.js';
import { calculate } from '../js/modules/hx-diagram/logic.js';
import { buildHxProcessRecord } from '../js/modules/hx-diagram/results.js';
import { updateActiveProcessFromDialog, deleteSavedProcessById } from '../js/modules/hx-diagram/controller.js';

assert.equal(['phase-26b2a-saved-records-update-delete-fix', 'phase-26b3-result-renderer', 'phase-26b3a2-process-immediate-render'].includes(config.migrationStatus), true);

state.replace({
  label: 'Alt',
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

const oldResult = calculate(state.get());
const oldRecord = buildHxProcessRecord(state.get(), oldResult, [], 'hx-test-1', 'Alt');
state.set({
  savedProcesses: [oldRecord],
  processes: [oldRecord],
  activeProcessId: oldRecord.id,
  activePath: oldRecord.path,
  label: 'Alt',
  targetTempC: '30'
}, { notify: false });

const root = {
  querySelectorAll(selector) {
    if (selector !== '[data-field]') return [];
    return [
      { dataset: { field: 'label' }, value: 'Neu' },
      { dataset: { field: 'tempC' }, value: '20' },
      { dataset: { field: 'rhPercent' }, value: '50' },
      { dataset: { field: 'targetTempC' }, value: '35' },
      { dataset: { field: 'targetRhPercent' }, value: '40' }
    ];
  },
  querySelector(selector) {
    if (selector === '#hxProcessName') return { value: 'Neu' };
    return null;
  }
};

const updated = updateActiveProcessFromDialog(root);
assert.ok(updated);
assert.equal(updated.id, 'hx-test-1');
assert.equal(updated.name, 'Neu');
assert.equal(state.get().savedProcesses.length, 1);
assert.equal(state.get().savedProcesses[0].input.targetTempC, '35');
assert.deepEqual(state.get().activePath, state.get().savedProcesses[0].path);
assert.notDeepEqual(state.get().activePath, oldRecord.path);

const remaining = deleteSavedProcessById('hx-test-1');
assert.equal(remaining.length, 0);
assert.equal(state.get().savedProcesses.length, 0);
assert.equal(state.get().activeProcessId, null);
assert.deepEqual(state.get().activePath, []);

console.log('hx diagram phase 26B.2a update/delete fix ok');
