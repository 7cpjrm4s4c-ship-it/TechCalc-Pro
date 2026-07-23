import { areaTypes, hydraulicTables, dnOrder } from '../../shared/rainwaterDomainTables.js';

const toNumber = value => Number(String(value ?? '').replace(',', '.'));
const typeById = new Map(areaTypes.map(item => [item.id, item]));
const VALID_DURATIONS = new Set([5, 10, 15]);
const FLOODING_DURATIONS = Object.freeze([5, 10, 15]);
const VALID_DISCHARGE_MODES = new Set(['table-existing-pipe', 'table-size-pipe', 'manual-full-flow', 'authority-discharge-limit']);

export function validateSurface(surface = {}) {
  const area = toNumber(surface.area ?? surface.areaM2 ?? surface.areaSize);
  const cs = toNumber(surface.cs ?? surface.runoffCoefficientCs);
  const cm = toNumber(surface.cm ?? surface.meanRunoffCoefficientCm);
  const errors = [];
  if (!(area > 0)) errors.push('Fläche muss größer 0 m² sein.');
  if (!(cs >= 0 && cs <= 1)) errors.push('Cₛ muss zwischen 0 und 1 liegen.');
  if (!(cm >= 0 && cm <= 1)) errors.push('Cₘ muss zwischen 0 und 1 liegen.');
  if (!['roof', 'property'].includes(surface.category ?? surface.group)) errors.push('Flächengruppe ist ungültig.');
  return { valid: errors.length === 0, errors, area, cs, cm };
}

export function isSealedSurface(surface = {}) {
  if (typeof surface.isSealed === 'boolean') return surface.isSealed;
  const type = typeById.get(surface.areaType ?? surface.surfaceType);
  if (typeof type?.isSealed === 'boolean') return type.isSealed;
  return (surface.category ?? surface.group) === 'roof';
}

export function isCriticalSurface(surface = {}) {
  if ((surface.category ?? surface.group) === 'roof') return true;
  if (typeof surface.isNotSafelyFloodable === 'boolean') return surface.isNotSafelyFloodable;
  return isSealedSurface(surface);
}

export function automaticRainDuration(meanSlopePercent, sealedShare) {
  const slope = Math.max(0, toNumber(meanSlopePercent) || 0);
  const share = Math.min(1, Math.max(0, Number(sealedShare) || 0));
  if (slope < 1) return share <= 0.5 ? 15 : 10;
  if (slope <= 4) return 10;
  return share <= 0.5 ? 10 : 5;
}

function rainValue(state, recurrence, duration) {
  return toNumber(state[`rainR${recurrence}Duration${duration}`]);
}

function validateRainInputs(state = {}, duration = 10) {
  const required = [
    ['r(5,30)', rainValue(state, 30, 5)],
    ['r(10,30)', rainValue(state, 30, 10)],
    ['r(15,30)', rainValue(state, 30, 15)],
    [`r(${duration},2)`, rainValue(state, 2, duration)],
    [`r(${duration},30)`, rainValue(state, 30, duration)]
  ];
  return required.filter(([, value]) => !(value > 0)).map(([label]) => `${label} muss größer 0 sein.`);
}

export function resolvePipeSlopePercent(stateOrValue = {}) {
  if (stateOrValue && typeof stateOrValue === 'object') {
    const canonical = toNumber(stateOrValue.pipeSlopePercent);
    if (Number.isFinite(canonical) && canonical > 0) return canonical;
    const legacy = toNumber(stateOrValue.pipeSlopePermille);
    return Number.isFinite(legacy) && legacy > 0 ? legacy / 10 : NaN;
  }
  const value = toNumber(stateOrValue);
  return Number.isFinite(value) && value > 0 ? value : NaN;
}

export function tableSlopePercent(value) {
  return resolvePipeSlopePercent(value);
}

export function tableSlopeFromPermille(value) {
  const legacy = toNumber(value);
  return Number.isFinite(legacy) ? legacy / 10 : NaN;
}

