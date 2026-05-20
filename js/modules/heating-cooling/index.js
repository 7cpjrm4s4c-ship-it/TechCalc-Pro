import config from './config.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { MEDIA, fmt, fmtInput } from '../../utils/calculations.js';
import { pipeSystems } from '../../utils/pipes.js';
import { card, field, selectField, segmented, renderModuleShell, stack, grid, inlineStats, mainResult, pressureBadge } from '../../core/renderer.js';
import { mountModule } from '../../core/mount.js';

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

function activeCalculationState(s) {
  return {
    mode: s.mode,
    mediumId: s.mediumId,
    pipeSystemId: s.pipeSystemId,
    calcTarget: activeValue(s, 'CalcTarget') || 'power',
    powerW: activeValue(s, 'PowerW') || '',
    powerUnit: activeValue(s, 'PowerUnit') || 'W',
    massFlowKgh: activeValue(s, 'MassFlowKgh') || '',
    deltaT: activeValue(s, 'DeltaT') || ''
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

function inputFields(s, active) {
  if (active.calcTarget === 'power') {
    return [
      field({ id: key(s, 'MassFlowKgh'), label: 'Massenstrom ṁ', unit: 'kg/h', value: fmtInput(active.massFlowKgh, 2) }),
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
    field({ id: key(s, 'MassFlowKgh'), label: 'Massenstrom ṁ', unit: 'kg/h', value: fmtInput(active.massFlowKgh, 2) })
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

function renderLineSectionCard(item, index) {
  const active = state.get().activeLineSectionId === item.id;
  const stats = [
    { label: 'Leistung', value: item.powerKw || '—', unit: 'kW' },
    { label: 'Massenstrom', value: item.massFlowKgh || '—', unit: 'kg/h' },
    { label: 'Volumenstrom', value: item.volumeFlowM3h || '—', unit: 'm³/h' },
    { label: 'Temperaturdifferenz', value: item.deltaT || '—', unit: 'K' },
    { label: 'Wärmeträger', value: item.medium || '—' },
    { label: 'Rohrdimension', value: item.pipeDn || '—' },
    { label: 'Rohrabmessung', value: item.pipeDimension || '—' },
    { label: 'Werkstoff', value: item.pipeMaterial || '—' },
    { label: 'Geschwindigkeit', value: item.pipeVelocity || '—', unit: item.pipeVelocity && item.pipeVelocity !== '—' ? 'm/s' : '' },
    { label: 'Druckverlust', value: item.pipePressureLoss || '—', unit: item.pipePressureLoss && item.pipePressureLoss !== '—' ? 'Pa/m' : '' }
  ];
  return `<article class="line-section-card is-collapsed ${active ? 'is-active' : ''}" data-line-card data-line-select="${item.id}">
    <div class="line-section-card__head">
      <button type="button" class="line-section-card__toggle" data-line-toggle aria-expanded="false">
        <strong>${item.name || 'Abschnitt ' + (index + 1)}</strong>
        <span>▾</span>
      </button>
      <button type="button" class="line-section-card__delete" data-line-delete="${item.id}" aria-label="Abschnitt löschen">×</button>
    </div>
    <div class="line-section-card__body">${inlineStats(stats)}</div>
  </article>`;
}

function lineSectionsCard(r) {
  const items = readLineSections();
  const rows = items.length
    ? `<div class="line-section-list">${items.map(renderLineSectionCard).join('')}</div>`
    : '<div class="empty-state empty-state--compact">Noch keine Leitungsabschnitte angelegt</div>';
  return card('Leitungsabschnitte', stack([
    `<div class="field"><label for="lineSectionName">Bezeichnung</label><div class="control"><input id="lineSectionName" type="text" placeholder="z. B. Verteilerabgang Nord" autocomplete="off" value="${(state.get().activeLineSectionName || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"></div></div>`,
    `<div class="tc-save-actions"><button type="button" class="action-button" data-line-save ${state.get().activeLineSectionId ? 'disabled' : ''}>Speichern</button><button type="button" class="action-button" data-line-update ${state.get().activeLineSectionId ? '' : 'disabled'}>Aktualisieren</button></div>`,
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
    inputState: activeCalculationState(currentState),
    uiState: { mode: currentState.mode, mediumId: currentState.mediumId, pipeSystemId: currentState.pipeSystemId },
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function bindLineSections(root, r, rerender) {
  const saveBtn = root.querySelector('[data-line-save]');
  const updateBtn = root.querySelector('[data-line-update]');
  saveBtn?.addEventListener('click', (event) => {
    event.preventDefault();
    const name = root.querySelector('#lineSectionName')?.value?.trim() || '';
    const currentState = state.get();
    const items = readLineSections();
    const id = (globalThis.crypto?.randomUUID?.() || `line-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const item = buildLineSectionRecord({ ...currentState, activeLineSectionId: null, activeLineSectionName: name }, r, items, id, name);
    writeLineSections([item, ...items]);
    state.set({ activeLineSectionId: null, activeLineSectionName: '' }, { notify:false });
    if (typeof rerender === 'function') rerender();
  });
  updateBtn?.addEventListener('click', (event) => {
    event.preventDefault();
    const currentState = state.get();
    const id = currentState.activeLineSectionId;
    if (!id) return;
    const name = root.querySelector('#lineSectionName')?.value?.trim() || '';
    const items = readLineSections();
    const existing = items.find(x => String(x.id) === String(id));
    if (!existing) return;
    const item = buildLineSectionRecord(currentState, r, items, id, name, existing);
    writeLineSections(items.map(entry => String(entry.id) === String(id) ? item : entry));
    state.set({ activeLineSectionId: id, activeLineSectionName: item.name }, { notify:false });
    if (typeof rerender === 'function') rerender();
  });
  root.querySelectorAll('[data-line-toggle]').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const card = toggle.closest('[data-line-card]');
      const collapsed = card?.classList.toggle('is-collapsed');
      toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    });
  });

  root.querySelectorAll('[data-line-select]').forEach(row => {
    row.addEventListener('click', event => {
      if (event.target.closest('[data-line-delete]') || event.target.closest('[data-line-toggle]')) return;
      const id = Number(row.dataset.lineSelect);
      const item = readLineSections().find(entry => Number(entry.id) === id);
      if (!item) return;
      const input = item.inputState || {};
      const prefix = (input.mode === 'cooling') ? 'cooling' : 'heating';
      state.set({
        ...(item.uiState || {}),
        mode: input.mode || item.uiState?.mode || state.get().mode,
        mediumId: item.uiState?.mediumId || state.get().mediumId,
        pipeSystemId: item.uiState?.pipeSystemId || state.get().pipeSystemId,
        [`${prefix}CalcTarget`]: input.calcTarget || 'power',
        [`${prefix}PowerW`]: input.powerW || '',
        [`${prefix}PowerUnit`]: input.powerUnit || 'W',
        [`${prefix}MassFlowKgh`]: input.massFlowKgh || '',
        [`${prefix}DeltaT`]: input.deltaT || '',
        activeLineSectionId: item.id,
        activeLineSectionName: item.name || ''
      });
    });
  });

  root.querySelectorAll('[data-line-delete]').forEach(del => {
    del.addEventListener('click', () => {
      const id = Number(del.dataset.lineDelete);
      writeLineSections(readLineSections().filter(item => item.id !== id));
      if (state.get().activeLineSectionId === id) state.set({ activeLineSectionId:null, activeLineSectionName:'' }, { notify:false });
      if (typeof rerender === 'function') rerender();
    });
  });
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
    inlineStats(mediumStats(r.medium))
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
    card('Betriebsart', segmented('mode', [
      { value: 'heating', label: '● Heizung' },
      { value: 'cooling', label: '● Kälte' }
    ], s.mode, { accent }), accent, { compact: true }),
    card(`${modeLabel} — Eingaben`, stack([
      segmented(key(s, 'CalcTarget'), [
        { value: 'power', label: 'Q Leistung' },
        { value: 'massFlow', label: 'ṁ Massenstrom' },
        { value: 'deltaT', label: 'ΔT Temperatur' }
      ], active.calcTarget, { accent }),
      grid(inputFields(s, active).join(''), 2)
    ].join('')), accent),
    mainResult(`Ergebnis — ${targetLabel(active.calcTarget)}`, targetMain(active.calcTarget, r), resultDetails, accent),
    `<div class="formula">Q = ṁ × cₚ × ΔT · ρ = ${fmt(r.medium.density, 0)} kg/m³ · cₚ = ${fmt(r.medium.cpWhKgK, 3)} Wh/(kg·K)</div>`
  ].join(''));

  const recommendationBody = !r.pipe
    ? '<div class="empty-state">Massenstrom berechnen oder eingeben →<br>Rohrdimensionierung</div>'
    : r.pipe.noDimension
      ? '<div class="empty-state">Keine Dimensionierung möglich!</div>'
      : `<div class="main-result"><span>Empfohlene Dimension</span><strong>DN ${r.pipe.dn}</strong></div>${inlineStats(pipeDetails(r))}`;

  const recommendation = stack([
    selectField({ id: 'pipeSystemId', label: 'Rohrmaterial', value: s.pipeSystemId, options: pipeSystems.map(p => ({ value: p.id, label: p.label })) }),
    recommendationBody
  ].join(''));

  return renderModuleShell(config, `
    <div class="span-6">${inputColumn}</div>
    <div class="span-6">${stack([card('Rohrdimensionsempfehlung', recommendation, 'blue'), lineSectionsCard(r)].join(''))}</div>
  `);
}

export default {
  config,
  state,
  mount(root) {
    mountModule(root, state, view, (rootEl, snapshot, render) => {
      bindLineSections(rootEl, calculate(activeCalculationState(snapshot)), render);
    });
  }
};