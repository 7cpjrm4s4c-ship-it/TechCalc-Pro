import config from './config.js';
import { buildVentilationResultModel } from './results.js';
import { ventilationLineSectionStats } from './viewModel.js';

export const VENTILATION_REPORT_DTO_VERSION = 1;

const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
const array = value => Array.isArray(value) ? value : [];

const normalizeRows = rows => array(rows).map(row => ({
  label: row?.label || '',
  value: row?.value ?? '',
  unit: row?.unit || ''
}));

const rowsFromResultCard = card => {
  if (!card) return [];
  const rows = [];
  if (card.primary) rows.push(card.primary);
  rows.push(...normalizeRows(card.rows));
  return normalizeRows(rows);
};

const sectionFromCard = card => ({
  title: card?.title || 'Ergebnis',
  rows: rowsFromResultCard(card)
});

const lineSectionRows = lineSections => array(lineSections).flatMap((item, index) => [
  { label: 'Bezeichnung', value: item?.name || `Leitungsabschnitt ${index + 1}` },
  ...ventilationLineSectionStats(item)
]);

function buildInputSummary(state = {}, activeState = {}) {
  const prefix = activeState.mode === 'cooling' ? 'cooling' : 'heating';
  return {
    mode: activeState.mode || state.mode || '',
    calcTarget: activeState.calcTarget || state[`${prefix}CalcTarget`] || '',
    powerW: activeState.powerW || state[`${prefix}PowerW`] || '',
    powerUnit: activeState.powerUnit || state[`${prefix}PowerUnit`] || '',
    volumeFlowM3h: activeState.volumeFlowM3h || state[`${prefix}VolumeFlowM3h`] || '',
    supplyTemp: activeState.supplyTemp || state[`${prefix}SupplyTemp`] || '',
    roomTemp: activeState.roomTemp || state[`${prefix}RoomTemp`] || '',
    deltaT: activeState.deltaT || ''
  };
}

export function buildVentilationReportDto({
  state = {},
  activeState = {},
  calculation = {},
  lineSections = [],
  generatedAt = new Date().toISOString()
} = {}) {
  const resultModel = buildVentilationResultModel(activeState, calculation, config.accent);
  const savedLineRows = lineSectionRows(lineSections);
  const resultGroups = [];

  if (savedLineRows.length) {
    resultGroups.push({
      title: 'Gespeicherte Leitungsabschnitte',
      rows: savedLineRows,
      isLineSection: true
    });
  } else {
    resultGroups.push(sectionFromCard(resultModel.primary));
  }

  return Object.freeze({
    metadata: Object.freeze({
      dtoType: 'techcalc.ventilation.report',
      dtoVersion: VENTILATION_REPORT_DTO_VERSION,
      moduleId: config.id,
      moduleTitle: config.title,
      reportHeading: config.title,
      generatedAt
    }),
    input: clone(buildInputSummary(state, activeState)),
    summary: {
      mode: activeState.mode || state.mode || '',
      calcTarget: activeState.calcTarget || '',
      lineSectionCount: array(lineSections).length
    },
    resultGroups: clone(resultGroups)
  });
}

export default buildVentilationReportDto;
