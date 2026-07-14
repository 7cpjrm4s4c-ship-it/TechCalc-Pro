import { calculate as calculateBase } from './logic.js';
import { surchargeFactorFromRiskClass, calculateReductionFactorFa } from './retentionFactors.js';

const compact = value => String(value ?? '').trim();
const toNumber = value => Number(String(value ?? '').replace(',', '.'));

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

function weightedCmAreaM2(state = {}) {
  return (Array.isArray(state.surfaces) ? state.surfaces : []).reduce((sum, surface) => {
    const area = toNumber(surface.area ?? surface.areaM2 ?? surface.areaSize);
    const cm = toNumber(surface.cm ?? surface.meanRunoffCoefficientCm);
    return area > 0 && cm >= 0 && cm <= 1 ? sum + area * cm : sum;
  }, 0);
}

export function deriveRetentionFactors(state = {}) {
  const effectiveAreaHa = weightedCmAreaM2(state) / 10000;
  const authorityLimitLs = toNumber(state.authorityLimitLs);
  const dryWeatherFlowLs = toNumber(state.retentionDryWeatherFlowLs) || 0;
  const upstreamThrottleFlowLs = toNumber(state.retentionUpstreamThrottleFlowLs) || 0;
  const availableRainThrottleLs = authorityLimitLs - dryWeatherFlowLs - upstreamThrottleFlowLs;
  const throttleRainShareLsHa = effectiveAreaHa > 0 ? availableRainThrottleLs / effectiveAreaHa : NaN;
  const surchargeFactorFz = surchargeFactorFromRiskClass(state.retentionRiskClass);
  const reduction = calculateReductionFactorFa({
    flowTimeMinutes: state.retentionFlowTimeMinutes,
    throttleRainShareLsHa,
    recurrenceFrequencyPerYear: state.retentionRecurrenceFrequencyPerYear
  });
  return Object.freeze({
    surchargeFactorFz,
    reductionFactorFa: reduction.value,
    reductionFactorValid: reduction.valid,
    reductionFactorSource: reduction.source,
    throttleRainShareLsHa
  });
}

export function calculate(state = {}) {
  const authorityMode = state.dischargeMode === 'authority-discharge-limit';
  const factors = deriveRetentionFactors(state);
  const adaptedState = {
    ...state,
    retentionEnabled: authorityMode,
    retentionRainByDuration: buildRetentionRainByDuration(state),
    retentionSurchargeFactorFz: factors.surchargeFactorFz,
    retentionReductionFactorFa: factors.reductionFactorFa ?? ''
  };
  const base = calculateBase(adaptedState);
  const warnings = Array.isArray(base.warnings)
    ? base.warnings.filter(message => message !== 'Bei behördlicher Einleitungsbegrenzung ist zusätzlich der Rückhaltenachweis nach DWA-A 117 zu führen.')
    : [];
  return Object.freeze({
    ...base,
    retention: Object.freeze({
      ...(base.retention || {}),
      factorSource: Object.freeze({
        surcharge: 'DWA-A 117 Tabelle 2',
        reduction: factors.reductionFactorSource,
        riskClass: state.retentionRiskClass || 'medium'
      })
    }),
    warnings: Object.freeze(warnings)
  });
}

export default calculate;
