import config from './config.js';
import schema from './schema.js';
import { state, initialState } from './state.js';
import { calculate, getAreaType, toNumber } from './logic.js';
import { areaTypes, roofDrainTable } from './tables.js';
import { card, field, selectField, segmented, renderModuleShell, stack, grid, mainResult, resultRows, inlineStats, esc } from '../../core/renderer.js';
import { mountModule } from '../../core/mount.js';
import { fmt, fmtInput } from '../../utils/calculations.js';
import { renderSavedRecordList, isSameId, createRecordId, replaceRecord, removeRecord } from '../../core/savedRecords.js';
import { canonicalGermanNumberInput } from '../../core/numbers.js';
import { preserveScroll as keepScroll } from '../../core/scrollManager.js';
import { registerCentralActions, commitAllFields } from '../../core/eventPipeline.js';

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

function surfacesTable(r, s) {
  const items = (Array.isArray(r.surfaces) ? r.surfaces : []).filter(item => !item.transient && String(item.id) !== '__current_input__');
  return renderSavedRecordList(items, {
    activeId: s.activeSurfaceId,
    expandedId: s.expandedSurfaceResultId,
    emptyText: 'Noch keine Regenflächen gespeichert.',
    loadAttr: 'data-rainwater-surface-select',
    toggleAttr: 'data-rainwater-surface-toggle',
    deleteAttr: 'data-rainwater-surface-delete',
    title: item => item.name || 'Regenfläche',
    subtitle: item => {
      const mode = item.surfaceMode || s.surfaceMode || 'roof';
      return `${modeLabel(mode)} · ${fmt(item.area,1)} m² · Qr ${fmt(item.qr || 0,2)} l/s`;
    },
    stats: item => {
      const mode = item.surfaceMode || s.surfaceMode || 'roof';
      const rows = [
        { label: 'Fläche', value: fmt(item.area,1), unit: 'm²' },
        { label: 'Cs', value: fmt(item.cs,2) },
        { label: 'Qr', value: fmt(item.qr || 0,2), unit: 'l/s' },
        { label: drainLabel(mode), value: item.requiredDrains || 0, unit: 'Stk.' },
        { label: 'Ablaufdimension', value: item.drainSize || '—' }
      ];
      if (mode === 'roof') rows.push({ label: 'DN Fallleitung', value: item.stackSelection?.dn || '—' });
      return rows;
    }
  });
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
    `<a class="action-button action-button--secondary tc-action-link" href="${esc(KOSTRA_URL)}" target="_blank" rel="noopener">KOSTRA / OpenKo Daten öffnen</a>`
  ].join(''));
}
function selectedDrainPreset(s) {
  return roofDrainTable.find(item => item.dn === (s.drainSize || 'DN 100')) || roofDrainTable.find(item => item.dn === 'DN 100') || roofDrainTable[0];
}

function dimensionInputBlock(s) {
  const mode = s.surfaceMode || s.calculationType || 'roof';
  const preset = selectedDrainPreset(s);
  const fields = [
    selectField({ id:'drainSize', label:mode === 'property' ? 'Vorwahl Hoftopf' : 'Vorwahl Dacheinlauf', value:s.drainSize || 'DN 100', options:drainOptions, commit:'immediate', lookup:true, render:'defer' }),
    field({ id:'drainSizeManual', label:'DN manuell', value:s.drainSizeManual || s.drainSize || preset?.dn || 'DN 100', placeholder:'DN 100', inputmode:'text' }),
    field({ id:'drainCapacity', label:'Abflusswert', value:fmtInput(s.drainCapacity || preset?.capacity,1), unit:'l/s', readonly:true }),
    field({ id:'drainHead', label:'Anstauhöhe', value:fmtInput(s.drainHead || preset?.head,0), unit:'mm', readonly:true })
  ];
  if (mode === 'roof') fields.push(field({ id:'stackCount', label:'Anzahl Fallleitungen', value:fmtInput(s.stackCount,0), unit:'Stk.' }));
  return stack([grid(fields.join(''), 2)].join(''));
}

