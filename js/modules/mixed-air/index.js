import config from './config.js';
import schema from './schema.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { createTypedDtoReportAdapter } from '../../core/typedDtoReportAdapter.js';
import { bindMixedAirActions } from './controller.js';
import { buildMixedAirResultModel } from './results.js';
import { renderView } from './view.js';
import { isDynamicMixedAirAction, updateMixedAirDynamic } from './dynamicRenderer.js';

function fmtReportValue(value, digits = 2) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Intl.NumberFormat('de-DE', { maximumFractionDigits: digits }).format(value);
  }
  return String(value ?? '').trim() || '-';
}

function airStateText(point = {}, tempFallback, rhFallback) {
  const temp = point.tempC ?? tempFallback;
  const rh = point.rhPercent ?? rhFallback;
  if (temp === undefined && rh === undefined) return '-';
  return `${fmtReportValue(temp)} °C / ${fmtReportValue(rh, 0)} %`;
}

function row(label, value, unit = '') {
  const text = fmtReportValue(value);
  return text && text !== '-' ? [label, text, unit] : null;
}

function rowsForMixedAirRecord(record = {}, index = 0, snapshot = {}, calculation = {}) {
  return [
    ['Bezeichnung', record.name || snapshot.activeMixedAirName || `Mischluft ${index + 1}`, ''],
    ['Betriebsart', record.mode || 'Mischluft', ''],
    row('Volumenstrom', record.volumeFlowM3h ?? calculation.mixed?.volumeFlowM3h, 'm³/h'),
    ['Außenluft', record.outdoor || airStateText(calculation.outdoor, snapshot.mixingOutdoorTemp, snapshot.mixingOutdoorRh), ''],
    ['Umluft', record.recirc || airStateText(calculation.recirc, snapshot.mixingRecircTemp, snapshot.mixingRecircRh), ''],
    ['Mischluft', record.mixed || airStateText(calculation.mixed), ''],
    row('Außenluftanteil', calculation.outdoorShare, '%'),
    row('Umluftanteil', calculation.recircShare, '%'),
    row('Kondensat', calculation.condensateKgh, 'kg/h'),
    row('Kondensationsleistung', calculation.condensationPowerKw, 'kW')
  ].filter(Boolean);
}

function currentMixedAirRecord(snapshot = {}, calculation = {}) {
  return {
    name: snapshot.activeMixedAirName || 'Aktuelle Berechnung',
    mode: 'Mischluft',
    volumeFlowM3h: calculation.mixed?.volumeFlowM3h,
    outdoor: airStateText(calculation.outdoor, snapshot.mixingOutdoorTemp, snapshot.mixingOutdoorRh),
    recirc: airStateText(calculation.recirc, snapshot.mixingRecircTemp, snapshot.mixingRecircRh),
    mixed: airStateText(calculation.mixed)
  };
}

function buildMixedAirReportDto(context = {}) {
  const moduleConfig = context.config || config;
  const snapshot = context.state || {};
  const calculation = context.calculation || {};
  const saved = Array.isArray(snapshot.savedMixedAirStates) ? snapshot.savedMixedAirStates : [];
  const records = saved.length ? saved : [currentMixedAirRecord(snapshot, calculation)];
  return {
    metadata: {
      dtoType: 'techcalc.generic-module.report',
      dtoVersion: 1,
      moduleId: moduleConfig.id,
      moduleTitle: moduleConfig.title || 'Mischluft',
      reportHeading: 'Berechnungsprotokoll',
      generatedAt: context.generatedAt
    },
    sections: records.map((record, index) => ({
      title: 'Mischluft',
      isLineSection: true,
      rows: rowsForMixedAirRecord(record, index, snapshot, calculation)
    }))
  };
}

const typedReportAdapter = createTypedDtoReportAdapter({
  config,
  schema,
  state,
  calculate,
  results: (snapshot, result) => buildMixedAirResultModel(snapshot, result),
  buildReportDto: buildMixedAirReportDto
});
const calculateForReport = typedReportAdapter.calculate;

function renderTypedView(snapshot) {
  calculateForReport(snapshot);
  return renderView(snapshot);
}

function updateTypedDynamic(root, snapshot, meta = {}) {
  calculateForReport(snapshot);
  updateMixedAirDynamic(root, snapshot, meta);
}

export default createPlatformModule({
  config,
  schema,
  state,
  calculate: calculateForReport,
  view: renderTypedView,
  bind: bindMixedAirActions,
  dynamicUpdate: updateTypedDynamic,
  isDynamicAction: isDynamicMixedAirAction,
  report: typedReportAdapter.report
});
