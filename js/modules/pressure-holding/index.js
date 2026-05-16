import config from './config.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { card, field, selectField, segmented, renderModuleShell, stack, grid, mainResult, resultCard } from '../../core/renderer.js';
import { mountModule } from '../../core/mount.js';
import { fmt, fmtInput } from '../../utils/calculations.js';

const opts = (items) => items.map(([value,label]) => ({ value, label }));

function warnList(items){
  if(!items.length) return '<div class="empty-state empty-state--compact ph-note">Keine Plausibilitätswarnungen.</div>';
  return `<div class="ph-warnings">${items.map(w => `<div class="ph-warning"><span>Hinweis</span><strong>${w}</strong></div>`).join('')}</div>`;
}

function explain(s){
  if(s.holdingType === 'mag'){
    return `MAG statisch: Membran-Druckausdehnungsgefäß mit Gaspolster. ${s.includeServitec === 'true' ? 'Mit Servitec wird nach Reflex-Formblatt ein Zusatzvolumen von 5 l berücksichtigt.' : 'Ohne Servitec wird nur Ausdehnungsvolumen und Wasservorlage angesetzt.'}`;
  }
  return s.dynamicType === 'variomat'
    ? 'Variomat: pumpengesteuerte Druckhaltestation. Das Nennvolumen wird dynamisch mit 1,1 × (Ve + VV) angesetzt; Arbeitsbereich AD 0,4 bar.'
    : 'Reflexomat: kompressorgesteuerte Druckhaltestation. Das Nennvolumen wird dynamisch mit 1,1 × (Ve + VV) angesetzt; Arbeitsbereich AD 0,2 bar.';
}

