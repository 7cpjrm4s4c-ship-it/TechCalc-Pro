import { parseNumber } from '../../core/numberService.js';
import config from './config.js';
import schema from './schema.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { card, field, segmented, renderModuleShell, stack, grid, inlineStats, mainResult, bindCommonInputs, bindNoClickScroll } from '../../core/renderer.js';
import { registerCentralActions } from '../../core/eventPipeline.js';
import { fmt, fmtInput } from '../../utils/calculations.js';
import { createRecordId, isSameId, replaceRecord, removeRecord, renderSavedRecordList, bindEditModeClear } from '../../core/savedRecords.js';

const MODE_PREFIX = { heating: 'heating', cooling: 'cooling' };
function prefixFor(s) { return MODE_PREFIX[s.mode] || 'heating'; }
function key(s, name) { return `${prefixFor(s)}${name}`; }
function activeValue(s, name) { return s[key(s, name)]; }


let ventilationLineSectionsMemory = [];
export function readVentilationLineSections() {
  return Array.isArray(ventilationLineSectionsMemory) ? [...ventilationLineSectionsMemory] : [];
}
export function writeVentilationLineSections(items) {
  ventilationLineSectionsMemory = Array.isArray(items) ? [...items] : [];
}

function ventilationLineSectionStats(item) {
  return [
    { label: 'Leistung', value: item.powerKw || '—', unit: item.powerKw && item.powerKw !== '—' ? 'kW' : '' },
    { label: 'Volumenstrom', value: item.volumeFlowM3h || '—', unit: item.volumeFlowM3h && item.volumeFlowM3h !== '—' ? 'm³/h' : '' },
    { label: 'Massenstrom', value: item.massFlowKgh || '—', unit: item.massFlowKgh && item.massFlowKgh !== '—' ? 'kg/h' : '' },
    { label: 'Temperaturdifferenz', value: item.deltaT || '—', unit: item.deltaT && item.deltaT !== '—' ? 'K' : '' },
    { label: 'Zuluft', value: item.supplyTemp || '—', unit: item.supplyTemp && item.supplyTemp !== '—' ? '°C' : '' },
    { label: 'Raum', value: item.roomTemp || '—', unit: item.roomTemp && item.roomTemp !== '—' ? '°C' : '' },
    { label: 'Betriebsart', value: item.modeLabel || '—' }
  ];
}

function ventilationLineSectionsCard(r, active, modeLabel) {
  const snapshot = state.get();
  const items = Array.isArray(snapshot.ventLineSections) ? snapshot.ventLineSections : readVentilationLineSections();
  const rows = renderSavedRecordList(items, {
    activeId: snapshot.activeVentLineSectionId,
    expandedId: snapshot.expandedVentLineSectionId,
    emptyText: 'Noch keine Leitungsabschnitte angelegt',
    loadAttr: 'data-vent-line-select',
    toggleAttr: 'data-line-toggle',
    deleteAttr: 'data-line-delete',
    title: item => item.name || 'Abschnitt',
    stats: item => ventilationLineSectionStats(item)
  });
  return card('Leitungsabschnitte', stack([
    `<div class="field"><label for="ventLineSectionName">Bezeichnung</label><div class="control"><input id="ventLineSectionName" type="text" placeholder="z. B. Zuluft Büro Nord" autocomplete="off" value="${(snapshot.activeVentLineSectionName || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"></div></div>`,
    `<div class="tc-save-actions"><button type="button" class="action-button" data-tc-action="vent-line:save" data-vent-line-save ${snapshot.activeVentLineSectionId ? 'disabled' : ''}>Speichern</button><button type="button" class="action-button" data-tc-action="vent-line:update" data-vent-line-update ${snapshot.activeVentLineSectionId ? '' : 'disabled'}>Aktualisieren</button></div>`,
    `<div data-vent-dynamic="line-sections">${rows}</div>`
  ].join('')), 'cyan');
}

