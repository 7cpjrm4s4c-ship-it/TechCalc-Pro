import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { buildFloodingReportDto, FLOODING_REPORT_DTO_VERSION } from '../js/modules/flooding-verification/reportAdapter.js';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const state = {
  schemaVersion: 2,
  projectName: 'Projekt A',
  dischargeMode: 'authority-discharge-limit',
  authorityName: 'Behörde',
  rainSourceDataset: 'KOSTRA-DWD 2020',
  rainSourceVersion: '2020',
  surfaces: [{ id: 's1', name: 'Dach Nord', area: 100, cs: 1, cm: 0.9, source: 'rainwater', imported: true }]
};
const calculation = {
  schemaVersion: 2,
  totalArea: 100,
  sealedArea: 100,
  sealedShare: 1,
  criticalArea: 100,
  weightedCsArea: 100,
  requiredRainFlowLs: 12.5,
  availableFlowLs: 10,
  utilizationPercent: 125,
  dischargeAdequate: false,
  dischargeMode: 'authority-discharge-limit',
  discharge: { dn: 'DN 100', slopePercent: 1, tableReference: 'Tabelle' },
  flooding: { equation20: { valueM3: 5 }, equation21ByDuration: [{ durationMinutes: 10, valueM3: 6 }], governing: { source: 'equation-21', valueM3: 6 } },
  retention: { active: true, calculated: true, surchargeFactorFz: 1.2, reductionFactorFa: 0.9, durationResults: [{ durationMinutes: 15, volumeM3: 8 }], governing: { volumeM3: 8 } },
  combinedStorage: { planningVolumeM3: 8, dinVolumeM3: 6, dwaVolumeM3: 8, governingSource: 'dwa-a-117', governingLabel: 'DWA-A 117', status: 'complete' }
};
const resultModel = {
  diagnostic: { status: 'warning', statusLabel: 'Warnung', statusReason: 'Prüfen', counts: { warnings: 1 }, items: [{ type: 'warning', message: 'Abfluss unzureichend' }] },
  interpretation: { summary: 'DWA maßgebend', discharge: 'unzureichend', dwa: 'vollständig', normative: 'Nachweis', recommendation: 'Speicher vorsehen' },
  groups: [{ title: 'Nachweisstatus', rows: [{ label: 'Status', value: 'Warnung' }] }]
};

test('report DTO is complete, deterministic and JSON serializable', () => {
  const dto = buildFloodingReportDto({ state, calculation, resultModel, generatedAt: '2026-07-17T00:00:00.000Z' });
  assert.equal(dto.metadata.dtoVersion, FLOODING_REPORT_DTO_VERSION);
  assert.equal(dto.metadata.dtoType, 'techcalc.flooding-verification.report');
  for (const key of ['metadata','projectReference','summary','surfaces','rainfall','hydraulics','floodingVerification','retentionVerification','durationComparison','diagnostics','interpretation','sources']) assert.ok(key in dto, key);
  assert.equal(dto.summary.planningVolumeM3, calculation.combinedStorage.planningVolumeM3);
  assert.equal(dto.floodingVerification.governing.valueM3, calculation.flooding.governing.valueM3);
  assert.equal(dto.retentionVerification.governing.volumeM3, calculation.retention.governing.volumeM3);
  assert.equal(dto.surfaces[0].imported, true);
  assert.doesNotThrow(() => JSON.stringify(dto));
  assert.deepEqual(JSON.parse(JSON.stringify(dto)).summary, dto.summary);
});

test('report adapter has no DOM, PDF drawing or duplicated calculation dependency', () => {
  const source = read('js/modules/flooding-verification/reportAdapter.js');
  assert.doesNotMatch(source, /document\.|querySelector|window\.|canvas|innerHTML/);
  assert.doesNotMatch(source, /pdfLayout|GlobalPdfReport|calculateBase|retentionFactors/);
});

test('platform and PDF mapper prefer registered typed report DTOs with legacy fallback', () => {
  const runtime = read('js/platform/moduleRuntime/index.js');
  const mapper = read('js/core/pdf/pdfDataMapping.js');
  const moduleIndex = read('js/modules/flooding-verification/index.js');
  assert.match(runtime, /report,/);
  assert.match(moduleIndex, /buildFloodingReportDto/);
  assert.match(moduleIndex, /report,/);
  assert.match(mapper, /typeof module\?\.report === 'function'/);
  assert.match(mapper, /reportSource: 'typed-dto'/);
  assert.match(mapper, /reportSource: 'legacy-dom'/);
});
