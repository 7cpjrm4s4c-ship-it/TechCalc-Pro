import config from './config.js';
import { state, initialState } from './state.js';
import { calculate, getAreaType, toNumber } from './logic.js';
import { areaTypes } from './tables.js';
import { card, field, selectField, segmented, renderModuleShell, stack, grid, mainResult, resultRows, inlineStats, esc } from '../../core/renderer.js';
import { mountModule } from '../../core/mount.js';
import { fmt, fmtInput } from '../../utils/calculations.js';
import { bindEditModeClear } from '../../core/savedRecords.js';

const opts = items => items.map(([value, label]) => ({ value, label }));
const areaOptions = areaTypes.map(item => ({ value:item.id, label:item.name }));
const KOSTRA_URL = 'https://www.dwd.de/DE/leistungen/kostra_dwd_rasterwerte/kostra_dwd_rasterwerte.html';

const fmtDecimalInput = (value, digits = 1) => {
  if (value === '' || value === null || value === undefined) return '';
  const n = toNumber(value);
  if (!Number.isFinite(n)) return String(value ?? '');
  return n.toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits });
};
const fmtStateNumber = (value, digits = 1) => {
  if (value === '' || value === null || value === undefined) return '—';
  const n = toNumber(value);
  if (!Number.isFinite(n)) return String(value ?? '—');
  return n.toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits });
};

