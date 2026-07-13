import { areaTypes, hydraulicTables, dnOrder } from '../rainwater/tables.js';

const toNumber = value => Number(String(value ?? '').replace(',', '.'));
const typeById = new Map(areaTypes.map(item => [item.id, item]));
const VALID_DURATIONS = new Set([5, 10, 15]);
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

export function calculate(state = {}) {
  const surfaces = Array.isArray(state.surfaces) ? state.surfaces : [];
  const validated = surfaces.map(surface => ({ surface, validation: validateSurface(surface) }));
  const valid = validated.filter(item => item.validation.valid);
  const categoryOf = surface => surface.category ?? surface.group;
  const sum = category => valid.filter(item => categoryOf(item.surface) === category).reduce((acc, item) => acc + item.validation.area, 0);
  const weighted = key => valid.reduce((acc, item) => acc + item.validation.area * item.validation[key], 0);
  const totalArea = valid.reduce((acc, item) => acc + item.validation.area, 0);
  const sealedArea = valid.reduce((acc, item) => acc + (isSealedSurface(item.surface) ? item.validation.area : 0), 0);
  const sealedShare = totalArea > 0 ? sealedArea / totalArea : 0;
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

  return Object.freeze({
    status: 'discharge-verification-ready', schemaVersion: Number(state.schemaVersion || 2),
    surfaceCount: surfaces.length, validSurfaceCount: valid.length, invalidSurfaceCount: invalidCount,
    roofArea: sum('roof'), propertyArea: sum('property'), totalArea, sealedArea, sealedShare,
    weightedCsArea, weightedCmArea: weighted('cm'), averageCs: totalArea > 0 ? weightedCsArea / totalArea : 0,
    averageCm: totalArea > 0 ? weighted('cm') / totalArea : 0, duplicateSourceCount: new Set(duplicateSources).size,
    automaticDurationMinutes, governingDurationMinutes, durationSource: manualValid ? 'manual' : 'automatic', manualDurationRequested: manualRequested, manualDurationValid: manualValid,
    rain: Object.freeze({ r2: Object.freeze({ 5: rainValue(state, 2, 5), 10: rainValue(state, 2, 10), 15: rainValue(state, 2, 15) }), r30: Object.freeze({ 5: rainValue(state, 30, 5), 10: rainValue(state, 30, 10), 15: rainValue(state, 30, 15) }), r100Duration5: rainValue(state, 100, 5), source: Object.freeze({ dataset: String(state.rainSourceDataset || '').trim(), location: String(state.rainSourceLocation || '').trim(), version: String(state.rainSourceVersion || '').trim(), entryMode: state.rainEntryMode || 'manual' }) }),
    requiredRainFlowLs, dischargeMode, slopePercent, discharge: discharge ? Object.freeze(discharge) : null, availableFlowLs, utilizationPercent,
    dischargeAdequate: availableFlowLs > 0 && availableFlowLs >= requiredRainFlowLs,
    rainInputValid: rainErrors.length === 0,
    calculationAvailable: rainErrors.length === 0 && dischargeErrors.length === 0 && valid.length > 0,
    warnings: [
      ...(invalidCount ? [`${invalidCount} Fläche(n) sind ungültig und werden nicht summiert.`] : []),
      ...(duplicateSources.length ? ['Mehrfach importierte Quell-IDs wurden erkannt.'] : []),
      ...(manualRequested && !manualValid ? ['Die manuelle Regendauer ist erst mit einer zulässigen Dauer und einer Begründung wirksam. Bis dahin wird die automatische Dauer verwendet.'] : []),
      ...rainErrors, ...dischargeErrors,
      ...(availableFlowLs > 0 && availableFlowLs < requiredRainFlowLs ? ['Der verfügbare Abfluss ist kleiner als der erforderliche Regenwasserabfluss.'] : [])
    ]
  });
}

export default calculate;
