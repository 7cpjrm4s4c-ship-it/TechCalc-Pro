import assert from 'node:assert/strict';
import { airDensity, ventilation } from '../core/data/index.js';
import { parseNumber } from '../core/engineering/numberService.js';
import {
  activeCalculationState,
  buildVentilationLineSectionRecord,
  resolveLineSectionVolumeFlowM3h,
  savedVentilationPatch,
  ventilationLineSectionStats
} from '../modules/ventilation/viewModel.js';
import { buildVentilationReportDto } from '../modules/ventilation/reportAdapter.js';
import { buildVentilationReportSections } from '../core/pdf/ventilationReportSections.js';
import { reportSections } from '../core/pdf/pdfDataMapping.js';

const EXPECTED_LABELS = ['Bezeichnung', 'Leistung', 'Volumenstrom', 'Massenstrom', 'Temperaturdifferenz', 'Zuluft', 'Raum', 'Betriebsart'];

const coolingState = {
  mode: 'cooling',
  coolingCalcTarget: 'power',
  coolingPowerW: '',
  coolingPowerUnit: 'W',
  coolingVolumeFlowM3h: '80000',
  coolingSupplyTemp: '18',
  coolingRoomTemp: '26',
  coolingDeltaT: ''
};

const coolingActive = activeCalculationState(coolingState);
const coolingResult = ventilation(coolingActive);

assert.ok(Math.abs(coolingResult.powerKw - 216.65) < 0.01, 'cooling result power is derived from the volume flow');
assert.ok(Math.abs(coolingResult.volumeFlowM3h - 80000) < 1e-9, 'cooling result keeps the volume flow');
assert.ok(Math.abs(coolingResult.massFlowKgh - 97008.41) < 0.01, 'cooling result mass flow matches the volume flow');
assert.equal(coolingResult.deltaT, 8, 'cooling deltaT is room minus supply temperature');

// Auftrag 3.1: Speichern eines Kälte-Abschnitts - der Datensatz enthält den Volumenstrom
const coolingRecord = buildVentilationLineSectionRecord(
  coolingState,
  coolingResult,
  coolingActive,
  'Kälte',
  [],
  'vent-cool-1',
  'Kälte Abschnitt'
);
assert.equal(coolingRecord.volumeFlowM3h, '80.000', 'saved cooling record stores the volume flow');
assert.equal(coolingRecord.modeLabel, 'Kälte', 'saved cooling record keeps its mode label');
assert.equal(coolingRecord.inputState.mode, 'cooling', 'saved cooling record keeps its mode in inputState');
assert.equal(coolingRecord.inputState.volumeFlowM3h, '80000', 'saved cooling record keeps the volume flow input');

const heatingState = {
  mode: 'heating',
  heatingCalcTarget: 'power',
  heatingPowerW: '',
  heatingPowerUnit: 'W',
  heatingVolumeFlowM3h: '25000',
  heatingSupplyTemp: '40',
  heatingRoomTemp: '20',
  heatingDeltaT: ''
};
const heatingActive = activeCalculationState(heatingState);
const heatingRecord = buildVentilationLineSectionRecord(
  heatingState,
  ventilation(heatingActive),
  heatingActive,
  'Heizung',
  [coolingRecord],
  'vent-heat-1',
  'Heiz Abschnitt'
);
assert.equal(heatingRecord.volumeFlowM3h, '25.000', 'saved heating record stores the volume flow');

// Auftrag 3.2: Ladeszene - Moduswechsel und Zurückladen stellen alle Felder wieder her
const afterModeSwitch = { ...coolingState, mode: 'heating', heatingCalcTarget: 'power' };
const coolingPatch = savedVentilationPatch(coolingRecord, afterModeSwitch);
assert.equal(coolingPatch.mode, 'cooling', 'loading a cooling record restores cooling mode');
assert.equal(coolingPatch.coolingCalcTarget, 'power', 'loading restores the cooling calc target');
assert.equal(coolingPatch.coolingVolumeFlowM3h, '80000', 'loading restores the cooling volume flow');
assert.equal(coolingPatch.coolingSupplyTemp, '18', 'loading restores the cooling supply temperature');
assert.equal(coolingPatch.coolingRoomTemp, '26', 'loading restores the cooling room temperature');
assert.equal(coolingPatch.heatingCalcTarget, undefined, 'loading a cooling record does not mutate heating keys');

