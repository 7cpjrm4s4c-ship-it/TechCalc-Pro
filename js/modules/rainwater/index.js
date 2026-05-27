import config from './config.js';
import { state, initialState } from './state.js';
import { calculate, getAreaType, toNumber } from './logic.js';
import { areaTypes, roofDrainTable } from './tables.js';
import { card, field, selectField, segmented, renderModuleShell, stack, grid, mainResult, resultRows, inlineStats, esc } from '../../core/renderer.js';
import { mountModule } from '../../core/mount.js';
import { fmt, fmtInput } from '../../utils/calculations.js';
import { bindEditModeClear, renderSavedRecordList, isSameId } from '../../core/savedRecords.js';
import { canonicalGermanNumberInput } from '../../core/numbers.js';
import { bindSavedCalculationActions } from '../../core/savedCalculationController.js';
import { preserveScroll as keepScroll } from '../../core/scrollManager.js';

const opts = items => items.map(([value, label]) => ({ value, label }));
const splitIndex = areaTypes.findIndex(item => item.id === 'concrete-asphalt');
const customAreaTypes = areaTypes.filter(item => item.custom);
const roofAreaTypes = areaTypes.filter((item, idx) => !item.custom && (splitIndex < 0 || idx < splitIndex));
const propertyAreaTypes = areaTypes.filter((item, idx) => !item.custom && (splitIndex < 0 || idx >= splitIndex));
const areaOptionsForMode = mode => (mode === 'property' ? propertyAreaTypes : roofAreaTypes)
  .concat(customAreaTypes)
  .map(item => ({ value:item.id, label:item.name }));
const defaultAreaTypeForMode = mode => (mode === 'property' ? 'concrete-asphalt' : 'metal-roof');
const normalizeAreaType = (mode, areaType) => {
  const allowed = areaOptionsForMode(mode).map(item => item.value);
  return allowed.includes(areaType) ? areaType : defaultAreaTypeForMode(mode);
};
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
  return renderSavedRecordList(s.savedCalculations || [], {
    activeId: s.activeCalculationId,
    emptyText: 'Noch keine Regenwasser-Berechnungen gespeichert.',
    loadAttr: 'data-rainwater-select',
    toggleAttr: 'data-line-toggle',
    deleteAttr: 'data-rainwater-delete',
    title: item => item.name || 'Berechnung',
    subtitle: item => {
      const r = item.result || {};
      return [`${fmt(r.qr || 0, 2)} l/s`, `FL ${r.stackDn || '—'}`, modeLabel(r.mode)].filter(Boolean).join(' · ');
    },
    stats: item => {
      const r = item.result || {};
      return [
        { label: 'Entwässerungsmenge', value: fmt(r.qr || 0, 2), unit: 'l/s' },
        { label: 'DN Fallleitung', value: r.stackDn || '—' },
        { label: drainLabel(r.mode), value: r.drains || 0, unit: 'Stk.' }
      ];
    }
  });
}

