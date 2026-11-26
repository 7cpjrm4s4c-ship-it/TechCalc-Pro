import assert from 'node:assert/strict';

import { lineSectionItems, reportSections } from '../core/pdf/pdfDataMapping.js';
import { calculate } from '../modules/heating-cooling/logic.js';
import { buildHeatingCoolingReportDto } from '../modules/heating-cooling/reportAdapter.js';

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
assert.ok(report.resultGroups.some(group => group.title === 'Gespeicherte Berechnungen'));
assert.doesNotThrow(() => JSON.stringify(report));

const sections = reportSections({ reportSource: 'typed-dto', reportDto: report });
assert.ok(sections.length >= 1);
assert.ok(sections.every(section => !/^(?:\d+\.\s*)?(berichtszusammenfassung|eingaben)$/i.test(section.title)),
  'generic module PDFs must not contain Berichtszusammenfassung or Eingaben sections');
assert.ok(sections.every(section => !/leitungsabschnitt/i.test(section.title)),
  'no Leitungsabschnitt section titles may remain');
const savedSection = sections.find(section => section.isLineSection && section.title === 'Gespeicherte Berechnungen');
assert.ok(savedSection, 'saved line sections keep their collective section');
const savedBlocks = lineSectionItems(savedSection.rows, savedSection.title);
assert.deepEqual(savedBlocks.map(block => block.title), ['Testabschnitt'],
  'each saved record must appear under its stored name');

console.log('Heating/cooling report DTO tests passed.');
