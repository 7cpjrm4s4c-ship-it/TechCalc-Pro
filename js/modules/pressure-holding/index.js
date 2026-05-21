import config from './config.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { card, field, selectField, segmented, renderModuleShell, stack, grid, mainResult, resultCard, resultRows, esc } from '../../core/renderer.js';
import { mountModule } from '../../core/mount.js';
import { fmt, fmtInput } from '../../utils/calculations.js';
import { bindEditModeClear } from '../../core/savedRecords.js';

const opts = (items) => items.map(([value,label]) => ({ value, label }));

function warnList(items){
  if(!items.length) return '<div class="empty-state empty-state--compact ph-note">Keine Plausibilitätswarnungen.</div>';
  return `<div class="ph-warnings">${items.map(w => `<div class="ph-warning"><span>Hinweis</span><strong>${w}</strong></div>`).join('')}</div>`;
}


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

function savedPlantRows(items = []){
  if(!items.length) return '<div class="empty-state empty-state--compact ph-note">Noch keine Anlagen gespeichert.</div>';
  return `<div class="ph-saved-list">${items.map(item => {
    const res = item.result || {};
    const subtitle = [res.productLabel, res.selectedStandardVolume ? `${fmt(res.selectedStandardVolume,0)} l` : '', res.systemVolume ? `VA ${fmt(res.systemVolume,0)} l` : ''].filter(Boolean).join(' · ');
    return `<article class="ph-saved-item line-section-card is-collapsed ${state.get().activePlantId === item.id ? 'is-active' : ''}" data-line-card data-ph-select="${esc(item.id)}">
      <div class="line-section-card__head">
        <div class="line-section-card__title" ><strong>${esc(item.name || 'Anlage')}</strong><small>${esc(subtitle || 'gespeicherte Druckhaltung')}</small></div>
        <button type="button" class="line-section-card__toggle" data-line-toggle aria-expanded="false" aria-label="Gespeicherte Anlage aufklappen"><span>▾</span></button>
        <button type="button" class="line-section-card__delete" data-ph-delete="${esc(item.id)}" aria-label="Anlage löschen">×</button>
      </div>
      <div class="line-section-card__body">${resultRows([
        { label:'Auswahl', value:res.productLabel || '—' },
        { label:'Normvolumen', value:res.selectedStandardVolume ? fmt(res.selectedStandardVolume,0) : '—', unit:res.selectedStandardVolume ? 'Liter' : '' },
        { label:'Mindestbetriebsdruck p₀', value:res.p0 !== undefined ? fmt(res.p0,2) : '—', unit:res.p0 !== undefined ? 'bar' : '' },
        { label:'Enddruck pₑ', value:res.pe !== undefined ? fmt(res.pe,2) : '—', unit:res.pe !== undefined ? 'bar' : '' }
      ])}</div>
    </article>`;
  }).join('')}</div>`;
}

function savedPlantsCard(s){
  return card('Anlagen speichern', stack([
    field({ id:'plantName', label:'Anlagenbezeichnung', value:s.plantName || '', placeholder:'z. B. Heizzentrale BT A', inputmode:'text' }),
    `<div class="tc-save-actions"><button type="button" class="action-button" data-ph-save ${s.activePlantId ? 'disabled' : ''}>Speichern</button><button type="button" class="action-button" data-ph-update ${s.activePlantId ? '' : 'disabled'}>Aktualisieren</button></div>`,
    savedPlantRows(Array.isArray(s.savedPlants) ? s.savedPlants : [])
  ].join('')), 'purple');
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
    savedPlantsCard(s),
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

function bindPressureHoldingActions(root, snapshot){
  bindEditModeClear(root, { state, activeIdKey: 'activePlantId', nameKey: 'plantName' });
  root.querySelector('[data-ph-save]')?.addEventListener('click', () => {
    const current = state.get();
    const result = calculate(current);
    const saved = Array.isArray(current.savedPlants) ? current.savedPlants : [];
    const record = savedPlantSnapshot({ ...current, activePlantId: null }, result);
    state.set({ savedPlants: [record, ...saved], activePlantId: null, plantName: '' });
  });
  root.querySelector('[data-ph-update]')?.addEventListener('click', () => {
    const current = state.get();
    const id = current.activePlantId;
    if(!id) return;
    const result = calculate(current);
    const saved = Array.isArray(current.savedPlants) ? current.savedPlants : [];
    const existing = saved.find(entry => String(entry.id) === String(id));
    if(!existing) return;
    const record = { ...savedPlantSnapshot(current, result), id, createdAt: existing.createdAt || new Date().toISOString() };
    state.set({ savedPlants: saved.map(item => String(item.id) === String(id) ? record : item), activePlantId: id, plantName: record.name });
  });
  root.querySelectorAll('[data-line-toggle]').forEach(toggle => {
    toggle.addEventListener('click', event => {
      event.stopPropagation();
      const itemCard = toggle.closest('[data-line-card]');
      const collapsed = itemCard?.classList.toggle('is-collapsed');
      toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    });
  });
  root.querySelectorAll('[data-ph-select]').forEach(button => {
    button.addEventListener('click', event => {
      if (event.target.closest('[data-ph-delete]') || event.target.closest('[data-line-toggle]')) return;
      event.preventDefault();
      event.stopPropagation();
      const current = state.get();
      const item = (current.savedPlants || []).find(entry => String(entry.id) === String(button.dataset.phSelect));
      if(!item?.state) return;
      state.set({ ...item.state, savedPlants: current.savedPlants || [], activePlantId: item.id, plantName: item.name || item.state?.plantName || '' });
    });
  });
  root.querySelectorAll('[data-ph-delete]').forEach(button => {
    button.addEventListener('click', event => {
      event.stopPropagation();
      const current = state.get();
      const next = (current.savedPlants || []).filter(entry => String(entry.id) !== String(button.dataset.phDelete));
      state.set({ savedPlants: next, activePlantId: String(current.activePlantId) === String(button.dataset.phDelete) ? null : current.activePlantId });
    });
  });
}

export default { config, state, mount(root){ return mountModule(root, state, view, bindPressureHoldingActions); } };
