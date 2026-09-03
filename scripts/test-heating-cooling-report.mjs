import assert from 'node:assert/strict';

import { reportSections } from '../js/core/pdf/pdfDataMapping.js';
import { calculate } from '../js/modules/heating-cooling/logic.js';
import { buildHeatingCoolingReportDto } from '../js/modules/heating-cooling/reportAdapter.js';

const state = {
  mode: 'heating',
  mediumId: 'water',
  pipeSystemId: 'steel',
  lineSections: [
    {
      id: 'line-1',
      name: 'Testabschnitt',
      powerKw: '10',
      massFlowKgh: '860',
      volumeFlowM3h: '0.862',
      deltaT: '10',
      medium: 'Wasser',
      pipeDn: 'DN 25',
      pipeDimension: 'Ø 28 mm',
      pipeMaterial: 'Stahl',
      pipeVelocity: '0.6',
      pipePressureLoss: '120'
    }
  ]
};

const activeState = {
  mode: 'heating',
  mediumId: 'water',
  pipeSystemId: 'steel',
  calcTarget: 'power',
  powerW: '10000',
  powerUnit: 'W',
  massFlowKgh: '',
  massFlowUnit: 'kg/h',
  deltaT: '10'
};

const calculation = calculate(activeState);
const report = buildHeatingCoolingReportDto({
  state,
  activeState,
  calculation,
  lineSections: state.lineSections,
  generatedAt: '2026-08-31T00:00:00.000Z'
});

assert.equal(report.metadata.dtoType, 'techcalc.heating-cooling.report');
assert.equal(report.metadata.moduleId, 'heating-cooling');
assert.equal(report.summary.calcTarget, 'power');
assert.equal(report.summary.lineSectionCount, 1);
assert.ok(report.resultGroups.some(group => group.title === 'Gespeicherte Leitungsabschnitte'));
assert.doesNotThrow(() => JSON.stringify(report));

const sections = reportSections({ reportSource: 'typed-dto', reportDto: report });
assert.ok(sections.length >= 3);
assert.equal(sections[0].title, '1. Berichtszusammenfassung');
assert.ok(sections.some(section => section.title.includes('Gespeicherte Leitungsabschnitte')));

console.log('Heating/cooling report DTO tests passed.');
