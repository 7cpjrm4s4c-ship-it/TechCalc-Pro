const toNumber = value => Number(String(value ?? '').replace(',', '.'));

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

export function calculate(state = {}) {
  const surfaces = Array.isArray(state.surfaces) ? state.surfaces : [];
  const validated = surfaces.map(surface => ({ surface, validation: validateSurface(surface) }));
  const valid = validated.filter(item => item.validation.valid);
  const sum = category => valid.filter(item => item.surface.category === category).reduce((acc, item) => acc + item.validation.area, 0);
  const weighted = key => valid.reduce((acc, item) => acc + item.validation.area * item.validation[key], 0);
  const totalArea = valid.reduce((acc, item) => acc + item.validation.area, 0);
  const invalidCount = validated.length - valid.length;
  const duplicateSources = surfaces.map(item => item.sourceId).filter(Boolean).filter((value, index, all) => all.indexOf(value) !== index);

  return Object.freeze({
    status: 'surface-management-ready',
    schemaVersion: Number(state.schemaVersion || 2),
    surfaceCount: surfaces.length,
    validSurfaceCount: valid.length,
    invalidSurfaceCount: invalidCount,
    roofArea: sum('roof'),
    propertyArea: sum('property'),
    totalArea,
    weightedCsArea: weighted('cs'),
    weightedCmArea: weighted('cm'),
    averageCs: totalArea > 0 ? weighted('cs') / totalArea : 0,
    averageCm: totalArea > 0 ? weighted('cm') / totalArea : 0,
    duplicateSourceCount: new Set(duplicateSources).size,
    calculationAvailable: false,
    warnings: [
      ...(invalidCount ? [`${invalidCount} Fläche(n) sind ungültig und werden nicht summiert.`] : []),
      ...(duplicateSources.length ? ['Mehrfach importierte Quell-IDs wurden erkannt.'] : []),
      'Die normative Fachberechnung wird in Phase 47C.4 bis 47C.6 ergänzt.'
    ]
  });
}

export default calculate;