function lineTypeLabel(value) {
  return { connection:'Anschlussleitung', stack:'Fallleitung', collector:'Sammelleitung', ground:'Grundleitung', gutter:'Rinne' }[value] || value;
}
function calcTypeLabel(value) {
  return { roof:'Dachfläche', property:'Grundstücksfläche', 'roof-drain':'Dachabläufe', emergency:'Notentwässerung', gutter:'Rinnenbemessung' }[value] || value;
}
function savedSnapshot(s, r) {
  const saved = Array.isArray(s.savedCalculations) ? s.savedCalculations : [];
  const copy = { ...s };
  delete copy.savedCalculations;
  delete copy.activeCalculationId;
  return {
    id: s.activeCalculationId || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: s.name?.trim() || `Regenwasser ${saved.length + 1}`,
    createdAt: s.activeCalculationId ? (saved.find(x => x.id === s.activeCalculationId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    state: copy,
    result: { qr:r.qr, dn:r.lineSelection?.dn, area:r.area, type:s.calculationType }
  };
}
function clearedInputs(current = {}) { return { ...initialState, savedCalculations: current.savedCalculations || [] }; }
function savedRows(s) {
  const items = Array.isArray(s.savedCalculations) ? s.savedCalculations : [];
  if (!items.length) return '<div class="empty-state empty-state--compact">Noch keine Regenwasser-Berechnungen gespeichert.</div>';
  return `<div class="ph-saved-list">${items.map(item => {
    const r = item.result || {};
    const active = String(s.activeCalculationId || '') === String(item.id);
    const subtitle = [`${fmt(r.qr || 0,2)} l/s`, r.dn, calcTypeLabel(r.type)].filter(Boolean).join(' · ');
    return `<article class="ph-saved-item line-section-card is-collapsed ${active ? 'is-active' : ''}" data-line-card data-rainwater-select="${esc(item.id)}">
      <div class="line-section-card__head">
        <div class="line-section-card__title"><strong>${esc(item.name || 'Berechnung')}</strong><small>${esc(subtitle)}</small></div>
        <button type="button" class="line-section-card__toggle" data-line-toggle aria-expanded="false" aria-label="Gespeicherte Berechnung aufklappen"><span>▾</span></button>
        <button type="button" class="line-section-card__delete" data-rainwater-delete="${esc(item.id)}" aria-label="Berechnung löschen">×</button>
      </div>
      <div class="line-section-card__body">${resultRows([
        { label:'Qr', value:fmt(r.qr || 0,2), unit:'l/s' },
        { label:'Fläche', value:fmt(r.area || 0,1), unit:'m²' },
        { label:'Empfohlene DN', value:r.dn || '—' }
      ])}</div>
    </article>`;
  }).join('')}</div>`;
}
function surfacesTable(s, r) {
  if (!r.surfaces.length) return '<div class="empty-state empty-state--compact">Noch keine Regenflächen hinzugefügt.</div>';
  return `<div class="dw-consumer-list wastewater-fixture-list">${r.surfaces.map(item => `<div class="dw-consumer-row wastewater-fixture-row">
    <div><strong>${esc(item.name)}</strong><span>${fmt(item.area,1)} m² · Cs ${fmt(item.cs,2)} · Cm ${fmt(item.cm,2)}</span></div>
    <button type="button" data-surface-delete="${esc(item.id)}" aria-label="Regenfläche entfernen">×</button>
  </div>`).join('')}</div>`;
}
function rainInputBlock(s) {
  return stack([
    grid([
      field({ id:'rainIntensity', label:'Regenspende r(D,T)', value:fmtInput(s.rainIntensity,1), unit:'l/(s·ha)' }),
      field({ id:'rainDuration', label:'Dauer D', value:fmtInput(s.rainDuration,0), unit:'min' }),
      field({ id:'returnPeriod', label:'Jährlichkeit T', value:fmtInput(s.returnPeriod,0), unit:'a' }),
      field({ id:'emergencyRainIntensity', label:'r(5,100) für Notentwässerung', value:fmtInput(s.emergencyRainIntensity,1), unit:'l/(s·ha)' })
    ].join(''), 2),
    `<a class="action-button action-button--secondary" href="${esc(KOSTRA_URL)}" target="_blank" rel="noopener">KOSTRA-DWD Daten öffnen</a>`
  ].join(''));
}
function surfaceInputBlock(s, r) {
  const selected = getAreaType(s.areaType || 'metal-roof');
  return stack([
    grid([
      field({ id:'areaName', label:'Bezeichnung', value:s.areaName || '', placeholder:'z. B. Dachfläche Nord', inputmode:'text' }),
      selectField({ id:'areaType', label:'Flächenart', value:s.areaType || 'metal-roof', options:areaOptions }),
      field({ id:'areaSize', label:'Fläche A', value:fmtInput(s.areaSize,1), unit:'m²' }),
      selected?.custom ? field({ id:'customCs', label:'Spitzenabflussbeiwert Cs', value:s.customCs || '', placeholder:'0,9' }) : inlineStats([{ label:'Cs', value:fmt(selected.cs,2) }, { label:'Cm', value:fmt(selected.cm,2) }])
    ].join(''), 2),
    selected?.custom ? grid([field({ id:'customCm', label:'mittlerer Abflussbeiwert Cm', value:s.customCm || '', placeholder:'0,8' })].join(''), 1) : '',
    '<button type="button" class="action-button action-button--secondary" data-surface-add>Fläche hinzufügen</button>',
    surfacesTable(s, r)
  ].join(''));
}
function lineInputBlock(s) {
  return stack([
    segmented('lineType', opts([['connection','Anschlussleitung'],['stack','Fallleitung'],['collector','Sammelleitung'],['ground','Grundleitung'],['gutter','Rinne']]), s.lineType, { accent:'green' }),
    grid([
      field({ id:'slopeCmM', label:'Gefälle J', value:fmtDecimalInput(s.slopeCmM,1), unit:'cm/m' }),
      selectField({ id:'fillRatio', label:'Füllungsgrad h/di', value:s.fillRatio, options:opts([['0.5','0,5'],['0.7','0,7'],['1.0','1,0']]) })
    ].join(''), 2)
  ].join(''));
}
function specialInputBlock(s) {
  if (s.calculationType === 'roof-drain') return card('Dachabläufe', grid([
    field({ id:'roofDrainCapacity', label:'Abflussvermögen Dachablauf QDA', value:fmtInput(s.roofDrainCapacity,1), unit:'l/s' })
  ].join(''), 1), 'green');
  if (s.calculationType === 'emergency') return card('Notentwässerung', grid([
    selectField({ id:'overflowType', label:'Überlaufart', value:s.overflowType, options:opts([['rectangular','rechteckiger Notüberlauf'],['round','runder Notüberlauf']]) }),
    field({ id:'overflowWidth', label:'Überlaufbreite Lw', value:fmtInput(s.overflowWidth,0), unit:'mm' }),
    field({ id:'overflowDiameter', label:'Durchmesser d', value:fmtInput(s.overflowDiameter,0), unit:'mm' }),
    field({ id:'overflowHead', label:'Druckhöhe h', value:fmtInput(s.overflowHead,0), unit:'mm' })
  ].join(''), 2), 'green');
  if (s.calculationType === 'gutter') return card('Rinnen', grid([
    selectField({ id:'gutterShape', label:'Rinnenform', value:s.gutterShape, options:opts([['semicircular','halbrund'],['box','kastenförmig']]) }),
    field({ id:'gutterNominal', label:'Nennmaß', value:s.gutterNominal || '333', unit:'mm' }),
    field({ id:'gutterLength', label:'Rinnenlänge', value:fmtInput(s.gutterLength,1), unit:'m' }),
    field({ id:'directionChanges', label:'Richtungsänderungen > 10°', value:fmtInput(s.directionChanges,0), unit:'Stk.' })
  ].join(''), 2), 'green');
  return '';
}
function inputCards(s, r) {
  return stack([
    card('Entwässerungsart', segmented('calculationType', opts([['roof','Dachfläche'],['property','Grundstücksfläche'],['roof-drain','Dachabläufe'],['emergency','Notentwässerung'],['gutter','Rinnen']]), s.calculationType, { accent:'green' }), 'green'),
    card('Leitungsart / Randbedingungen', lineInputBlock(s), 'green'),
    card('Regenspende', rainInputBlock(s), 'green'),
    card('Regenflächen', surfaceInputBlock(s, r), 'green'),
    specialInputBlock(s),
    card('Berechnung speichern', stack([
      field({ id:'name', label:'Bezeichnung', value:s.name || '', placeholder:'z. B. Dachfläche Verwaltung', inputmode:'text' }),
      `<div class="tc-save-actions"><button type="button" class="action-button" data-rainwater-save ${s.activeCalculationId ? 'disabled' : ''}>Speichern</button><button type="button" class="action-button" data-rainwater-update ${s.activeCalculationId ? '' : 'disabled'}>Aktualisieren</button></div>`,
      savedRows(s)
    ].join('')), 'green')
  ].join(''));
}
function warningList(warnings, s) {
  const fixed = '<div class="ph-warning ph-warning--norm"><span>Normgrundlage:</span><strong>Berechnung erfolgt auf Grundlage der DIN 1986 - 100, aktuellste Fassung.</strong></div>';
  const typeHints = {
    connection: ['Anschlussleitungen werden wie Sammelleitungen bemessen; die Nennweite darf nicht kleiner als die Nennweite des Dachablaufs sein.'],
    stack: ['Regenwasserfallleitungen können bis f = 0,33 bemessen werden; Fallleitungsverzüge > 10° gesondert prüfen.'],
    collector: ['Sammelleitungen innerhalb von Gebäuden: Füllungsgrad h/di = 0,7 und Mindestgefälle 0,5 cm/m.'],
    ground: ['Grundleitungen: Mindestdurchmesser DN 100; außerhalb v ≥ 0,7 m/s und vmax 2,5 m/s prüfen.'],
    gutter: ['Bei Richtungsänderungen > 10° ist das Abflussvermögen der Rinne um 15 % zu reduzieren.']
  }[s.lineType] || [];
  const all = [...typeHints, ...warnings];
  return `<div class="ph-warnings">${fixed}${all.map(item => `<div class="ph-warning"><span>Hinweis:</span><strong>${esc(item)}</strong></div>`).join('')}</div>`;
}
function resultCards(s, r) {
  return stack([
    mainResult('Ergebnis Regenwasser', { label:'Empfohlene Dimension', value:r.lineSelection?.dn || '—' }, [
      { label:'Qr', value:fmt(r.qr,2), unit:'l/s' },
      { label:'Fläche', value:fmt(r.area,1), unit:'m²' },
      { label:'Cs,resultierend', value:fmt(r.csResulting,2) },
      { label:'r(D,T)', value:fmt(r.rdt,1), unit:'l/(s·ha)' }
    ], 'green'),
    card('Dimensionierung und Berechnungsansatz', stack([
      resultRows([
        { label:'Entwässerungsart', value:calcTypeLabel(s.calculationType) },
        { label:'Leitungsart', value:lineTypeLabel(s.lineType) },
        { label:'Kapazität gewählte DN', value:r.lineSelection?.capacity ? fmt(r.lineSelection.capacity,1) : '—', unit:r.lineSelection?.capacity ? 'l/s' : '' },
        { label:'Füllungsgrad', value:`h/di ${String(s.fillRatio).replace('.', ',')}` },
        { label:'angesetztes Gefälle', value:fmtStateNumber(s.slopeCmM,1), unit:'cm/m' },
        { label:'erforderliche Dachabläufe', value:s.calculationType === 'roof-drain' ? r.roofDrains : '—', unit:s.calculationType === 'roof-drain' ? 'Stk.' : '' },
        { label:'QNot', value:s.calculationType === 'emergency' ? fmt(r.qnot,2) : '—', unit:s.calculationType === 'emergency' ? 'l/s' : '' },
        { label:'Rinnenempfehlung', value:s.calculationType === 'gutter' ? `RG ${r.gutter?.nominal} / Fallleitung ${r.gutter?.di} mm` : '—' }
      ]),
      '<div class="ph-formula ph-formula--small">Qr = r(D,T) × C × A / 10000 · nDA = Q / QDA · QNot = (r(5,100) - r(D,T)) × C × A / 10000</div>'
    ].join('')), 'green'),
    card('Normhinweise / Plausibilität', warningList(r.warnings, s), 'green')
  ].join(''));
}
function view(s) {
  const r = calculate(s);
  return renderModuleShell(config, `<div class="span-6">${inputCards(s, r)}</div><div class="span-6">${resultCards(s, r)}</div>`);
}
function bindActions(root) {
  bindEditModeClear(root, { state, activeIdKey:'activeCalculationId', nameKey:'name', onClear: () => state.set(clearedInputs(state.get())) });
  root.querySelector('[data-surface-add]')?.addEventListener('click', () => {
    const current = state.get();
    const base = getAreaType(current.areaType || 'metal-roof');
    const record = { id:`${Date.now()}-${Math.random().toString(16).slice(2)}`, areaType:current.areaType, areaName:current.areaName, areaSize:current.areaSize };
    if (base?.custom) { record.customCs = current.customCs; record.customCm = current.customCm; }
    state.set({ surfaces:[...(current.surfaces || []), record], areaName:'', areaSize:'100', customCs:'', customCm:'' });
  });
  root.querySelectorAll('[data-surface-delete]').forEach(btn => btn.addEventListener('click', event => {
    event.stopPropagation();
    const current = state.get();
    state.set({ surfaces:(current.surfaces || []).filter(item => String(item.id) !== String(btn.dataset.surfaceDelete)) });
  }));
  root.querySelector('[data-rainwater-save]')?.addEventListener('click', () => {
    const current = state.get();
    const record = savedSnapshot({ ...current, activeCalculationId:null }, calculate(current));
    state.set({ savedCalculations:[record, ...(current.savedCalculations || [])], activeCalculationId:null, name:'' });
  });
  root.querySelector('[data-rainwater-update]')?.addEventListener('click', () => {
    const current = state.get();
    const id = current.activeCalculationId;
    if (!id) return;
    const saved = current.savedCalculations || [];
    const existing = saved.find(item => String(item.id) === String(id));
    if (!existing) return;
    const record = { ...savedSnapshot(current, calculate(current)), id, createdAt:existing.createdAt || new Date().toISOString() };
    state.set({ savedCalculations:saved.map(item => String(item.id) === String(id) ? record : item), activeCalculationId:id, name:record.name });
  });
  root.querySelectorAll('[data-line-toggle]').forEach(toggle => toggle.addEventListener('click', event => {
    event.stopPropagation();
    const itemCard = toggle.closest('[data-line-card]');
    const collapsed = itemCard?.classList.toggle('is-collapsed');
    toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  }));
  root.querySelectorAll('[data-rainwater-select]').forEach(cardEl => cardEl.addEventListener('click', event => {
    if (event.target.closest('[data-rainwater-delete]') || event.target.closest('[data-line-toggle]')) return;
    const current = state.get();
    const item = (current.savedCalculations || []).find(entry => String(entry.id) === String(cardEl.dataset.rainwaterSelect));
    if (!item?.state) return;
    if (String(current.activeCalculationId || '') === String(item.id)) { state.set(clearedInputs(current)); return; }
    state.set({ ...item.state, savedCalculations:current.savedCalculations || [], activeCalculationId:item.id, name:item.name || item.state.name || '' });
  }));
  root.querySelectorAll('[data-rainwater-delete]').forEach(btn => btn.addEventListener('click', event => {
    event.stopPropagation();
    const current = state.get();
    const next = (current.savedCalculations || []).filter(item => String(item.id) !== String(btn.dataset.rainwaterDelete));
    state.set({ savedCalculations:next, activeCalculationId:String(current.activeCalculationId) === String(btn.dataset.rainwaterDelete) ? null : current.activeCalculationId });
  }));
}

export default { config, state, mount(root) { return mountModule(root, state, view, bindActions); } };