export function lookupFullFlow(dn, slopePercent) {
  const slope = resolvePipeSlopePercent(slopePercent);
  const row = (hydraulicTables['1.0'] || []).find(item => Math.abs(Number(item.slope) - slope) < 1e-9);
  const qFullLs = row?.values?.[dn];
  if (!(qFullLs > 0)) return null;
  const diameterMm = toNumber(String(dn).replace(/[^0-9.,]/g, ''));
  const diameterM = diameterMm / 1000;
  const crossSectionM2 = Math.PI * diameterM * diameterM / 4;
  const velocityMs = crossSectionM2 > 0 ? (qFullLs / 1000) / crossSectionM2 : 0;
  return { dn, slopePercent: slope, qFullLs, velocityMs, tableReference: 'DIN 1986-100 Tabelle A.5', lookupMode: 'exact' };
}

export function sizePipe(requiredFlowLs, slopePercent) {
  const required = Number(requiredFlowLs);
  if (!(required > 0)) return null;
  for (const dn of dnOrder) {
    const candidate = lookupFullFlow(dn, slopePercent);
    if (candidate && candidate.qFullLs >= required) return candidate;
  }
  return null;
}

function finiteNonNegative(rawValue) {
  const raw = Number(rawValue);
  const finite = Number.isFinite(raw);
  return {
    rawValueM3: finite ? raw : null,
    valueM3: finite ? Math.max(0, raw) : 0,
    clampedToZero: finite && raw < 0,
    valid: finite
  };
}

export function calculateFloodingEquation20({ durationMinutes, rain30, rain2, totalAreaM2, weightedCsAreaM2 } = {}) {
  const duration = Number(durationMinutes);
  const r30 = Number(rain30);
  const r2 = Number(rain2);
  const totalArea = Number(totalAreaM2);
  const weightedCsArea = Number(weightedCsAreaM2);
  if (!(duration > 0) || !(r30 > 0) || !(r2 > 0) || !(totalArea > 0) || !(weightedCsArea >= 0)) {
    return Object.freeze({ durationMinutes: duration || 0, rain30: r30 || 0, rain2: r2 || 0, totalAreaM2: totalArea || 0, weightedCsAreaM2: weightedCsArea || 0, rawValueM3: null, valueM3: 0, clampedToZero: false, valid: false });
  }
  const rawValueM3 = (r30 * totalArea - r2 * weightedCsArea) * duration * 60 / (10000 * 1000);
  return Object.freeze({ durationMinutes: duration, rain30: r30, rain2: r2, totalAreaM2: totalArea, weightedCsAreaM2: weightedCsArea, ...finiteNonNegative(rawValueM3) });
}

export function calculateFloodingEquation21({ durationMinutes, rain30, totalAreaM2, dischargeLs } = {}) {
  const duration = Number(durationMinutes);
  const r30 = Number(rain30);
  const totalArea = Number(totalAreaM2);
  const qOut = Number(dischargeLs);
  if (!(duration > 0) || !(r30 > 0) || !(totalArea > 0) || !(qOut >= 0)) {
    return Object.freeze({ durationMinutes: duration || 0, rain30: r30 || 0, totalAreaM2: totalArea || 0, dischargeLs: qOut || 0, rawValueM3: null, valueM3: 0, clampedToZero: false, valid: false });
  }
  const rawValueM3 = (r30 * totalArea / 10000 - qOut) * duration * 60 / 1000;
  return Object.freeze({ durationMinutes: duration, rain30: r30, totalAreaM2: totalArea, dischargeLs: qOut, ...finiteNonNegative(rawValueM3) });
}

function maxDurationResult(results = []) {
  const valid = results.filter(item => item?.valid && Number.isFinite(item.valueM3));
  if (!valid.length) return null;
  return valid.reduce((max, item) => item.valueM3 > max.valueM3 ? item : max, valid[0]);
}

