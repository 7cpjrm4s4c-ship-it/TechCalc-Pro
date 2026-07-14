import { calculate as calculateBase } from './logic.js';
import { surchargeFactorFromRiskClass, calculateReductionFactorFa } from './retentionFactors.js';

const compact = value => String(value ?? '').trim();
const toNumber = value => Number(String(value ?? '').replace(',', '.'));

function positive(value) {
  const number = toNumber(value);
  return Number.isFinite(number) && number > 0 ? value : null;
}

export function buildRetentionRainByDuration(state = {}) {
  const existing = state.retentionRainByDuration && typeof state.retentionRainByDuration === 'object'
    ? state.retentionRainByDuration
    : {};
  const recurrence = toNumber(state.retentionRecurrenceFrequencyPerYear);
  const usesTwoYearRain = Math.abs(recurrence - 0.5) < 1e-9;
  const manual = {
    5: positive(state.retentionRainDuration5),
    10: positive(state.retentionRainDuration10),
    15: positive(state.retentionRainDuration15)
  };
  const automatic = usesTwoYearRain
    ? {
        5: positive(state.rainR2Duration5),
        10: positive(state.rainR2Duration10),
        15: positive(state.rainR2Duration15)
      }
    : {};

  const merged = {};
  for (const duration of [5, 10, 15]) {
    const value = manual[duration] ?? automatic[duration] ?? positive(existing[duration]);
    if (value != null) merged[duration] = value;
  }
  return Object.freeze(merged);
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
    reductionFactorWithinDomain: reduction.withinDomain,
    reductionFactorSource: reduction.source,
    throttleRainShareLsHa
  });
}

export function calculate(state = {}) {
  const authorityMode = state.dischargeMode === 'authority-discharge-limit';
  const factors = deriveRetentionFactors(state);
  const retentionRainByDuration = buildRetentionRainByDuration(state);
  const adaptedState = {
    ...state,
    retentionEnabled: authorityMode,
    retentionRainByDuration,
    retentionSurchargeFactorFz: factors.surchargeFactorFz,
    retentionReductionFactorFa: factors.reductionFactorFa ?? ''
  };
  const base = calculateBase(adaptedState);
  const warnings = Array.isArray(base.warnings)
    ? base.warnings.filter(message => {
        if (message === 'Bei behördlicher Einleitungsbegrenzung ist zusätzlich der Rückhaltenachweis nach DWA-A 117 zu führen.') return false;
        if (!factors.reductionFactorWithinDomain && message === 'Der Abminderungsfaktor fA muss größer 0 sein.') return false;
        return true;
      })
    : [];

  if (authorityMode && !factors.reductionFactorWithinDomain) {
    warnings.push('Der Abminderungsfaktor fA kann nicht normativ bestimmt werden, weil tf, qDr,R,u oder n außerhalb des Gültigkeitsbereichs von DWA-A 117 Anhang B liegen. Das einfache Verfahren ist nicht uneingeschränkt anwendbar.');
  }

  return Object.freeze({
    ...base,
    retention: Object.freeze({
      ...(base.retention || {}),
      rainByDuration: retentionRainByDuration,
      surchargeFactorFz: factors.surchargeFactorFz,
      reductionFactorFa: factors.reductionFactorFa,
      reductionFactorValid: factors.reductionFactorValid,
      reductionFactorWithinDomain: factors.reductionFactorWithinDomain,
      factorSource: Object.freeze({
        surcharge: 'DWA-A 117 Tabelle 2',
        reduction: factors.reductionFactorSource,
        riskClass: state.retentionRiskClass || 'medium',
        rain: Math.abs(toNumber(state.retentionRecurrenceFrequencyPerYear) - 0.5) < 1e-9
          ? 'KOSTRA r(D,2) automatisch übernommen'
          : 'projektspezifische KOSTRA-Regenspenden r(D,n)'
      })
    }),
    warnings: Object.freeze(warnings)
  });
}

export default calculate;
