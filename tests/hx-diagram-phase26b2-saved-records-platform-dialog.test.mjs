import assert from 'node:assert/strict';
import hxModule from '../js/modules/hx-diagram/index.js';
import config from '../js/modules/hx-diagram/config.js';
import { state, normalizeSavedProcesses } from '../js/modules/hx-diagram/state.js';
import { hxProcessCard, hxProcessController, savedProcessPatch } from '../js/modules/hx-diagram/controller.js';
import { buildHxProcessRecord, hxProcessStats } from '../js/modules/hx-diagram/results.js';
import { calculate } from '../js/modules/hx-diagram/logic.js';

assert.ok(['phase-26b2-saved-records-platform-dialog', 'phase-26b2a-saved-records-update-delete-fix', 'phase-26b3-result-renderer', 'phase-26b3a2-process-immediate-render', 'phase-26b3a3-enter-tab-navigation-and-live-diagram', 'phase-26c1-diagram-renderer-extraction', 'phase-26c2-single-render-pipeline'].includes(config.migrationStatus));
assert.ok(config.capabilities.includes('centralSavedRecords'));
assert.equal(typeof hxModule.mount, 'function');

state.replace({
  label: 'Testprozess',
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

const result = calculate(state.get());
const record = buildHxProcessRecord(state.get(), result, [], 'hx-1', 'Testprozess');
assert.equal(record.id, 'hx-1');
assert.equal(record.name, 'Testprozess');
assert.ok(Array.isArray(record.path));
assert.ok(record.path.length >= 2);
assert.ok(hxProcessStats(record).length >= 4);

const cardHtml = hxProcessCard({ ...state.get(), savedProcesses: [record] });
assert.match(cardHtml, /data-line-save/);
assert.match(cardHtml, /data-line-update/);
assert.match(cardHtml, /data-line-select="hx-1"/);
assert.doesNotMatch(cardHtml, /data-hx-select-process/);
assert.doesNotMatch(cardHtml, /data-hx-remove-process/);

const patch = savedProcessPatch(record, { savedProcesses: [record], expandedProcessId: null });
assert.equal(patch.activeProcessId, 'hx-1');
assert.equal(patch.label, 'Testprozess');
assert.ok(Array.isArray(patch.activePath));
assert.equal(normalizeSavedProcesses({ processes: [record] }).length, 1);
assert.equal(typeof hxProcessController.bind, 'function');

console.log('hx diagram phase 26B.2 saved records platform dialog contract ok');
