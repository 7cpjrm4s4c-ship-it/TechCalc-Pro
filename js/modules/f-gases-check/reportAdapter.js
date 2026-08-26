import config from './config.js';
import { F_GASES_SCHEMA_VERSION } from './state.js';
import { createFGasesSystemSnapshot } from '../../shared/fGasesSystemSnapshot.js';

export const F_GASES_REPORT_DTO_VERSION = 1;

export function buildFGasesReportDto({ state = {}, calculation = {}, generatedAt = new Date().toISOString() } = {}) {
  return Object.freeze({
    metadata: {
      dtoType: 'techcalc.f-gases-check.report',
      dtoVersion: F_GASES_REPORT_DTO_VERSION,
      moduleId: config.id,
      moduleTitle: config.title,
      schemaVersion: state.schemaVersion ?? F_GASES_SCHEMA_VERSION,
      generatedAt
    },
    systemSnapshot: createFGasesSystemSnapshot(state, { generatedAt }),
    result: {
      status: calculation.status || 'not-specified',
      gwp: calculation.gwp ?? null,
      co2EquivalentTonnes: calculation.co2EquivalentTonnes ?? null,
      checks: { ...(calculation.checks || {}) }
    },
    dataVersions: { ...(calculation.dataVersions || state.dataVersions || {}) }
  });
}

export default buildFGasesReportDto;
