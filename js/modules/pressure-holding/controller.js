import { createSavedRecordActions } from '../../core/savedRecordController.js';
import { renderSavedRecordList, renderSavedRecordPanel, bindEditModeClear } from '../../core/savedRecords.js';
import { commitAllFields, registerCentralActions } from '../../core/eventPipeline.js';
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

export function savedPlantRows(s = {}){
  return renderSavedRecordList(Array.isArray(s.savedPlants) ? s.savedPlants : [], {
    activeId: s.activePlantId,
    expandedId: s.expandedPlantId,
    emptyText: 'Noch keine Anlagen gespeichert.',
    title: item => item.name || 'Anlage',
    subtitle: savedPlantSubtitle,
    stats: savedPlantStats,
    className: 'ph-saved-list'
  });
}

export function savedPlantsCard(s = {}){
  return renderSavedRecordPanel({
    title: 'Anlagen speichern',
    nameFieldId: 'plantName',
    nameLabel: 'Anlagenbezeichnung',
    nameValue: s.plantName || '',
    namePlaceholder: 'z. B. Heizzentrale BT A',
    addAction: 'pressure:save',
    updateAction: 'pressure:update',
    addDisabled: Boolean(s.activePlantId),
    updateDisabled: !s.activePlantId,
    listHtml: savedPlantRows(s),
    accent: 'purple'
  });
}

export function savedPlantSnapshot(s, r){
  const saved = Array.isArray(s.savedPlants) ? s.savedPlants : [];
  const baseName = s.plantName?.trim() || `${s.holdingType === 'dynamic' ? (s.dynamicType === 'variomat' ? 'Variomat' : 'Reflexomat') : 'MAG'} ${saved.length + 1}`;
  const copy = { ...s };
  delete copy.savedPlants;
  delete copy.activePlantId;
  return {
    id: s.activePlantId || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: baseName,
    createdAt: s.activePlantId ? (saved.find(x => x.id === s.activePlantId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    state: copy,
    result: {
      productLabel: r.productLabel,
      selectedVolume: r.selectedVolume,
      selectedStandardVolume: r.selectedStandardVolume,
      p0: r.p0,
      paMin: r.paMin,
      pe: r.pe,
      systemVolume: r.systemVolume
    }
  };
}

export function hydrateSavedPlant(item, current){
  return {
    ...(item.state || {}),
    savedPlants: current.savedPlants || [],
    activePlantId: item.id,
    expandedPlantId: current.expandedPlantId || null,
    plantName: item.name || item.state?.plantName || ''
  };
}

export function clearSavedPlant(){
  return { activePlantId: null, plantName: '' };
}

export function bindPressureHoldingActions(root, { state, calculate } = {}){
  bindEditModeClear(root, {
    state,
    activeIdKey: 'activePlantId',
    nameKey: 'plantName'
  });

  const actions = createSavedRecordActions({
    root,
    state,
    calculate,
    snapshot: savedPlantSnapshot,
    hydrate: hydrateSavedPlant,
    clear: clearSavedPlant,
    listKey: 'savedPlants',
    activeIdKey: 'activePlantId',
    expandedIdKey: 'expandedPlantId',
    nameKey: 'plantName',
    recordPrefix: 'pressure',
    beforeCreate: ({ root: host }) => commitAllFields(host || root, state, { action: 'pressure:pre-save', notify: false }),
    beforeUpdate: ({ root: host }) => commitAllFields(host || root, state, { action: 'pressure:pre-update', notify: false }),
    preserveSaveScroll: true,
    preserveLoadScroll: true
  });

  registerCentralActions(root, {
    'pressure:save': actions.save,
    'pressure:update': actions.update,
    'saved:load': actions.load,
    'saved:delete': actions.delete,
    'saved:toggle': actions.toggle
  });
}