function surfacesTable(r, s) {
  if (!r.surfaces.length) return '<div class="empty-state empty-state--compact">Noch keine Regenflächen hinzugefügt.</div>';
  const activeId = String(s.activeSurfaceId || '');
  return `<div class="tc-consumer-list dw-consumer-list wastewater-fixture-list rainwater-surface-list">${r.surfaces.map(item => {
    const active = String(item.id) === activeId;
    return `<div class="tc-consumer-row dw-consumer-row wastewater-fixture-row rainwater-surface-row ${active ? 'is-active' : ''}" data-surface-select="${esc(item.id)}">
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
  const mode = s.surfaceMode || s.calculationType || 'roof';
  const areaType = normalizeAreaType(mode, s.areaType || defaultAreaTypeForMode(mode));
  const selected = getAreaType(areaType);
  return stack([
    grid([
      field({ id:'areaName', label:'Bezeichnung', value:s.areaName || '', placeholder:'z. B. Dachfläche Nord', inputmode:'text' }),
      selectField({ id:'areaType', label:'Flächenart', value:areaType, options:areaOptionsForMode(mode) }),
      field({ id:'areaSize', label:'Fläche A', value:fmtInput(s.areaSize,1), unit:'m²' }),
      selected?.custom ? field({ id:'customCs', label:'Spitzenabflussbeiwert Cs', value:s.customCs || '', placeholder:'0,9' }) : inlineStats([{ label:'Cs', value:fmt(selected.cs,2) }, { label:'Cm', value:fmt(selected.cm,2) }])
    ].join(''), 2),
    selected?.custom ? grid([field({ id:'customCm', label:'mittlerer Abflussbeiwert Cm', value:s.customCm || '', placeholder:'0,8' })].join(''), 1) : '',
    `<div class="tc-save-actions"><button type="button" class="action-button action-button--secondary" data-surface-add>Fläche hinzufügen</button><button type="button" class="action-button" data-surface-update ${s.activeSurfaceId ? '' : 'disabled'}>Aktualisieren</button></div>`
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
    card('Regenflächen', surfaceInputBlock(s, r), 'green')
  ].join(''));
}
function warningList(warnings, s) {
  const fixed = '<div class="tc-warning ph-warning ph-warning--norm"><span>Normgrundlage: </span><strong>Berechnung erfolgt auf Grundlage der DIN 1986 - 100, aktuellste Fassung.</strong></div>';
  const items = (warnings || []).map(text => `<div class="tc-warning ph-warning"><span>Hinweis: </span><strong>${esc(text)}</strong></div>`).join('');
  return fixed + items;
}
function surfaceDimensionCards(r, s) {
  if (!r.surfaces.length) return '<div class="empty-state empty-state--compact">Keine Einzelflächen berechnet.</div>';
  const activeId = String(s.activeSurfaceId || '');
  return `<div class="tc-saved-list ph-saved-list rainwater-result-list">${r.surfaces.map((item) => {
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
        <div class="tc-result-group rainwater-result-group"><h4>Hauptentwässerung</h4>${resultRows(mainRows)}</div>
        ${isRoof ? `<div class="tc-result-group rainwater-result-group"><h4>Notentwässerung</h4>${resultRows(emergencyRows)}</div>` : ''}
        <div class="tc-formula ph-formula ph-formula--small">Qr = r × C × A / 10000 · Anzahl Abläufe = Qr / Ablaufleistung · Q je Fallleitung = Qr / Anzahl Fallleitungen</div>
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
  const mode = current.surfaceMode || current.calculationType || 'roof';
  return {
    surfaceMode: mode,
    areaType: normalizeAreaType(mode, current.areaType || defaultAreaTypeForMode(mode)),
    areaName: current.areaName,
    areaSize: normalizeSurfaceFieldValue('areaSize', current.areaSize),
    customCs: normalizeSurfaceFieldValue('customCs', current.customCs),
    customCm: normalizeSurfaceFieldValue('customCm', current.customCm),
    roofRainIntensity: normalizeSurfaceFieldValue('roofRainIntensity', current.roofRainIntensity),
    propertyRainIntensity: normalizeSurfaceFieldValue('propertyRainIntensity', current.propertyRainIntensity),
    rainHundredIntensity: normalizeSurfaceFieldValue('rainHundredIntensity', current.rainHundredIntensity),
    drainSize: current.drainSize,
    drainSizeManual: current.drainSizeManual,
    drainCapacity: normalizeSurfaceFieldValue('drainCapacity', current.drainCapacity),
    drainHead: normalizeSurfaceFieldValue('drainHead', current.drainHead),
    stackCount: normalizeSurfaceFieldValue('stackCount', current.stackCount),
    slopeCmM: normalizeSurfaceFieldValue('slopeCmM', current.slopeCmM),
    fillRatio: normalizeSurfaceFieldValue('fillRatio', current.fillRatio),
    emergencyType: current.emergencyType,
    emergencyHead: normalizeSurfaceFieldValue('emergencyHead', current.emergencyHead),
    emergencyWidth: normalizeSurfaceFieldValue('emergencyWidth', current.emergencyWidth),
    emergencyDiameter: normalizeSurfaceFieldValue('emergencyDiameter', current.emergencyDiameter),
    emergencyManufacturerDn: current.emergencyManufacturerDn,
    emergencyCapacity: normalizeSurfaceFieldValue('emergencyCapacity', current.emergencyCapacity),
    emergencySafetyFactor: normalizeSurfaceFieldValue('emergencySafetyFactor', current.emergencySafetyFactor)
  };
}
function patchActiveSurfaceFromState() {
  const current = state.get();
  const activeId = current.activeSurfaceId;
  if (!activeId) return false;
  const next = (current.surfaces || []).map(item => String(item.id) === String(activeId) ? { ...item, ...surfacePatchFromState(current) } : item);
  state.set({ surfaces: next }, { notify:false });
  return true;
}
function commitActiveSurfaceField(field, value) {
  if (!surfaceEditFields.has(field)) return false;
  const current = state.get();
  const activeId = current.activeSurfaceId;
  if (!activeId) return false;
  const nextValue = normalizeSurfaceFieldValue(field, value);
  const nextCurrent = { ...current, [field]: nextValue };
  const patch = surfacePatchFromState(nextCurrent);
  const next = (current.surfaces || []).map(item => String(item.id) === String(activeId) ? { ...item, ...patch } : item);
  state.set({ [field]: nextValue, surfaces: next }, { notify:false });
  return true;
}
function commitSurfaceFieldsBeforeAction(root) {
  root.querySelectorAll('[data-field]').forEach(el => {
    if (surfaceEditFields.has(el.dataset.field)) commitActiveSurfaceField(el.dataset.field, el.value);
  });
}
function statePatchFromSurface(item = {}) {
  const mode = item.surfaceMode || item.calculationType || 'roof';
  return {
    surfaceMode: mode,
    calculationType: mode,
    areaType: normalizeAreaType(mode, item.areaType || defaultAreaTypeForMode(mode)),
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
function clearSurfaceEditorPatch(current = {}) {
  const mode = current.surfaceMode || current.calculationType || 'roof';
  return {
    activeSurfaceId: null,
    surfaceMode: mode,
    calculationType: mode,
    areaType: normalizeAreaType(mode, defaultAreaTypeForMode(mode)),
    areaName: '',
    areaSize: '',
    customCs: '',
    customCm: '',
    drainSize: 'DN 100',
    drainSizeManual: '',
    drainCapacity: '',
    drainHead: '',
    stackCount: '',
    emergencyType: 'rect',
    emergencyHead: '',
    emergencyWidth: '',
    emergencyDiameter: '',
    emergencyManufacturerDn: '',
    emergencyCapacity: '',
    emergencySafetyFactor: ''
  };
}
function resetSurfaceEditorAfterAdd(current = {}) {
  return {
    ...clearSurfaceEditorPatch(current),
    roofRainIntensity: current.roofRainIntensity || current.rainIntensity || '300',
    propertyRainIntensity: current.propertyRainIntensity || current.rainIntensity || '300',
    rainIntensity: current.rainIntensity || '300',
    rainHundredIntensity: current.rainHundredIntensity || '500'
  };
}

const surfaceNumericFields = new Set(['areaSize','customCs','customCm','roofRainIntensity','propertyRainIntensity','rainHundredIntensity','drainCapacity','drainHead','stackCount','slopeCmM','fillRatio','emergencyHead','emergencyWidth','emergencyDiameter','emergencyCapacity','emergencySafetyFactor']);
function normalizeSurfaceFieldValue(field, value) {
  return surfaceNumericFields.has(field) ? canonicalGermanNumberInput(value) : value;
}

const surfaceEditFields = new Set(['surfaceMode','areaType','areaName','areaSize','customCs','customCm','roofRainIntensity','propertyRainIntensity','rainHundredIntensity','drainSize','drainSizeManual','drainCapacity','drainHead','stackCount','emergencyType','emergencyHead','emergencyWidth','emergencyDiameter','emergencyManufacturerDn','emergencyCapacity','emergencySafetyFactor']);
function preserveScroll(action) {
  keepScroll(action);
}
function bindActions(root) {
  bindEditModeClear(root, { state, activeIdKey:'activeCalculationId', nameKey:'name', onClear: () => state.set(clearedInputs(state.get())) });
  if (!root.__rainwaterInputBound) {
    root.__rainwaterInputBound = true;
    root.addEventListener('input', event => {
      const el = event.target.closest('[data-field]');
      if (!el) return;
      commitActiveSurfaceField(el.dataset.field, el.value);
    });
    root.addEventListener('change', event => {
      const el = event.target.closest('[data-field]');
      if (!el) return;
      commitActiveSurfaceField(el.dataset.field, el.value);
    });
  }
  root.querySelector('[data-surface-add]')?.addEventListener('pointerdown', () => commitSurfaceFieldsBeforeAction(root), { capture:true });
  root.querySelector('[data-surface-add]')?.addEventListener('click', () => {
    commitSurfaceFieldsBeforeAction(root);
    const current = state.get();
    const patch = surfacePatchFromState(current);
    const base = getAreaType(patch.areaType || defaultAreaTypeForMode(patch.surfaceMode));
    const record = { id:`${Date.now()}-${Math.random().toString(16).slice(2)}`, ...patch };
    if (base?.custom) { record.customCs = current.customCs; record.customCm = current.customCm; }
    preserveScroll(() => state.set({
      ...resetSurfaceEditorAfterAdd(current),
      surfaces:[...(current.surfaces || []), record],
      activeSurfaceId:null
    }));
  });

  root.querySelectorAll('[data-segment="surfaceMode"]').forEach(btn => btn.addEventListener('click', event => {
    const nextMode = btn.dataset.value || 'roof';
    const current = state.get();
    const nextAreaType = normalizeAreaType(nextMode, current.areaType || defaultAreaTypeForMode(nextMode));
    if (nextAreaType !== current.areaType) preserveScroll(() => state.set({ areaType:nextAreaType }, { notify:true }));
  }));
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
    if (String(current.activeSurfaceId || '') === String(id)) {
      preserveScroll(() => state.set(clearSurfaceEditorPatch(current)));
      return;
    }
    const item = (current.surfaces || []).find(entry => String(entry.id) === String(id));
    if (!item) return;
    preserveScroll(() => state.set({ ...statePatchFromSurface(item), activeSurfaceId:id }));
  }));
  root.querySelector('#drainSize')?.addEventListener('change', event => {
    const selected = roofDrainTable.find(item => item.dn === event.target.value);
    if (!selected) return;
    preserveScroll(() => state.set({ drainSize:selected.dn, drainSizeManual:selected.dn, drainCapacity:String(selected.capacity).replace('.', ','), drainHead:String(selected.head) }));
  });

  root.querySelector('[data-surface-update]')?.addEventListener('pointerdown', () => commitSurfaceFieldsBeforeAction(root), { capture:true });
  root.querySelector('[data-surface-update]')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    commitSurfaceFieldsBeforeAction(root);
    preserveScroll(() => {
      if (!patchActiveSurfaceFromState()) return;
      state.set({}, { notify:true });
    });
  });
  bindSavedCalculationActions(root, {
    state,
    calculate,
    snapshot: savedSnapshot,
    clearInputs: clearedInputs,
    saveSelector: '[data-rainwater-save]',
    updateSelector: '[data-rainwater-update]',
    loadAttr: 'data-rainwater-select',
    toggleAttr: 'data-line-toggle',
    deleteAttr: 'data-rainwater-delete'
  });

  if (!root.__rainwaterOutsideBound) {
    root.__rainwaterOutsideBound = true;
    root.addEventListener('click', event => {
      const current = state.get();
      if (!current.activeSurfaceId) return;
      const ignore = '[data-surface-select], [data-surface-result-select], [data-surface-delete], [data-line-card], [data-line-toggle], input, select, textarea, button, label, a, .segmented';
      if (event.target.closest(ignore)) return;
      preserveScroll(() => state.set(clearSurfaceEditorPatch(current)));
    });
  }
}

export default { config, state, mount(root) { return mountModule(root, state, view, bindActions); } };