const restored = activeCalculationState({ ...afterModeSwitch, ...coolingPatch });
assert.equal(restored.mode, 'cooling', 'restored active state is cooling');
assert.equal(restored.volumeFlowM3h, '80000', 'restored active state has the volume flow');
assert.equal(restored.supplyTemp, '18', 'restored active state has the supply temperature');
assert.equal(restored.roomTemp, '26', 'restored active state has the room temperature');
assert.equal(restored.deltaT, 8, 'restored active state derives deltaT');
assert.equal(restored.calcTarget, 'power', 'restored active state has the calc target');

// Auftrag 3.3: PDF-DTO - Kälte-Abschnitt mit identischer Zeilenstruktur inklusive Volumenstrom
const dto = buildVentilationReportDto({
  state: coolingState,
  activeState: coolingActive,
  calculation: coolingResult,
  lineSections: [coolingRecord, heatingRecord]
});
const lineGroup = dto.resultGroups.find(group => group.isLineSection);
assert.ok(lineGroup, 'ventilation DTO exposes a line-section group');
const labels = lineGroup.rows.map(row => row.label);
assert.deepEqual(labels.slice(0, EXPECTED_LABELS.length), EXPECTED_LABELS, 'cooling block starts with the full row structure');
assert.deepEqual(labels.slice(EXPECTED_LABELS.length), EXPECTED_LABELS, 'heating block uses the identical row structure');

const coolingRows = lineGroup.rows.slice(0, EXPECTED_LABELS.length);
const coolingVolumeRow = coolingRows.find(row => row.label === 'Volumenstrom');
assert.equal(coolingVolumeRow.value, '80.000', 'cooling DTO row carries the volume flow value');
assert.equal(coolingVolumeRow.unit, 'm³/h', 'cooling DTO row carries the volume flow unit');
const heatingVolumeRow = lineGroup.rows.slice(EXPECTED_LABELS.length).find(row => row.label === 'Volumenstrom');
assert.equal(heatingVolumeRow.value, '25.000', 'heating DTO row keeps its volume flow');
assert.equal(heatingVolumeRow.unit, 'm³/h', 'heating DTO row keeps the volume flow unit');

const sections = buildVentilationReportSections(dto);
const sectionRows = sections.flatMap(section => section.rows);
assert.ok(sectionRows.some(row => row[0] === 'Volumenstrom' && row[1] === '80.000' && row[2] === 'm³/h'), 'ventilation PDF sections keep the cooling volume flow row');

const pdfSections = reportSections({ id: 'ventilation', title: 'Lüftung', shortTitle: 'Lüftung', reportSource: 'typed-dto', reportDto: dto });
const pdfRows = pdfSections.flatMap(section => section.rows);
assert.ok(pdfRows.some(row => row[0] === 'Volumenstrom' && row[1] === '80.000' && row[2] === 'm³/h'), 'final PDF rows render 80.000 m³/h for the cooling block, not a truncated value');

// Datensatz ohne gespeicherten Volumenstrom: Ableitung beim Export aus inputState bzw. gespeicherter Rechnung
const legacyRecord = { ...coolingRecord, id: 'vent-cool-legacy', volumeFlowM3h: '' };
assert.equal(resolveLineSectionVolumeFlowM3h(legacyRecord), '80000', 'volume flow is derived from the stored input state');
const legacyStats = ventilationLineSectionStats(legacyRecord);
const legacyVolumeRow = legacyStats.find(row => row.label === 'Volumenstrom');
assert.equal(legacyVolumeRow.value, '80.000', 'legacy cooling record exports the derived volume flow');
assert.equal(legacyVolumeRow.unit, 'm³/h', 'legacy cooling record exports the volume flow unit');

