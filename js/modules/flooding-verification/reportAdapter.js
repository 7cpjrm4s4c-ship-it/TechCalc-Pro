import config from './config.js';
import { FLOODING_VERIFICATION_SCHEMA_VERSION } from './state.js';

export const FLOODING_REPORT_DTO_VERSION = 1;

const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
const array = value => Array.isArray(value) ? value : [];
const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};

function mapSurface(surface = {}, index = 0) {
  return Object.freeze({
    id: surface.id ?? null,
    name: surface.name || surface.surfaceName || `Fläche ${index + 1}`,
    category: surface.category || surface.surfaceCategory || '',
    areaType: surface.areaType || surface.surfaceAreaType || '',
    areaM2: surface.area ?? surface.areaM2 ?? surface.areaSize ?? null,
    runoffCoefficientCs: surface.cs ?? surface.runoffCoefficientCs ?? null,
    meanRunoffCoefficientCm: surface.cm ?? surface.meanRunoffCoefficientCm ?? null,
    weightedCsAreaM2: surface.weightedCsAreaM2 ?? null,
    weightedCmAreaM2: surface.weightedCmAreaM2 ?? null,
    source: surface.source || surface.origin || 'local',
    imported: Boolean(surface.imported || surface.source === 'rainwater'),
    snapshot: clone(surface.snapshot || null)
  });
}

function mapDiagnostics(resultModel = {}) {
  const diagnostic = object(resultModel.diagnostic);
  const items = array(diagnostic.items || resultModel.diagnostics).map(item => Object.freeze({
    type: item.type || item.level || item.severity || 'hint',
    code: item.code || '',
    title: item.title || item.label || '',
    message: item.message || item.text || item.value || '',
    recommendation: item.recommendation || ''
  }));
  return Object.freeze({
    status: diagnostic.status || '',
    statusLabel: diagnostic.statusLabel || '',
    statusReason: diagnostic.statusReason || '',
    counts: Object.freeze({ ...object(diagnostic.counts) }),
    items: Object.freeze(items)
  });
}

/**
 * Builds the module-owned, layout-neutral report DTO.
 * The adapter maps existing state/calculation/result models only. It does not
 * query the DOM, format PDF commands or reproduce engineering calculations.
 */
