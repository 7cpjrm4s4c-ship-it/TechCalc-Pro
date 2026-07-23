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

function storageValue(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function combinedStorageModel({
  planningVolumeM3,
  dinVolumeM3,
  dwaVolumeM3,
  governingSource,
  governingLabel,
  governingReason,
  status,
  rule,
  requiresDwaCheck
}) {
  return Object.freeze({
    planningVolumeM3,
    dinVolumeM3,
    dwaVolumeM3,
    governingSource,
    governingLabel,
    governingReason,
    status,
    rule,
    requiresDwaCheck
  });
}

export function deriveCombinedStorage(result = {}, authorityMode = false) {
  const dinVolumeM3 = storageValue(result.flooding?.governing?.valueM3);
  const dwaCalculated = Boolean(authorityMode && result.retention?.calculated);
  const dwaVolumeM3 = dwaCalculated ? storageValue(result.retention?.governing?.volumeM3) : null;
  const requiresDwaCheck = Boolean(authorityMode);

  if (!requiresDwaCheck) {
    if (dinVolumeM3 == null) {
      return combinedStorageModel({
        planningVolumeM3: null,
        dinVolumeM3,
        dwaVolumeM3: null,
        governingSource: 'unavailable',
        governingLabel: 'Nachweis unvollständig',
        governingReason: 'Der DIN-Überflutungsnachweis ist noch nicht vollständig. Ein planerischer Bemessungswert kann noch nicht ausgegeben werden.',
        status: 'incomplete',
        rule: 'Für diese Betriebsart ist kein Rückhalteraumnachweis nach DWA-A 117 erforderlich.',
        requiresDwaCheck
      });
    }
    return combinedStorageModel({
      planningVolumeM3: dinVolumeM3,
      dinVolumeM3,
      dwaVolumeM3: null,
      governingSource: 'din-1986-100',
      governingLabel: 'DIN 1986-100',
      governingReason: 'Für diese Betriebsart ist kein zusätzlicher Rückhalteraumnachweis nach DWA-A 117 erforderlich. Das DIN-Bemessungsvolumen ist für die Planung anzusetzen.',
      status: 'din-only',
      rule: 'DWA-A 117 nicht erforderlich; DIN 1986-100 ist maßgebend.',
      requiresDwaCheck
    });
  }

  if (dinVolumeM3 == null && dwaVolumeM3 == null) {
    return combinedStorageModel({
      planningVolumeM3: null,
      dinVolumeM3,
      dwaVolumeM3,
      governingSource: 'unavailable',
      governingLabel: 'Nachweis unvollständig',
      governingReason: 'DIN- und DWA-A-117-Nachweis sind noch nicht vollständig. Ein planerischer Bemessungswert kann noch nicht ausgegeben werden.',
      status: 'incomplete',
      rule: 'Bemessungswert erst nach vollständigem DIN- und DWA-A-117-Nachweis verfügbar.',
      requiresDwaCheck
    });
  }

  if (dinVolumeM3 != null && dwaVolumeM3 == null) {
    return combinedStorageModel({
      planningVolumeM3: dinVolumeM3,
      dinVolumeM3,
      dwaVolumeM3,
      governingSource: 'din-1986-100',
      governingLabel: 'DIN 1986-100 – DWA-A 117 noch offen',
      governingReason: 'Der DIN-Überflutungsnachweis ist vollständig. Der zusätzlich erforderliche DWA-A-117-Nachweis ist noch offen; der angezeigte Wert ist daher noch nicht abschließend.',
      status: 'pending-dwa',
      rule: 'Vorläufiger DIN-Bemessungswert; DWA-A 117 muss noch abgeschlossen werden.',
      requiresDwaCheck
    });
  }

  if (dinVolumeM3 == null && dwaVolumeM3 != null) {
    return combinedStorageModel({
      planningVolumeM3: dwaVolumeM3,
      dinVolumeM3,
      dwaVolumeM3,
      governingSource: 'dwa-a-117',
      governingLabel: 'DWA-A 117 – DIN noch offen',
      governingReason: 'Der DWA-A-117-Rückhalteraumnachweis ist vollständig. Der DIN-Überflutungsnachweis ist noch offen; der angezeigte Wert ist daher noch nicht abschließend.',
      status: 'pending-din',
      rule: 'Vorläufiger DWA-A-117-Bemessungswert; DIN 1986-100 muss noch abgeschlossen werden.',
      requiresDwaCheck
    });
  }

  const equal = Math.abs(dinVolumeM3 - dwaVolumeM3) < 1e-9;
  if (equal) {
    return combinedStorageModel({
      planningVolumeM3: dinVolumeM3,
      dinVolumeM3,
      dwaVolumeM3,
      governingSource: 'both',
      governingLabel: 'DIN 1986-100 und DWA-A 117',
      governingReason: 'Beide Nachweisverfahren führen zum gleichen erforderlichen Speichervolumen.',
      status: 'complete',
      rule: 'Beide Nachweise ergeben denselben Bemessungswert; die Volumina werden nicht addiert.',
      requiresDwaCheck
    });
  }

  const dinGoverns = dinVolumeM3 > dwaVolumeM3;
  return combinedStorageModel({
    planningVolumeM3: Math.max(dinVolumeM3, dwaVolumeM3),
    dinVolumeM3,
    dwaVolumeM3,
    governingSource: dinGoverns ? 'din-1986-100' : 'dwa-a-117',
    governingLabel: dinGoverns ? 'DIN 1986-100' : 'DWA-A 117',
    governingReason: dinGoverns
      ? 'Das nach DIN 1986-100 erforderliche Speichervolumen ist größer als das Ergebnis nach DWA-A 117. Für die Planung ist daher das DIN-Bemessungsvolumen anzusetzen.'
      : 'Der Rückhalteraumnachweis nach DWA-A 117 ergibt das größere erforderliche Speichervolumen. Dieses ist für die Planung maßgebend.',
    status: 'complete',
    rule: 'Für einen gemeinsamen Speicher ist der größere Volumenbedarf aus DIN 1986-100 und DWA-A 117 anzusetzen; die Volumina werden nicht addiert.',
    requiresDwaCheck
  });
}

export function buildCombinedStorageResult(base = {}, retention = {}, authorityMode = false) {
  return deriveCombinedStorage({
    ...base,
    retention
  }, authorityMode);
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
    combinedStorage: buildCombinedStorageResult(base, retention, authorityMode),
    warnings: Object.freeze(warnings)
  });
}

export default calculate;