const massOnlyRecord = {
  id: 'vent-cool-mass',
  name: 'Kälte Abschnitt 2',
  powerKw: '216,65',
  volumeFlowM3h: '',
  massFlowKgh: '97.008,41',
  deltaT: '8',
  supplyTemp: '18',
  roomTemp: '26',
  modeLabel: 'Kälte'
};
const massDerived = Number(resolveLineSectionVolumeFlowM3h(massOnlyRecord));
assert.ok(Math.abs(massDerived - 97008.41 / airDensity(18)) < 1e-6, 'volume flow falls back to mass flow divided by air density');
assert.ok(Math.abs(massDerived - 80000) < 1, 'mass-flow fallback yields about 80.000 m³/h');

const powerOnlyRecord = { ...massOnlyRecord, id: 'vent-cool-power', massFlowKgh: '' };
const powerDerived = Number(resolveLineSectionVolumeFlowM3h(powerOnlyRecord));
assert.ok(Math.abs(powerDerived - 80000) < 1, 'volume flow falls back to power, heat value and deltaT');

const legacyDto = buildVentilationReportDto({
  state: coolingState,
  activeState: coolingActive,
  calculation: coolingResult,
  lineSections: [legacyRecord]
});
const legacyGroup = legacyDto.resultGroups.find(group => group.isLineSection);
const legacyDtoVolumeRow = legacyGroup.rows.find(row => row.label === 'Volumenstrom');
assert.equal(legacyDtoVolumeRow.value, '80.000', 'PDF DTO derives the volume flow for records saved without it');
assert.equal(legacyDtoVolumeRow.unit, 'm³/h', 'derived volume flow row keeps its unit');

// Verschluck-Verbot: fehlender Wert erscheint als „—“, die Zeile wird niemals entfernt
const emptyRecord = { id: 'vent-empty', name: 'Leerer Abschnitt' };
const emptyStats = ventilationLineSectionStats(emptyRecord);
assert.deepEqual(emptyStats.map(row => row.label), ['Leistung', 'Volumenstrom', 'Massenstrom', 'Temperaturdifferenz', 'Zuluft', 'Raum', 'Betriebsart'], 'no row type is filtered out of the stats');
assert.equal(emptyStats.find(row => row.label === 'Volumenstrom').value, '—', 'a missing volume flow renders as em dash');
const emptyDto = buildVentilationReportDto({ state: coolingState, activeState: coolingActive, calculation: coolingResult, lineSections: [emptyRecord] });
const emptyGroup = emptyDto.resultGroups.find(group => group.isLineSection);
assert.ok(emptyGroup.rows.some(row => row.label === 'Volumenstrom' && row.value === '—'), 'PDF DTO keeps the volume flow row as em dash instead of dropping it');
const emptyPdfRows = reportSections({ id: 'ventilation', title: 'Lüftung', shortTitle: 'Lüftung', reportSource: 'typed-dto', reportDto: emptyDto }).flatMap(section => section.rows);
assert.ok(emptyPdfRows.some(row => row[0] === 'Volumenstrom'), 'final PDF rows keep the volume flow row even without any derivable value');
assert.equal(emptyPdfRows.filter(row => row[0] === 'Volumenstrom').length, 1, 'the volume flow row is not removed by the PDF row filters');

// Nacharbeit C.1: Kälte-Abschnitt mit Leistungseingabe 216,65 kW (calcTarget volumeFlow), Zuluft 18 °C, Raum 26 °C
const coolingPowerState = {
  mode: 'cooling',
  coolingCalcTarget: 'volumeFlow',
  coolingPowerW: '216.65',
  coolingPowerUnit: 'kW',
  coolingVolumeFlowM3h: '',
  coolingSupplyTemp: '18',
  coolingRoomTemp: '26',
  coolingDeltaT: ''
};
const coolingPowerActive = activeCalculationState(coolingPowerState);
const coolingPowerResult = ventilation(coolingPowerActive);
assert.ok(Math.abs(coolingPowerResult.volumeFlowM3h - 80000) < 1, 'cooling power input is back-calculated to about 80.000 m³/h');
assert.ok(Math.abs(coolingPowerResult.massFlowKgh - 97008) < 1, 'mass flow follows the back-calculated volume flow');
const coolingPowerRecord = buildVentilationLineSectionRecord(
  coolingPowerState,
  coolingPowerResult,
  coolingPowerActive,
  'Kälte',
  [],
  'vent-cool-power-input',
  'Kühlung'
);
assert.ok(coolingPowerRecord.volumeFlowM3h && coolingPowerRecord.volumeFlowM3h !== '—', 'saved cooling record with power input contains the volume flow');
assert.ok(Math.abs(parseNumber(coolingPowerRecord.volumeFlowM3h, { fallback: NaN }) - 80000) < 1, 'saved volume flow is about 80.000 m³/h');

