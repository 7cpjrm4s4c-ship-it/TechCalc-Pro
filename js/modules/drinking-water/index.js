import config from './config.js';
import schema from './schema.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { createTypedDtoReportAdapter } from '../../core/typedDtoReportAdapter.js';
import { bindDrinkingWaterActions } from './controller.js';
import { renderView } from './view.js';
import { updateDrinkingWaterDynamic, isDynamicDrinkingWaterAction } from './dynamicRenderer.js';

function fmtReportValue(value, digits = 2) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Intl.NumberFormat('de-DE', { maximumFractionDigits: digits }).format(value);
  }
  return String(value ?? '').trim() || '-';
}

function warmWaterLabel(value) {
  if (value === true) return 'zentral';
  if (value === false) return 'dezentral';
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'central') return 'zentral';
  if (normalized === 'decentral') return 'dezentral';
  return fmtReportValue(value);
}

function hasValue(value) {
  return value !== undefined && value !== null && value !== '';
}

function row(label, value, unit = '') {
  return hasValue(value) ? [label, fmtReportValue(value), unit] : null;
}

function consumerTitle(consumer = {}, index = 0) {
  return consumer.label || consumer.name || consumer.typeLabel || consumer.fixtureLabel || consumer.title || `Einrichtungsgegenstand ${index + 1}`;
}

function consumerCount(consumer = {}) {
  return consumer.count ?? consumer.quantity ?? consumer.anzahl ?? consumer.amount ?? 1;
}

function consumerDetail(consumer = {}, index = 0) {
  const parts = [`${fmtReportValue(consumerCount(consumer), 0)} × ${consumerTitle(consumer, index)}`];
  if (hasValue(consumer.vr)) parts.push(`Berechnungsdurchfluss ${fmtReportValue(consumer.vr)} l/s`);
  if (hasValue(consumer.pmin)) parts.push(`Mindestfließdruck ${fmtReportValue(consumer.pmin)} bar`);
  if (hasValue(consumer.hotWater)) parts.push(consumer.hotWater ? 'mit Warmwasser' : 'nur Kaltwasser');
  if (consumer.permanent) parts.push('Dauerverbraucher');
  return parts.join(' · ');
}

function consumerRows(consumers = []) {
  return Array.isArray(consumers)
    ? consumers.map((consumer, index) => [`Einrichtungsgegenstand ${index + 1}`, consumerDetail(consumer, index), ''])
    : [];
}

function rowsForUsageUnit(record = {}, index = 0, snapshot = {}) {
  return [
    ['Bezeichnung', record.name || record.label || `Nutzungseinheit ${index + 1}`, ''],
    row('Gebäudetyp', snapshot.buildingType || snapshot.building),
    row('Warmwasserbereitung', warmWaterLabel(snapshot.warmWaterMode || snapshot.centralWarmWater)),
    row('Gleichzeitigkeitsfaktor', record.simultaneityFactor || record.factor),
    ...consumerRows(record.consumers || record.items || record.fixtures)
  ].filter(Boolean);
}

function rowsForSingleConsumerGroup(record = {}, index = 0, snapshot = {}) {
  return [
    ['Bezeichnung', record.name || record.label || `Einzelverbraucher ${index + 1}`, ''],
    row('Warmwasserbereitung', warmWaterLabel(snapshot.warmWaterMode || snapshot.centralWarmWater)),
    ...consumerRows(record.consumers || record.items || record.fixtures)
  ].filter(Boolean);
}

function rowsForCurrentCalculation(snapshot = {}, calculation = {}) {
  return [
    ['Bezeichnung', snapshot.name || 'Aktuelle Trinkwasserberechnung', ''],
    row('Gebäudetyp', snapshot.buildingType || snapshot.building),
    row('Warmwasserbereitung', warmWaterLabel(snapshot.warmWaterMode || snapshot.centralWarmWater)),
    row('Anzahl Einrichtungsgegenstände', calculation.consumerCount, ''),
    row('Summendurchfluss', calculation.totalSumFlow ?? calculation.sumFlow ?? calculation.rawFlow, 'l/s'),
    row('Spitzendurchfluss', calculation.peakFlow, 'l/s'),
    row('Nennweite', calculation.nennweite || calculation.dn, ''),
    row('Wasserzähler Q3', calculation.meterQ3 || calculation.q3, 'm³/h')
  ].filter(Boolean);
}

function buildDrinkingWaterReportDto(context = {}) {
  const moduleConfig = context.config || config;
  const snapshot = context.state || {};
  const calculation = context.calculation || {};
  const usageUnits = Array.isArray(snapshot.savedUsageUnits) ? snapshot.savedUsageUnits : [];
  const singleConsumers = Array.isArray(snapshot.savedSingleConsumers) ? snapshot.savedSingleConsumers : [];
  const sections = [
    ...usageUnits.map((record, index) => ({
      title: 'Nutzungseinheit',
      isLineSection: true,
      rows: rowsForUsageUnit(record, index, snapshot)
    })),
    ...singleConsumers.map((record, index) => ({
      title: 'Einzelverbrauchergruppe',
      isLineSection: true,
      rows: rowsForSingleConsumerGroup(record, index, snapshot)
    }))
  ];
  if (!sections.length) {
    sections.push({
      title: 'Trinkwasserberechnung',
      isLineSection: true,
      rows: rowsForCurrentCalculation(snapshot, calculation)
    });
  }
  return {
    metadata: {
      dtoType: 'techcalc.generic-module.report',
      dtoVersion: 1,
      moduleId: moduleConfig.id,
      moduleTitle: moduleConfig.title || 'Trinkwasserberechnung',
      reportHeading: 'Berechnungsprotokoll',
      generatedAt: context.generatedAt
    },
    sections
  };
}

const typedReportAdapter = createTypedDtoReportAdapter({
  config,
  schema,
  state,
  calculate,
  buildReportDto: buildDrinkingWaterReportDto
});
const calculateForReport = typedReportAdapter.calculate;

function renderTypedView(snapshot) {
  calculateForReport(snapshot);
  return renderView(snapshot);
}

function updateTypedDynamic(root, snapshot, meta = {}) {
  calculateForReport(snapshot);
  updateDrinkingWaterDynamic(root, snapshot, meta);
}

export default createPlatformModule({
  config,
  schema,
  state,
  calculate: calculateForReport,
  view: renderTypedView,
  bind: bindDrinkingWaterActions,
  dynamicUpdate: updateTypedDynamic,
  isDynamicAction: isDynamicDrinkingWaterAction,
  report: typedReportAdapter.report
});
