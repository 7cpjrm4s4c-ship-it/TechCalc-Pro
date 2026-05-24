import config from './config.js';
import { state, initialState } from './state.js';
import { calculate, getAreaType, toNumber } from './logic.js';
import { areaTypes, roofDrainTable } from './tables.js';
import { card, field, selectField, segmented, renderModuleShell, stack, grid, mainResult, resultRows, inlineStats, esc } from '../../core/renderer.js';
import { mountModule } from '../../core/mount.js';
import { fmt, fmtInput } from '../../utils/calculations.js';
import { bindEditModeClear } from '../../core/savedRecords.js';

const opts = items => items.map(([value, label]) => ({ value, label }));
const areaOptions = areaTypes.map(item => ({ value:item.id, label:item.name }));
const KOSTRA_URL = 'https://www.openko.de';

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
const modeLabel = value => ({ roof:'Dachfläche', property:'Grundstücksfläche' }[value] || value);
const drainLabel = mode => mode === 'property' ? 'Hoftöpfe' : 'Dacheinläufe';
const drainCapacityLabel = mode => mode === 'property' ? 'Abflussvermögen Hoftopf' : 'Abflussvermögen Dacheinlauf';
const rainLabel = mode => mode === 'property' ? 'Regenspende r(5,2)' : 'Regenspende r(5,5)';
const drainOptions = roofDrainTable.map(item => ({ value:item.dn, label:`${item.dn} · ${String(item.capacity).replace('.', ',')} l/s · ${item.head} mm Anstauhöhe` }));
const emergencyTypeOptions = opts([['rect','Rechteckiger Notüberlauf'],['round','Runder Notüberlauf'],['manual','Herstellerwert / freie Eingabe']]);

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
    result: {
      qr:r.qr,
      collectorDn:r.collectorSelection?.dn,
      stackDn:r.stackSelection?.dn,
      qNot:r.qNot,
      drains:r.requiredDrains,
      area:r.area,
      mode:r.mode
    }
  };
}
function clearedInputs(current = {}) { return { ...initialState, savedCalculations: current.savedCalculations || [] }; }
function savedRows(s) {
  const items = Array.isArray(s.savedCalculations) ? s.savedCalculations : [];
  if (!items.length) return '<div class="empty-state empty-state--compact">Noch keine Regenwasser-Berechnungen gespeichert.</div>';
  return `<div class="ph-saved-list">${items.map(item => {
    const r = item.result || {};
    const active = String(s.activeCalculationId || '') === String(item.id);
    const subtitle = [`${fmt(r.qr || 0,2)} l/s`, `FL ${r.stackDn || '—'}`, modeLabel(r.mode)].filter(Boolean).join(' · ');
    return `<article class="line-section-card saved-record-card is-collapsed ${active ? 'is-active' : ''}" data-line-card data-rainwater-select="${esc(item.id)}">
      <div class="line-section-card__head saved-record-card__head">
        <div class="line-section-card__title saved-record-card__title"><strong>${esc(item.name || 'Berechnung')}</strong><small>${esc(subtitle)}</small></div>
        <button type="button" class="line-section-card__toggle saved-record-card__toggle" data-line-toggle aria-expanded="false" aria-label="Gespeicherte Berechnung aufklappen"><span>▾</span></button>
        <button type="button" class="line-section-card__delete saved-record-card__delete" data-rainwater-delete="${esc(item.id)}" aria-label="Berechnung löschen">×</button>
      </div>
      <div class="line-section-card__body">${resultRows([
        { label:'Entwässerungsmenge', value:fmt(r.qr || 0,2), unit:'l/s' },
        { label:'DN Fallleitung', value:r.stackDn || '—' },
        { label:drainLabel(r.mode), value:r.drains || 0, unit:'Stk.' }
      ])}</div>
    </article>`;
  }).join('')}</div>`;
}
function surfacesTable(r, s) {
  if (!r.surfaces.length) return '<div class="empty-state empty-state--compact">Noch keine Regenflächen hinzugefügt.</div>';
  const activeId = String(r.selectedSurfaceId || s.activeSurfaceId || '');
  return `<div class="dw-consumer-list wastewater-fixture-list rainwater-surface-list">${r.surfaces.map(item => {
    const active = String(item.id) === activeId;
    return `<div class="dw-consumer-row wastewater-fixture-row rainwater-surface-row ${active ? 'is-active' : ''}" data-surface-select="${esc(item.id)}">
      <div><strong>${esc(item.name)}</strong><span>${fmt(item.area,1)} m² · Cs ${fmt(item.cs,2)} · Qr ${fmt(item.qr,2)} l/s · FL ${item.stackSelection?.dn || '—'}</span></div>
      <button type="button" data-surface-delete="${esc(item.id)}" aria-label="Regenfläche entfernen">×</button>
    </div>`;
  }).join('')}</div>`;
}
function modeCard(s) {
  const mode = s.surfaceMode || s.calculationType || 'roof';
  return card('Berechnungsbereich', segmented('surfaceMode', opts([['roof','Dachfläche'],['property','Grundstücksfläche']]), mode, { accent:'green' }), 'green');
}
function rainInputBlock(s) {
  const mode = s.surfaceMode || s.calculationType || 'roof';
  const activeRainField = mode === 'property' ? 'propertyRainIntensity' : 'roofRainIntensity';
  const activeRainValue = mode === 'property' ? (s.propertyRainIntensity || s.rainIntensity || '300') : (s.roofRainIntensity || s.rainIntensity || '300');
  return stack([
    grid([
      field({ id:activeRainField, label:rainLabel(mode), value:fmtInput(activeRainValue,1), unit:'l/(s·ha)' }),
      field({ id:'rainHundredIntensity', label:'Regenspende r(5,100)', value:fmtInput(s.rainHundredIntensity,1), unit:'l/(s·ha)' })
    ].join(''), 2),
    `<a class="action-button action-button--secondary rainwater-kostra-link" href="${esc(KOSTRA_URL)}" target="_blank" rel="noopener">KOSTRA / OpenKo Daten öffnen</a>`
  ].join(''));
}
function dimensionInputBlock(s) {
  const mode = s.surfaceMode || s.calculationType || 'roof';
  const fields = [
    selectField({ id:'drainSize', label:mode === 'property' ? 'Vorwahl Hoftopf' : 'Vorwahl Dacheinlauf', value:s.drainSize || 'DN 100', options:drainOptions }),
    field({ id:'drainSizeManual', label:'DN manuell', value:s.drainSizeManual || s.drainSize || 'DN 100', placeholder:'DN 100', inputmode:'text' }),
    field({ id:'drainCapacity', label:'Abflusswert manuell', value:fmtInput(s.drainCapacity,1), unit:'l/s' }),
    field({ id:'drainHead', label:'Anstauhöhe manuell', value:fmtInput(s.drainHead,0), unit:'mm' })
  ];
  if (mode === 'roof') fields.push(field({ id:'stackCount', label:'Anzahl Fallleitungen', value:fmtInput(s.stackCount,0), unit:'Stk.' }));
  return stack([grid(fields.join(''), 2)].join(''));
}

