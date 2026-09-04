import config from './config.js';
import schema from './schema.js';
import { state } from './state.js';
import { calculate, processLabel } from './logic.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { createTypedDtoReportAdapter } from '../../core/typedDtoReportAdapter.js';
import { bindHxDiagramActions } from './controller.js';
import { renderHxSvg } from './diagramRenderer.js';
import { renderView } from './view.js';
import { isDynamicHxDiagramAction, updateHxDiagramDynamic } from './dynamicRenderer.js';

function fmtReportValue(value, digits = 2) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Intl.NumberFormat('de-DE', { maximumFractionDigits: digits }).format(value);
  }
  return String(value ?? '').trim() || '-';
}

function hasValue(value) {
  return value !== undefined && value !== null && value !== '';
}

function row(label, value, unit = '') {
  return hasValue(value) ? [label, fmtReportValue(value), unit] : null;
}

function hxProcessName(record = {}, index = 0) {
  return record.name || record.label || record.input?.label || `h,x-Prozess ${index + 1}`;
}

function safeProcessLabel(value) {
  const fallback = {
    heat: 'Erwärmen',
    cool: 'Kühlen',
    adiabatic: 'adiabate Befeuchtung',
    steam: 'Dampfbefeuchtung',
    'cool-dehumidify': 'Kühlen und Entfeuchten'
  }[value] || value || '-';
  try {
    return processLabel(value) || fallback;
  } catch {
    return fallback;
  }
}

function recordInput(record = {}, snapshot = {}) {
  return record.input || {
    label: record.name || snapshot.activeHxProcessName || snapshot.name,
    airVolumeM3h: snapshot.airVolumeM3h,
    tempC: snapshot.tempC ?? snapshot.startTempC,
    rhPercent: snapshot.rhPercent ?? snapshot.startRhPercent,
    targetTempC: snapshot.targetTempC,
    targetRhPercent: snapshot.targetRhPercent,
    heatingSupplyTempC: snapshot.heatingSupplyTempC,
    heatingReturnTempC: snapshot.heatingReturnTempC,
    coolingSupplyTempC: snapshot.coolingSupplyTempC,
    coolingReturnTempC: snapshot.coolingReturnTempC,
    process: snapshot.process || snapshot.selectedProcess
  };
}

function recordPath(record = {}, calculation = {}) {
  if (Array.isArray(record.path) && record.path.length) return record.path;
  if (Array.isArray(record.processPath) && record.processPath.length) return record.processPath;
  if (Array.isArray(calculation.processPath) && calculation.processPath.length) return calculation.processPath;
  if (Array.isArray(calculation.path) && calculation.path.length) return calculation.path;
  return [];
}

function pointText(point = {}, index = 0) {
  const label = point.label || point.name || `Punkt ${index + 1}`;
  const temperature = point.tempC ?? point.temperatureC ?? point.temperature;
  const rh = point.rhPercent ?? point.relativeHumidityPercent ?? point.relativeHumidity;
  const humidity = point.humidityRatioGkg ?? point.humidityGkg ?? point.xGkg;
  const enthalpy = point.enthalpyKjKg ?? point.enthalpy;
  const parts = [
    hasValue(temperature) ? `${fmtReportValue(temperature)} °C` : '',
    hasValue(rh) ? `${fmtReportValue(rh, 0)} % r. F.` : '',
    hasValue(humidity) ? `x = ${fmtReportValue(humidity)} g/kg` : '',
    hasValue(enthalpy) ? `h = ${fmtReportValue(enthalpy)} kJ/kg` : ''
  ].filter(Boolean);
  return `${label}: ${parts.join(' · ')}`;
}

