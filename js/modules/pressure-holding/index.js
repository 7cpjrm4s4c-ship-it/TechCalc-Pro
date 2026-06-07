import config from './config.js';
import schema from './schema.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { card, field, selectField, segmented, renderModuleShell, stack, grid } from '../../core/renderer.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { fmt, fmtInput } from '../../utils/calculations.js';
import { createSavedRecordActions } from '../../core/savedRecordController.js';
import { renderSavedRecordList, renderSavedRecordPanel, bindEditModeClear } from '../../core/savedRecords.js';
import { renderResultModel } from '../../platform/resultRenderer/index.js';
import { createPressureHoldingDynamicRenderer } from '../../platform/dynamicRenderer/index.js';
import { buildPressureHoldingResultModel } from './results.js';
import { commitAllFields, registerCentralActions } from '../../core/eventPipeline.js';

const opts = (items) => items.map(([value,label]) => ({ value, label }));



function savedPlantSnapshot(s, r){
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

function savedPlantRows(s){
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

function savedPlantsCard(s){
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

function hydrateSavedPlant(item, current){
  return {
    ...(item.state || {}),
    savedPlants: current.savedPlants || [],
    activePlantId: item.id,
    expandedPlantId: current.expandedPlantId || null,
    plantName: item.name || item.state?.plantName || ''
  };
}

function clearSavedPlant(){
  return { activePlantId: null, plantName: '' };
}


function explain(s){
  if(s.holdingType === 'mag'){
    return `MAG statisch: Membran-Druckausdehnungsgefäß mit Gaspolster. ${s.includeServitec === 'true' ? 'Mit Servitec wird nach Reflex-Formblatt ein Zusatzvolumen von 5 l berücksichtigt.' : 'Ohne Servitec wird nur Ausdehnungsvolumen und Wasservorlage angesetzt.'}`;
  }
  return s.dynamicType === 'variomat'
    ? 'Variomat: pumpengesteuerte Druckhaltestation. Das Nennvolumen wird dynamisch mit 1,1 × (Ve + VV) angesetzt; Arbeitsbereich AD 0,4 bar.'
    : 'Reflexomat: kompressorgesteuerte Druckhaltestation. Das Nennvolumen wird dynamisch mit 1,1 × (Ve + VV) angesetzt; Arbeitsbereich AD 0,2 bar.';
}


function basisContent(s){
  return stack([
    segmented('systemType', opts([['heating','Heizwasser'],['cooling','Kühlwasser']]), s.systemType, { accent:'purple' }),
    segmented('holdingType', opts([['mag','MAG statisch'],['dynamic','Druckhaltestation']]), s.holdingType, { accent:'purple' }),
    segmented('connectionType', opts([['suction','Vordruck / Saugseite'],['pressure','Nachdruck / Druckseite']]), s.connectionType, { accent:'purple' }),
    `<p class="tc-help ph-help">${explain(s)}</p>`
  ].join(''));
}

function volumeFieldsContent(s){
  const volumeFields = [
    selectField({ id:'waterContentMode', label:'Anlagenvolumen', value:s.waterContentMode, options:opts([['known','bekannt eingeben'],['estimated','über Leistung schätzen']]) }),
    s.waterContentMode === 'estimated'
      ? field({ id:'heatPowerKw', label:'Gesamtleistung Q', value:fmtInput(s.heatPowerKw,1), unit:'kW' })
      : field({ id:'systemVolumeL', label:'Anlagenvolumen Vₐ', value:fmtInput(s.systemVolumeL,1), unit:'Liter' }),
    s.waterContentMode === 'estimated'
      ? field({ id:'specificWaterContent', label:'spez. Wasserinhalt vₐ', value:fmtInput(s.specificWaterContent,1), unit:'l/kW' })
      : field({ id:'additionalVolumeL', label:'Zusatzvolumen', value:fmtInput(s.additionalVolumeL,1), unit:'Liter' })
  ];
  return grid(volumeFields.join(''), 2);
}

function temperatureFieldsContent(s){
  return grid([
    selectField({ id:'frostMode', label:'Medium', value:s.frostMode, options:opts([['water','Wasser'],['glycol20','Antifrogen N 20 %'],['glycol34','Antifrogen N 34 %']]) }),
    field({ id:'tMinC', label:'tiefste Systemtemperatur', value:fmtInput(s.tMinC,1), unit:'°C' }),
    field({ id:'tMaxC', label:'höchste Temperatur tTR/tmax', value:fmtInput(s.tMaxC,1), unit:'°C' })
  ].join(''), 2);
}

function pressureFieldsContent(s){
  const pressureFields = [
    field({ id:'staticHeightM', label:'statische Höhe H', value:fmtInput(s.staticHeightM,1), unit:'m' }),
    field({ id:'staticPressureBar', label:'statischer Druck pₛₜ manuell', value:fmtInput(s.staticPressureBar,2), unit:'bar' }),
    s.connectionType === 'pressure' ? field({ id:'pumpPressureBar', label:'Pumpendifferenzdruck Δpₚ', value:fmtInput(s.pumpPressureBar,2), unit:'bar' }) : '',
    field({ id:'safetyValveBar', label:'Sicherheitsventil pSV', value:fmtInput(s.safetyValveBar,2), unit:'bar' })
  ].filter(Boolean);
  return `${grid(pressureFields.join(''), 2)}<p class="tc-help ph-help">Ist die statische Höhe eingetragen, wird pₛₜ automatisch mit H/10 berechnet. Der manuelle pₛₜ-Wert gilt nur ohne Höhenangabe.</p>`;
}

function holdingOptionsContent(s){
  return s.holdingType === 'mag'
    ? `${segmented('includeServitec', opts([['false','ohne Servitec'],['true','mit Servitec +5 l']]), s.includeServitec, { accent:'purple' })}<p class="tc-help ph-help">Servitec steht für Entgasung/Nachspeisung. Bei „mit Servitec“ wird das Zusatzvolumen des Entgasungsrohres berücksichtigt.</p>`
    : `${selectField({ id:'dynamicType', label:'Druckhaltestation', value:s.dynamicType, options:opts([['reflexomat','Reflexomat · kompressorgesteuert · AD 0,2 bar'],['variomat','Variomat · pumpengesteuert · AD 0,4 bar']]) })}<p class="tc-help ph-help">Die Auswahl bestimmt Arbeitsbereich AD und die Ergebnisbezeichnung der Station.</p>`;
}

function resultContent(s, r = calculate(s)){
  return renderResultModel(buildPressureHoldingResultModel(s, r, 'purple'), 'purple');
}

function view(s){
  const r = calculate(s);
  const inputColumn = stack([
    card('Berechnungsart', `<div data-ph-dynamic="basis">${basisContent(s)}</div>`, 'purple'),
    card('Anlagenvolumen', `<div data-ph-dynamic="volume-fields">${volumeFieldsContent(s)}</div>`, 'purple'),
    card('Temperaturen / Stoffwerte', `<div data-ph-dynamic="temperature-fields">${temperatureFieldsContent(s)}</div>`, 'purple'),
    card('Druckdaten', `<div data-ph-dynamic="pressure-fields">${pressureFieldsContent(s)}</div>`, 'purple'),
    `<div data-ph-dynamic="saved-records">${savedPlantsCard(s)}</div>`,
    card(s.holdingType === 'mag' ? 'MAG-Optionen' : 'Dynamisches System', `<div data-ph-dynamic="holding-options">${holdingOptionsContent(s)}</div>`, 'purple')
  ].join(''));

  return renderModuleShell(config, `<div class="span-6">${inputColumn}</div><div class="span-6" data-ph-dynamic="result">${resultContent(s, r)}</div>`);
}

function bindPressureHoldingActions(root){
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


const pressureHoldingDynamicRenderer = createPressureHoldingDynamicRenderer({
  calculate,
  fmtInput,
  renderBasis: basisContent,
  renderVolumeFields: volumeFieldsContent,
  renderPressureFields: pressureFieldsContent,
  renderHoldingOptions: holdingOptionsContent,
  renderSavedPanel: savedPlantsCard,
  renderResult: resultContent
});

function updatePressureHoldingDynamic(root, s, meta = {}) {
  pressureHoldingDynamicRenderer.update(root, s, meta);
}

function isDynamicPressureHoldingAction(meta = {}) {
  return String(meta.action || '') !== 'initial';
}


export default createPlatformModule({
  config,
  schema,
  state,
  calculate,
  view,
  bind: bindPressureHoldingActions,
  dynamicUpdate: updatePressureHoldingDynamic,
  isDynamicAction: isDynamicPressureHoldingAction
});