function emergencyInputBlock(s) {
  const mode = s.surfaceMode || s.calculationType || 'roof';
  if (mode !== 'roof') return '<div class="empty-state empty-state--compact">Notentwässerung wird nur für Dachflächen vorbemessen.</div>';
  const type = s.emergencyType || 'rect';
  const fields = [
    selectField({ id:'emergencyType', label:'Art Notentwässerung', value:type, options:emergencyTypeOptions }),
    field({ id:'emergencyHead', label:'Druckhöhe / Anstauhöhe', value:fmtInput(s.emergencyHead || '35',0), unit:'mm' })
  ];
  if (type === 'rect') fields.push(field({ id:'emergencyWidth', label:'Überlaufbreite je Notüberlauf Lw', value:fmtInput(s.emergencyWidth || '300',0), unit:'mm' }));
  if (type === 'round') fields.push(field({ id:'emergencyDiameter', label:'Durchmesser rund', value:fmtInput(s.emergencyDiameter || '100',0), unit:'mm' }));
  if (type === 'manual') {
    fields.push(field({ id:'emergencyManufacturerDn', label:'Hersteller-DN', value:s.emergencyManufacturerDn || '', placeholder:'DN 100', inputmode:'text' }));
    fields.push(field({ id:'emergencyCapacity', label:'Hersteller-Abflusswert', value:s.emergencyCapacity || '', unit:'l/s' }));
  }
  fields.push(field({ id:'emergencySafetyFactor', label:'Sicherheitsfaktor', value:fmtDecimalInput(s.emergencySafetyFactor || '1,0',1) }));
  return stack([grid(fields.join(''), 2)].join(''));
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
    surfacesTable(r, s)
  ].join(''));
}
function saveCard(s) {
  return card('Berechnung speichern', stack([
    field({ id:'name', label:'Bezeichnung', value:s.name || '', placeholder:'z. B. Dachfläche Verwaltung', inputmode:'text' }),
    `<div class="tc-save-actions"><button type="button" class="action-button" data-rainwater-save ${s.activeCalculationId ? 'disabled' : ''}>Speichern</button><button type="button" class="action-button" data-rainwater-update ${s.activeCalculationId ? '' : 'disabled'}>Aktualisieren</button></div>`,
    savedRows(s)
  ].join('')), 'green');
}
function savedCalculationsCard(s) {
  return card('Gespeicherte Regenwasser-Berechnungen', savedRows(s), 'green');
}
function inputCards(s, r) {
  return stack([
    modeCard(s),
    card('Regenspende', rainInputBlock(s), 'green'),
    card('Dacheinläufe / Hoftöpfe', dimensionInputBlock(s), 'green'),
    card('Notentwässerung', emergencyInputBlock(s), 'green'),
    card('Regenflächen', surfaceInputBlock(s, r), 'green'),
    savedCalculationsCard(s)
  ].join(''));
}
function warningList(warnings, s) {
  const fixed = '<div class="ph-warning ph-warning--norm"><span>Normgrundlage: </span><strong>Berechnung erfolgt auf Grundlage der DIN 1986 - 100, aktuellste Fassung.</strong></div>';
  const items = (warnings || []).map(text => `<div class="ph-warning"><span>Hinweis: </span><strong>${esc(text)}</strong></div>`).join('');
  return fixed + items;
}
function surfaceDimensionCards(r, s) {
  if (!r.surfaces.length) return '<div class="empty-state empty-state--compact">Keine Einzelflächen berechnet.</div>';
  const activeId = String(r.selectedSurfaceId || s.activeSurfaceId || '');
  return `<div class="ph-saved-list rainwater-result-list">${r.surfaces.map((item) => {
    const mode = item.surfaceMode || r.mode || s.surfaceMode || 'roof';
    const active = String(item.id) === activeId;
    const isRoof = mode === 'roof';
    const mainRows = [
      { label:'Regenspende', value:fmt(item.rdt,1), unit:'l/(s·ha)' },
      { label:'Fläche', value:fmt(item.area,1), unit:'m²' },
      { label:'Abflussbeiwert Cs', value:fmt(item.cs,2) },
      { label:'Entwässerungsmenge Qr', value:fmt(item.qr,2), unit:'l/s' },
      { label:drainLabel(mode), value:item.requiredDrains, unit:'Stk.' },
      { label:'gewählte Ablaufdimension', value:item.drainSize || '—' },
      { label:'Ablaufleistung je Ablauf', value:fmt(item.drainCapacity,1), unit:'l/s' },
      { label:'Anstauhöhe Ablauf', value:item.drainHead || '—', unit:item.drainHead ? 'mm' : '' }
    ];
    if (isRoof) mainRows.push(
      { label:'Anzahl Fallleitungen', value:item.stackCount, unit:'Stk.' },
      { label:'Q je Fallleitung', value:fmt(item.qPerStack,2), unit:'l/s' },
      { label:'DN Fallleitung', value:item.stackSelection?.dn || '—' }
    );
    const emergencyRows = isRoof ? [
      { label:'r(5,100)', value:fmt(item.r100,1), unit:'l/(s·ha)' },
      { label:'Notabfluss Qnot', value:fmt(item.emergency?.qNot || 0,2), unit:'l/s' },
      { label:'Art Notentwässerung', value:item.emergency?.type === 'round' ? 'Rund' : item.emergency?.type === 'manual' ? 'Herstellerwert' : 'Rechteckig' },
      { label:'Notüberläufe', value:item.emergency?.requiredCount || 0, unit:'Stk.' },
      { label:'erforderliche Überlaufbreite je Notüberlauf', value:item.emergency?.rectWidthPerOverflow ? fmt(item.emergency.rectWidthPerOverflow,0) : '—', unit:item.emergency?.rectWidthPerOverflow ? 'mm' : '' },
      { label:'Notüberlauf-DN', value:item.emergency?.manufacturerDn || '—' },
      { label:'gewählte Überlaufleistung je Notüberlauf', value:item.emergency?.capacity ? fmt(item.emergency.capacity,2) : '—', unit:item.emergency?.capacity ? 'l/s' : '' }
    ] : [];
    return `<article class="line-section-card ${active ? 'is-active' : ''} is-collapsed" data-line-card data-surface-result-select="${esc(item.id)}">
      <div class="line-section-card__head">
        <div class="line-section-card__title"><strong>${esc(item.name)}</strong><small>${fmt(item.area,1)} m² · Qr ${fmt(item.qr,2)} l/s · ${drainLabel(mode)} ${item.requiredDrains} Stk.${isRoof ? ` · FL ${item.stackSelection?.dn || '—'}` : ''}</small></div>
        <button type="button" class="line-section-card__toggle" data-line-toggle aria-expanded="false" aria-label="Flächendimensionierung aufklappen"><span>▾</span></button>
      </div>
      <div class="line-section-card__body">
        <div class="rainwater-result-group"><h4>Hauptentwässerung</h4>${resultRows(mainRows)}</div>
        ${isRoof ? `<div class="rainwater-result-group"><h4>Notentwässerung</h4>${resultRows(emergencyRows)}</div>` : ''}
        <div class="ph-formula ph-formula--small">Qr = r × C × A / 10000 · Anzahl Abläufe = Qr / Ablaufleistung · Q je Fallleitung = Qr / Anzahl Fallleitungen</div>
      </div>
    </article>`;
  }).join('')}</div>`;
}
function resultCards(s, r) {
  const mode = r.selectedSurface?.surfaceMode || r.mode || s.surfaceMode || 'roof';
  const isRoof = mode === 'roof';
  const secondary = [
    { label:'Entwässerungsmenge', value:fmt(r.qr,2), unit:'l/s' },
    { label:'Ablaufdimension', value:r.drainSize || '—' },
    { label:'Abläufe', value:r.requiredDrains, unit:'Stk.' },
    { label:'markierte Fläche', value:r.selectedSurface?.name || '—' }
  ];
  if (isRoof) secondary.splice(1, 0, { label:'DN Fallleitung', value:r.stackSelection?.dn || '—' }, { label:'Notabfluss Qnot', value:fmt(r.qNot || 0,2), unit:'l/s' });
  return stack([
    mainResult('Ergebnis Regenwasser', { label:isRoof ? 'DN Fallleitung' : drainLabel(mode), value:isRoof ? (r.stackSelection?.dn || '—') : r.requiredDrains, unit:isRoof ? '' : 'Stk.' }, secondary, 'green'),
    card('Flächen / Berechnung', surfaceDimensionCards(r, s), 'green'),
    card('Normhinweise / Plausibilität', warningList(r.warnings, s), 'green')
  ].join(''));
}
function view(s) {
  const r = calculate(s);
  return renderModuleShell(config, `<div class="span-6">${inputCards(s, r)}</div><div class="span-6">${resultCards(s, r)}</div>`);
}