// Nacharbeit A/C.2: historischer Datensatz mit leerem volumeFlowM3h – Rekonstruktion beim Report-Aufbau
const legacyCoolingRecord = {
  id: 'vent-legacy-cooling',
  name: 'Kühlung',
  powerKw: '216,65',
  volumeFlowM3h: '',
  massFlowKgh: '97.008,41',
  deltaT: '8',
  supplyTemp: '18',
  roomTemp: '26',
  modeLabel: 'Kälte',
  inputState: { mode: 'cooling', calcTarget: 'volumeFlow', powerW: '216.65', powerUnit: 'kW', volumeFlowM3h: '', supplyTemp: '18', roomTemp: '26', deltaT: 8 },
  uiState: { mode: 'cooling' }
};
const legacyDtoAll = buildVentilationReportDto({
  state: coolingPowerState,
  activeState: coolingPowerActive,
  calculation: coolingPowerResult,
  lineSections: [legacyCoolingRecord, heatingRecord]
});
const legacyGroupAll = legacyDtoAll.resultGroups.find(group => group.isLineSection);
const legacyLabels = legacyGroupAll.rows.map(row => row.label);
assert.deepEqual(legacyLabels.slice(0, EXPECTED_LABELS.length), EXPECTED_LABELS, 'legacy cooling block keeps the full row structure');
assert.deepEqual(legacyLabels.slice(EXPECTED_LABELS.length), EXPECTED_LABELS, 'heating block keeps the identical row structure');
const legacyAllVolumeRow = legacyGroupAll.rows.find(row => row.label === 'Volumenstrom');
assert.ok(legacyAllVolumeRow.value && legacyAllVolumeRow.value !== '—', 'legacy cooling record gets a reconstructed volume flow value');
assert.ok(Math.abs(parseNumber(legacyAllVolumeRow.value, { fallback: NaN }) - 80000) < 1, 'reconstructed volume flow is about 80.000 m³/h');
assert.equal(legacyAllVolumeRow.unit, 'm³/h', 'reconstructed volume flow row keeps the unit m³/h');
const legacyPdfRows = reportSections({ id: 'ventilation', title: 'Lüftung', shortTitle: 'Lüftung', reportSource: 'typed-dto', reportDto: legacyDtoAll }).flatMap(section => section.rows);
const legacyPdfVolumeRows = legacyPdfRows.filter(row => row[0] === 'Volumenstrom');
assert.equal(legacyPdfVolumeRows.length, 2, 'both PDF blocks contain the volume flow row, none is swallowed');
assert.ok(legacyPdfVolumeRows.some(row => Math.abs(parseNumber(row[1], { fallback: NaN }) - 80000) < 1 && row[2] === 'm³/h'), 'PDF renders the reconstructed cooling volume flow as 80.000 m³/h');

// Nacharbeit C.3: Zeilenfilter – keine Zeile wird wegen fehlenden Werten aus dem Report entfernt
const mixedDto = buildVentilationReportDto({
  state: coolingState,
  activeState: coolingActive,
  calculation: coolingResult,
  lineSections: [legacyCoolingRecord, emptyRecord, heatingRecord]
});
const mixedRows = mixedDto.resultGroups.find(group => group.isLineSection).rows;
const blocks = [];
for (const row of mixedRows) {
  if (row.label === 'Bezeichnung') blocks.push([]);
  if (blocks.length) blocks[blocks.length - 1].push(row.label);
}
assert.equal(blocks.length, 3, 'three saved sections produce three blocks');
for (const block of blocks) {
  assert.deepEqual(block, EXPECTED_LABELS, 'every block contains all row types, regardless of missing values');
}

console.log('ventilation cooling volume flow PDF regression ok');