function normalizeRetentionRainSeries(series = {}) {
  return Object.entries(series || {})
    .map(([duration, rain]) => ({ durationMinutes: Number(duration), rainIntensityLsHa: toNumber(rain) }))
    .filter(item => item.durationMinutes > 0 && Number.isFinite(item.rainIntensityLsHa))
    .sort((a, b) => a.durationMinutes - b.durationMinutes);
}

export function calculateDwa117Duration({ durationMinutes, rainIntensityLsHa, throttleRainShareLsHa, surchargeFactorFz, reductionFactorFa, effectiveAreaHa } = {}) {
  const duration = Number(durationMinutes);
  const rain = Number(rainIntensityLsHa);
  const throttle = Number(throttleRainShareLsHa);
  const fz = Number(surchargeFactorFz);
  const fA = Number(reductionFactorFa);
  const au = Number(effectiveAreaHa);
  const valid = duration > 0 && rain > 0 && throttle >= 0 && fz > 0 && fA > 0 && au > 0;
  if (!valid) {
    return Object.freeze({ durationMinutes: duration || 0, rainIntensityLsHa: rain || 0, throttleRainShareLsHa: throttle || 0, surchargeFactorFz: fz || 0, reductionFactorFa: fA || 0, effectiveAreaHa: au || 0, specificStorageM3Ha: 0, volumeM3: 0, rawSpecificStorageM3Ha: null, rawVolumeM3: null, clampedToZero: false, valid: false });
  }
  const rawSpecificStorageM3Ha = (rain - throttle) * duration * fz * fA * 0.06;
  const rawVolumeM3 = rawSpecificStorageM3Ha * au;
  const clampedToZero = rawSpecificStorageM3Ha < 0 || rawVolumeM3 < 0;
  return Object.freeze({
    durationMinutes: duration,
    rainIntensityLsHa: rain,
    throttleRainShareLsHa: throttle,
    surchargeFactorFz: fz,
    reductionFactorFa: fA,
    effectiveAreaHa: au,
    rawSpecificStorageM3Ha,
    specificStorageM3Ha: Math.max(0, rawSpecificStorageM3Ha),
    rawVolumeM3,
    volumeM3: Math.max(0, rawVolumeM3),
    clampedToZero,
    valid: Number.isFinite(rawSpecificStorageM3Ha) && Number.isFinite(rawVolumeM3)
  });
}

export function calculateDwa117SimpleProcedure({ enabled = false, dischargeMode = '', authorityLimitLs = 0, weightedCmAreaM2 = 0, dryWeatherFlowLs = 0, upstreamThrottleFlowLs = 0, surchargeFactorFz = 0, reductionFactorFa = 0, rainByDuration = {} } = {}) {
  const active = Boolean(enabled) && dischargeMode === 'authority-discharge-limit';
  const effectiveAreaHa = Number(weightedCmAreaM2) / 10000;
  const authority = Number(authorityLimitLs);
  const dryWeather = Number(dryWeatherFlowLs);
  const upstreamThrottle = Number(upstreamThrottleFlowLs);
  const availableRainThrottleLs = authority - dryWeather - upstreamThrottle;
  const throttleRainShareLsHa = effectiveAreaHa > 0 ? availableRainThrottleLs / effectiveAreaHa : NaN;
  const rainSeries = normalizeRetentionRainSeries(rainByDuration);
  const errors = [];
  if (active && !(effectiveAreaHa > 0)) errors.push('Die abflusswirksame Fläche Au muss größer 0 ha sein.');
  if (active && !(authority > 0)) errors.push('Die behördliche Einleitungsbegrenzung muss größer 0 l/s sein.');
  if (active && !(availableRainThrottleLs >= 0)) errors.push('Der für Regenabfluss verfügbare Drosselabfluss ist negativ.');
  if (active && !(Number(surchargeFactorFz) > 0)) errors.push('Der Zuschlagsfaktor fz muss größer 0 sein.');
  if (active && !(Number(reductionFactorFa) > 0)) errors.push('Der Abminderungsfaktor fA muss größer 0 sein.');
  if (active && !rainSeries.length) errors.push('Für das einfache Verfahren sind geprüfte Regenspenden je Dauerstufe erforderlich.');
  const durationResults = active && !errors.length
    ? rainSeries.map(item => calculateDwa117Duration({ ...item, throttleRainShareLsHa, surchargeFactorFz: Number(surchargeFactorFz), reductionFactorFa: Number(reductionFactorFa), effectiveAreaHa }))
    : [];
  const governing = maxDurationResult(durationResults.map(item => ({ ...item, valueM3: item.volumeM3 })));
  return Object.freeze({
    active,
    calculated: active && errors.length === 0 && durationResults.length > 0,
    effectiveAreaHa,
    authorityLimitLs: authority,
    dryWeatherFlowLs: dryWeather,
    upstreamThrottleFlowLs: upstreamThrottle,
    availableRainThrottleLs,
    throttleRainShareLsHa: Number.isFinite(throttleRainShareLsHa) ? throttleRainShareLsHa : null,
    surchargeFactorFz: Number(surchargeFactorFz) || 0,
    reductionFactorFa: Number(reductionFactorFa) || 0,
    durationResults: Object.freeze(durationResults),
    governing: governing ? Object.freeze({ ...governing, volumeM3: governing.valueM3 }) : null,
    errors: Object.freeze(errors)
  });
}

