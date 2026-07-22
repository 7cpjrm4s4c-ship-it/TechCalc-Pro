import assert from 'node:assert/strict';
import { buildFloodingReportDto } from '../js/modules/flooding-verification/reportAdapter.js';
import { buildAuthorityChartModel } from '../js/core/pdf/authorityCharts.js';
import { applyAuthorityReportPolicy } from '../js/core/pdf/authorityReportPolicy.js';
import { buildAuthorityCorporateData } from '../js/core/pdf/authorityCorporateBlock.js';

const dto = buildFloodingReportDto({
  state: {
    surfaces: [{
      name: 'Dachfläche 1',
      category: 'roof',
      areaType: 'metal-roof',
      area: '125,5',
      cs: '0,9',
      cm: '0,8'
    }],
    rainSourceDataset: 'KOSTRA-DWD 2020',
    rainSourceVersion: '2020'
  },
  calculation: {},
  resultModel: {},
  generatedAt: '2026-07-18T08:15:00.000Z'
});

assert.equal(dto.surfaces[0].areaM2, 125.5);
assert.equal(dto.surfaces[0].runoffCoefficientCs, 0.9);
assert.equal(dto.surfaces[0].weightedCsAreaM2, 112.95);

const chartModel = buildAuthorityChartModel({
  summary: { governingSource: 'din-1986-100', governingLabel: 'DIN 1986-100', dinVolumeM3: 42 },
  durationComparison: {
    din: [
      { durationMinutes: 5, valueM3: 20 },
      { durationMinutes: 10, valueM3: 42 },
      { durationMinutes: 15, valueM3: 31 }
    ]
  },
  floodingVerification: {
    equation21Governing: { durationMinutes: 15, valueM3: 31 }
  }
});
assert.equal(chartModel.din[1].governing, true, 'Der größte DIN-Balken muss maßgebend markiert sein.');
assert.equal(chartModel.din[2].governing, false, 'Eine inkonsistente Dauerreferenz darf keinen kleineren Balken markieren.');

const sourceSection = applyAuthorityReportPolicy({
  title: '12. Quellen, Versionen und Nachweisidentität',
  rows: [
    ['DIN 1986-100', 'Überflutungsnachweis', ''],
    ['DWA-A 117', 'Rückhalteraumnachweis', ''],
    ['KOSTRA-DWD 2020', 'Regenspenden · 2020', ''],
    ['Report-Version', '1', '']
  ]
}, {
  hydraulics: { dischargeMode: 'authority-discharge-limit' }
});
assert.equal(sourceSection.title, '10. Verwendete Regelwerke und Datengrundlagen');
assert.deepEqual(sourceSection.rows.map(row => row[0]), ['DIN 1986-100', 'DWA-A 117', 'KOSTRA-DWD 2020']);

const documentInfo = buildAuthorityCorporateData({}, { reportDto: dto });
assert.equal(documentInfo.module, 'Überflutungsnachweis');
assert.equal(documentInfo.generatedAt, '18.07.2026');

console.log('Phase 47C.12 review corrections ok');
