import { parseNumber } from '../../core/numberService.js';
import config from './config.js';
import schema from './schema.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { MEDIA, fmt, fmtInput } from '../../utils/calculations.js';
import { pipeSystems } from '../../utils/pipes.js';
import { card, field, selectField, segmented, renderModuleShell, stack, grid, inlineStats, mainResult, bindCommonInputs, bindNoClickScroll } from '../../core/renderer.js';
import { registerCentralActions } from '../../core/eventPipeline.js';
import { createRecordId, isSameId, replaceRecord, removeRecord, renderSavedRecordList, bindSavedRecordList, bindEditModeClear } from '../../core/savedRecords.js';

const MODE_PREFIX = {
  heating: 'heating',
  cooling: 'cooling'
};

function prefixFor(s) {
  return MODE_PREFIX[s.mode] || 'heating';
}

function key(s, name) {
  return `${prefixFor(s)}${name}`;
}

function activeValue(s, name) {
  return s[key(s, name)];
}

function mediumForId(id) {
  return MEDIA.find(m => m.id === id) || MEDIA[0];
}

function activeMassFlowUnit(s) {
  return activeValue(s, 'MassFlowUnit') || 'kg/h';
}

function massFlowInputToKgH(value, unit, mediumId) {
  const parsed = parseNumber(value, { fallback: 0 });
  if (!Number.isFinite(parsed) || parsed <= 0) return '';
  if (unit === 'm3/h' || unit === 'm³/h') {
    return String(parsed * (mediumForId(mediumId)?.density || 998));
  }
  return String(parsed);
}

function formatMassFlowInput(value, unit, mediumId) {
  const parsed = parseNumber(value, { fallback: NaN });
  if (!Number.isFinite(parsed)) return '';
  if (unit === 'm3/h' || unit === 'm³/h') {
    const density = mediumForId(mediumId)?.density || 998;
    return fmtInput(parsed / density, 3);
  }
  return fmtInput(parsed, 2);
}

function activeCalculationState(s) {
  return {
    mode: s.mode,
    mediumId: s.mediumId,
    pipeSystemId: s.pipeSystemId,
    calcTarget: activeValue(s, 'CalcTarget') || 'power',
    powerW: activeValue(s, 'PowerW') || '',
    powerUnit: activeValue(s, 'PowerUnit') || 'W',
    massFlowKgh: massFlowInputToKgH(activeValue(s, 'MassFlowKgh'), activeMassFlowUnit(s), s.mediumId),
    massFlowUnit: activeMassFlowUnit(s),
    deltaT: activeValue(s, 'DeltaT') || ''
  };
}


