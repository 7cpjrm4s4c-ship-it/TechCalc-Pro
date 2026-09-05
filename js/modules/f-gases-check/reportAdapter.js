import config from './config.js';
import { F_GASES_SCHEMA_VERSION } from './state.js';
import { createFGasesSystemSnapshot } from '../../shared/fGasesSystemSnapshot.js';
import { buildFGasesResultModel } from './results.js';
export const F_GASES_REPORT_DTO_VERSION = 3;
const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
export function buildFGasesReportDto({ state = {}, calculation = {}, resultModel = null, generatedAt = new Date().toISOString() } = {}) {
  const reportResultModel = resultModel || buildFGasesResultModel(state, calculation);
  return Object.freeze({
    metadata: { dtoType: 'techcalc.f-gases-check.report', dtoVersion: F_GASES_REPORT_DTO_VERSION, moduleId: config.id, moduleTitle: config.title, reportHeading: 'Informationsblatt', schemaVersion: state.schemaVersion ?? F_GASES_SCHEMA_VERSION, generatedAt },
    systemSnapshot: createFGasesSystemSnapshot(state, { generatedAt }),
    summary: { status: calculation.status || 'not-specified', gwp: calculation.gwp ?? null, chargeKg: calculation.chargeKg ?? null, co2EquivalentTonnes: calculation.co2EquivalentTonnes ?? null, checks: clone(calculation.checks || {}) },
    service: clone(calculation.serviceDetails || {}),
    leakCheck: clone(calculation.leakCheckDetails || {}),
    documentation: clone(calculation.documentationDetails || {}),
    operatorDuties: clone(calculation.operatorDutyDetails || {}),
    applicableRegulations: clone((calculation.applicableRegulations || []).map(rule => ({ id: rule.id, legalSource: rule.legalSource, validFrom: rule.validFrom, validUntil: rule.validUntil || null, messageKey: rule.messageKey }))),
    resultGroups: clone(reportResultModel.groups || []), notices: clone(reportResultModel.notices || []), dataVersions: clone(calculation.dataVersions || state.dataVersions || {}),
    sources: [
      { id: 'EU-FGAS', title: 'Verordnung (EU) 2024/573', role: 'EU-Rechtsgrundlage' },
      { id: 'DE-CHEMG', title: 'Chemikaliengesetz in der für Version 1.5.0 dokumentierten Fassung', role: 'Deutsche Ergänzung' },
      { id: 'DE-CHEMKLIMA', title: 'Chemikalien-Klimaschutzverordnung', role: 'Deutsche Durchführung' },
      { id: 'UBA-GWP-2026-03', title: 'UBA Treibhauspotentiale, Stand März 2026', role: 'GWP-Daten' }
    ]
  });
}
export default buildFGasesReportDto;
