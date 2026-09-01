import config from './config.js';
import {
  buildHeatingCoolingResultModel,
  buildPipeRecommendationModel,
  targetLabel
} from './results.js';
import { lineSectionStats } from './controller.js';

export const HEATING_COOLING_REPORT_DTO_VERSION = 1;

const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));

const normalizeRows = rows => (Array.isArray(rows) ? rows : [])
  .map(row => ({
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

const lineSectionRows = lineSections => (Array.isArray(lineSections) ? lineSections : [])
  .flatMap((item, index) => [
    { label: 'Bezeichnung', value: item?.name || `Leitungsabschnitt ${index + 1}` },
    ...lineSectionStats(item)
  ]);

function buildInputSummary(state = {}, activeState = {}) {
  return {
    mode: activeState.mode || state.mode || '',
    mediumId: activeState.mediumId || state.mediumId || '',
    pipeSystemId: activeState.pipeSystemId || state.pipeSystemId || '',
    calcTarget: activeState.calcTarget || '',
    powerW: activeState.powerW || '',
    powerUnit: activeState.powerUnit || '',
    massFlowKgh: activeState.massFlowKgh || '',
    massFlowUnit: activeState.massFlowUnit || '',
    deltaT: activeState.deltaT || ''
  };
}

export function buildHeatingCoolingReportDto({
  state = {},
  activeState = {},
  calculation = {},
  lineSections = [],
  generatedAt = new Date().toISOString()
} = {}) {
  const resultModel = buildHeatingCoolingResultModel(activeState, calculation, config.accent);
  const pipeModel = buildPipeRecommendationModel(calculation);
  const savedLineRows = lineSectionRows(lineSections);
  const resultGroups = [
    sectionFromCard(resultModel.primary),
    sectionFromCard(pipeModel)
  ];

  if (savedLineRows.length) {
    resultGroups.push({
      title: 'Gespeicherte Leitungsabschnitte',
      rows: savedLineRows,
      isLineSection: true
    });
  }

  return Object.freeze({
    metadata: {
      dtoType: 'techcalc.heating-cooling.report',
      dtoVersion: HEATING_COOLING_REPORT_DTO_VERSION,
      moduleId: config.id,
      moduleTitle: config.title,
      reportHeading: config.title,
      generatedAt
    },
    input: clone(buildInputSummary(state, activeState)),
    summary: {
      mode: activeState.mode || state.mode || '',
      calcTarget: activeState.calcTarget || '',
      calcTargetLabel: targetLabel(activeState.calcTarget),
      lineSectionCount: Array.isArray(lineSections) ? lineSections.length : 0
    },
    resultGroups: clone(resultGroups)
  });
}

export default buildHeatingCoolingReportDto;
