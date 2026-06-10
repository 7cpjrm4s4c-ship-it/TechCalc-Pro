import { calculate } from './logic.js';
import { buildHxResultModel } from './results.js';

function hasCompleteInput(s) {
  return [s.tempC, s.rhPercent, s.targetTempC, s.targetRhPercent]
    .every(value => String(value ?? '').trim() !== '');
}

export function createViewModel(s = {}) {
  const result = calculate(s);
  const activePath = Array.isArray(s.activePath) && s.activePath.length
    ? s.activePath
    : hasCompleteInput(s) ? result.processPath : [];
  const vm = {
    state: s,
    result,
    activePath,
    hasCompleteInput: hasCompleteInput(s),
    processes: Array.isArray(s.savedProcesses) ? s.savedProcesses : (Array.isArray(s.processes) ? s.processes : []),
    activeProcessId: s.activeProcessId || null,
    targetReached: !activePath.length || result.targetReached
  };
  vm.resultModel = buildHxResultModel(vm);
  return vm;
}
