import config from './config.js';
import schema from './schema.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { createTypedDtoReportAdapter } from '../../core/typedDtoReportAdapter.js';
import { bindHeatRecoveryActions } from './controller.js';
import { buildHeatRecoveryResultModel } from './results.js';
import { renderView } from './view.js';
import { isDynamicHeatRecoveryAction, updateHeatRecoveryDynamic } from './dynamicRenderer.js';

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

function rowsForRltRecord(record = {}, index = 0, snapshot = {}, calculation = {}) {
  const rows = [
    ['Bezeichnung', record.name || snapshot.activeRltDeviceName || `RLT-Gerät ${index + 1}`, ''],
    ['Betriebsart', record.mode || 'Wärmerückgewinnung', ''],
    row('Volumenstrom', record.volumeFlowM3h ?? calculation.effectiveVolumeFlowM3h ?? snapshot.volumeFlowM3h, 'm³/h'),
    row('Wirkungsgrad', record.efficiencyPercent ?? snapshot.efficiencyPercent, '%'),
    row('Bypass-Anteil', record.bypassPercent ?? snapshot.bypassPercent, '%'),
    ['Außenluft', record.outdoor || airStateText(calculation.outdoor, snapshot.outdoorTemp, snapshot.outdoorRh), ''],
    ['Abluft', record.extract || airStateText(calculation.extract, snapshot.extractTemp, snapshot.extractRh), ''],
    ['Zuluft nach WRG', record.supply || airStateText(calculation.supply), ''],
    ['Fortluft', record.exhaust || airStateText(calculation.exhaust), ''],
    row('zurückgewonnene Leistung', record.power ?? calculation.recoveredPowerKw, typeof record.power === 'string' ? '' : 'kW'),
    row('Kondensat', calculation.condensateKgh, 'kg/h'),
    row('Kondensationsleistung', calculation.condensationPowerKw, 'kW')
  ].filter(Boolean);
  return rows;
}

function currentRltRecord(snapshot = {}, calculation = {}) {
  return {
    name: snapshot.activeRltDeviceName || 'Aktuelle Berechnung',
    mode: 'Wärmerückgewinnung',
    volumeFlowM3h: calculation.effectiveVolumeFlowM3h ?? snapshot.volumeFlowM3h,
    efficiencyPercent: snapshot.efficiencyPercent,
    bypassPercent: snapshot.bypassPercent,
    outdoor: airStateText(calculation.outdoor, snapshot.outdoorTemp, snapshot.outdoorRh),
    extract: airStateText(calculation.extract, snapshot.extractTemp, snapshot.extractRh),
    supply: airStateText(calculation.supply),
    exhaust: airStateText(calculation.exhaust),
    power: calculation.recoveredPowerKw
  };
}

function buildHeatRecoveryReportDto(context = {}) {
  const moduleConfig = context.config || config;
  const snapshot = context.state || {};
  const calculation = context.calculation || {};
  const saved = Array.isArray(snapshot.savedRltDevices) ? snapshot.savedRltDevices : (Array.isArray(snapshot.rltDevices) ? snapshot.rltDevices : []);
  const records = saved.length ? saved : [currentRltRecord(snapshot, calculation)];
  return {
    metadata: {
      dtoType: 'techcalc.generic-module.report',
      dtoVersion: 1,
      moduleId: moduleConfig.id,
      moduleTitle: moduleConfig.title || 'Wärmerückgewinnung',
      reportHeading: 'Berechnungsprotokoll',
      generatedAt: context.generatedAt
    },
    sections: records.map((record, index) => ({
      title: 'Wärmerückgewinnung',
      isLineSection: true,
      rows: rowsForRltRecord(record, index, snapshot, calculation)
    }))
  };
}

const typedReportAdapter = createTypedDtoReportAdapter({
  config,
  schema,
  state,
  calculate,
  results: (snapshot, result) => buildHeatRecoveryResultModel(snapshot, result),
  buildReportDto: buildHeatRecoveryReportDto
});
const calculateForReport = typedReportAdapter.calculate;

function renderTypedView(snapshot) {
  calculateForReport(snapshot);
  return renderView(snapshot);
}

function updateTypedDynamic(root, snapshot, meta = {}) {
  calculateForReport(snapshot);
  updateHeatRecoveryDynamic(root, snapshot, meta);
}

export default createPlatformModule({
  config,
  schema,
  state,
  calculate: calculateForReport,
  view: renderTypedView,
  bind: bindHeatRecoveryActions,
  dynamicUpdate: updateTypedDynamic,
  isDynamicAction: isDynamicHeatRecoveryAction,
  report: typedReportAdapter.report
});
