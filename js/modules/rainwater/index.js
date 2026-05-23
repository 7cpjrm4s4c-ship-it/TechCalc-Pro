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
const emergencyOptions = opts([['yes','Notentwässerung vorbemessen'],['no','Nicht berücksichtigen']]);
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
    const subtitle = [`${fmt(r.qr || 0,2)} l/s`, `SL ${r.collectorDn || '—'}`, `FL ${r.stackDn || '—'}`, modeLabel(r.mode)].filter(Boolean).join(' · ');
    return `<article class="ph-saved-item line-section-card is-collapsed ${active ? 'is-active' : ''}" data-line-card data-rainwater-select="${esc(item.id)}">
      <div class="line-section-card__head">
        <div class="line-section-card__title"><strong>${esc(item.name || 'Berechnung')}</strong><small>${esc(subtitle)}</small></div>
        <button type="button" class="line-section-card__toggle" data-line-toggle aria-expanded="false" aria-label="Gespeicherte Berechnung aufklappen"><span>▾</span></button>
        <button type="button" class="line-section-card__delete" data-rainwater-delete="${esc(item.id)}" aria-label="Berechnung löschen">×</button>
      </div>
      <div class="line-section-card__body">${resultRows([
        { label:'Entwässerungsmenge', value:fmt(r.qr || 0,2), unit:'l/s' },
        { label:'DN Sammelleitung', value:r.collectorDn || '—' },
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
      <div><strong>${esc(item.name)}</strong><span>${fmt(item.area,1)} m² · Cs ${fmt(item.cs,2)} · Qr ${fmt(item.qr,2)} l/s · ${item.collectorSelection?.dn || '—'}</span></div>
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
  return stack([
    grid([
      selectField({ id:'drainSize', label:mode === 'property' ? 'Vorwahl Hoftopf' : 'Vorwahl Dacheinlauf', value:s.drainSize || 'DN 100', options:drainOptions }),
      field({ id:'drainSizeManual', label:'DN manuell', value:s.drainSizeManual || s.drainSize || 'DN 100', placeholder:'DN 100', inputmode:'text' }),
      field({ id:'drainCapacity', label:'Abflusswert manuell', value:fmtInput(s.drainCapacity,1), unit:'l/s' }),
      field({ id:'drainHead', label:'Anstauhöhe manuell', value:fmtInput(s.drainHead,0), unit:'mm' }),
      field({ id:'stackCount', label:'Anzahl Fallleitungen', value:fmtInput(s.stackCount,0), unit:'Stk.' }),
      field({ id:'slopeCmM', label:'Gefälle J', value:fmtDecimalInput(s.slopeCmM,1), unit:'cm/m' }),
      selectField({ id:'fillRatio', label:'Füllungsgrad h/di', value:s.fillRatio, options:opts([['0.5','0,5'],['0.7','0,7'],['1.0','1,0']]) })
    ].join(''), 2)
  ].join(''));
}

function emergencyInputBlock(s) {
  const mode = s.surfaceMode || s.calculationType || 'roof';
  if (mode !== 'roof') return '<div class="empty-state empty-state--compact">Notentwässerung wird nur für Dachflächen vorbemessen.</div>';
  return stack([
    grid([
      selectField({ id:'emergencyEnabled', label:'Notentwässerung', value:s.emergencyEnabled || 'yes', options:emergencyOptions }),
      selectField({ id:'emergencyType', label:'Art Notentwässerung', value:s.emergencyType || 'rect', options:emergencyTypeOptions }),
      field({ id:'emergencyHead', label:'Druckhöhe / Anstauhöhe', value:fmtInput(s.emergencyHead || '35',0), unit:'mm' }),
      field({ id:'emergencyWidth', label:'Überlaufbreite Lw', value:fmtInput(s.emergencyWidth || '300',0), unit:'mm' }),
      field({ id:'emergencyDiameter', label:'Durchmesser rund', value:fmtInput(s.emergencyDiameter || '100',0), unit:'mm' }),
      field({ id:'emergencyCapacity', label:'Hersteller-Abflusswert optional', value:s.emergencyCapacity || '', unit:'l/s' }),
      field({ id:'emergencySafetyFactor', label:'Sicherheitsfaktor', value:fmtDecimalInput(s.emergencySafetyFactor || '1,0',1) })
    ].join(''), 2)
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
function inputCards(s, r) {
  return stack([
    modeCard(s),
    card('Regenspende', rainInputBlock(s), 'green'),
    card('Randbedingungen', dimensionInputBlock(s), 'green'),
    card('Notentwässerung', emergencyInputBlock(s), 'green'),
    card('Regenflächen', surfaceInputBlock(s, r), 'green')
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
    return `<article class="line-section-card ${active ? 'is-active' : ''} ${active ? '' : 'is-collapsed'}" data-line-card data-surface-result-select="${esc(item.id)}">
      <div class="line-section-card__head">
        <div class="line-section-card__title"><strong>${esc(item.name)}</strong><small>${fmt(item.area,1)} m² · Qr ${fmt(item.qr,2)} l/s · SL ${item.collectorSelection?.dn || '—'} · FL ${item.stackSelection?.dn || '—'}</small></div>
        <button type="button" class="line-section-card__toggle" data-line-toggle aria-expanded="${active ? 'true' : 'false'}" aria-label="Flächendimensionierung aufklappen"><span>${active ? '▴' : '▾'}</span></button>
      </div>
      <div class="line-section-card__body">${resultRows([
        { label:'Entwässerungsmenge', value:fmt(item.qr,2), unit:'l/s' },
        { label:'DN Sammelleitung', value:item.collectorSelection?.dn || '—' },
        { label:'DN Fallleitung', value:item.stackSelection?.dn || '—' },
        { label:drainLabel(mode), value:item.requiredDrains, unit:'Stk.' },
        { label:'Ablaufdimension', value:item.drainSize || '—' },
        { label:'Ablaufleistung', value:fmt(item.drainCapacity,1), unit:'l/s' },
        { label:'Anstauhöhe Ablauf', value:item.drainHead || '—', unit:item.drainHead ? 'mm' : '' },
        { label:'Anzahl Fallleitungen', value:item.stackCount, unit:'Stk.' },
        { label:'Q je Fallleitung', value:fmt(item.qPerStack,2), unit:'l/s' },
        { label:'Abflussbeiwert Cs', value:fmt(item.cs,2) },
        { label:'Regenspende', value:fmt(item.rdt,1), unit:'l/(s·ha)' },
        { label:'r(5,100)', value:fmt(item.r100,1), unit:'l/(s·ha)' },
        { label:'Notabfluss Qnot', value:fmt(item.emergency?.qNot || 0,2), unit:'l/s' },
        { label:'Notüberläufe', value:item.emergency?.requiredCount || 0, unit:'Stk.' },
        { label:'erf. Überlaufbreite', value:item.emergency?.rectRequiredWidth ? fmt(item.emergency.rectRequiredWidth,0) : '—', unit:item.emergency?.rectRequiredWidth ? 'mm' : '' },
        { label:'gewählte Überlaufleistung', value:item.emergency?.capacity ? fmt(item.emergency.capacity,2) : '—', unit:item.emergency?.capacity ? 'l/s' : '' },
        { label:'Füllungsgrad', value:`h/di ${String(item.fillRatio).replace('.', ',')}` },
        { label:'angesetztes Gefälle', value:fmtStateNumber(item.slopeCmM,1), unit:'cm/m' }
      ])}<div class="ph-formula ph-formula--small">Qr = r × C × A / 10000 · Anzahl Abläufe = Qr / Ablaufleistung · Q je Fallleitung = Qr / Anzahl Fallleitungen</div></div>
    </article>`;
  }).join('')}</div>`;
}
function resultCards(s, r) {
  const mode = r.selectedSurface?.surfaceMode || r.mode || s.surfaceMode || 'roof';
  return stack([
    mainResult('Ergebnis Regenwasser', { label:'DN Sammelleitung', value:r.collectorSelection?.dn || '—' }, [
      { label:'DN Fallleitung', value:r.stackSelection?.dn || '—' },
      { label:drainLabel(mode), value:r.requiredDrains, unit:'Stk.' },
      { label:'Entwässerungsmenge', value:fmt(r.qr,2), unit:'l/s' },
      { label:'Notabfluss Qnot', value:fmt(r.qNot || 0,2), unit:'l/s' },
      { label:'markierte Fläche', value:r.selectedSurface?.name || '—' }
    ], 'green'),
    card('Flächen / Dimensionierung', surfaceDimensionCards(r, s), 'green'),
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
    const record = { id:`${Date.now()}-${Math.random().toString(16).slice(2)}`, surfaceMode:current.surfaceMode || current.calculationType || 'roof', areaType:current.areaType, areaName:current.areaName, areaSize:current.areaSize };
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
    state.set({ activeSurfaceId:el.dataset.surfaceSelect || el.dataset.surfaceResultSelect });
  }));
  root.querySelector('#drainSize')?.addEventListener('change', event => {
    const selected = roofDrainTable.find(item => item.dn === event.target.value);
    if (!selected) return;
    state.set({ drainSize:selected.dn, drainSizeManual:selected.dn, drainCapacity:String(selected.capacity).replace('.', ','), drainHead:String(selected.head) });
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