function emergencyInputBlock(s) {
  const mode = s.surfaceMode || s.calculationType || 'roof';
  if (mode !== 'roof') return '<div class="empty-state empty-state--compact">Notentwässerung wird nur für Dachflächen vorbemessen.</div>';
  const type = s.emergencyType || 'rect';
  const fields = [
    selectField({ id:'emergencyType', label:'Art Notentwässerung', value:type, options:emergencyTypeOptions, commit:'immediate', lookup:true }),
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
function surfaceInputBlock(s) {
  const mode = s.surfaceMode || s.calculationType || 'roof';
  const areaType = normalizeAreaType(mode, s.areaType || defaultAreaTypeForMode(mode));
  const selected = getAreaType(areaType);
  return stack([
    grid([
      selectField({ id:'areaType', label:'Flächenart', value:areaType, options:areaOptionsForMode(mode), commit:'immediate', lookup:true }),
      field({ id:'areaSize', label:'Fläche A', value:fmtInput(s.areaSize,1), unit:'m²' }),
      selected?.custom ? field({ id:'customCs', label:'Spitzenabflussbeiwert Cs', value:s.customCs || '', placeholder:'0,9' }) : inlineStats([{ label:'Cs', value:fmt(selected.cs,2) }, { label:'Cm', value:fmt(selected.cm,2) }])
    ].join(''), 2),
    selected?.custom ? grid([field({ id:'customCm', label:'mittlerer Abflussbeiwert Cm', value:s.customCm || '', placeholder:'0,8' })].join(''), 1) : ''
  ].join(''));
}
function surfaceSaveCard(s, r) {
  return card('Gespeicherte Flächen', stack([
    field({ id:'areaName', label:'Bezeichnung', value:s.areaName || '', placeholder:'z. B. Dachfläche Nord', inputmode:'text' }),
    `<div class="tc-save-actions"><button type="button" class="action-button action-button--secondary" data-tc-action="rainwater:surface-add" data-surface-add ${s.activeSurfaceId ? 'disabled' : ''}>Speichern</button><button type="button" class="action-button" data-tc-action="rainwater:surface-update" data-surface-update ${s.activeSurfaceId ? '' : 'disabled'}>Aktualisieren</button></div>`,
    `<div data-rainwater-dynamic="surface-list">${surfacesTable(r, s)}</div>`
  ].join('')), 'green');
}
function inputCards(s, r) {
  return stack([
    modeCard(s),
    card('Regenspende', rainInputBlock(s), 'green'),
    card('Dacheinläufe / Hoftöpfe', dimensionInputBlock(s), 'green'),
    card('Notentwässerung', emergencyInputBlock(s), 'green'),
    card('Regenfläche', surfaceInputBlock(s), 'green')
  ].join(''));
}
function warningList(warnings, s) {
  const fixed = '<div class="tc-warning"><span>Normgrundlage: </span><strong>Berechnung erfolgt auf Grundlage der DIN 1986 - 100, aktuellste Fassung.</strong></div>';
  const items = (warnings || []).map(text => `<div class="tc-warning"><span>Hinweis: </span><strong>${esc(text)}</strong></div>`).join('');
  return fixed + items;
}
function resultCards(s, r) {
  const mode = r.selectedSurface?.surfaceMode || r.mode || s.surfaceMode || 'roof';
  const isRoof = mode === 'roof';
  const selectedLabel = r.selectedSurface && !r.selectedSurface.transient ? r.selectedSurface.name : 'Aktuelle Eingabe';
  const secondary = [
    { label:'Entwässerungsmenge', value:fmt(r.qr,2), unit:'l/s' },
    { label:'Ablaufdimension', value:r.drainSize || '—' },
    { label:'Abläufe', value:r.requiredDrains, unit:'Stk.' },
    { label:'Quelle', value:selectedLabel || 'Aktuelle Eingabe' }
  ];
  if (isRoof) secondary.splice(1, 0, { label:'DN Fallleitung', value:r.stackSelection?.dn || '—' }, { label:'Notabfluss Qnot', value:fmt(r.qNot || 0,2), unit:'l/s' });
  const clearSelection = s.activeSurfaceId ? '<div class="tc-save-actions"><button type="button" class="action-button action-button--secondary" data-tc-action="rainwater:surface-clear-selection">Auswahl aufheben</button></div>' : '';
  return stack([
    mainResult('Ergebnis Regenwasser', { label:isRoof ? 'DN Fallleitung' : drainLabel(mode), value:isRoof ? (r.stackSelection?.dn || '—') : r.requiredDrains, unit:isRoof ? '' : 'Stk.' }, secondary, 'green') + clearSelection,
    card('Normhinweise / Plausibilität', warningList(r.warnings, s), 'green')
  ].join(''));
}
function view(s) {
  const r = calculate(s);
  return renderModuleShell(config, `<div class="span-6">${inputCards(s, r)}</div><div class="span-6">${resultCards(s, r)}${surfaceSaveCard(s, r)}</div>`);
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

function patchLookupDefaults(patch = {}, base = state.get()) {
  const next = { ...patch };
  const drainSize = next.drainSize || base.drainSize;
  if (Object.prototype.hasOwnProperty.call(patch, 'drainSize')) {
    const preset = roofDrainTable.find(item => item.dn === drainSize) || roofDrainTable.find(item => item.dn === 'DN 100') || roofDrainTable[0];
    next.drainSizeManual = preset?.dn || drainSize || 'DN 100';
    next.drainCapacity = preset?.capacity != null ? String(preset.capacity).replace('.', ',') : '';
    next.drainHead = preset?.head != null ? String(preset.head) : '';
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'emergencyType')) {
    const type = next.emergencyType || base.emergencyType || 'rect';
    if (type === 'rect') {
      next.emergencyWidth = base.emergencyWidth || '300';
      next.emergencyDiameter = '';
      next.emergencyCapacity = '';
    } else if (type === 'round') {
      next.emergencyDiameter = base.emergencyDiameter || '100';
      next.emergencyWidth = '';
      next.emergencyCapacity = '';
    } else if (type === 'manual') {
      next.emergencyWidth = '';
      next.emergencyDiameter = '';
    }
  }
  return next;
}


function setSegmentVisual(root, field, value) {
  root?.querySelectorAll?.(`[data-segment="${field}"]`)?.forEach(button => {
    const active = String(button.dataset.value) === String(value);
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
  });
}

function patchFieldDomValue(root, field, value, digits = null) {
  const el = root?.querySelector?.(`[data-field="${field}"]`);
  if (!el) return;
  const next = digits == null ? String(value ?? '') : fmtInput(value, digits);
  if (el.value !== next) el.value = next;
}

function hydrateDrainDom(root, patch) {
  patchFieldDomValue(root, 'drainSizeManual', patch.drainSizeManual || '', null);
  patchFieldDomValue(root, 'drainCapacity', patch.drainCapacity || '', 1);
  patchFieldDomValue(root, 'drainHead', patch.drainHead || '', 0);
}

const surfaceEditFields = new Set(['surfaceMode','areaType','areaName','areaSize','customCs','customCm','roofRainIntensity','propertyRainIntensity','rainHundredIntensity','drainSize','drainSizeManual','drainCapacity','drainHead','stackCount','emergencyType','emergencyHead','emergencyWidth','emergencyDiameter','emergencyManufacturerDn','emergencyCapacity','emergencySafetyFactor']);
function preserveScroll(action) {
  keepScroll(action);
}
function bindActions(root) {
  // Regenwasser uses the central event pipeline as the only write path.
  // Field changes are committed globally; area records are synchronized when
  // the user explicitly saves/updates/selects a surface. Keeping module-owned
  // input/change listeners on the shared app root caused stale handlers after
  // module switches and broke navigation from Heizung/Lüftung to Regenwasser.

  const addSurface = () => {
    commitAllFields(root, state, { action:'rainwater:pre-surface-add', notify:false });
    commitSurfaceFieldsBeforeAction(root);
    const current = state.get();
    const patch = surfacePatchFromState(current);
    const base = getAreaType(patch.areaType || defaultAreaTypeForMode(patch.surfaceMode));
    const record = { id:createRecordId('rain-surface'), ...patch };
    if (base?.custom) { record.customCs = current.customCs; record.customCm = current.customCm; }
    preserveScroll(() => state.set({
      ...resetSurfaceEditorAfterAdd(current),
      surfaces:[...(current.surfaces || []), record],
      activeSurfaceId:null
    }, { action:'rainwater:surface-add' }));
  };

  const updateSurface = () => {
    commitAllFields(root, state, { action:'rainwater:pre-surface-update', notify:false });
    commitSurfaceFieldsBeforeAction(root);
    preserveScroll(() => {
      if (!patchActiveSurfaceFromState()) return;
      state.set({}, { notify:true, action:'rainwater:surface-update' });
    });
  };

  const selectSurface = element => {
    const carrier = element?.closest?.('[data-rainwater-surface-select], [data-surface-select], [data-surface-result-select]') || element;
    const id = carrier?.getAttribute?.('data-rainwater-surface-select') || carrier?.getAttribute?.('data-surface-select') || carrier?.getAttribute?.('data-surface-result-select');
    if (!id) return;
    const current = state.get();
    if (isSameId(current.activeSurfaceId, id)) {
      preserveScroll(() => state.set(clearSurfaceEditorPatch(current), { action:'rainwater:surface-deselect' }));
      return;
    }
    const item = (current.surfaces || []).find(entry => isSameId(entry.id, id));
    if (!item) return;
    preserveScroll(() => state.set({ ...statePatchFromSurface(item), activeSurfaceId:id }, { action:'rainwater:surface-select' }));
  };

  const deleteSurface = element => {
    const carrier = element?.closest?.('[data-rainwater-surface-delete], [data-surface-delete]') || element;
    const id = carrier?.getAttribute?.('data-rainwater-surface-delete') || carrier?.getAttribute?.('data-surface-delete');
    if (!id) return;
    const current = state.get();
    const next = removeRecord(current.surfaces || [], id);
    state.set({
      surfaces: next,
      activeSurfaceId: isSameId(current.activeSurfaceId, id) ? null : current.activeSurfaceId,
      expandedSurfaceResultId: isSameId(current.expandedSurfaceResultId, id) ? null : current.expandedSurfaceResultId
    }, { action:'rainwater:surface-delete' });
  };

  const toggleSurface = element => {
    const card = element?.closest?.('[data-rainwater-surface-select], [data-line-card]');
    const id = card?.getAttribute?.('data-rainwater-surface-select') || card?.getAttribute?.('data-surface-result-select');
    if (!id) return;
    const current = state.get();
    state.set({ expandedSurfaceResultId: isSameId(current.expandedSurfaceResultId, id) ? null : id }, { action:'rainwater:surface-toggle' });
  };



  const selectSegment = ({ element, root }) => {
    const field = element?.dataset?.segment;
    const value = element?.dataset?.value;
    if (field !== 'surfaceMode' || !value) return;
    const nextMode = value === 'property' ? 'property' : 'roof';
    setSegmentVisual(root, 'surfaceMode', nextMode);
    const current = state.get();
    const drainPatch = patchLookupDefaults({ drainSize: current.drainSize || 'DN 100' }, current);
    preserveScroll(() => state.set({
      ...drainPatch,
      surfaceMode: nextMode,
      calculationType: nextMode,
      areaType: defaultAreaTypeForMode(nextMode),
      activeSurfaceId: null,
      expandedSurfaceResultId: null
    }, { action:'rainwater:surface-mode-select' }));
  };

  const normalizeLookupsAfterCommit = event => {
    const fieldName = event?.detail?.field;
    if (fieldName !== 'drainSize' && fieldName !== 'emergencyType' && fieldName !== 'areaType') return;
    const current = state.get();
    if (fieldName === 'areaType') {
      state.set({ areaType: normalizeAreaType(current.surfaceMode || current.calculationType || 'roof', current.areaType) }, { action:'rainwater:area-type-normalize', notify:true });
      return;
    }
    const lookupPatch = patchLookupDefaults({ [fieldName]: current[fieldName] }, current);
    state.set(lookupPatch, { action:`rainwater:${fieldName}:lookup`, notify: fieldName !== 'drainSize' });
    if (fieldName === 'drainSize') hydrateDrainDom(root, lookupPatch);
  };
  if (!root.__tcRainwaterLookupHydrationBound) {
    root.__tcRainwaterLookupHydrationBound = true;
    root.addEventListener('tc:commit', normalizeLookupsAfterCommit);
    root.__tcRainwaterLookupHydrationCleanup = () => {
      root.removeEventListener('tc:commit', normalizeLookupsAfterCommit);
      root.__tcRainwaterLookupHydrationBound = false;
      root.__tcRainwaterLookupHydrationCleanup = null;
    };
  }

  registerCentralActions(root, {
    'segment': selectSegment,
    'rainwater:surface-add': addSurface,
    'rainwater:surface-update': updateSurface,
    'rainwater:surface-select': ({ element }) => selectSurface(element),
    'rainwater:surface-delete': ({ element }) => deleteSurface(element),
    'rainwater:surface-toggle': ({ element }) => toggleSurface(element),
    'rainwater:surface-clear-selection': () => preserveScroll(() => state.set(clearSurfaceEditorPatch(state.get()), { action:'rainwater:surface-clear-selection' })),
    // Global saved-record actions are scoped to Regenflächen only. The former
    // duplicate calculation-level save workflow was removed in Phase 14G so
    // Regenwasser follows the same single-record workflow as the reference modules.
    'saved:load': ({ element }) => {
      if (element?.closest?.('[data-rainwater-surface-select]')) return selectSurface(element);
      return undefined;
    },
    'saved:delete': ({ element }) => {
      if (element?.closest?.('[data-rainwater-surface-delete]')) return deleteSurface(element);
      return undefined;
    },
    'saved:toggle': ({ element }) => {
      if (element?.closest?.('[data-rainwater-surface-select]')) return toggleSurface(element);
      return undefined;
    }
  });

}

export default { config, schema, state, mount(root) { return mountModule(root, state, view, bindActions); } };
