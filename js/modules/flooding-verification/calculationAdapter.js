import { calculate as calculateBase } from './logic.js';

const compact = value => String(value ?? '').trim();

export function buildRetentionRainByDuration(state = {}) {
  const existing = state.retentionRainByDuration && typeof state.retentionRainByDuration === 'object'
    ? state.retentionRainByDuration
    : {};
  return Object.freeze({
    ...existing,
    ...(compact(state.retentionRainDuration5) ? { 5: state.retentionRainDuration5 } : {}),
    ...(compact(state.retentionRainDuration10) ? { 10: state.retentionRainDuration10 } : {}),
    ...(compact(state.retentionRainDuration15) ? { 15: state.retentionRainDuration15 } : {})
  });
}

export function calculate(state = {}) {
  const authorityMode = state.dischargeMode === 'authority-discharge-limit';
  const adaptedState = {
    ...state,
    retentionEnabled: authorityMode,
    retentionRainByDuration: buildRetentionRainByDuration(state)
  };
  const base = calculateBase(adaptedState);
  const warnings = Array.isArray(base.warnings)
    ? base.warnings.filter(message => message !== 'Bei behördlicher Einleitungsbegrenzung ist zusätzlich der Rückhaltenachweis nach DWA-A 117 zu führen.')
    : [];
  return Object.freeze({ ...base, warnings: Object.freeze(warnings) });
}

export default calculate;