function view(s){
  const r = calculate(s);
  const main = s.holdingType === 'dynamic'
    ? { label:`Erforderliches Nennvolumen ${s.dynamicType === 'variomat' ? 'Variomat' : 'Reflexomat'}`, value:fmt(r.vnDynamic,1), unit:'Liter' }
    : { label:'Erforderliches MAG-Nennvolumen', value:r.vnMag > 0 ? fmt(r.vnMag,1) : '—', unit:r.vnMag > 0 ? 'Liter' : '' };
  const details = [
    { label: s.holdingType === 'dynamic' ? 'Auswahl Station / Gefäß' : 'Auswahl MAG', value:r.productLabel },
    { label:'Nächstes Normvolumen', value: r.selectedVolume > 0 ? fmt(r.selectedStandardVolume,0) : '—', unit:'Liter' },
    { label:'Mindestbetriebsdruck p₀', value:fmt(r.p0,2), unit:'bar' },
    { label:'Anfangsdruck pₐ min.', value:fmt(r.paMin,2), unit:'bar' },
    { label:'Enddruck pₑ', value:fmt(r.pe,2), unit:'bar' }
  ];

  const basis = card('Berechnungsart', stack([
    segmented('systemType', opts([['heating','Heizwasser'],['cooling','Kühlwasser']]), s.systemType, { accent:'purple' }),
    segmented('holdingType', opts([['mag','MAG statisch'],['dynamic','Druckhaltestation']]), s.holdingType, { accent:'purple' }),
    segmented('connectionType', opts([['suction','Vordruck / Saugseite'],['pressure','Nachdruck / Druckseite']]), s.connectionType, { accent:'purple' }),
    `<p class="ph-help">${explain(s)}</p>`
  ].join('')), 'purple');

  const volumeFields = [
    selectField({ id:'waterContentMode', label:'Anlagenvolumen', value:s.waterContentMode, options:opts([['known','bekannt eingeben'],['estimated','über Leistung schätzen']]) }),
    s.waterContentMode === 'estimated'
      ? field({ id:'heatPowerKw', label:'Gesamtleistung Q', value:fmtInput(s.heatPowerKw,1), unit:'kW' })
      : field({ id:'systemVolumeL', label:'Anlagenvolumen Vₐ', value:fmtInput(s.systemVolumeL,1), unit:'Liter' }),
    s.waterContentMode === 'estimated'
      ? field({ id:'specificWaterContent', label:'spez. Wasserinhalt vₐ', value:fmtInput(s.specificWaterContent,1), unit:'l/kW' })
      : field({ id:'additionalVolumeL', label:'Zusatzvolumen', value:fmtInput(s.additionalVolumeL,1), unit:'Liter' })
  ];

  const pressureFields = [
    field({ id:'staticHeightM', label:'statische Höhe H', value:fmtInput(s.staticHeightM,1), unit:'m' }),
    field({ id:'staticPressureBar', label:'statischer Druck pₛₜ manuell', value:fmtInput(s.staticPressureBar,2), unit:'bar' }),
    s.connectionType === 'pressure' ? field({ id:'pumpPressureBar', label:'Pumpendifferenzdruck Δpₚ', value:fmtInput(s.pumpPressureBar,2), unit:'bar' }) : '',
    field({ id:'safetyValveBar', label:'Sicherheitsventil pSV', value:fmtInput(s.safetyValveBar,2), unit:'bar' })
  ].filter(Boolean);

  const inputColumn = stack([
    basis,
    card('Anlagenvolumen', grid(volumeFields.join(''), 2), 'purple'),
    card('Temperaturen / Stoffwerte', grid([
      selectField({ id:'frostMode', label:'Medium', value:s.frostMode, options:opts([['water','Wasser'],['glycol20','Antifrogen N 20 %'],['glycol34','Antifrogen N 34 %']]) }),
      field({ id:'tMinC', label:'tiefste Systemtemperatur', value:fmtInput(s.tMinC,1), unit:'°C' }),
      field({ id:'tMaxC', label:'höchste Temperatur tTR/tmax', value:fmtInput(s.tMaxC,1), unit:'°C' })
    ].join(''), 2), 'purple'),
    card('Druckdaten', `${grid(pressureFields.join(''), 2)}<p class="ph-help">Ist die statische Höhe eingetragen, wird pₛₜ automatisch mit H/10 berechnet. Der manuelle pₛₜ-Wert gilt nur ohne Höhenangabe.</p>`, 'purple'),
    s.holdingType === 'mag' ? card('MAG-Optionen', `${segmented('includeServitec', opts([['false','ohne Servitec'],['true','mit Servitec +5 l']]), s.includeServitec, { accent:'purple' })}<p class="ph-help">Servitec steht für Entgasung/Nachspeisung. Bei „mit Servitec“ wird das Zusatzvolumen des Entgasungsrohres berücksichtigt.</p>`, 'purple') : card('Dynamisches System', `${selectField({ id:'dynamicType', label:'Druckhaltestation', value:s.dynamicType, options:opts([['reflexomat','Reflexomat · kompressorgesteuert · AD 0,2 bar'],['variomat','Variomat · pumpengesteuert · AD 0,4 bar']]) })}<p class="ph-help">Die Auswahl bestimmt Arbeitsbereich AD und die Ergebnisbezeichnung der Station.</p>`, 'purple')
  ].join(''));

  const resultColumn = stack([
    mainResult('Ergebnis Druckhaltung', main, details, 'purple'),
    resultCard('Zwischenergebnisse', [
      { label:'Ausdehnungskoeffizient n', value:fmt(r.expansionPct,2), unit:'%' },
      { label:'Verdampfungsdruck pD', value:fmt(r.vaporPressure,2), unit:'bar' },
      { label:'statischer Druck pₛₜ verwendet', value:fmt(r.staticPressure,2), unit:'bar' },
      { label:'Ausdehnungsvolumen Ve', value:fmt(r.ve,1), unit:'Liter' },
      { label:'Wasservorlage VV', value:fmt(r.vv,1), unit:'Liter' },
      { label:'Schließdruckdifferenz ASV', value:fmt(r.asv,2), unit:'bar' },
      { label:'Volumenfaktor MAG', value:fmt(r.factor,2) }
    ], 'purple'),
    card('Formeln / Plausibilität', stack([
      `<div class="formula ph-formula">p₀ = pₛₜ + pD ${s.connectionType === 'pressure' ? '+ Δpₚ' : '+ 0,2 bar'} · pe = pSV − ASV</div>`,
      `<div class="formula ph-formula">Ve = VA × n / 100 · VV = max(0,5 % × VA; 3 l)</div>`,
      s.holdingType === 'mag'
        ? `<div class="formula ph-formula">Vn = (Ve + VV${s.includeServitec === 'true' ? ' + 5 l' : ''}) × (pe + 1) / (pe − p₀)</div>`
        : `<div class="formula ph-formula">Vn ≥ 1,1 × (Ve + VV) · pe ≥ p₀ + 0,3 bar + AD</div>`,
      warnList(r.warnings)
    ].join('')), 'purple')
  ].join(''));

  return renderModuleShell(config, `<div class="span-6">${inputColumn}</div><div class="span-6">${resultColumn}</div>`);
}

export default { config, state, mount(root){ mountModule(root, state, view); } };