export function calculate(state = {}) {
  const surfaces = Array.isArray(state.surfaces) ? state.surfaces : [];
  const validated = surfaces.map(surface => ({ surface, validation: validateSurface(surface) }));
  const valid = validated.filter(item => item.validation.valid);
  const categoryOf = surface => surface.category ?? surface.group;
  const sum = category => valid.filter(item => categoryOf(item.surface) === category).reduce((acc, item) => acc + item.validation.area, 0);
  const weighted = key => valid.reduce((acc, item) => acc + item.validation.area * item.validation[key], 0);
  const totalArea = valid.reduce((acc, item) => acc + item.validation.area, 0);
  const sealedArea = valid.reduce((acc, item) => acc + (isSealedSurface(item.surface) ? item.validation.area : 0), 0);
  const criticalArea = valid.reduce((acc, item) => acc + (isCriticalSurface(item.surface) ? item.validation.area : 0), 0);
  const sealedShare = totalArea > 0 ? sealedArea / totalArea : 0;
  const criticalShare = totalArea > 0 ? criticalArea / totalArea : 0;
  const invalidCount = validated.length - valid.length;
  const duplicateSources = surfaces.map(item => item.sourceId).filter(Boolean).filter((value, index, all) => all.indexOf(value) !== index);
  const automaticDurationMinutes = automaticRainDuration(state.meanSlopePercent, sealedShare);
  const requestedManualDuration = Number(state.manualRainDuration);
  const manualReason = String(state.manualRainDurationReason || '').trim();
  const manualRequested = state.rainDurationMode === 'manual';
  const manualValid = manualRequested && VALID_DURATIONS.has(requestedManualDuration) && Boolean(manualReason);
  const governingDurationMinutes = manualValid ? requestedManualDuration : automaticDurationMinutes;
  const rainErrors = validateRainInputs(state, governingDurationMinutes);
  const rD2 = rainValue(state, 2, governingDurationMinutes);
  const weightedCsArea = weighted('cs');
  const weightedCmArea = weighted('cm');
  const requiredRainFlowLs = rD2 > 0 ? rD2 * weightedCsArea / 10000 : 0;
  const slopePercent = resolvePipeSlopePercent(state);

  const dischargeMode = VALID_DISCHARGE_MODES.has(state.dischargeMode) ? state.dischargeMode : 'table-existing-pipe';
  let discharge = null;
  const dischargeErrors = [];
  if (dischargeMode === 'table-existing-pipe') {
    discharge = lookupFullFlow(state.pipeNominalDiameterDn, slopePercent);
    if (!discharge) dischargeErrors.push('Für die gewählte Kombination aus DN und Gefälle ist kein exakter Tabellenwert hinterlegt.');
  } else if (dischargeMode === 'table-size-pipe') {
    if (!(requiredRainFlowLs > 0)) dischargeErrors.push('Für die Dimensionierung muss zunächst ein erforderlicher Regenwasserabfluss größer 0 vorliegen.');
    else discharge = sizePipe(requiredRainFlowLs, slopePercent);
    if (requiredRainFlowLs > 0 && !discharge) dischargeErrors.push('Für das gewählte Gefälle konnte innerhalb des Tabellenumfangs keine ausreichende Nennweite bestimmt werden.');
  } else if (dischargeMode === 'manual-full-flow') {
    const qFullLs = toNumber(state.manualFullFlowLs);
    if (!(qFullLs > 0)) dischargeErrors.push('Der manuell vorgegebene Vollfüllungsabfluss muss größer 0 sein.');
    else discharge = { qFullLs, velocityMs: null, tableReference: String(state.manualFullFlowSource || '').trim() || 'Manuelle Vorgabe', lookupMode: 'manual', dn: null, slopePercent: null };
  } else {
    const qLimitLs = toNumber(state.authorityLimitLs);
    if (!(qLimitLs > 0)) dischargeErrors.push('Die behördliche Einleitungsbegrenzung muss größer 0 sein.');
    else discharge = { qLimitLs, qFullLs: null, velocityMs: null, tableReference: String(state.authorityReference || '').trim() || 'Behördliche Vorgabe', lookupMode: 'authority-limit', dn: null, slopePercent: null };
  }

  const availableFlowLs = dischargeMode === 'authority-discharge-limit' ? Number(discharge?.qLimitLs || 0) : Number(discharge?.qFullLs || 0);
  const utilizationPercent = availableFlowLs > 0 ? requiredRainFlowLs / availableFlowLs * 100 : 0;

  const equation20 = calculateFloodingEquation20({ durationMinutes: governingDurationMinutes, rain30: rainValue(state, 30, governingDurationMinutes), rain2: rD2, totalAreaM2: totalArea, weightedCsAreaM2: weightedCsArea });
  const equation21ByDuration = FLOODING_DURATIONS.map(durationMinutes => calculateFloodingEquation21({ durationMinutes, rain30: rainValue(state, 30, durationMinutes), totalAreaM2: totalArea, dischargeLs: availableFlowLs }));
  const equation21Governing = maxDurationResult(equation21ByDuration);
  const floodingCandidates = [
    equation20.valid ? { source: 'equation-20', durationMinutes: equation20.durationMinutes, valueM3: equation20.valueM3 } : null,
    equation21Governing ? { source: 'equation-21', durationMinutes: equation21Governing.durationMinutes, valueM3: equation21Governing.valueM3 } : null
  ].filter(Boolean);
  const governingFlooding = floodingCandidates.length ? floodingCandidates.reduce((max, item) => item.valueM3 > max.valueM3 ? item : max, floodingCandidates[0]) : null;
  const floodingWarnings = [
    ...(equation20.clampedToZero ? ['Gleichung (20) ergab rechnerisch ein negatives Volumen und wurde auf 0 m³ begrenzt.'] : []),
    ...equation21ByDuration.filter(item => item.clampedToZero).map(item => `Gleichung (21) für ${item.durationMinutes} min ergab rechnerisch ein negatives Volumen und wurde auf 0 m³ begrenzt.`),
    ...(criticalShare > 0.7 ? ['Der kritische Flächenanteil liegt über 70 %. Die zusätzliche Prüfung der Notentwässerung mit r(5,100) ist erforderlich.'] : []),
    ...(dischargeMode === 'authority-discharge-limit' ? ['Bei behördlicher Einleitungsbegrenzung ist zusätzlich der Rückhaltenachweis nach DWA-A 117 zu führen.'] : [])
  ];

  const retention = calculateDwa117SimpleProcedure({
    enabled: state.retentionEnabled,
    dischargeMode,
    authorityLimitLs: toNumber(state.authorityLimitLs),
    weightedCmAreaM2: weightedCmArea,
    dryWeatherFlowLs: toNumber(state.retentionDryWeatherFlowLs),
    upstreamThrottleFlowLs: toNumber(state.retentionUpstreamThrottleFlowLs),
    surchargeFactorFz: toNumber(state.retentionSurchargeFactorFz),
    reductionFactorFa: toNumber(state.retentionReductionFactorFa),
    rainByDuration: state.retentionRainByDuration
  });

  return Object.freeze({
    status: 'flooding-verification-ready', schemaVersion: Number(state.schemaVersion || 2),
    surfaceCount: surfaces.length, validSurfaceCount: valid.length, invalidSurfaceCount: invalidCount,
    roofArea: sum('roof'), propertyArea: sum('property'), totalArea, sealedArea, sealedShare, criticalArea, criticalShare,
    weightedCsArea, weightedCmArea, averageCs: totalArea > 0 ? weightedCsArea / totalArea : 0,
    averageCm: totalArea > 0 ? weightedCmArea / totalArea : 0, duplicateSourceCount: new Set(duplicateSources).size,
    automaticDurationMinutes, governingDurationMinutes, durationSource: manualValid ? 'manual' : 'automatic', manualDurationRequested: manualRequested, manualDurationValid: manualValid,
    rain: Object.freeze({ r2: Object.freeze({ 5: rainValue(state, 2, 5), 10: rainValue(state, 2, 10), 15: rainValue(state, 2, 15) }), r30: Object.freeze({ 5: rainValue(state, 30, 5), 10: rainValue(state, 30, 10), 15: rainValue(state, 30, 15) }), r100Duration5: rainValue(state, 100, 5), source: Object.freeze({ dataset: String(state.rainSourceDataset || '').trim(), location: String(state.rainSourceLocation || '').trim(), version: String(state.rainSourceVersion || '').trim(), entryMode: state.rainEntryMode || 'manual' }) }),
    requiredRainFlowLs, dischargeMode, slopePercent, discharge: discharge ? Object.freeze(discharge) : null, availableFlowLs, utilizationPercent,
    dischargeAdequate: availableFlowLs > 0 && availableFlowLs >= requiredRainFlowLs,
    flooding: Object.freeze({ equation20, equation21ByDuration: Object.freeze(equation21ByDuration), equation21Governing: equation21Governing ? Object.freeze(equation21Governing) : null, governing: governingFlooding ? Object.freeze(governingFlooding) : null, dischargeSource: dischargeMode === 'authority-discharge-limit' ? 'authority-limit' : discharge?.lookupMode || null }),
    retention,
    rainInputValid: rainErrors.length === 0,
    calculationAvailable: rainErrors.length === 0 && dischargeErrors.length === 0 && valid.length > 0,
    floodingCalculationAvailable: rainErrors.length === 0 && dischargeErrors.length === 0 && valid.length > 0 && equation20.valid && Boolean(equation21Governing),
    warnings: [
      ...(invalidCount ? [`${invalidCount} Fläche(n) sind ungültig und werden nicht summiert.`] : []),
      ...(duplicateSources.length ? ['Mehrfach importierte Quell-IDs wurden erkannt.'] : []),
      ...(manualRequested && !manualValid ? ['Die manuelle Regendauer ist erst mit einer zulässigen Dauer und einer Begründung wirksam. Bis dahin wird die automatische Dauer verwendet.'] : []),
      ...rainErrors, ...dischargeErrors, ...floodingWarnings,
      ...(retention.active ? retention.errors : []),
      ...(availableFlowLs > 0 && availableFlowLs < requiredRainFlowLs ? ['Der verfügbare Abfluss ist kleiner als der erforderliche Regenwasserabfluss.'] : [])
    ]
  });
}

export default calculate;
