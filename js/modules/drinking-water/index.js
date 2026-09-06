import config from './config.js';
import schema from './schema.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { createTypedDtoReportAdapter } from '../../core/typedDtoReportAdapter.js';
import { bindDrinkingWaterActions } from './controller.js';
import { renderView } from './view.js';
import { updateDrinkingWaterDynamic, isDynamicDrinkingWaterAction } from './dynamicRenderer.js';

const BUILDING_LABELS = Object.freeze({
  residential: 'Wohngebäude / Nutzungseinheiten',
  hotel: 'Hotel',
  hospital: 'Bettenhaus Krankenhaus',
  school: 'Schule / Verwaltungsgebäude',
  senior: 'Wohnheim / Seniorenheim'
});

function fmtReportValue(value, digits = 2) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Intl.NumberFormat('de-DE', { maximumFractionDigits: digits }).format(value);
  }
  return String(value ?? '').trim() || '-';
}
function numeric(value, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const normalized = String(value ?? '').trim().replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}
function hasValue(value) {
  return value !== undefined && value !== null && value !== '';
}
function row(label, value, unit = '', digits = 2) {
  return hasValue(value) ? [label, fmtReportValue(value, digits), unit] : null;
}
function warmWaterLabel(value) {
  if (value === true) return 'Zentrale Warmwasserbereitung';
  if (value === false) return 'Dezentrale Warmwasserbereitung';
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'central' || normalized === 'zentral') return 'Zentrale Warmwasserbereitung';
  if (normalized === 'decentral' || normalized === 'dezentral') return 'Dezentrale Warmwasserbereitung';
  return '';
}
function selectedWarmWaterMode(snapshot = {}, calculation = {}) {
  return calculation.warmWaterMode || snapshot.waterHeatingMode || snapshot.warmWaterMode || snapshot.centralWarmWater;
}
function selectedWarmWaterLabel(snapshot = {}, calculation = {}) {
  return warmWaterLabel(selectedWarmWaterMode(snapshot, calculation));
}
function selectedBuildingLabel(snapshot = {}, calculation = {}) {
  return calculation.building?.label || BUILDING_LABELS[snapshot.buildingType] || fmtReportValue(snapshot.buildingType || snapshot.building);
}
function yesNo(value) {
  return value === true || String(value).toLowerCase() === 'true' ? 'ja' : 'nein';
}
function consumerTitle(consumer = {}, index = 0) {
  return consumer.label || consumer.name || consumer.typeLabel || consumer.fixtureLabel || consumer.title || `Einrichtungsgegenstand ${index + 1}`;
}
function consumerCount(consumer = {}) {
  return Math.max(0, numeric(consumer.count ?? consumer.quantity ?? consumer.anzahl ?? consumer.amount ?? 1, 1));
}
function consumerFlow(consumer = {}) {
  return numeric(consumer.vr ?? consumer.flow ?? consumer.calculationFlow, 0);
}
function consumerPressure(consumer = {}) {
  return numeric(consumer.pmin ?? consumer.minimumFlowPressure ?? consumer.minimumPressure, 0);
}
function consumerTotalFlow(consumer = {}) {
  return consumerCount(consumer) * consumerFlow(consumer);
}
function waterUseLabel(consumer = {}) {
  return consumer.hotWater ? 'mit Warmwasser' : 'nur Kaltwasser';
}
function consumerDetail(consumer = {}) {
  const count = consumerCount(consumer);
  const flow = consumerFlow(consumer);
  const parts = [
    `Anzahl ${fmtReportValue(count, 0)} Stk.`,
    `Berechnungsdurchfluss je Stück ${fmtReportValue(flow)} l/s`,
    `Summe Berechnungsdurchfluss ${fmtReportValue(count * flow)} l/s`
  ];
  if (hasValue(consumer.pmin)) parts.push(`Mindestfließdruck ${fmtReportValue(consumerPressure(consumer))} bar`);
  parts.push(waterUseLabel(consumer));
  if (consumer.permanent) parts.push('Dauerverbraucher');
  return parts.join(' · ');
}
function rowsFromFixtureSummary(snapshot = {}, calculation = {}) {
  const aggregate = new Map();
  const addConsumer = (consumer = {}) => {
    const label = consumerTitle(consumer, aggregate.size);
    const flow = consumerFlow(consumer);
    const pmin = consumerPressure(consumer);
    const hotWater = Boolean(consumer.hotWater);
    const permanent = Boolean(consumer.permanent);
    const key = `${label}|${flow}|${pmin}|${hotWater ? '1' : '0'}|${permanent ? '1' : '0'}`;
    const current = aggregate.get(key) || {
      label,
      count: 0,
      vr: flow,
      pmin,
      hotWater,
      permanent
    };
    current.count += consumerCount(consumer);
    aggregate.set(key, current);
  };
  const usageUnits = Array.isArray(calculation.usageUnits) && calculation.usageUnits.length
    ? calculation.usageUnits
    : Array.isArray(snapshot.savedUsageUnits) ? snapshot.savedUsageUnits : [];
  usageUnits.forEach(unit => (unit.consumers || []).forEach(addConsumer));
  const singleGroups = Array.isArray(calculation.singleGroups) && calculation.singleGroups.length
    ? calculation.singleGroups
    : Array.isArray(snapshot.savedSingleConsumers) ? snapshot.savedSingleConsumers : [];
  singleGroups.forEach(group => {
    if (Array.isArray(group.consumers) && group.consumers.length) {
      group.consumers.forEach(addConsumer);
    } else {
      addConsumer(group);
    }
  });
  const rows = [...aggregate.values()].map((consumer, index) => [
    `${index + 1}. ${consumer.label}`,
    consumerDetail(consumer),
    ''
  ]);
  return [
    ['Bezeichnung', 'Zusammenstellung Einrichtungsgegenstände', ''],
    ...(rows.length ? rows : [['Status', 'Keine Einrichtungsgegenstände gespeichert', '']])
  ];
}
function countConsumers(consumers = []) {
  return consumers.reduce((sum, consumer) => sum + consumerCount(consumer), 0);
}
function singleGroupFlow(group = {}, warmWaterMode = 'central') {
  return (group.consumers || []).reduce((sum, consumer) => {
    const count = consumerCount(consumer);
    const baseFlow = consumerFlow(consumer) * count;
    if (!consumer.hotWater) return sum + baseFlow;
    const addonFlow = warmWaterMode === 'decentral' ? 0.05 * count : consumerFlow(consumer) * count;
    return sum + baseFlow + addonFlow;
  }, 0);
}
function rowsForUsageUnit(record = {}, index = 0, snapshot = {}, calculation = {}) {
  const hasGl = hasValue(record.simultaneityFactor);
  return [
    ['Bezeichnung', record.name || record.label || `Nutzungseinheit ${index + 1}`, ''],
    row('Gebäude-/Nutzungsart', selectedBuildingLabel(snapshot, calculation)),
    row('Warmwasserbereitung', selectedWarmWaterLabel(snapshot, calculation)),
    row('Anzahl Einrichtungsgegenstände', record.consumerCount ?? countConsumers(record.consumers || []), '', 0),
    row('Installierter Summendurchfluss', record.rawFlow, 'l/s'),
    row('Wirksamer Summendurchfluss', record.sumFlow, 'l/s'),
    row('Spitzendurchfluss Nutzungseinheit', record.peakFlow, 'l/s'),
    row('Berechnungsansatz', hasGl ? `Gleichzeitigkeitsfaktor ${fmtReportValue(record.simultaneityFactor)}` : 'Ansatz nach Nutzungseinheit: zwei größte Entnahmestellen')
  ].filter(Boolean);
}
function rowsForSingleConsumerGroup(record = {}, index = 0, snapshot = {}, calculation = {}) {
  const warmWaterMode = selectedWarmWaterMode(snapshot, calculation) === 'decentral' ? 'decentral' : 'central';
  const consumers = Array.isArray(record.consumers) ? record.consumers : [];
  return [
    ['Bezeichnung', record.name || record.label || `Einzelverbrauchergruppe ${index + 1}`, ''],
    row('Gebäude-/Nutzungsart', selectedBuildingLabel(snapshot, calculation)),
    row('Warmwasserbereitung', selectedWarmWaterLabel(snapshot, calculation)),
    row('Anzahl Einrichtungsgegenstände', countConsumers(consumers), '', 0),
    row('Wirksamer Summendurchfluss Gruppe', singleGroupFlow(record, warmWaterMode), 'l/s'),
    row('Dauerverbraucher enthalten', yesNo(consumers.some(consumer => consumer.permanent))),
    row('Berechnungsansatz', 'Einzelverbraucher außerhalb der Nutzungseinheiten')
  ].filter(Boolean);
}
function rowsForCalculationResult(snapshot = {}, calculation = {}) {
  const usageUnitCount = Array.isArray(calculation.usageUnits) ? calculation.usageUnits.length : 0;
  const singleGroupCount = Array.isArray(calculation.singleGroups) ? calculation.singleGroups.length : 0;
  return [
    ['Bezeichnung', 'Berechnungsergebnisse', ''],
    row('Gebäude-/Nutzungsart', selectedBuildingLabel(snapshot, calculation)),
    row('Warmwasserbereitung', selectedWarmWaterLabel(snapshot, calculation)),
    row('Anzahl Nutzungseinheiten', usageUnitCount, '', 0),
    row('Anzahl Einzelverbrauchergruppen', singleGroupCount, '', 0),
    row('Summendurchfluss Nutzungseinheiten', calculation.neSumFlow, 'l/s'),
    row('Spitzendurchfluss Nutzungseinheiten', calculation.nePeakSum, 'l/s'),
    row('Summendurchfluss Einzelverbraucher', calculation.singleSumFlow, 'l/s'),
    row('Gesamtsummendurchfluss', calculation.totalSumFlow, 'l/s'),
    row('Dauerverbrauch', calculation.permanentFlow, 'l/s'),
    row('Spitzendurchfluss', calculation.peakFlow, 'l/s'),
    row('Berechnungsansatz', calculation.formulaText)
  ].filter(Boolean);
}
function rowsForHouseConnection(calculation = {}) {
  return [
    ['Bezeichnung', 'Dimensionierung Hauseinführung', ''],
    row('Auslegungsdurchfluss', calculation.house?.flowM3h, 'm³/h'),
    row('Nennweite Hauseinführung', calculation.house?.dn),
    row('Wasserzähler', calculation.house?.meter),
    row('Q3 Wasserzähler', calculation.house?.q3, 'm³/h', 0),
    row('Dimensionierungsansatz', 'vorläufig über Spitzendurchfluss')
  ].filter(Boolean);
}
function rowsForCurrentCalculation(snapshot = {}, calculation = {}) {
  return [
    ['Bezeichnung', snapshot.name || 'Aktuelle Trinkwasserberechnung', ''],
    ...rowsForCalculationResult(snapshot, calculation).filter(item => item[0] !== 'Bezeichnung'),
    ...rowsForHouseConnection(calculation).filter(item => item[0] !== 'Bezeichnung')
  ];
}
function buildDrinkingWaterReportDto(context = {}) {
  const moduleConfig = context.config || config;
  const snapshot = context.state || {};
  const calculation = calculate(snapshot);
  const usageUnits = Array.isArray(calculation.usageUnits) ? calculation.usageUnits.filter(unit => !unit.transient) : [];
  const singleGroups = Array.isArray(calculation.singleGroups) ? calculation.singleGroups.filter(group => !group.transient) : [];
  const sections = [
    ...usageUnits.map((record, index) => ({
      title: 'Trinkwasser',
      isLineSection: true,
      rows: rowsForUsageUnit(record, index, snapshot, calculation)
    })),
    ...singleGroups.map((record, index) => ({
      title: 'Trinkwasser',
      isLineSection: true,
      rows: rowsForSingleConsumerGroup(record, index, snapshot, calculation)
    })),
    {
      title: 'Trinkwasser',
      isLineSection: true,
      rows: rowsForCalculationResult(snapshot, calculation)
    },
    {
      title: 'Trinkwasser',
      isLineSection: true,
      rows: rowsForHouseConnection(calculation)
    },
    {
      title: 'Trinkwasser',
      isLineSection: true,
      rows: rowsFromFixtureSummary(snapshot, calculation)
    }
  ];
  if (!usageUnits.length && !singleGroups.length) {
    sections.unshift({
      title: 'Trinkwasser',
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
