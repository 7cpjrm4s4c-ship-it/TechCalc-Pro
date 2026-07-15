import { calculate as calculateBase } from './logic.js';
import { surchargeFactorFromRiskClass, calculateReductionFactorFa } from './retentionFactors.js';

const toNumber = value => Number(String(value ?? '').replace(',', '.'));

function positive(value) {
  const number = toNumber(value);
  return Number.isFinite(number) && number > 0 ? value : null;
}

function completeRain(values = {}) {
  return [5, 10, 15].every(duration => positive(values[duration]) != null);
}

export function resolveRetentionRainInput(state = {}) {
  const existing = state.retentionRainByDuration && typeof state.retentionRainByDuration === 'object'
    ? state.retentionRainByDuration
    : {};
  const requestedRecurrence = toNumber(state.retentionRecurrenceFrequencyPerYear);
  const manual = {
    5: positive(state.retentionRainDuration5),
    10: positive(state.retentionRainDuration10),
    15: positive(state.retentionRainDuration15)
  };
  const twoYear = {
    5: positive(state.rainR2Duration5),
    10: positive(state.rainR2Duration10),
    15: positive(state.rainR2Duration15)
  };
  const hasManualSet = completeRain(manual);
  const hasTwoYearSet = completeRain(twoYear);
  const usesTwoYearRain = Math.abs(requestedRecurrence - 0.5) < 1e-9;
  const automaticTwoYearFallback = !hasManualSet && hasTwoYearSet;
  const effectiveRecurrence = automaticTwoYearFallback ? 0.5 : requestedRecurrence;

  const merged = {};
  for (const duration of [5, 10, 15]) {
    const value = manual[duration]
      ?? ((usesTwoYearRain || automaticTwoYearFallback) ? twoYear[duration] : null)
      ?? positive(existing[duration]);
    if (value != null) merged[duration] = value;
  }

  return Object.freeze({
    rainByDuration: Object.freeze(merged),
    requestedRecurrence,
    effectiveRecurrence,
    automaticTwoYearFallback,
    source: automaticTwoYearFallback || usesTwoYearRain
      ? 'KOSTRA r(D,2) automatisch übernommen'
      : 'projektspezifische KOSTRA-Regenspenden r(D,n)'
  });
}

export function buildRetentionRainByDuration(state = {}) {
  return resolveRetentionRainInput(state).rainByDuration;
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
    throttleRainShareLsHa,
    dryWeatherFlowLs,
    upstreamThrottleFlowLs
  });
}

export function buildCombinedStorageResult(base = {}, retention = {}) {
  const dinValue = base.floodingCalculationAvailable
    ? Number(base.flooding?.governing?.valueM3)
    : NaN;
  const dwaValue = retention.calculated
    ? Number(retention.governing?.volumeM3)
    : NaN;
  const dinVolumeM3 = Number.isFinite(dinValue) && dinValue >= 0 ? dinValue : null;
  const dwaVolumeM3 = Number.isFinite(dwaValue) && dwaValue >= 0 ? dwaValue : null;

  if (dinVolumeM3 == null && dwaVolumeM3 == null) {
    return Object.freeze({
      planningVolumeM3: null,
      dinVolumeM3,
      dwaVolumeM3,
      governingSource: 'unavailable',
      rule: 'Bemessungswert erst nach vollständigem DIN- und gegebenenfalls DWA-Nachweis verfügbar.'
    });
  }

  if (dinVolumeM3 != null && dwaVolumeM3 != null) {
    const equal = Math.abs(dinVolumeM3 - dwaVolumeM3) < 1e-9;
    return Object.freeze({
      planningVolumeM3: Math.max(dinVolumeM3, dwaVolumeM3),
      dinVolumeM3,
      dwaVolumeM3,
      governingSource: equal ? 'both' : (dinVolumeM3 > dwaVolumeM3 ? 'din-1986-100' : 'dwa-a-117'),
      rule: 'Für einen gemeinsamen Speicher ist der größere Volumenbedarf aus DIN 1986-100 und DWA-A 117 anzusetzen; die Volumina werden nicht addiert.'
    });
  }

  return Object.freeze({
    planningVolumeM3: dinVolumeM3 ?? dwaVolumeM3,
    dinVolumeM3,
    dwaVolumeM3,
    governingSource: dinVolumeM3 != null ? 'din-1986-100' : 'dwa-a-117',
    rule: dinVolumeM3 != null
      ? 'DIN-Bemessungswert; der DWA-A-117-Nachweis ist noch nicht vollständig.'
      : 'DWA-A-117-Bemessungswert; der DIN-Nachweis ist noch nicht vollständig.'
  });
}

export function calculate(state = {}) {
  const authorityMode = state.dischargeMode === 'authority-discharge-limit';
  const rainInput = resolveRetentionRainInput(state);
  const factorState = {
    ...state,
    retentionRecurrenceFrequencyPerYear: Number.isFinite(rainInput.effectiveRecurrence)
      ? String(rainInput.effectiveRecurrence).replace('.', ',')
      : state.retentionRecurrenceFrequencyPerYear
  };
  const factors = deriveRetentionFactors(factorState);
  const adaptedState = {
    ...factorState,
    retentionEnabled: authorityMode,
    retentionRainByDuration: rainInput.rainByDuration,
    retentionSurchargeFactorFz: factors.surchargeFactorFz,
    retentionReductionFactorFa: factors.reductionFactorFa ?? ''
  };
  const base = calculateBase(adaptedState);
  const retention = Object.freeze({
    ...(base.retention || {}),
    rainByDuration: rainInput.rainByDuration,
    requestedRecurrenceFrequencyPerYear: rainInput.requestedRecurrence,
    effectiveRecurrenceFrequencyPerYear: rainInput.effectiveRecurrence,
    automaticTwoYearFallback: rainInput.automaticTwoYearFallback,
    surchargeFactorFz: factors.surchargeFactorFz,
    reductionFactorFa: factors.reductionFactorFa,
    reductionFactorValid: factors.reductionFactorValid,
    reductionFactorWithinDomain: factors.reductionFactorWithinDomain,
    dryWeatherFlowLs: factors.dryWeatherFlowLs,
    upstreamThrottleFlowLs: factors.upstreamThrottleFlowLs,
    factorSource: Object.freeze({
      surcharge: 'DWA-A 117 Tabelle 2',
      reduction: factors.reductionFactorSource,
      riskClass: state.retentionRiskClass || 'medium',
      rain: rainInput.source
    })
  });
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
  if (authorityMode && rainInput.automaticTwoYearFallback) {
    warnings.push('Für den DWA-A-117-Nachweis werden mangels projektspezifischer r(D,n)-Werte automatisch die vorhandenen r(D,2)-Werte mit n = 0,5/a verwendet.');
  }

  return Object.freeze({
    ...base,
    retention,
    combinedStorage: buildCombinedStorageResult(base, retention),
    warnings: Object.freeze(warnings)
  });
}

export default calculate;
