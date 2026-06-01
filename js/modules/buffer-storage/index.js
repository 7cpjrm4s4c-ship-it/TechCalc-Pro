import config from './config.js';
import schema from './schema.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { card, field, selectField, segmented, renderModuleShell, stack, grid, mainResult, resultCard, resultRows, inlineStats, esc } from '../../core/renderer.js';
import { mountModule } from '../../core/mount.js';
import { fmt, fmtInput } from '../../utils/calculations.js';
import { bindSavedRecordWorkflow } from '../../core/savedRecordController.js';

const opts = items => items.map(([value, label]) => ({ value, label }));

function modeLabel(mode){
  if(mode === 'defrost') return 'Wärmepumpe / Abtauung';
  if(mode === 'reserve') return 'Wasservorlage';
  if(mode === 'compare') return 'Vergleich / maßgebend';
  return 'Mindestlaufzeit';
}
function mediumLabel(s){
  if(s.mediumMode === 'water') return 'Wasser';
  const name = s.glycolType === 'propylene' ? 'Propylenglykol' : 'Ethylenglykol';
  return `${name} ${s.glycolConcentration} %`;
}
function warnList(items){
  if(!items.length) return '<div class="empty-state empty-state--compact">Keine Plausibilitätswarnungen.</div>';
  return `<div class="tc-warning-list ph-warnings">${items.map(item => `<div class="tc-warning ph-warning"><span>Hinweis</span><strong>${esc(item)}</strong></div>`).join('')}</div>`;
}
function savedSnapshot(s, r){
  const saved = Array.isArray(s.savedCalculations) ? s.savedCalculations : [];
  const copy = { ...s };
  delete copy.savedCalculations;
  delete copy.activeCalculationId;
  return {
    id: s.activeCalculationId || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: s.plantName?.trim() || `Pufferspeicher ${saved.length + 1}`,
    createdAt: s.activeCalculationId ? (saved.find(x => x.id === s.activeCalculationId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    state: copy,
    result: { mode: s.calculationMode, volume: r.decisiveVolume, standard: r.nextStandardVolume, medium: mediumLabel(s) }
  };
}
function savedRows(items = []){
  if(!items.length) return '<div class="empty-state empty-state--compact">Noch keine Pufferspeicher-Berechnungen gespeichert.</div>';
  return `<div class="tc-saved-list ph-saved-list">${items.map(item => {
    const res = item.result || {};
    const subtitle = [modeLabel(res.mode), res.standard ? `${fmt(res.standard,0)} l` : '', res.medium].filter(Boolean).join(' · ');
    return `<article class="ph-saved-item line-section-card is-collapsed ${state.get().activeCalculationId === item.id ? 'is-active' : ''}" data-line-card data-buffer-select="${esc(item.id)}">
      <div class="line-section-card__head">
        <div class="line-section-card__title" ><strong>${esc(item.name || 'Berechnung')}</strong><small>${esc(subtitle || 'gespeicherte Berechnung')}</small></div>
        <button type="button" class="line-section-card__toggle" data-line-toggle aria-expanded="false" aria-label="Gespeicherte Berechnung aufklappen"><span>▾</span></button>
        <button type="button" class="line-section-card__delete" data-buffer-delete="${esc(item.id)}" aria-label="Berechnung löschen">×</button>
      </div>
      <div class="line-section-card__body">${resultRows([
        { label:'Berechnungsart', value:modeLabel(res.mode) },
        { label:'Normvolumen', value:res.standard ? fmt(res.standard,0) : '—', unit:res.standard ? 'Liter' : '' },
        { label:'Volumen', value:res.volume ? fmt(res.volume,1) : '—', unit:res.volume ? 'Liter' : '' },
        { label:'Medium', value:res.medium || '—' }
      ])}</div>
    </article>`;
  }).join('')}</div>`;
}

function clearedBufferInputs() {
  return {
    plantName: '',
    activeCalculationId: null,
    qMaxKw: '',
    partLoadFactor: '',
    qLoadKw: '',
    compressorRunTimeMin: '',
    controllerDeltaT: '',
    existingSystemVolumeL: '',
    qConsumerKw: '',
    qDefrostKw: '',
    qHeatingCircuitKw: '',
    maxDefrostTimeMin: '',
    hydraulicDeltaT: '',
    consumerFlowM3h: '',
    bridgeTimeMin: ''
  };
}

function savedCard(s){
  return card('Berechnung speichern', stack([
    field({ id:'plantName', label:'Bezeichnung', value:s.plantName || '', placeholder:'z. B. Kaltwassersatz BT A', inputmode:'text' }),
    `<div class="tc-save-actions"><button type="button" class="action-button" data-buffer-save ${s.activeCalculationId ? 'disabled' : ''}>Speichern</button><button type="button" class="action-button" data-buffer-update ${s.activeCalculationId ? '' : 'disabled'}>Aktualisieren</button></div>`,
    savedRows(Array.isArray(s.savedCalculations) ? s.savedCalculations : [])
  ].join('')), 'cyan');
}
function glycolFields(s){
  if(s.mediumMode === 'water') return '';
  const concentrations = s.glycolType === 'propylene' ? ['25','30','35','40','45','50'] : ['20','25','30','35','40','45','50'];
  return grid([
    selectField({ id:'glycolType', label:'Glykolart', value:s.glycolType, options:opts([['ethylene','Ethylenglykol'],['propylene','Propylenglykol']]) }),
    selectField({ id:'glycolConcentration', label:'Konzentration', value:s.glycolConcentration, options:concentrations.map(v => ({ value:v, label:`${v} %` })) })
  ].join(''), 2);
}
function bufferInputGrid(content, modifier = ''){
  return `<div class="buffer-input-grid ${modifier}">${content}</div>`;
}
function runtimeInputs(s){
  return card('Mindestlaufzeit Verdichter', bufferInputGrid([
    field({ id:'qMaxKw', label:'QMax · max. Geräte-/Kälte-/Heizleistung', value:fmtInput(s.qMaxKw,2), unit:'kW' }),
    field({ id:'compressorRunTimeMin', label:'TLaufzeit · Mindestlaufzeit Verdichter', value:fmtInput(s.compressorRunTimeMin,2), unit:'min' }),
    field({ id:'qLoadKw', label:'QLast · konstante Lastabnahme', value:fmtInput(s.qLoadKw,2), unit:'kW' }),
    field({ id:'partLoadFactor', label:'Teillast · kleinste Teillaststufe', value:fmtInput(s.partLoadFactor,3), unit:'%' }),
    field({ id:'controllerDeltaT', label:'ΔT Hydraulikkreislauf', value:fmtInput(s.controllerDeltaT,2), unit:'K' }),
    field({ id:'existingSystemVolumeL', label:'vorhandener Systeminhalt abziehen', value:fmtInput(s.existingSystemVolumeL,1), unit:'Liter' }),
    '<p class="tc-help ph-help ph-help--inline buffer-help"><strong>Teillast:</strong> prozentualer Leistungsanteil der kleinsten Verdichter-/Leistungsstufe. Beispiel: 4 gleich große Verdichter ⇒ 25 %. Die Berechnung nutzt intern 0,25.</p>',
    '<p class="tc-help ph-help ph-help--inline buffer-help"><strong>QLast:</strong> konstant durch aktive Verbraucher abgenommene Leistung. Falls keine konstante Last vorhanden oder bekannt ist, 0 kW eintragen.</p>'
  ].join(''), 'buffer-input-grid--runtime'), 'cyan');
}
function defrostInputs(s){
  return card('Abtaubetrieb Wärmepumpe', bufferInputGrid([
    field({ id:'qConsumerKw', label:'QVerbraucher · Heizleistung aktive Verbraucher', value:fmtInput(s.qConsumerKw,2), unit:'kW' }),
    field({ id:'qDefrostKw', label:'QKälte · Kälteleistung bei Abtauung', value:fmtInput(s.qDefrostKw,2), unit:'kW' }),
    field({ id:'qHeatingCircuitKw', label:'QHeiz · Heizleistung verbleibender Kreis', value:fmtInput(s.qHeatingCircuitKw,2), unit:'kW' }),
    field({ id:'maxDefrostTimeMin', label:'TMaxAbtauung · maximale Abtauzeit', value:fmtInput(s.maxDefrostTimeMin,2), unit:'min' }),
    field({ id:'hydraulicDeltaT', label:'ΔT Hydraulikkreislauf', value:fmtInput(s.hydraulicDeltaT,2), unit:'K' }),
    field({ id:'existingSystemVolumeL', label:'vorhandener Systeminhalt abziehen', value:fmtInput(s.existingSystemVolumeL,1), unit:'Liter' })
  ].join(''), 'buffer-input-grid--defrost'), 'cyan');
}
function reserveInputs(s){
  return card('Wasservorlage als Kälte- / Wärmespeicher', bufferInputGrid([
    field({ id:'consumerFlowM3h', label:'Volumenstrom Verbraucher', value:fmtInput(s.consumerFlowM3h,3), unit:'m³/h' }),
    field({ id:'bridgeTimeMin', label:'Überbrückungszeit', value:fmtInput(s.bridgeTimeMin,2), unit:'min' })
  ].join(''), 'buffer-input-grid--reserve'), 'cyan');
}
function inputBlocks(s){
  if(s.calculationMode === 'compare') return [runtimeInputs(s), defrostInputs(s), reserveInputs(s)].join('');
  if(s.calculationMode === 'defrost') return defrostInputs(s);
  if(s.calculationMode === 'reserve') return reserveInputs(s);
  return runtimeInputs(s);
}
function view(s){
  const r = calculate(s);
  const main = { label:'Erforderliches Pufferspeichervolumen', value:r.decisiveVolume > 0 ? fmt(r.decisiveVolume,1) : '—', unit:r.decisiveVolume > 0 ? 'Liter' : '' };
  const details = [
    { label:'Nächstes Normvolumen', value:r.nextStandardVolume ? fmt(r.nextStandardVolume,0) : '—', unit:r.nextStandardVolume ? 'Liter' : '' },
    { label:'Berechnungsart', value:modeLabel(s.calculationMode) },
    { label:'Medium / Faktor', value:`${mediumLabel(s)} / ${fmt(r.factor,2)}` },
    { label:'minimaler Systeminhalt', value:fmt(r.decisiveSystemVolume,1), unit:'Liter' }
  ];

  const inputColumn = stack([
    card('Berechnungsart', stack([
      `<div class="buffer-mode-tabs">${segmented('calculationMode', opts([['runtime','Mindestlaufzeit'],['defrost','Abtauung'],['reserve','Wasservorlage'],['compare','Vergleich']]), s.calculationMode, { accent:'cyan' })}</div>`,
      '<p class="tc-help ph-help">Die Auslegung kann die Mindestlaufzeit von Verdichtern, den Abtaubetrieb luftgekühlter Wärmepumpen oder eine definierte Kälte-/Wärmevorlage betrachten.</p>'
    ].join('')), 'cyan'),
    card('Medium / Faktor', stack([
      selectField({ id:'mediumMode', label:'Wärmeträger', value:s.mediumMode, options:opts([['water','Wasser'],['glycol','Wasser-Glykol-Gemisch']]) }),
      glycolFields(s),
      inlineStats([{ label:'Berechnungsfaktor', value:fmt(r.factor,2) }, { label:'Grundlage', value:'Mitsubishi-Formel' }])
    ].join('')), 'cyan'),
    inputBlocks(s),
    savedCard(s)
  ].join(''));

  const resultColumn = stack([
    mainResult('Ergebnis Pufferspeicher', main, details, 'cyan'),
    resultCard('Zwischenergebnisse', [
      { label:'Leistungsanteil Mindestlaufzeit', value:fmt(r.runtimePower,2), unit:'kW' },
      { label:'Systeminhalt Mindestlaufzeit', value:fmt(r.runtimeSystemVolume,1), unit:'Liter' },
      { label:'Puffervolumen Mindestlaufzeit', value:fmt(r.runtimeBufferVolume,1), unit:'Liter' },
      { label:'Leistungsbilanz Abtauung', value:fmt(r.defrostPower,2), unit:'kW' },
      { label:'Systeminhalt Abtauung', value:fmt(r.defrostSystemVolume,1), unit:'Liter' },
      { label:'Puffervolumen Abtauung', value:fmt(r.defrostBufferVolume,1), unit:'Liter' },
      { label:'Wasservorlage', value:fmt(r.reserveVolume,1), unit:'Liter' },
      { label:'abgezogener Systeminhalt', value:fmt(r.existingSystemVolume,1), unit:'Liter' }
    ], 'cyan'),
    card('Formeln / Plausibilität', stack([
      '<div class="formula tc-formula ph-formula">V = ((QMax × Teillast − QLast) × Faktor × TLaufzeit) / ΔTHydraulik</div>',
      '<div class="formula tc-formula ph-formula">VAbtau = ((QVerbraucher + QKälte − QHeiz) × Faktor × TMaxAbtauung) / ΔTHydraulik</div>',
      '<div class="formula tc-formula ph-formula">VWasservorlage = V̇Verbraucher × tÜberbrückung × 1000 / 60</div>',
      warnList(r.warnings)
    ].join('')), 'cyan')
  ].join(''));

  return renderModuleShell(config, `<div class="span-6">${inputColumn}</div><div class="span-6">${resultColumn}</div>`);
}
function bindActions(root){
  bindSavedRecordWorkflow(root, {
    state,
    calculate,
    snapshot: savedSnapshot,
    hydrate: (item, current) => ({
      ...(item.state || {}),
      savedCalculations: current.savedCalculations || [],
      activeCalculationId: item.id,
      plantName: item.name || item.state?.plantName || ''
    }),
    clear: current => ({ ...clearedBufferInputs(), savedCalculations: current.savedCalculations || [] }),
    listKey: 'savedCalculations',
    activeIdKey: 'activeCalculationId',
    nameKey: 'plantName',
    recordPrefix: 'buffer',
    saveSelector: '[data-buffer-save]',
    updateSelector: '[data-buffer-update]',
    loadAttr: 'data-buffer-select',
    deleteAttr: 'data-buffer-delete',
    preserveSaveScroll: true,
    preserveLoadScroll: true,
    clearOnOutsideClick: true
  });
}

export default { config, schema, state, mount(root){ return mountModule(root, state, view, bindActions); } };