function buildVentilationLineSectionRecord(currentState, r, active, modeLabel, items, id, name, existing = null) {
  return {
    id,
    name: name || currentState.activeVentLineSectionName || existing?.name || `Abschnitt ${items.length + 1}`,
    powerKw: fmt(r.powerKw),
    volumeFlowM3h: fmt(r.volumeFlowM3h),
    massFlowKgh: fmt(r.massFlowKgh),
    deltaT: fmt(r.deltaT),
    supplyTemp: fmt(active.supplyTemp),
    roomTemp: fmt(active.roomTemp),
    modeLabel,
    inputState: activeCalculationState(currentState),
    uiState: { mode: currentState.mode },
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}


function firstFilled(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return '';
}

function parseDisplayNumber(value) {
  if (value === undefined || value === null || value === '—') return '';
  const parsed = parseNumber(value, { fallback: NaN });
  return Number.isFinite(parsed) ? String(parsed) : '';
}

function inferStoredMode(input = {}, item = {}, fallback = 'heating') {
  if (input.mode === 'cooling' || input.mode === 'heating') return input.mode;
  if (item.uiState?.mode === 'cooling' || item.uiState?.mode === 'heating') return item.uiState.mode;
  const label = String(item.modeLabel || item.mode || '').toLowerCase();
  if (label.includes('kälte') || label.includes('kuehl') || label.includes('kühl')) return 'cooling';
  const hasCooling = ['coolingCalcTarget', 'coolingPowerW', 'coolingVolumeFlowM3h', 'coolingDeltaT', 'coolingSupplyTemp', 'coolingRoomTemp'].some(k => input[k] !== undefined && input[k] !== null && input[k] !== '');
  const hasHeating = ['heatingCalcTarget', 'heatingPowerW', 'heatingVolumeFlowM3h', 'heatingDeltaT', 'heatingSupplyTemp', 'heatingRoomTemp'].some(k => input[k] !== undefined && input[k] !== null && input[k] !== '');
  if (hasCooling && !hasHeating) return 'cooling';
  return fallback === 'cooling' ? 'cooling' : 'heating';
}

function savedVentilationPatch(item, currentState) {
  const input = item.inputState || item.state || item.uiState || {};
  const nextMode = inferStoredMode(input, item, currentState.mode || 'heating');
  const prefix = nextMode === 'cooling' ? 'cooling' : 'heating';
  const calcTarget = firstFilled(input.calcTarget, input[`${prefix}CalcTarget`], currentState[`${prefix}CalcTarget`], 'power');
  const powerFromResult = parseDisplayNumber(item.powerKw);
  return {
    ...(item.uiState || {}),
    mode: nextMode,
    [`${prefix}CalcTarget`]: calcTarget,
    [`${prefix}PowerW`]: firstFilled(input.powerW, input[`${prefix}PowerW`], calcTarget !== 'power' ? powerFromResult : ''),
    [`${prefix}PowerUnit`]: firstFilled(input.powerUnit, input[`${prefix}PowerUnit`], calcTarget !== 'power' && powerFromResult ? 'kW' : 'W'),
    [`${prefix}VolumeFlowM3h`]: firstFilled(input.volumeFlowM3h, input[`${prefix}VolumeFlowM3h`], parseDisplayNumber(item.volumeFlowM3h)),
    [`${prefix}SupplyTemp`]: firstFilled(input.supplyTemp, input[`${prefix}SupplyTemp`], parseDisplayNumber(item.supplyTemp)),
    [`${prefix}RoomTemp`]: firstFilled(input.roomTemp, input[`${prefix}RoomTemp`], parseDisplayNumber(item.roomTemp)),
    activeVentLineSectionId: item.id,
    activeVentLineSectionName: item.name || ''
  };
}

function bindVentilationLineSections(root, r, active, modeLabel, rerender) {
  bindEditModeClear(root, { state, activeIdKey: 'activeVentLineSectionId', nameKey: 'activeVentLineSectionName' });

  const currentResult = () => calculate(activeCalculationState(state.get()));
  const currentItems = () => {
    const snapshot = state.get();
    return Array.isArray(snapshot.ventLineSections) ? snapshot.ventLineSections : readVentilationLineSections();
  };
  const persistLineSections = (items, patch = {}, action = 'vent-line:update') => {
    const next = Array.isArray(items) ? [...items] : [];
    ventilationLineSectionsMemory = next;
    state.set({ ventLineSections: next, ...patch }, { action });
  };
  const shouldSkipDuplicateAction = action => {
    const now = Date.now();
    const last = root.__tcLastVentilationLineAction || {};
    if (last.action === action && now - Number(last.at || 0) < 700) return true;
    root.__tcLastVentilationLineAction = { action, at: now };
    return false;
  };
  const currentModeLabel = () => state.get().mode === 'cooling' ? 'Kälte' : 'Heizung';

  const saveCurrentLine = ({ root: actionRoot } = {}) => {
    if (shouldSkipDuplicateAction('vent-line:save')) return;
    const host = actionRoot || root;
    const name = host.querySelector('#ventLineSectionName')?.value?.trim() || '';
    const currentState = state.get();
    const activeState = activeCalculationState(currentState);
    const items = currentItems();
    const id = createRecordId('vent');
    const item = buildVentilationLineSectionRecord({ ...currentState, activeVentLineSectionId: null, activeVentLineSectionName: name }, currentResult(), activeState, currentModeLabel(), items, id, name);
    persistLineSections([item, ...items], { activeVentLineSectionId: null, activeVentLineSectionName: '', expandedVentLineSectionId: state.get().expandedVentLineSectionId }, 'vent-line:save');
  };

  const updateCurrentLine = ({ root: actionRoot } = {}) => {
    if (shouldSkipDuplicateAction('vent-line:update')) return;
    const host = actionRoot || root;
    const currentState = state.get();
    const id = currentState.activeVentLineSectionId;
    if (!id) return;
    const name = host.querySelector('#ventLineSectionName')?.value?.trim() || '';
    const items = currentItems();
    const existing = items.find(entry => isSameId(entry.id, id));
    if (!existing) return;
    const activeState = activeCalculationState(currentState);
    const item = buildVentilationLineSectionRecord(currentState, currentResult(), activeState, currentModeLabel(), items, id, name, existing);
    persistLineSections(replaceRecord(items, id, item), { activeVentLineSectionId: id, activeVentLineSectionName: item.name, expandedVentLineSectionId: state.get().expandedVentLineSectionId }, 'vent-line:update');
  };

  const loadLine = id => {
    const item = currentItems().find(entry => isSameId(entry.id, id));
    if (!item) return;
    if (isSameId(state.get().activeVentLineSectionId, id)) {
      state.set({ activeVentLineSectionId: null, activeVentLineSectionName: '', expandedVentLineSectionId: state.get().expandedVentLineSectionId }, { action: 'vent-line:deselect' });
      return;
    }
    state.set({ ...savedVentilationPatch(item, state.get()), expandedVentLineSectionId: state.get().expandedVentLineSectionId }, { action: 'vent-line:select' });
  };

  const deleteLine = id => {
    const next = removeRecord(currentItems(), id);
    const patch = isSameId(state.get().activeVentLineSectionId, id)
      ? { activeVentLineSectionId: null, activeVentLineSectionName: '', expandedVentLineSectionId: null }
      : (isSameId(state.get().expandedVentLineSectionId, id) ? { expandedVentLineSectionId: null } : {});
    persistLineSections(next, patch, 'vent-line:delete');
  };

  const toggleLine = element => {
    const card = element?.closest?.('[data-line-card]');
    if (!card) return;
    const id = card.getAttribute('data-vent-line-select');
    if (!id) return;
    const currentExpanded = state.get().expandedVentLineSectionId;
    const willOpen = !isSameId(currentExpanded, id);
    state.set({ expandedVentLineSectionId: willOpen ? id : null }, { action: 'vent-line:toggle' });
  };

  registerCentralActions(root, {
    'vent-line:save': saveCurrentLine,
    'vent-line:update': updateCurrentLine,
    'saved:load': ({ element }) => loadLine(element?.getAttribute('data-vent-line-select') || element?.closest?.('[data-vent-line-select]')?.getAttribute('data-vent-line-select')),
    'saved:delete': ({ element }) => deleteLine(element?.getAttribute('data-line-delete')),
    'saved:toggle': ({ element }) => toggleLine(element)
  });
}

function activeCalculationState(s) {
  const active = {
    mode: s.mode,
    calcTarget: activeValue(s, 'CalcTarget') || 'power',
    powerW: activeValue(s, 'PowerW') || '',
    powerUnit: activeValue(s, 'PowerUnit') || 'W',
    volumeFlowM3h: activeValue(s, 'VolumeFlowM3h') || '',
    supplyTemp: activeValue(s, 'SupplyTemp') || '',
    roomTemp: activeValue(s, 'RoomTemp') || ''
  };
  return {
    ...active,
    deltaT: derivedDeltaT(active)
  };
}

function powerField(s) {
  const unit = activeValue(s, 'PowerUnit') || 'W';
  return field({
    id: key(s, 'PowerW'),
    label: 'Leistung Q',
    unit,
    unitField: key(s, 'PowerUnit'),
    unitOptions: [
      { value: 'W', label: 'W' },
      { value: 'kW', label: 'kW' }
    ],
    value: fmtInput(activeValue(s, 'PowerW'), 2)
  });
}

function derivedDeltaT(active) {
  const supply = parseNumber(active.supplyTemp, { fallback: NaN });
  const room = parseNumber(active.roomTemp, { fallback: NaN });
  if (!Number.isFinite(supply) || !Number.isFinite(room)) return '';

  const mode = active.mode === 'cooling' ? 'cooling' : 'heating';
  const delta = mode === 'cooling'
    ? room - supply
    : supply - room;

  return delta > 0 ? delta : 0;
}

function derivedDeltaTField(s, active) {
  return field({
    id: key(s, 'DeltaT'),
    label: 'ΔT Temperatur',
    unit: 'K',
    value: fmtInput(derivedDeltaT(active), 2),
    readonly: true
  });
}

function inputFields(s, active) {
  const dtValue = derivedDeltaT(active);
  if (active.calcTarget === 'power') {
    return [
      field({ id: key(s, 'VolumeFlowM3h'), label: 'Volumenstrom V̇', unit: 'm³/h', value: fmtInput(active.volumeFlowM3h, 2) }),
      derivedDeltaTField(s, active)
    ];
  }
  if (active.calcTarget === 'volumeFlow') {
    return [powerField(s), derivedDeltaTField(s, active)];
  }
  return [powerField(s), field({ id: key(s, 'VolumeFlowM3h'), label: 'Volumenstrom V̇', unit: 'm³/h', value: fmtInput(active.volumeFlowM3h, 2) })];
}

function targetLabel(target) { return target === 'power' ? 'Leistung' : target === 'volumeFlow' ? 'Volumenstrom' : 'Temperaturspreizung'; }
function targetMain(target, r) {
  if (target === 'power') return { label: 'Berechnete Luftleistung', value: fmt(r.powerKw), unit: 'kW' };
  if (target === 'volumeFlow') return { label: 'Berechneter Volumenstrom', value: fmt(r.volumeFlowM3h), unit: 'm³/h' };
  return { label: 'Berechnete Temperaturspreizung', value: fmt(r.deltaT), unit: 'K' };
}

function view(s) {
  const active = activeCalculationState(s);
  const r = calculate(active);
  const accent = s.mode === 'cooling' ? 'cyan' : 'orange';
  const modeLabel = s.mode === 'cooling' ? 'Kälte' : 'Heizung';

  const resultDetails = [
    { label: 'Leistung', value: fmt(r.powerKw), unit: 'kW' },
    { label: 'Volumenstrom', value: fmt(r.volumeFlowM3h), unit: 'm³/h' },
    { label: 'Massenstrom', value: fmt(r.massFlowKgh), unit: 'kg/h' }
  ].filter(item => item.label !== targetLabel(active.calcTarget));

  const inputColumn = stack([
    card('Temperaturen', grid([
      field({ id: key(s, 'SupplyTemp'), label: 'Zuluft Tzl', unit: '°C', value: fmtInput(active.supplyTemp, 2) }),
      field({ id: key(s, 'RoomTemp'), label: 'Raum Tr', unit: '°C', value: fmtInput(active.roomTemp, 2) })
    ].join(''), 2), accent),
    card('Betriebsart', `<div data-vent-dynamic="mode-segment">${segmented('mode', [
      { value: 'heating', label: '● Heizleistung' },
      { value: 'cooling', label: '● Kühlleistung' }
    ], s.mode, { accent })}</div>`, accent, { compact: true }),
    card(`${modeLabel} — Eingaben`, stack([
      `<div data-vent-dynamic="target-segment">${segmented(key(s, 'CalcTarget'), [
        { value: 'power', label: 'Q Leistung' },
        { value: 'volumeFlow', label: 'V̇ Volumenstrom' },
        { value: 'deltaT', label: 'ΔT Temperatur' }
      ], active.calcTarget, { accent })}</div>`,
      `<div data-vent-dynamic="input-fields">${grid(inputFields(s, active).join(''), 2)}</div>`
    ].join('')), accent),
    `<div class="formula" data-vent-dynamic="formula">Q = V̇ × (ρ × cₚ / 3,6) × ΔT / 1000 · Wärmewert = ${fmt(r.factor, 3)} Wh/(m³·K)</div>`
  ].join(''));

  const airStats = card('Luftkennwerte aktuell', inlineStats([
    { label: 'ρL', value: fmt(r.rho, 3), unit: 'kg/m³' },
    { label: 'cₚ,L', value: fmt(r.cp, 3), unit: 'kJ/(kg·K)' },
    { label: 'ρ × cₚ / 3,6', value: fmt(r.factor, 3), unit: 'Wh/(m³·K)' }
  ]), 'cyan', { compact: true });

  const outputColumn = stack([
    `<div data-vent-dynamic="result">${mainResult(`Ergebnis — ${targetLabel(active.calcTarget)}`, targetMain(active.calcTarget, r), resultDetails, accent)}</div>`,
    `<div data-vent-dynamic="air-stats">${airStats}</div>`,
    ventilationLineSectionsCard(r, active, modeLabel)
  ].join(''));

  return renderModuleShell(config, `
    <div class="span-6">${inputColumn}</div>
    <div class="span-6">${outputColumn}</div>
  `);
}

function setInner(root, selector, html) {
  const el = root?.querySelector?.(selector);
  if (!el) return;
  const next = String(html ?? '');
  if (el.innerHTML !== next) el.innerHTML = next;
}

function setInputValue(root, field, value) {
  const el = root?.querySelector?.(`input[data-field="${field}"], textarea[data-field="${field}"]`);
  if (!el || document.activeElement === el) return;
  const next = String(value ?? '');
  if (el.value !== next) el.value = next;
}

function updateSegment(root, name, value) {
  root?.querySelectorAll?.(`[data-segment="${name}"]`)?.forEach(button => {
    button.classList.toggle('is-active', String(button.dataset.value) === String(value));
    button.setAttribute('aria-selected', String(String(button.dataset.value) === String(value)));
  });
}

function updateCardAccent(root, selector, accent) {
  const cardEl = root?.querySelector?.(selector)?.closest?.('.card');
  if (!cardEl) return;
  [...cardEl.classList].forEach(cls => {
    if (cls.startsWith('card--accent-')) cardEl.classList.remove(cls);
  });
  cardEl.classList.add(`card--accent-${accent}`);
}

function setCardTitle(root, selector, title) {
  const titleEl = root?.querySelector?.(selector)?.closest?.('.card')?.querySelector?.('.card__title');
  if (titleEl && titleEl.textContent !== title) titleEl.textContent = title;
}

function renderVentLineSectionRows(s) {
  const items = Array.isArray(s.ventLineSections) ? s.ventLineSections : readVentilationLineSections();
  return renderSavedRecordList(items, {
    activeId: s.activeVentLineSectionId,
    expandedId: s.expandedVentLineSectionId,
    emptyText: 'Noch keine Leitungsabschnitte angelegt',
    loadAttr: 'data-vent-line-select',
    toggleAttr: 'data-line-toggle',
    deleteAttr: 'data-line-delete',
    title: item => item.name || 'Abschnitt',
    stats: item => ventilationLineSectionStats(item)
  });
}

function updateVentSaveControls(root, s) {
  const nameInput = root?.querySelector?.('#ventLineSectionName');
  if (nameInput && document.activeElement !== nameInput) nameInput.value = s.activeVentLineSectionName || '';
  const saveButton = root?.querySelector?.('[data-vent-line-save]');
  const updateButton = root?.querySelector?.('[data-vent-line-update]');
  if (saveButton) saveButton.disabled = Boolean(s.activeVentLineSectionId);
  if (updateButton) updateButton.disabled = !s.activeVentLineSectionId;
}

function renderAirStats(r) {
  return card('Luftkennwerte aktuell', inlineStats([
    { label: 'ρL', value: fmt(r.rho, 3), unit: 'kg/m³' },
    { label: 'cₚ,L', value: fmt(r.cp, 3), unit: 'kJ/(kg·K)' },
    { label: 'ρ × cₚ / 3,6', value: fmt(r.factor, 3), unit: 'Wh/(m³·K)' }
  ]), 'cyan', { compact: true });
}

function updateVentilationDynamic(root, s, meta = {}) {
  const active = activeCalculationState(s);
  const r = calculate(active);
  const accent = s.mode === 'cooling' ? 'cyan' : 'orange';
  const modeLabel = s.mode === 'cooling' ? 'Kälte' : 'Heizung';
  const previous = root.__tcVentilationDynamic || {};
  const previousPrefix = previous.prefix || 'heating';
  const currentPrefix = prefixFor(s);
  const action = String(meta.action || '');
  const changed = Array.isArray(meta.changed) ? meta.changed : [];
  const modeChanged = previous.mode !== s.mode || changed.includes('mode');
  const targetChanged = previous.calcTarget !== active.calcTarget || previousPrefix !== currentPrefix || changed.includes(key(s, 'CalcTarget'));
  const lineStructural = /^(vent-line:|saved:)/.test(action);
  const appStructural = /^(record:|module:|replace|reset)/.test(action);
  const resultDetails = [
    { label: 'Leistung', value: fmt(r.powerKw), unit: 'kW' },
    { label: 'Volumenstrom', value: fmt(r.volumeFlowM3h), unit: 'm³/h' },
    { label: 'Massenstrom', value: fmt(r.massFlowKgh), unit: 'kg/h' }
  ].filter(item => item.label !== targetLabel(active.calcTarget));

  updateCardAccent(root, '[data-vent-dynamic="mode-segment"]', accent);
  updateCardAccent(root, '[data-vent-dynamic="target-segment"]', accent);
  updateSegment(root, 'mode', s.mode);

  if (modeChanged) {
    setInner(root, '[data-vent-dynamic="mode-segment"]', segmented('mode', [
      { value: 'heating', label: '● Heizleistung' },
      { value: 'cooling', label: '● Kühlleistung' }
    ], s.mode, { accent }));
    setCardTitle(root, '[data-vent-dynamic="target-segment"]', `${modeLabel} — Eingaben`);
  }

  if (modeChanged || targetChanged) {
    setInner(root, '[data-vent-dynamic="target-segment"]', segmented(key(s, 'CalcTarget'), [
      { value: 'power', label: 'Q Leistung' },
      { value: 'volumeFlow', label: 'V̇ Volumenstrom' },
      { value: 'deltaT', label: 'ΔT Temperatur' }
    ], active.calcTarget, { accent }));
    setInner(root, '[data-vent-dynamic="input-fields"]', grid(inputFields(s, active).join(''), 2));
  } else {
    updateSegment(root, key(s, 'CalcTarget'), active.calcTarget);
    setInputValue(root, key(s, 'PowerW'), fmtInput(active.powerW, 2));
    setInputValue(root, key(s, 'VolumeFlowM3h'), fmtInput(active.volumeFlowM3h, 2));
    setInputValue(root, key(s, 'DeltaT'), fmtInput(derivedDeltaT(active), 2));
    setInputValue(root, key(s, 'SupplyTemp'), fmtInput(active.supplyTemp, 2));
    setInputValue(root, key(s, 'RoomTemp'), fmtInput(active.roomTemp, 2));
  }

  setInner(root, '[data-vent-dynamic="result"]', mainResult(`Ergebnis — ${targetLabel(active.calcTarget)}`, targetMain(active.calcTarget, r), resultDetails, accent));
  setInner(root, '[data-vent-dynamic="air-stats"]', renderAirStats(r));
  setInner(root, '[data-vent-dynamic="formula"]', `Q = V̇ × (ρ × cₚ / 3,6) × ΔT / 1000 · Wärmewert = ${fmt(r.factor, 3)} Wh/(m³·K)`);

  if (lineStructural || appStructural || changed.includes('ventLineSections') || changed.includes('activeVentLineSectionId') || changed.includes('activeVentLineSectionName') || changed.includes('expandedVentLineSectionId')) {
    updateVentSaveControls(root, s);
    setInner(root, '[data-vent-dynamic="line-sections"]', renderVentLineSectionRows(s));
  }

  root.__tcVentilationDynamic = {
    mode: s.mode,
    prefix: currentPrefix,
    calcTarget: active.calcTarget
  };
}

function isDynamicVentilationAction(meta = {}) {
  return String(meta.action || '') !== 'initial';
}

function mountVentilation(root) {
  if (!root) return () => {};
  bindNoClickScroll(root);

  const fullRender = (snapshot = state.get()) => {
    root.innerHTML = view(snapshot);
    root.__tcVentilationDynamic = null;
    bindCommonInputs(root, state);
    const active = activeCalculationState(snapshot);
    const modeLabel = snapshot.mode === 'cooling' ? 'Kälte' : 'Heizung';
    bindVentilationLineSections(root, calculate(active), active, modeLabel, fullRender);
    updateVentilationDynamic(root, snapshot, { action: 'initial', changed: [] });
  };

  fullRender(state.get());
  const unsubscribe = state.subscribe((snapshot, meta = {}) => {
    if (isDynamicVentilationAction(meta)) {
      updateVentilationDynamic(root, snapshot, meta);
      return;
    }
    fullRender(snapshot);
  });
  return () => { if (typeof unsubscribe === 'function') unsubscribe(); };
}

export default {
  config,
  schema,
  state,
  mount(root) {
    return mountVentilation(root);
  }
};
