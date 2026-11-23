import { createLineSectionController } from '../../core/runtime/index.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { formatNumber, parseNumber } from '../../core/engineering/numberService.js';

const fmt = (value, digits = 2) => formatNumber(value, { maximumFractionDigits: digits });
function num(value) {
  return parseNumber(value, { fallback: 0 });
}

function integerReportText(value) {
  const parsed = num(value);
  return parsed ? String(Math.round(parsed)) : '';
}
function savedPlantStats(item = {}){
  const res = item.result || {};
  const normVolume = res.totalSelectedVolumeL || res.selectedStandardVolume;
  return [
    { label:'Station / Gefäß', value:res.productLabel || '—' },
    { label:'Normvolumen', value:normVolume ? fmt(normVolume,0) : '—', unit:normVolume ? 'Liter' : '' },
    { label:'Mindestbetriebsdruck p₀', value:res.p0 !== undefined ? fmt(res.p0,2) : '—', unit:res.p0 !== undefined ? 'bar' : '' },
    { label:'Enddruck pₑ', value:res.pe !== undefined ? fmt(res.pe,2) : '—', unit:res.pe !== undefined ? 'bar' : '' }
  ];
}
function savedPlantSubtitle(item = {}){
  const res = item.result || {};
  const normVolume = res.totalSelectedVolumeL || res.selectedStandardVolume;
  return [
    res.productLabel,
    normVolume ? `${fmt(normVolume,0)} l` : '',
    res.systemVolume ? `VA ${fmt(res.systemVolume,0)} l` : ''
  ].filter(Boolean).join(' · ');
}
function pressureResultRows(currentState = {}, result = {}) {
  const systemVolume = num(result.systemVolume) || num(currentState.systemVolumeL);
  // MAG: Aufteilung auf mehrere gleiche Gefäße ≤ 1000 l statt Einzel-Standardvolumen
  const isMagSplit = currentState.holdingType === 'mag' && num(result.vesselCount) > 0;
  const selectionRows = isMagSplit
    ? [
        { label: 'Anzahl MAG', value: integerReportText(result.vesselCount) },
        { label: 'Nennvolumen je Gefäß', value: integerReportText(result.vesselVolumeL), unit: 'l' },
        { label: 'Gesamt-Nennvolumen der Auswahl', value: integerReportText(result.totalSelectedVolumeL), unit: 'l' }
      ]
    : [{ label: 'Standardvolumen', value: integerReportText(result.selectedStandardVolume), unit: 'l' }];
  const rows = [
    { label: 'Produkt', value: result.productLabel },
    { label: 'Ausgewähltes Volumen', value: result.selectedVolume, unit: 'l', digits: 2 },
    ...selectionRows,
    { label: 'Anlagenvolumen', value: integerReportText(systemVolume), unit: 'l' },
    { label: 'Vordruck', value: result.p0, unit: 'bar', digits: 2 },
    { label: 'Mindestdruck', value: result.paMin, unit: 'bar', digits: 2 },
    { label: 'Enddruck', value: result.pe, unit: 'bar', digits: 2 },
    { label: 'Ausdehnungskoeffizient', value: result.expansionPct, unit: '%', digits: 2 },
    { label: 'Verdampfungsdruck', value: result.vaporPressure, unit: 'bar', digits: 2 },
    { label: 'Verwendeter statischer Druck', value: result.staticPressure, unit: 'bar', digits: 2 },
    { label: 'Ausdehnungsvolumen', value: result.ve, unit: 'l', digits: 2 },
    { label: 'Wasservorlage', value: result.vv, unit: 'l', digits: 2 },
    { label: 'Schließdruckdifferenz', value: result.asv, unit: 'bar', digits: 2 },
    { label: 'Volumenfaktor', value: result.factor, digits: 2 }
  ];
  
  // Zubehör-Ergebnisse hinzufügen
  const acc = result.accessories || {};
  
  // Servitec
  if (acc.servitec && acc.servitec.type) {
    rows.push({ label: 'Servitec-Typ', value: acc.servitec.label || acc.servitec.type });
  }
  
  // Nachspeisung
  if (acc.fillSystem && acc.fillSystem.system) {
    rows.push({ label: 'Nachspeisesystem', value: acc.fillSystem.label });
    rows.push({ label: 'Nachspeisemenge', value: acc.fillSystem.feedFlowLh, unit: 'l/h', digits: 0 });
  }
  
  // Wasseraufbereitung
  if (acc.waterTreatment && acc.waterTreatment.method) {
    rows.push({ label: 'Wasseraufbereitung', value: acc.waterTreatment.method === 'softening' ? 'Enthärtung' : 'Entsalzung' });
    if (acc.waterTreatment.patronCount > 0) {
      rows.push({ label: 'Patronenzahl', value: acc.waterTreatment.patronCount, digits: 0 });
    }
  }
  
  // Sicherheitsventil
  if (acc.safetyValve && acc.safetyValve.connection) {
    rows.push({ label: 'SV-Anschluss', value: acc.safetyValve.connectionLabel || acc.safetyValve.connection });
    rows.push({ label: 'Abblaseleistung', value: acc.safetyValve.flowRateLh, unit: 'l/h', digits: 0 });
  }
  
  return rows
    .filter(row => row.value !== undefined && row.value !== null && row.value !== '')
    .map(row => [
      row.label,
      typeof row.value === 'number' ? fmt(row.value, row.digits ?? 2) : String(row.value),
      row.unit || ''
    ]);
}
export function buildPressureRecord(currentState = {}, result = {}, items = [], id, name, existing = null){
  const copy = { ...currentState };
  delete copy.savedPlants;
  delete copy.activePlantId;
  delete copy.expandedPlantId;
  const systemVolume = num(result.systemVolume) || num(currentState.systemVolumeL);
  const acc = result.accessories || {};
  return {
    id,
    name: name || currentState.plantName?.trim() || existing?.name || `${currentState.holdingType === 'dynamic' ? (currentState.dynamicType === 'variomat' ? 'Variomat' : 'Reflexomat') : 'MAG'} ${items.length + 1}`,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    state: copy,
    result: {
      productLabel: result.productLabel,
      selectedVolume: result.selectedVolume,
      selectedStandardVolume: result.selectedStandardVolume,
      ...(currentState.holdingType === 'mag' ? {
        vesselCount: result.vesselCount,
        vesselVolumeL: result.vesselVolumeL,
        totalSelectedVolumeL: result.totalSelectedVolumeL
      } : {}),
      p0: result.p0,
      paMin: result.paMin,
      pe: result.pe,
      systemVolume,
      expansionPct: result.expansionPct,
      vaporPressure: result.vaporPressure,
      staticPressure: result.staticPressure,
      ve: result.ve,
      vv: result.vv,
      asv: result.asv,
      factor: result.factor,
      accessories: {
        servitec: acc.servitec ? { type: acc.servitec.type, label: acc.servitec.label } : null,
        fillSystem: acc.fillSystem ? { system: acc.fillSystem.system, label: acc.fillSystem.label, feedFlowLh: acc.fillSystem.feedFlowLh } : null,
        waterTreatment: acc.waterTreatment ? { method: acc.waterTreatment.method, patronCount: acc.waterTreatment.patronCount } : null,
        safetyValve: acc.safetyValve ? { connection: acc.safetyValve.connection, connectionLabel: acc.safetyValve.connectionLabel, flowRateLh: acc.safetyValve.flowRateLh } : null
      }
    },
    rows: pressureResultRows(currentState, result)
  };
}
export function hydratePressureRecord(item = {}, current = {}){
  // Migration: includeServitec -> useServitec
  const state = item?.state ? { ...item.state } : {};
  
  // Wenn useServitec nicht gesetzt ist, aber includeServitec gesetzt war, migriere
  if (state.useServitec === undefined && state.includeServitec !== undefined) {
    state.useServitec = state.includeServitec;
  }
  
  // Default für useServitec auf 'true' setzen, wenn nicht vorhanden
  if (state.useServitec === undefined) {
    state.useServitec = 'true';
  }
  
  // Default für servitecType auf 'auto' setzen
  if (state.servitecType === undefined) {
    state.servitecType = 'auto';
  }
  
  // Default für feedType auf 'manual' setzen
  if (state.feedType === undefined) {
    state.feedType = 'manual';
  }
  
  // Default für waterTreatmentMethod auf 'softening' setzen
  if (state.waterTreatmentMethod === undefined) {
    state.waterTreatmentMethod = 'softening';
  }
  
  return state ? {
    ...state,
    savedPlants: current.savedPlants || [],
    activePlantId: item.id,
    expandedPlantId: current.expandedPlantId || null,
    plantName: item.name || state.plantName || ''
  } : {};
}
export const pressureHoldingSavedController = createLineSectionController({
  state,
  listKey: 'savedPlants',
  activeIdKey: 'activePlantId',
  nameKey: 'plantName',
  expandedIdKey: 'expandedPlantId',
  recordPrefix: 'pressure',
  cardTitle: 'Anlagen speichern',
  nameLabel: 'Anlagenbezeichnung',
  nameInputId: 'plantName',
  namePlaceholder: 'z. B. Heizzentrale BT A',
  emptyText: 'Noch keine Anlagen gespeichert.',
  accent: 'blue',
  dynamicAttr: 'saved-records',
  dynamicDataAttr: 'data-ph-dynamic',
  title: item => item.name || 'Anlage',
  subtitle: savedPlantSubtitle,
  stats: savedPlantStats,
  currentResult: () => calculate(state.get()),
  buildRecord: ({ currentState, result, items, id, name, existing }) => buildPressureRecord(currentState, result, items, id, name, existing),
  hydrateRecord: ({ item, currentState }) => hydratePressureRecord(item, currentState)
});
export function savedPlantsCard(s = {}){
  return pressureHoldingSavedController.renderCard(s);
}

export function bindPressureHoldingActions(root){
  pressureHoldingSavedController.bind(root);
}
