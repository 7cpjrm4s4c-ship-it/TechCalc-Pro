export function calculate(state = {}) {
  const surfaces = Array.isArray(state.surfaces) ? state.surfaces : [];
  const totalArea = surfaces.reduce((sum, surface) => sum + Number(surface?.area || 0), 0);
  return Object.freeze({
    status: 'infrastructure-ready',
    schemaVersion: Number(state.schemaVersion || 2),
    surfaceCount: surfaces.length,
    totalArea,
    calculationAvailable: false,
    warnings: ['Die normative Fachberechnung wird in Phase 47C.4 bis 47C.6 ergänzt.']
  });
}

export default calculate;
