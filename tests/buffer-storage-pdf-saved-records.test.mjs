import assert from 'node:assert/strict';

import bufferStorageModule from '../js/modules/buffer-storage/index.js';
import { calculate } from '../js/modules/buffer-storage/logic.js';
import { buildBufferRecord } from '../js/modules/buffer-storage/controller.js';
import { reportSections } from '../js/core/pdf/pdfDataMapping.js';

const defrostState = {
  plantName: 'Test Abtau',
  calculationMode: 'defrost',
  mediumMode: 'water',
  qMaxKw: 500,
  partLoadFactor: 0.25,
  qLoadKw: 0,
  compressorRunTimeMin: 1,
  controllerDeltaT: 1.25,
  qConsumerKw: 200,
  qDefrostKw: 80,
  qHeatingCircuitKw: 50,
  maxDefrostTimeMin: 5,
  hydraulicDeltaT: 2,
  existingSystemVolumeL: 0,
  consumerFlowM3h: 25,
  bridgeTimeMin: 10
};

const defrostResult = calculate(defrostState);
assert.equal(defrostResult.defrostBufferVolume, 8234, 'Abtau-Puffervolumen muss in Litern berechnet werden');
assert.equal(defrostResult.nextStandardVolume, 10000, 'nächstes Normvolumen muss in Litern berechnet werden');

const record = buildBufferRecord(defrostState, defrostResult, [], 'buffer-test', 'Test Abtau');
bufferStorageModule.calculate(defrostState);
const dto = bufferStorageModule.report({ ...defrostState, savedBuffers: [record] });
const sections = reportSections({
  id: 'buffer-storage',
  title: 'Pufferspeicher',
  shortTitle: 'Pufferspeicher',
  reportDto: dto,
  reportSource: 'typed-dto'
});
const savedSection = sections.find(section => section.isLineSection && section.title === 'Pufferspeicher');
assert.ok(savedSection, 'gespeicherte Pufferspeicher-Records müssen als Leitungsabschnitt-artige PDF-Blöcke exportiert werden');
const rows = savedSection.rows;
assert.ok(rows.some(row => row[0] === 'Puffervolumen Abtauung' && row[1] === '8.234' && row[2] === 'l'));
assert.ok(rows.some(row => row[0] === 'Erforderliches Pufferspeichervolumen' && row[1] === '8.234' && row[2] === 'l'));
assert.ok(rows.some(row => row[0] === 'Nächstes Normvolumen' && row[1] === '10.000' && row[2] === 'l'));

console.log('buffer-storage saved-record PDF litre formatting ok');