function massFlowField(s) {
  const unit = activeMassFlowUnit(s);
  return field({
    id: key(s, 'MassFlowKgh'),
    label: 'Massenstrom ṁ',
    unit,
    unitField: key(s, 'MassFlowUnit'),
    unitOptions: [
      { value: 'kg/h', label: 'kg/h' },
      { value: 'm3/h', label: 'm³/h' }
    ],
    value: formatMassFlowInput(activeValue(s, 'MassFlowKgh'), unit, s.mediumId)
  });
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

function inputFields(s, active) {
  if (active.calcTarget === 'power') {
    return [
      massFlowField(s),
      field({ id: key(s, 'DeltaT'), label: 'ΔT Temperatur', unit: 'K', value: fmtInput(active.deltaT, 2) })
    ];
  }
  if (active.calcTarget === 'massFlow') {
    return [
      powerField(s),
      field({ id: key(s, 'DeltaT'), label: 'ΔT Temperatur', unit: 'K', value: fmtInput(active.deltaT, 2) })
    ];
  }
  return [
    powerField(s),
    massFlowField(s)
  ];
}

function targetLabel(target) {
  return target === 'power' ? 'Leistung' : target === 'massFlow' ? 'Massenstrom' : 'Temperaturspreizung';
}

function targetMain(target, r) {
  if (target === 'power') return { label: 'Berechnete Leistung', value: fmt(r.powerKw), unit: 'kW' };
  if (target === 'massFlow') return { label: 'Berechneter Massenstrom', value: fmt(r.massFlowKgh), unit: 'kg/h' };
  return { label: 'Berechnete Temperaturspreizung', value: fmt(r.deltaT), unit: 'K' };
}

function mediumStats(medium) {
  const stats = [
    { label: 'Dichte ρ', value: fmt(medium.density, 0), unit: 'kg/m³' },
    { label: 'cₚ', value: fmt(medium.cpWhKgK, 3), unit: 'Wh/(kg·K)' }
  ];
  if (medium.frostC !== null && medium.frostC !== undefined) {
    stats.push({ label: 'Frostschutz', value: fmt(medium.frostC, 0), unit: '°C' });
  }
  return stats;
}


let lineSectionsMemory = [];

export function readLineSections() {
  return Array.isArray(lineSectionsMemory) ? [...lineSectionsMemory] : [];
}

export function writeLineSections(items) {
  lineSectionsMemory = Array.isArray(items) ? [...items] : [];
}

function lineSectionStats(item) {
  return [
    { label: 'Leistung', value: item.powerKw || '—', unit: item.powerKw && item.powerKw !== '—' ? 'kW' : '' },
    { label: 'Massenstrom', value: item.massFlowKgh || '—', unit: item.massFlowKgh && item.massFlowKgh !== '—' ? 'kg/h' : '' },
    { label: 'Volumenstrom', value: item.volumeFlowM3h || '—', unit: item.volumeFlowM3h && item.volumeFlowM3h !== '—' ? 'm³/h' : '' },
    { label: 'Temperaturdifferenz', value: item.deltaT || '—', unit: item.deltaT && item.deltaT !== '—' ? 'K' : '' },
    { label: 'Wärmeträger', value: item.medium || '—' },
    { label: 'Rohrdimension', value: item.pipeDn || '—' },
    { label: 'Rohrabmessung', value: item.pipeDimension || '—' },
    { label: 'Werkstoff', value: item.pipeMaterial || '—' },
    { label: 'Geschwindigkeit', value: item.pipeVelocity || '—', unit: item.pipeVelocity && item.pipeVelocity !== '—' ? 'm/s' : '' },
    { label: 'Druckverlust', value: item.pipePressureLoss || '—', unit: item.pipePressureLoss && item.pipePressureLoss !== '—' ? 'Pa/m' : '' }
  ];
}

function lineSectionsCard(r) {
  const items = readLineSections();
  const rows = renderSavedRecordList(items, {
    activeId: state.get().activeLineSectionId,
    emptyText: 'Noch keine Leitungsabschnitte angelegt',
    loadAttr: 'data-line-select',
    toggleAttr: 'data-line-toggle',
    deleteAttr: 'data-line-delete',
    title: item => item.name || 'Abschnitt',
    stats: item => lineSectionStats(item)
  });
  return card('Leitungsabschnitte', stack([
    `<div class="field"><label for="lineSectionName">Bezeichnung</label><div class="control"><input id="lineSectionName" type="text" placeholder="z. B. Verteilerabgang Nord" autocomplete="off" value="${(state.get().activeLineSectionName || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"></div></div>`,
    `<div class="tc-save-actions"><button type="button" class="action-button" data-tc-action="line:save" data-line-save ${state.get().activeLineSectionId ? 'disabled' : ''}>Speichern</button><button type="button" class="action-button" data-tc-action="line:update" data-line-update ${state.get().activeLineSectionId ? '' : 'disabled'}>Aktualisieren</button></div>`,
    rows
  ].join('')), 'blue');
}

function buildLineSectionRecord(currentState, r, items, id, name, existing = null) {
  return {
    id,
    name: name || currentState.activeLineSectionName || existing?.name || `Abschnitt ${items.length + 1}`,
    powerKw: fmt(r.powerKw),
    massFlowKgh: fmt(r.massFlowKgh),
    volumeFlowM3h: fmt(r.volumeFlowM3h, 3),
    deltaT: fmt(r.deltaT),
    medium: r.medium?.label || '—',
    pipeDn: r.pipe && !r.pipe.noDimension ? `DN ${r.pipe.dn}` : '—',
    pipeDimension: r.pipe && !r.pipe.noDimension ? (r.pipe.dimension ? `Ø ${r.pipe.dimension} mm` : `di ${fmt(r.pipe.di, 1)} mm`) : '—',
    pipeMaterial: r.pipe && !r.pipe.noDimension ? r.pipe.system.label : '—',
    pipeVelocity: r.pipe && !r.pipe.noDimension ? fmt(r.pipe.velocity) : '—',
    pipePressureLoss: r.pipe && !r.pipe.noDimension ? fmt(r.pipe.pressureLoss) : '—',
    modeLabel: currentState.mode === 'cooling' ? 'Kälte' : 'Heizung',
    inputState: activeCalculationState(currentState),
    uiState: { mode: currentState.mode, mediumId: currentState.mediumId, pipeSystemId: currentState.pipeSystemId },
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
  if (label.includes('heiz')) return 'heating';
  const hasCooling = ['coolingCalcTarget', 'coolingPowerW', 'coolingMassFlowKgh', 'coolingDeltaT'].some(k => input[k] !== undefined && input[k] !== null && input[k] !== '');
  const hasHeating = ['heatingCalcTarget', 'heatingPowerW', 'heatingMassFlowKgh', 'heatingDeltaT'].some(k => input[k] !== undefined && input[k] !== null && input[k] !== '');
  if (hasCooling && !hasHeating) return 'cooling';
  return fallback === 'cooling' ? 'cooling' : 'heating';
}

function savedLineSectionPatch(item, currentState) {
  const input = item.inputState || item.state || item.uiState || {};
  const nextMode = inferStoredMode(input, item, currentState.mode || 'heating');
  const prefix = nextMode === 'cooling' ? 'cooling' : 'heating';
  const calcTarget = firstFilled(input.calcTarget, input[`${prefix}CalcTarget`], currentState[`${prefix}CalcTarget`], 'power');
  const powerFromResult = parseDisplayNumber(item.powerKw);
  return {
    ...(item.uiState || {}),
    mode: nextMode,
    mediumId: firstFilled(input.mediumId, item.uiState?.mediumId, currentState.mediumId),
    pipeSystemId: firstFilled(input.pipeSystemId, item.uiState?.pipeSystemId, currentState.pipeSystemId),
    [`${prefix}CalcTarget`]: calcTarget,
    [`${prefix}PowerW`]: firstFilled(input.powerW, input[`${prefix}PowerW`], calcTarget !== 'power' ? powerFromResult : ''),
    [`${prefix}PowerUnit`]: firstFilled(input.powerUnit, input[`${prefix}PowerUnit`], calcTarget !== 'power' && powerFromResult ? 'kW' : 'W'),
    [`${prefix}MassFlowKgh`]: firstFilled(input.massFlowKgh, input[`${prefix}MassFlowKgh`], parseDisplayNumber(item.massFlowKgh)),
    [`${prefix}MassFlowUnit`]: firstFilled(input.massFlowUnit, input[`${prefix}MassFlowUnit`], 'kg/h'),
    [`${prefix}DeltaT`]: firstFilled(input.deltaT, input[`${prefix}DeltaT`], parseDisplayNumber(item.deltaT)),
    activeLineSectionId: item.id,
    activeLineSectionName: item.name || ''
  };
}

function bindLineSections(root, r, rerender) {
  bindEditModeClear(root, { state, activeIdKey: 'activeLineSectionId', nameKey: 'activeLineSectionName' });

  const currentResult = () => calculate(activeCalculationState(state.get()));
  const saveCurrentLine = () => {
    const name = root.querySelector('#lineSectionName')?.value?.trim() || '';
    const currentState = state.get();
    const items = readLineSections();
    const id = createRecordId('line');
    const item = buildLineSectionRecord({ ...currentState, activeLineSectionId: null, activeLineSectionName: name }, currentResult(), items, id, name);
    writeLineSections([item, ...items]);
    state.set({ activeLineSectionId: null, activeLineSectionName: '' }, { action: 'line:save' });
  };
  const updateCurrentLine = () => {
    const currentState = state.get();
    const id = currentState.activeLineSectionId;
    if (!id) return;
    const name = root.querySelector('#lineSectionName')?.value?.trim() || '';
    const items = readLineSections();
    const existing = items.find(x => String(x.id) === String(id));
    if (!existing) return;
    const item = buildLineSectionRecord(currentState, currentResult(), items, id, name, existing);
    writeLineSections(replaceRecord(items, id, item));
    state.set({ activeLineSectionId: id, activeLineSectionName: item.name }, { action: 'line:update' });
  };
  const loadLine = id => {
    const item = readLineSections().find(entry => isSameId(entry.id, id));
    if (!item) return;
    if (isSameId(state.get().activeLineSectionId, id)) {
      state.set({ activeLineSectionId: null, activeLineSectionName: '' }, { action: 'line:deselect' });
      return;
    }
    state.set(savedLineSectionPatch(item, state.get()), { action: 'line:select' });
  };
  const deleteLine = id => {
    writeLineSections(removeRecord(readLineSections(), id));
    const patch = isSameId(state.get().activeLineSectionId, id)
      ? { activeLineSectionId: null, activeLineSectionName: '' }
      : {};
    state.set(patch, { action: 'line:delete', notify: true });
  };
  const toggleLine = element => {
    const card = element?.closest?.('[data-line-card]');
    if (!card) return;
    const willOpen = card.classList.contains('is-collapsed');
    root.querySelectorAll('[data-line-card]').forEach(item => {
      if (item === card) return;
      item.classList.add('is-collapsed');
      item.querySelector('[data-line-toggle]')?.setAttribute('aria-expanded', 'false');
    });
    card.classList.toggle('is-collapsed', !willOpen);
    element.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
  };

  registerCentralActions(root, {
    'line:save': saveCurrentLine,
    'line:update': updateCurrentLine,
    'saved:load': ({ element }) => loadLine(element?.getAttribute('data-line-select') || element?.closest?.('[data-line-select]')?.getAttribute('data-line-select')),
    'saved:delete': ({ element }) => deleteLine(element?.getAttribute('data-line-delete')),
    'saved:toggle': ({ element }) => toggleLine(element)
  });

  // Keep the legacy binder as a fallback for browsers/tests that dispatch plain click
  // events before the central action map has been registered. Central actions stop
  // propagation, so normal runtime uses the global pipeline only.
  bindSavedRecordList(root, {
    loadAttr: 'data-line-select',
    toggleAttr: 'data-line-toggle',
    deleteAttr: 'data-line-delete',
    preserveLoadScroll: false,
    onLoad: loadLine,
    onDelete: deleteLine
  });
}



function bindHeatingCoolingInteractionAdapter(root, rerender) {
  if (!root || root.__tcHeatingCoolingAdapterBound) return;
  root.__tcHeatingCoolingAdapterBound = true;

  const commitFieldElement = (el, { notify = true, action = 'field:commit' } = {}) => {
    if (!el?.dataset?.field) return;
    const fieldName = el.dataset.field;
    let value = el.value;
    if (/MassFlowKgh$/.test(fieldName)) {
      const current = state.get();
      const unit = current[fieldName.replace(/MassFlowKgh$/, 'MassFlowUnit')] || 'kg/h';
      if (unit === 'm3/h' || unit === 'm³/h') {
        const density = mediumForId(current.mediumId)?.density || 998;
        const parsed = parseNumber(value, { fallback: NaN });
        value = Number.isFinite(parsed) ? String(parsed * density) : value;
      }
    }
    state.set({ [fieldName]: value }, { notify, action });
  };

  root.addEventListener('change', event => {
    const fieldEl = event.target?.closest?.('[data-field]');
    if (!fieldEl || !root.contains(fieldEl)) return;
    // Selects in this module represent master-data choices. They must update the
    // derived medium/pipe properties immediately, not only after a surface click.
    if (fieldEl.matches('select')) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      commitFieldElement(fieldEl, { notify: true, action: 'field:change:immediate' });
      return;
    }
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    commitFieldElement(fieldEl, { notify: true, action: 'field:change' });
  }, true);

  root.addEventListener('blur', event => {
    const fieldEl = event.target?.closest?.('input[data-field]');
    if (!fieldEl || !root.contains(fieldEl)) return;
    // Desktop requirement: calculation starts when leaving the input.
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    commitFieldElement(fieldEl, { notify: true, action: 'field:blur' });
  }, true);

  root.addEventListener('keydown', event => {
    const fieldEl = event.target?.closest?.('input[data-field]');
    if (!fieldEl || !root.contains(fieldEl)) return;
    if (event.key !== 'Enter') return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    commitFieldElement(fieldEl, { notify: true, action: 'field:enter' });
  }, true);

  root.addEventListener('click', event => {
    const segment = event.target?.closest?.('[data-segment]');
    if (!segment || !root.contains(segment)) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    state.set({ [segment.dataset.segment]: segment.dataset.value }, { action: 'segment:select' });
  }, true);

  root.addEventListener('click', event => {
    const deleteButton = event.target?.closest?.('[data-line-delete]');
    if (deleteButton && root.contains(deleteButton)) return;
    const toggleButton = event.target?.closest?.('[data-line-toggle]');
    if (toggleButton && root.contains(toggleButton)) return;
    const card = event.target?.closest?.('[data-line-select]');
    if (!card || !root.contains(card)) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    const id = card.getAttribute('data-line-select');
    const item = readLineSections().find(entry => isSameId(entry.id, id));
    if (!item) return;
    if (isSameId(state.get().activeLineSectionId, id)) {
      state.set({ activeLineSectionId: null, activeLineSectionName: '' });
      return;
    }
    state.set(savedLineSectionPatch(item, state.get()));
  }, true);
}


function pipeDetails(r) {
  return [
    { label: 'Material', value: r.pipe.system.label },
    { label: 'Geschwindigkeit', value: fmt(r.pipe.velocity), unit: 'm/s' },
    { label: 'Druckverlust', value: fmt(r.pipe.pressureLoss), unit: 'Pa/m' },
    { label: 'Norm', value: r.pipe.norm }
  ];
}


function view(s) {
  const active = activeCalculationState(s);
  const r = calculate(active);
  const accent = s.mode === 'cooling' ? 'cyan' : 'orange';
  const modeLabel = s.mode === 'cooling' ? 'Kälte' : 'Heizung';

  const mediumCard = card('Medium', stack([
    selectField({ id: 'mediumId', label: 'Wärmeträger', value: s.mediumId, options: MEDIA.map(m => ({ value: m.id, label: m.label })) }),
    `<div data-hc-dynamic="medium-stats">${inlineStats(mediumStats(r.medium))}</div>`
  ].join('')), 'blue', { compact: true });

  const resultDetails = [
    { label: 'Leistung', value: fmt(r.powerKw), unit: 'kW' },
    { label: 'Massenstrom', value: fmt(r.massFlowKgh), unit: 'kg/h' },
    { label: 'Volumenstrom', value: fmt(r.volumeFlowM3h, 3), unit: 'm³/h' },
    { label: 'ΔT', value: fmt(r.deltaT), unit: 'K' },
    { label: 'Medium', value: r.medium.label },
    { label: 'Dichte', value: fmt(r.medium.density, 0), unit: 'kg/m³' }
  ].filter(item => item.label !== targetLabel(active.calcTarget));

  const inputColumn = stack([
    mediumCard,
    card('Betriebsart', `<div data-hc-dynamic="mode-segment">${segmented('mode', [
      { value: 'heating', label: '● Heizung' },
      { value: 'cooling', label: '● Kälte' }
    ], s.mode, { accent })}</div>`, accent, { compact: true }),
    card(`${modeLabel} — Eingaben`, stack([
      `<div data-hc-dynamic="target-segment">${segmented(key(s, 'CalcTarget'), [
        { value: 'power', label: 'Q Leistung' },
        { value: 'massFlow', label: 'ṁ Massenstrom' },
        { value: 'deltaT', label: 'ΔT Temperatur' }
      ], active.calcTarget, { accent })}</div>`,
      `<div data-hc-dynamic="input-fields">${grid(inputFields(s, active).join(''), 2)}</div>`
    ].join('')), accent),
    `<div data-hc-dynamic="result">${mainResult(`Ergebnis — ${targetLabel(active.calcTarget)}`, targetMain(active.calcTarget, r), resultDetails, accent)}</div>`,
    `<div class="formula" data-hc-dynamic="formula">Q = ṁ × cₚ × ΔT · ρ = ${fmt(r.medium.density, 0)} kg/m³ · cₚ = ${fmt(r.medium.cpWhKgK, 3)} Wh/(kg·K)</div>`
  ].join(''));

  const recommendationBody = !r.pipe
    ? '<div class="empty-state">Massenstrom berechnen oder eingeben →<br>Rohrdimensionierung</div>'
    : r.pipe.noDimension
      ? '<div class="empty-state">Keine Dimensionierung möglich!</div>'
      : `<div class="main-result"><span>Empfohlene Dimension</span><strong>DN ${r.pipe.dn}</strong></div>${inlineStats(pipeDetails(r))}`;

  const recommendation = stack([
    selectField({ id: 'pipeSystemId', label: 'Rohrmaterial', value: s.pipeSystemId, options: pipeSystems.map(p => ({ value: p.id, label: p.label })) }),
    `<div data-hc-dynamic="pipe-result">${recommendationBody}</div>`
  ].join(''));

  return renderModuleShell(config, `
    <div class="span-6">${inputColumn}</div>
    <div class="span-6">${stack([card('Rohrdimensionsempfehlung', recommendation, 'blue'), lineSectionsCard(r)].join(''))}</div>
  `);
}


function setInner(root, selector, html) {
  const el = root?.querySelector?.(selector);
  if (!el) return;
  const next = String(html ?? '');
  if (el.innerHTML !== next) el.innerHTML = next;
}

function setSelectValue(root, field, value) {
  const el = root?.querySelector?.(`[data-field="${field}"]`);
  if (el && el.value !== String(value ?? '')) el.value = String(value ?? '');
}

function updateSegment(root, name, value) {
  root?.querySelectorAll?.(`[data-segment="${name}"]`)?.forEach(button => {
    button.classList.toggle('is-active', String(button.dataset.value) === String(value));
  });
}

function renderRecommendationBody(r) {
  return !r.pipe
    ? '<div class="empty-state">Massenstrom berechnen oder eingeben →<br>Rohrdimensionierung</div>'
    : r.pipe.noDimension
      ? '<div class="empty-state">Keine Dimensionierung möglich!</div>'
      : `<div class="main-result"><span>Empfohlene Dimension</span><strong>DN ${r.pipe.dn}</strong></div>${inlineStats(pipeDetails(r))}`;
}

function updateHeatingCoolingDynamic(root, s) {
  const active = activeCalculationState(s);
  const r = calculate(active);
  const accent = s.mode === 'cooling' ? 'cyan' : 'orange';
  const resultDetails = [
    { label: 'Leistung', value: fmt(r.powerKw), unit: 'kW' },
    { label: 'Massenstrom', value: fmt(r.massFlowKgh), unit: 'kg/h' },
    { label: 'Volumenstrom', value: fmt(r.volumeFlowM3h, 3), unit: 'm³/h' },
    { label: 'ΔT', value: fmt(r.deltaT), unit: 'K' },
    { label: 'Medium', value: r.medium.label },
    { label: 'Dichte', value: fmt(r.medium.density, 0), unit: 'kg/m³' }
  ].filter(item => item.label !== targetLabel(active.calcTarget));

  setSelectValue(root, 'mediumId', s.mediumId);
  setSelectValue(root, 'pipeSystemId', s.pipeSystemId);
  setInner(root, '[data-hc-dynamic="medium-stats"]', inlineStats(mediumStats(r.medium)));
  updateSegment(root, 'mode', s.mode);
  updateSegment(root, key(s, 'CalcTarget'), active.calcTarget);
  setInner(root, '[data-hc-dynamic="target-segment"]', segmented(key(s, 'CalcTarget'), [
    { value: 'power', label: 'Q Leistung' },
    { value: 'massFlow', label: 'ṁ Massenstrom' },
    { value: 'deltaT', label: 'ΔT Temperatur' }
  ], active.calcTarget, { accent }));
  setInner(root, '[data-hc-dynamic="input-fields"]', grid(inputFields(s, active).join(''), 2));
  setInner(root, '[data-hc-dynamic="result"]', mainResult(`Ergebnis — ${targetLabel(active.calcTarget)}`, targetMain(active.calcTarget, r), resultDetails, accent));
  setInner(root, '[data-hc-dynamic="formula"]', `Q = ṁ × cₚ × ΔT · ρ = ${fmt(r.medium.density, 0)} kg/m³ · cₚ = ${fmt(r.medium.cpWhKgK, 3)} Wh/(kg·K)`);
  setInner(root, '[data-hc-dynamic="pipe-result"]', renderRecommendationBody(r));
}

function isDynamicHeatingCoolingAction(meta = {}) {
  const action = String(meta.action || '');
  return /^(field:|segment:select|binding:|input:confirm|surface:confirm)/.test(action);
}

function mountHeatingCooling(root) {
  if (!root) return () => {};
  bindNoClickScroll(root);

  const fullRender = (snapshot = state.get()) => {
    root.innerHTML = view(snapshot);
    bindHeatingCoolingInteractionAdapter(root);
    bindCommonInputs(root, state);
    bindLineSections(root, calculate(activeCalculationState(snapshot)), fullRender);
  };

  fullRender(state.get());
  const unsubscribe = state.subscribe((snapshot, meta = {}) => {
    if (isDynamicHeatingCoolingAction(meta)) {
      updateHeatingCoolingDynamic(root, snapshot);
      bindLineSections(root, calculate(activeCalculationState(snapshot)), fullRender);
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
    return mountHeatingCooling(root);
  }
};
