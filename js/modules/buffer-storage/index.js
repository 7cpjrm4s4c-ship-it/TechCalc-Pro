import config from './config.js';
import schema from './schema.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { card, field, selectField, segmented, renderModuleShell, stack, grid, inlineStats } from '../../core/renderer.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { fmt, fmtInput } from '../../utils/calculations.js';
import { bindBufferStorageActions, bufferSaveCard } from './controller.js';
import { buildBufferStorageResultModel } from './results.js';
import { renderResultModel } from '../../platform/resultRenderer/index.js';

const opts = items => items.map(([value, label]) => ({ value, label }));

function savedCard(s){
  return bufferSaveCard(s);
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
    renderResultModel(buildBufferStorageResultModel(s, r, 'cyan'), 'cyan')
  ].join(''));

  return renderModuleShell(config, `<div class="span-6">${inputColumn}</div><div class="span-6">${resultColumn}</div>`);
}
function bindActions(root){
  bindBufferStorageActions(root);
}


export default createPlatformModule({
  config,
  schema,
  state,
  calculate,
  view,
  bind: bindActions,
  isDynamicAction: () => false
});