function surfacePatchFromState(current = {}) {
  return {
    surfaceMode: current.surfaceMode || current.calculationType || 'roof',
    areaType: current.areaType,
    areaName: current.areaName,
    areaSize: current.areaSize,
    customCs: current.customCs,
    customCm: current.customCm,
    roofRainIntensity: current.roofRainIntensity,
    propertyRainIntensity: current.propertyRainIntensity,
    rainHundredIntensity: current.rainHundredIntensity,
    drainSize: current.drainSize,
    drainSizeManual: current.drainSizeManual,
    drainCapacity: current.drainCapacity,
    drainHead: current.drainHead,
    stackCount: current.stackCount,
    slopeCmM: current.slopeCmM,
    fillRatio: current.fillRatio,
    emergencyType: current.emergencyType,
    emergencyHead: current.emergencyHead,
    emergencyWidth: current.emergencyWidth,
    emergencyDiameter: current.emergencyDiameter,
    emergencyManufacturerDn: current.emergencyManufacturerDn,
    emergencyCapacity: current.emergencyCapacity,
    emergencySafetyFactor: current.emergencySafetyFactor
  };
}
function patchActiveSurfaceFromState() {
  const current = state.get();
  const activeId = current.activeSurfaceId;
  if (!activeId) return;
  const next = (current.surfaces || []).map(item => String(item.id) === String(activeId) ? { ...item, ...surfacePatchFromState(current) } : item);
  state.set({ surfaces: next }, { notify:false });
}
function statePatchFromSurface(item = {}) {
  return {
    surfaceMode: item.surfaceMode || item.calculationType || 'roof',
    calculationType: item.surfaceMode || item.calculationType || 'roof',
    areaType: item.areaType || 'metal-roof',
    areaName: item.areaName || '',
    areaSize: item.areaSize || '100',
    customCs: item.customCs || '',
    customCm: item.customCm || '',
    roofRainIntensity: item.roofRainIntensity,
    propertyRainIntensity: item.propertyRainIntensity,
    rainHundredIntensity: item.rainHundredIntensity,
    drainSize: item.drainSize,
    drainSizeManual: item.drainSizeManual,
    drainCapacity: item.drainCapacity,
    drainHead: item.drainHead,
    stackCount: item.stackCount,
    slopeCmM: item.slopeCmM,
    fillRatio: item.fillRatio,
    emergencyType: item.emergencyType,
    emergencyHead: item.emergencyHead,
    emergencyWidth: item.emergencyWidth,
    emergencyDiameter: item.emergencyDiameter,
    emergencyManufacturerDn: item.emergencyManufacturerDn,
    emergencyCapacity: item.emergencyCapacity,
    emergencySafetyFactor: item.emergencySafetyFactor
  };
}
const surfaceEditFields = new Set(['surfaceMode','areaType','areaName','areaSize','customCs','customCm','roofRainIntensity','propertyRainIntensity','rainHundredIntensity','drainSize','drainSizeManual','drainCapacity','drainHead','stackCount','emergencyType','emergencyHead','emergencyWidth','emergencyDiameter','emergencyManufacturerDn','emergencyCapacity','emergencySafetyFactor']);
function preserveScroll(action) {
  const x = window.scrollX || 0;
  const y = window.scrollY || document.documentElement.scrollTop || 0;
  action?.();
  requestAnimationFrame(() => window.scrollTo(x, y));
  setTimeout(() => window.scrollTo(x, y), 0);
}
function bindActions(root) {
  bindEditModeClear(root, { state, activeIdKey:'activeCalculationId', nameKey:'name', onClear: () => state.set(clearedInputs(state.get())) });
  root.querySelector('[data-surface-add]')?.addEventListener('click', () => {
    const current = state.get();
    const base = getAreaType(current.areaType || 'metal-roof');
    const record = { id:`${Date.now()}-${Math.random().toString(16).slice(2)}`, ...surfacePatchFromState(current) };
    if (base?.custom) { record.customCs = current.customCs; record.customCm = current.customCm; }
    state.set({ surfaces:[...(current.surfaces || []), record], activeSurfaceId:record.id, areaName:'', areaSize:'100', customCs:'', customCm:'' });
  });
  root.querySelectorAll('[data-surface-delete]').forEach(btn => btn.addEventListener('click', event => {
    event.stopPropagation();
    const current = state.get();
    const next = (current.surfaces || []).filter(item => String(item.id) !== String(btn.dataset.surfaceDelete));
    state.set({ surfaces:next, activeSurfaceId:String(current.activeSurfaceId || '') === String(btn.dataset.surfaceDelete) ? (next[next.length - 1]?.id || null) : current.activeSurfaceId });
  }));
  root.querySelectorAll('[data-surface-select], [data-surface-result-select]').forEach(el => el.addEventListener('click', event => {
    if (event.target.closest('[data-surface-delete]') || event.target.closest('[data-line-toggle]')) return;
    event.preventDefault();
    event.stopPropagation();
    const id = el.dataset.surfaceSelect || el.dataset.surfaceResultSelect;
    const current = state.get();
    const item = (current.surfaces || []).find(entry => String(entry.id) === String(id));
    if (!item) return;
    preserveScroll(() => state.set({ ...statePatchFromSurface(item), activeSurfaceId:id }));
  }));
  root.querySelector('#drainSize')?.addEventListener('change', event => {
    const selected = roofDrainTable.find(item => item.dn === event.target.value);
    if (!selected) return;
    state.set({ drainSize:selected.dn, drainSizeManual:selected.dn, drainCapacity:String(selected.capacity).replace('.', ','), drainHead:String(selected.head) }, { notify:false });
    patchActiveSurfaceFromState();
    state.set({}, { notify:true });
  });

  root.querySelectorAll('[data-field]').forEach(el => {
    if (!surfaceEditFields.has(el.dataset.field)) return;
    const applyPatch = () => patchActiveSurfaceFromState();
    el.addEventListener('change', applyPatch);
    el.addEventListener('blur', applyPatch);
  });
  root.querySelectorAll('[data-segment="surfaceMode"]').forEach(btn => {
    btn.addEventListener('click', () => setTimeout(patchActiveSurfaceFromState, 0));
  });
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
    event.preventDefault();
    event.stopPropagation();
    const itemCard = toggle.closest('[data-line-card]');
    const collapsed = itemCard?.classList.toggle('is-collapsed');
    toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  }));
  root.querySelectorAll('[data-rainwater-select]').forEach(cardEl => cardEl.addEventListener('click', event => {
    if (event.target.closest('[data-rainwater-delete]') || event.target.closest('[data-line-toggle]')) return;
    event.preventDefault();
    event.stopPropagation();
    const current = state.get();
    const item = (current.savedCalculations || []).find(entry => String(entry.id) === String(cardEl.dataset.rainwaterSelect));
    if (!item?.state) return;
    preserveScroll(() => {
      if (String(current.activeCalculationId || '') === String(item.id)) { state.set(clearedInputs(current)); return; }
      state.set({ ...item.state, savedCalculations:current.savedCalculations || [], activeCalculationId:item.id, name:item.name || item.state.name || '' });
    });
  }));
  root.querySelectorAll('[data-rainwater-delete]').forEach(btn => btn.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    const current = state.get();
    const next = (current.savedCalculations || []).filter(item => String(item.id) !== String(btn.dataset.rainwaterDelete));
    preserveScroll(() => state.set({ savedCalculations:next, activeCalculationId:String(current.activeCalculationId) === String(btn.dataset.rainwaterDelete) ? null : current.activeCalculationId }));
  }));

  root.addEventListener('click', event => {
    const current = state.get();
    if (!current.activeSurfaceId) return;
    const ignore = '[data-surface-select], [data-surface-result-select], [data-surface-delete], [data-line-card], [data-line-toggle], input, select, textarea, button, label, a, .segmented';
    if (event.target.closest(ignore)) return;
    preserveScroll(() => state.set({ activeSurfaceId:null }));
  });
}

export default { config, state, mount(root) { return mountModule(root, state, view, bindActions); } };
