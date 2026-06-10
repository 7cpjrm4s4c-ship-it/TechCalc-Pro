import { calculate } from './logic.js';
import { buildHxResultModel } from './results.js';

function hasCompleteInput(s) {
  return [s.tempC, s.rhPercent, s.targetTempC, s.targetRhPercent]
    .every(value => String(value ?? '').trim() !== '');
}

export function createViewModel(s = {}) {
  const result = calculate(s);
  const completeInput = hasCompleteInput(s);
  // A selected saved process can carry an old persisted path in state.activePath.
  // The visible diagram must always be a live preview of the current form values
  // and selected air-treatment process. Persistence happens only on Update.
  const activePath = completeInput
    ? result.processPath
    : Array.isArray(s.activePath) && s.activePath.length ? s.activePath : [];
  const vm = {
    state: s,
    result,
    activePath,
    hasCompleteInput: completeInput,
    processes: Array.isArray(s.savedProcesses) ? s.savedProcesses : (Array.isArray(s.processes) ? s.processes : []),
    activeProcessId: s.activeProcessId || null,
    targetReached: !activePath.length || result.targetReached
  };
  vm.resultModel = buildHxResultModel(vm);
  return vm;
}
