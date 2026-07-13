import { areaTypes } from '../rainwater/tables.js';

const toNumber = value => Number(String(value ?? '').replace(',', '.'));
const typeById = new Map(areaTypes.map(item => [item.id, item]));
const VALID_DURATIONS = new Set([5, 10, 15]);

export function validateSurface(surface = {}) {
  const area = toNumber(surface.area);
  const cs = toNumber(surface.cs);
  const cm = toNumber(surface.cm);
  const errors = [];
  if (!(area > 0)) errors.push('Fläche muss größer 0 m² sein.');
  if (!(cs >= 0 && cs <= 1)) errors.push('Cₛ muss zwischen 0 und 1 liegen.');
  if (!(cm >= 0 && cm <= 1)) errors.push('Cₘ muss zwischen 0 und 1 liegen.');
  if (!['roof', 'property'].includes(surface.category)) errors.push('Flächengruppe ist ungültig.');
  return { valid: errors.length === 0, errors, area, cs, cm };
}

export function isSealedSurface(surface = {}) {
  if (typeof surface.isSealed === 'boolean') return surface.isSealed;
  const type = typeById.get(surface.areaType);
  if (typeof type?.isSealed === 'boolean') return type.isSealed;
  return surface.category === 'roof';
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

export function calculate(state = {}) {
  const surfaces = Array.isArray(state.surfaces) ? state.surfaces : [];
  const validated = surfaces.map(surface => ({ surface, validation: validateSurface(surface) }));
  const valid = validated.filter(item => item.validation.valid);
  const sum = category => valid.filter(item => item.surface.category === category).reduce((acc, item) => acc + item.validation.area, 0);
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

  return Object.freeze({
    status: 'rain-duration-ready',
    schemaVersion: Number(state.schemaVersion || 2),
    surfaceCount: surfaces.length,
    validSurfaceCount: valid.length,
    invalidSurfaceCount: invalidCount,
    roofArea: sum('roof'),
    propertyArea: sum('property'),
    totalArea,
    sealedArea,
    sealedShare,
    weightedCsArea: weighted('cs'),
    weightedCmArea: weighted('cm'),
    averageCs: totalArea > 0 ? weighted('cs') / totalArea : 0,
    averageCm: totalArea > 0 ? weighted('cm') / totalArea : 0,
    duplicateSourceCount: new Set(duplicateSources).size,
    automaticDurationMinutes,
    governingDurationMinutes,
    durationSource: manualValid ? 'manual' : 'automatic',
    manualDurationRequested: manualRequested,
    manualDurationValid: manualValid,
    rain: Object.freeze({
      r2: Object.freeze({ 5: rainValue(state, 2, 5), 10: rainValue(state, 2, 10), 15: rainValue(state, 2, 15) }),
      r30: Object.freeze({ 5: rainValue(state, 30, 5), 10: rainValue(state, 30, 10), 15: rainValue(state, 30, 15) }),
      r100Duration5: rainValue(state, 100, 5),
      source: Object.freeze({
        dataset: String(state.rainSourceDataset || '').trim(),
        location: String(state.rainSourceLocation || '').trim(),
        version: String(state.rainSourceVersion || '').trim(),
        entryMode: state.rainEntryMode || 'manual'
      })
    }),
    rainInputValid: rainErrors.length === 0,
    calculationAvailable: false,
    warnings: [
      ...(invalidCount ? [`${invalidCount} Fläche(n) sind ungültig und werden nicht summiert.`] : []),
      ...(duplicateSources.length ? ['Mehrfach importierte Quell-IDs wurden erkannt.'] : []),
      ...(manualRequested && !manualValid ? ['Die manuelle Regendauer ist erst mit einer zulässigen Dauer und einer Begründung wirksam. Bis dahin wird die automatische Dauer verwendet.'] : []),
      ...rainErrors,
      'Die normative Fachberechnung wird in Phase 47C.4 bis 47C.6 ergänzt.'
    ]
  });
}

export default calculate;