export function buildFloodingReportDto({ state = {}, calculation = {}, resultModel = {}, generatedAt = new Date().toISOString() } = {}) {
  const flooding = object(calculation.flooding);
  const retention = object(calculation.retention);
  const combinedStorage = object(calculation.combinedStorage);
  const discharge = object(calculation.discharge);
  const interpretation = object(resultModel.interpretation);

  const dto = {
    metadata: {
      dtoType: 'techcalc.flooding-verification.report',
      dtoVersion: FLOODING_REPORT_DTO_VERSION,
      moduleId: config.id || 'flooding-verification',
      moduleTitle: config.title || 'Überflutungsnachweis',
      schemaVersion: calculation.schemaVersion || state.schemaVersion || FLOODING_VERIFICATION_SCHEMA_VERSION,
      appVersion: '1.4.0-dev.2',
      generatedAt
    },
    projectReference: {
      projectName: state.projectName || '',
      authorityName: state.authorityName || '',
      authorityReference: state.authorityReference || '',
      authorityDate: state.authorityDate || '',
      authoritySourceNote: state.authoritySourceNote || ''
    },
    summary: {
      status: combinedStorage.status || '',
      planningVolumeM3: combinedStorage.planningVolumeM3 ?? null,
      dinVolumeM3: combinedStorage.dinVolumeM3 ?? null,
      dwaVolumeM3: combinedStorage.dwaVolumeM3 ?? null,
      governingSource: combinedStorage.governingSource || '',
      governingLabel: combinedStorage.governingLabel || '',
      governingReason: combinedStorage.governingReason || '',
      rule: combinedStorage.rule || ''
    },
    surfaces: array(state.surfaces).map(mapSurface),
    rainfall: {
      entryMode: state.rainEntryMode || '',
      durationMode: state.rainDurationMode || '',
      manualDurationMinutes: state.manualRainDuration || '',
      manualDurationReason: state.manualRainDurationReason || '',
      automaticDurationMinutes: calculation.automaticDurationMinutes ?? null,
      governingDurationMinutes: calculation.governingDurationMinutes ?? null,
      sourceDataset: state.rainSourceDataset || '',
      sourceLocation: state.rainSourceLocation || '',
      sourceVersion: state.rainSourceVersion || '',
      r2ByDuration: { 5: state.rainR2Duration5 || '', 10: state.rainR2Duration10 || '', 15: state.rainR2Duration15 || '' },
      r30ByDuration: { 5: state.rainR30Duration5 || '', 10: state.rainR30Duration10 || '', 15: state.rainR30Duration15 || '' },
      r100ByDuration: { 5: state.rainR100Duration5 || '' },
      valid: Boolean(calculation.rainInputValid)
    },
    hydraulics: {
      dischargeMode: calculation.dischargeMode || state.dischargeMode || '',
      requiredRainFlowLs: calculation.requiredRainFlowLs ?? null,
      availableFlowLs: calculation.availableFlowLs ?? null,
      utilizationPercent: calculation.utilizationPercent ?? null,
      adequate: Boolean(calculation.dischargeAdequate),
      pipeNominalDiameterDn: discharge.dn || state.pipeNominalDiameterDn || '',
      pipeSlopePercent: discharge.slopePercent ?? state.pipeSlopePercent ?? null,
      tableReference: discharge.tableReference || state.manualFullFlowSource || '',
      authorityLimitLs: state.authorityLimitLs || ''
    },
    floodingVerification: {
      equation20: clone(flooding.equation20 || {}),
      equation21ByDuration: clone(flooding.equation21ByDuration || []),
      equation21Governing: clone(flooding.equation21Governing || {}),
      governing: clone(flooding.governing || {}),
      totalAreaM2: calculation.totalArea ?? null,
      sealedAreaM2: calculation.sealedArea ?? null,
      sealedShare: calculation.sealedShare ?? null,
      criticalAreaM2: calculation.criticalArea ?? null,
      weightedCsAreaM2: calculation.weightedCsArea ?? null
    },
    retentionVerification: {
      active: Boolean(retention.active),
      calculated: Boolean(retention.calculated),
      requestedRecurrenceFrequencyPerYear: retention.requestedRecurrenceFrequencyPerYear ?? null,
      effectiveRecurrenceFrequencyPerYear: retention.effectiveRecurrenceFrequencyPerYear ?? null,
      automaticTwoYearFallback: Boolean(retention.automaticTwoYearFallback),
      surchargeFactorFz: retention.surchargeFactorFz ?? null,
      reductionFactorFa: retention.reductionFactorFa ?? null,
      throttleRainShareLsHa: retention.throttleRainShareLsHa ?? null,
      durationResults: clone(retention.durationResults || []),
      governing: clone(retention.governing || {}),
      factorSource: clone(retention.factorSource || {})
    },
    durationComparison: {
      din: clone(flooding.equation21ByDuration || []),
      dwa: clone(retention.durationResults || [])
    },
    diagnostics: mapDiagnostics(resultModel),
    interpretation: {
      summary: interpretation.summary || '',
      discharge: interpretation.discharge || '',
      dwa: interpretation.dwa || '',
      normative: interpretation.normative || '',
      recommendation: interpretation.recommendation || ''
    },
    resultGroups: clone(resultModel.groups || []),
    sources: [
      { id: 'DIN-1986-100', title: 'DIN 1986-100', role: 'Überflutungsnachweis' },
      { id: 'DWA-A-117', title: 'DWA-A 117', role: 'Rückhalteraumnachweis' },
      { id: 'KOSTRA-DWD', title: state.rainSourceDataset || 'KOSTRA-DWD', role: 'Regenspenden', version: state.rainSourceVersion || '' }
    ]
  };

  return Object.freeze(dto);
}

export default buildFloodingReportDto;