function rowsForHxRecord(record = {}, index = 0, snapshot = {}, calculation = {}) {
  const input = recordInput(record, snapshot);
  const process = record.process || record.processLabel || input.process || snapshot.process || snapshot.selectedProcess || calculation.effectiveProcess;
  const path = recordPath(record, calculation);
  return [
    ['Prozess', record.processLabel || safeProcessLabel(process), ''],
    row('Luftvolumenstrom', input.airVolumeM3h, 'm³/h'),
    row('Starttemperatur', input.tempC, '°C'),
    row('relative Feuchte Start', input.rhPercent, '%'),
    row('Zieltemperatur', input.targetTempC, '°C'),
    row('Ziel-Feuchte', input.targetRhPercent, '%'),
    row('Heizung-Vorlauf', input.heatingSupplyTempC, '°C'),
    row('Heizung-Rücklauf', input.heatingReturnTempC, '°C'),
    row('Kälte-Vorlauf', input.coolingSupplyTempC, '°C'),
    row('Kälte-Rücklauf', input.coolingReturnTempC, '°C'),
    ...path.map((point, pointIndex) => [`Zustandspunkt ${pointIndex + 1}`, pointText(point, pointIndex), ''])
  ].filter(Boolean);
}

function escapeXml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function innerSvg(svg = '') {
  const match = String(svg).match(/<svg\b[^>]*>([\s\S]*?)<\/svg>/i);
  return match ? match[1] : '';
}

function combinedHxSvg(records = [], calculation = {}) {
  const charts = records
    .map((record, index) => ({
      title: hxProcessName(record, index),
      path: recordPath(record, calculation)
    }))
    .filter(chart => chart.path.length);
  if (!charts.length) return '';
  if (charts.length === 1) return renderHxSvg(charts[0].path);
  const width = 820;
  const panelHeight = 500;
  const height = Math.max(panelHeight, charts.length * panelHeight);
  const panels = charts.map((chart, index) => {
    const svg = innerSvg(renderHxSvg(chart.path));
    const offsetY = index * panelHeight;
    return `<g transform="translate(0 ${offsetY})"><rect x="0" y="0" width="${width}" height="${panelHeight}" fill="#ffffff"/><text x="24" y="24" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#1f2937">${escapeXml(chart.title)}</text><g transform="translate(0 30)">${svg}</g></g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${panels}</svg>`;
}

function currentHxRecord(snapshot = {}, calculation = {}) {
  return {
    name: snapshot.activeHxProcessName || snapshot.name || 'Aktueller Prozess',
    process: snapshot.process || snapshot.selectedProcess || calculation.effectiveProcess,
    input: recordInput({}, snapshot),
    path: recordPath({}, calculation)
  };
}

function buildHxDiagramReportDto(context = {}) {
  const moduleConfig = context.config || config;
  const snapshot = context.state || {};
  const calculation = context.calculation || {};
  const saved = Array.isArray(snapshot.savedProcesses) ? snapshot.savedProcesses : [];
  const records = saved.length ? saved : [currentHxRecord(snapshot, calculation)];
  const chartSvg = combinedHxSvg(records, calculation);
  return {
    metadata: {
      dtoType: 'techcalc.generic-module.report',
      dtoVersion: 1,
      moduleId: moduleConfig.id,
      moduleTitle: moduleConfig.title || 'h,x-Diagramm',
      reportHeading: 'h,x-Diagramm',
      generatedAt: context.generatedAt
    },
    chartSvg,
    sections: records.map((record, index) => ({
      title: hxProcessName(record, index),
      isLineSection: false,
      rows: rowsForHxRecord(record, index, snapshot, calculation)
    }))
  };
}

const typedReportAdapter = createTypedDtoReportAdapter({
  config,
  schema,
  state,
  calculate,
  buildReportDto: buildHxDiagramReportDto
});
const calculateForReport = typedReportAdapter.calculate;

function renderTypedView(snapshot) {
  calculateForReport(snapshot);
  return renderView(snapshot);
}

function updateTypedDynamic(root, snapshot, meta = {}) {
  calculateForReport(snapshot);
  updateHxDiagramDynamic(root, snapshot, meta);
}

export default createPlatformModule({
  config,
  schema,
  state,
  calculate: calculateForReport,
  view: renderTypedView,
  bind: bindHxDiagramActions,
  dynamicUpdate: updateTypedDynamic,
  isDynamicAction: isDynamicHxDiagramAction,
  report: typedReportAdapter.report
});
