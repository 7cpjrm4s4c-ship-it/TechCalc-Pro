export const RAINWATER_REPORT_DTO_VERSION = 1;

const array = value => Array.isArray(value) ? value : [];
const finite = value => {
  if (value == null || String(value).trim() === '') return null;
  const normalized = typeof value === 'string' ? value.replace(',', '.') : value;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
};

function mapSurface(surface = {}, index = 0) {
  const emergency = surface.emergency || {};
  return Object.freeze({
    id: surface.id || null,
    name: surface.name || `Fläche ${index + 1}`,
    mode: surface.surfaceMode || '',
    areaType: surface.areaType || surface.base?.id || '',
    areaTypeLabel: surface.base?.name || '',
    areaM2: finite(surface.area),
    runoffCoefficientCs: finite(surface.cs),
    meanRunoffCoefficientCm: finite(surface.cm),
    designRainIntensity: finite(surface.rdt),
    hundredYearRainIntensity: finite(surface.r100),
    rainwaterFlowLs: finite(surface.qr),
    drain: Object.freeze({
      manufacturer: surface.drainManufacturer || '',
      manufacturerDefined: Boolean(surface.drainManufacturerDefined),
      nominalDiameter: surface.drainSize || '',
      capacityLs: finite(surface.drainCapacity),
      headMm: finite(surface.drainHead),
      requiredCount: finite(surface.requiredDrains)
    }),
    stack: Object.freeze({
      count: finite(surface.stackCount),
      flowPerStackLs: finite(surface.qPerStack),
      nominalDiameter: surface.stackSelection?.dn || '',
      capacityLs: finite(surface.stackSelection?.capacity)
    }),
    collector: Object.freeze({
      nominalDiameter: surface.collectorSelection?.dn || '',
      capacityLs: finite(surface.collectorSelection?.capacity),
      fillRatio: surface.fillRatio || '',
      slopeCmM: surface.slopeCmM || ''
    }),
    emergency: Object.freeze({
      type: emergency.type || '',
      headMm: finite(emergency.head),
      widthMm: finite(emergency.width),
      diameterMm: finite(emergency.diameter),
      manufacturerDn: emergency.manufacturerDn || '',
      safetyFactor: finite(emergency.safetyFactor),
      baseFlowLs: finite(emergency.qNotBase),
      requiredFlowLs: finite(emergency.qNot),
      capacityLs: finite(emergency.capacity),
      requiredCount: finite(emergency.requiredCount),
      requiredWidthMm: finite(emergency.rectRequiredWidth)
    })
  });
}

function isSavedSurface(surface = {}) {
  return !surface.transient && String(surface.id ?? '') !== '__current_input__';
}

export function buildRainwaterReportDto({ state = {}, calculation = {}, generatedAt = new Date().toISOString() } = {}) {
  const surfaces = array(calculation.surfaces).filter(isSavedSurface).map(mapSurface);
  return Object.freeze({
    metadata: {
      dtoType: 'techcalc.rainwater.report',
      dtoVersion: RAINWATER_REPORT_DTO_VERSION,
      moduleId: 'rainwater',
      moduleTitle: 'Regenwasser',
      generatedAt
    },
    surfaces,
    warnings: array(calculation.warnings)
  });
}

export default buildRainwaterReportDto;
