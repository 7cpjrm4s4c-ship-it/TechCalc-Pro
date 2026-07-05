import { createLineSectionController } from '../../platform/lineSectionController/index.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { fmt } from '../../utils/calculations.js';

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

export function buildPressureRecord(currentState = {}, result = {}, items = [], id, name, existing = null){
  const copy = { ...currentState };
  delete copy.savedPlants;
  delete copy.activePlantId;
  delete copy.expandedPlantId;
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
      systemVolume: result.systemVolume
    }
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
  accent: 'purple',
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
