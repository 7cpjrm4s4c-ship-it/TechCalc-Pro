import { createLineSectionController } from '../../platform/lineSectionController/index.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { fmt } from '../../utils/calculations.js';
import { parseNumber } from '../../core/numberService.js';

function num(value) {
  return parseNumber(value, { fallback: 0 });
}

function integerReportText(value) {
  const parsed = num(value);
  return parsed ? String(Math.round(parsed)) : '';
}

function savedPlantStats(item = {}){
  const res = item.result || {};
  return [
    { label:'Station / Gefäß', value:res.productLabel || '—' },
    { label:'Normvolumen', value:res.selectedStandardVolume ? fmt(res.selectedStandardVolume,0) : '—', unit:res.selectedStandardVolume ? 'Liter' : '' },
    { label:'Mindestbetriebsdruck p₀', value:res.p0 !== undefined ? fmt(res.p0,2) : '—', unit:res.p0 !== undefined ? 'bar' : '' },
    { label:'Enddruck pₑ', value:res.pe !== undefined ? fmt(res.pe,2) : '—', unit:res.pe !== undefined ? 'bar' : '' }
  ];
}

function savedPlantSubtitle(item = {}){
  const res = item.result || {};
  return [
    res.productLabel,
    res.selectedStandardVolume ? `${fmt(res.selectedStandardVolume,0)} l` : '',
    res.systemVolume ? `VA ${fmt(res.systemVolume,0)} l` : ''
  ].filter(Boolean).join(' · ');
}

function pressureResultRows(currentState = {}, result = {}) {
  const systemVolume = num(result.systemVolume) || num(currentState.systemVolumeL);
  const rows = [
    { label: 'Produkt', value: result.productLabel },
    { label: 'Ausgewähltes Volumen', value: result.selectedVolume, unit: 'l', digits: 2 },
    { label: 'Standardvolumen', value: integerReportText(result.selectedStandardVolume), unit: 'l' },
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
      factor: result.factor
    },
    rows: pressureResultRows(currentState, result)
  };
}

export function hydratePressureRecord(item = {}, current = {}){
  return item?.state ? {
    ...item.state,
    savedPlants: current.savedPlants || [],
    activePlantId: item.id,
    expandedPlantId: current.expandedPlantId || null,
    plantName: item.name || item.state?.plantName || ''
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
