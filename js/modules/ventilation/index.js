import config from './config.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { card, field, segmented, renderModuleShell, stack, grid, inlineStats, mainResult } from '../../core/renderer.js';
import { mountModule } from '../../core/mount.js';
import { fmt, fmtInput } from '../../utils/calculations.js';

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

function renderVentilationLineSection(item, index) {
  const active = state.get().activeVentLineSectionId === item.id;
  return `<article class="line-section-card is-collapsed ${active ? 'is-active' : ''}" data-line-card data-vent-line-select="${item.id}">
    <div class="line-section-card__head">
      <button type="button" class="line-section-card__toggle" data-line-toggle aria-expanded="false"><strong>${item.name || 'Abschnitt ' + (index + 1)}</strong><span>▾</span></button>
      <button type="button" class="line-section-card__delete" data-line-delete="${item.id}" aria-label="Abschnitt löschen">×</button>
    </div>
    <div class="line-section-card__body">${inlineStats([
      { label: 'Leistung', value: item.powerKw || '—', unit: 'kW' },
      { label: 'Volumenstrom', value: item.volumeFlowM3h || '—', unit: 'm³/h' },
      { label: 'Massenstrom', value: item.massFlowKgh || '—', unit: 'kg/h' },
      { label: 'Temperaturdifferenz', value: item.deltaT || '—', unit: 'K' },
      { label: 'Zuluft', value: item.supplyTemp || '—', unit: '°C' },
      { label: 'Raum', value: item.roomTemp || '—', unit: '°C' },
      { label: 'Betriebsart', value: item.modeLabel || '—' }
    ])}</div>
  </article>`;
}

function ventilationLineSectionsCard(r, active, modeLabel) {
  const items = readVentilationLineSections();
  const rows = items.length
    ? `<div class="line-section-list">${items.map(renderVentilationLineSection).join('')}</div>`
    : '<div class="empty-state empty-state--compact">Noch keine Leitungsabschnitte angelegt</div>';
  return card('Leitungsabschnitte', stack([
    `<div class="field"><label for="ventLineSectionName">Bezeichnung</label><div class="control"><input id="ventLineSectionName" type="text" placeholder="z. B. Zuluft Büro Nord" autocomplete="off" value="${(state.get().activeVentLineSectionName || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"></div></div>`,
    `<div class="tc-save-actions"><button type="button" class="action-button" data-vent-line-save ${state.get().activeVentLineSectionId ? 'disabled' : ''}>Speichern</button><button type="button" class="action-button" data-vent-line-update ${state.get().activeVentLineSectionId ? '' : 'disabled'}>Aktualisieren</button></div>`,
    rows
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
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function bindVentilationLineSections(root, r, active, modeLabel, rerender) {
  root.querySelector('[data-vent-line-save]')?.addEventListener('click', event => {
    event.preventDefault();
    const name = root.querySelector('#ventLineSectionName')?.value?.trim() || '';
    const currentState = state.get();
    const items = readVentilationLineSections();
    const id = (globalThis.crypto?.randomUUID?.() || `vent-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const item = buildVentilationLineSectionRecord({ ...currentState, activeVentLineSectionId: null, activeVentLineSectionName: name }, r, active, modeLabel, items, id, name);
    writeVentilationLineSections([item, ...items]);
    state.set({ activeVentLineSectionId: null, activeVentLineSectionName: '' }, { notify:false });
    if (typeof rerender === 'function') rerender();
  });
  root.querySelector('[data-vent-line-update]')?.addEventListener('click', event => {
    event.preventDefault();
    const currentState = state.get();
    const id = currentState.activeVentLineSectionId;
    if (!id) return;
    const name = root.querySelector('#ventLineSectionName')?.value?.trim() || '';
    const items = readVentilationLineSections();
    const existing = items.find(entry => String(entry.id) === String(id));
    if (!existing) return;
    const item = buildVentilationLineSectionRecord(currentState, r, active, modeLabel, items, id, name, existing);
    writeVentilationLineSections(items.map(entry => String(entry.id) === String(id) ? item : entry));
    state.set({ activeVentLineSectionId: id, activeVentLineSectionName: item.name }, { notify:false });
    if (typeof rerender === 'function') rerender();
  });
  root.querySelectorAll('[data-line-toggle]').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const card = toggle.closest('[data-line-card]');
      const collapsed = card?.classList.toggle('is-collapsed');
      toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    });
  });
  root.querySelectorAll('[data-vent-line-select]').forEach(row => {
    row.addEventListener('click', event => {
      if (event.target.closest('[data-line-delete]') || event.target.closest('[data-line-toggle]')) return;
      const id = row.dataset.ventLineSelect;
      const item = readVentilationLineSections().find(entry => String(entry.id) === String(id));
      if (!item?.inputState) return;
      const input = item.inputState;
      const prefix = (input.mode === 'cooling') ? 'cooling' : 'heating';
      state.set({
        mode: input.mode || state.get().mode,
        [`${prefix}CalcTarget`]: input.calcTarget || 'power',
        [`${prefix}PowerW`]: input.powerW || '',
        [`${prefix}PowerUnit`]: input.powerUnit || 'W',
        [`${prefix}VolumeFlowM3h`]: input.volumeFlowM3h || '',
        [`${prefix}DeltaT`]: input.deltaT || '',
        [`${prefix}SupplyTemp`]: input.supplyTemp || '',
        [`${prefix}RoomTemp`]: input.roomTemp || '',
        activeVentLineSectionId: item.id,
        activeVentLineSectionName: item.name || ''
      });
    });
  });

  root.querySelectorAll('[data-line-delete]').forEach(del => {
    del.addEventListener('click', () => {
      const id = del.dataset.lineDelete;
      writeVentilationLineSections(readVentilationLineSections().filter(item => String(item.id) !== String(id)));
      if (String(state.get().activeVentLineSectionId) === String(id)) state.set({ activeVentLineSectionId:null, activeVentLineSectionName:'' }, { notify:false });
      if (typeof rerender === 'function') rerender();
    });
  });
}

function activeCalculationState(s) {
  return {
    mode: s.mode,
    calcTarget: activeValue(s, 'CalcTarget') || 'power',
    powerW: activeValue(s, 'PowerW') || '',
    powerUnit: activeValue(s, 'PowerUnit') || 'W',
    volumeFlowM3h: activeValue(s, 'VolumeFlowM3h') || '',
    deltaT: activeValue(s, 'DeltaT') || '',
    supplyTemp: activeValue(s, 'SupplyTemp') || '',
    roomTemp: activeValue(s, 'RoomTemp') || ''
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
  if (active.deltaT !== '' && active.deltaT !== null && active.deltaT !== undefined) return active.deltaT;
  const supply = Number(String(active.supplyTemp || '').replace(',', '.'));
  const room = Number(String(active.roomTemp || '').replace(',', '.'));
  if (Number.isFinite(supply) && Number.isFinite(room)) return Math.abs(supply - room);
  return '';
}

function inputFields(s, active) {
  const dtValue = derivedDeltaT(active);
  if (active.calcTarget === 'power') {
    return [
      field({ id: key(s, 'VolumeFlowM3h'), label: 'Volumenstrom V̇', unit: 'm³/h', value: fmtInput(active.volumeFlowM3h, 2) }),
      field({ id: key(s, 'DeltaT'), label: 'ΔT Temperatur', unit: 'K', value: fmtInput(dtValue, 2) })
    ];
  }
  if (active.calcTarget === 'volumeFlow') {
    return [powerField(s), field({ id: key(s, 'DeltaT'), label: 'ΔT Temperatur', unit: 'K', value: fmtInput(dtValue, 2) })];
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
    card('Betriebsart', segmented('mode', [
      { value: 'heating', label: '● Heizleistung' },
      { value: 'cooling', label: '● Kühlleistung' }
    ], s.mode, { accent }), accent, { compact: true }),
    card(`${modeLabel} — Eingaben`, stack([
      segmented(key(s, 'CalcTarget'), [
        { value: 'power', label: 'Q Leistung' },
        { value: 'volumeFlow', label: 'V̇ Volumenstrom' },
        { value: 'deltaT', label: 'ΔT Temperatur' }
      ], active.calcTarget, { accent }),
      grid(inputFields(s, active).join(''), 2)
    ].join('')), accent),
    `<div class="formula">Q = V̇ × (ρ × cₚ / 3,6) × ΔT / 1000 · Wärmewert = ${fmt(r.factor, 3)} Wh/(m³·K)</div>`
  ].join(''));

  const airStats = card('Luftkennwerte aktuell', inlineStats([
    { label: 'ρL', value: fmt(r.rho, 3), unit: 'kg/m³' },
    { label: 'cₚ,L', value: fmt(r.cp, 3), unit: 'kJ/(kg·K)' },
    { label: 'ρ × cₚ / 3,6', value: fmt(r.factor, 3), unit: 'Wh/(m³·K)' }
  ]), 'cyan', { compact: true });

  const outputColumn = stack([
    mainResult(`Ergebnis — ${targetLabel(active.calcTarget)}`, targetMain(active.calcTarget, r), resultDetails, accent),
    airStats,
    ventilationLineSectionsCard(r, active, modeLabel)
  ].join(''));

  return renderModuleShell(config, `
    <div class="span-6">${inputColumn}</div>
    <div class="span-6">${outputColumn}</div>
  `);
}

export default {
  config,
  state,
  mount(root) {
    mountModule(root, state, view, (rootEl, snapshot, render) => {
      const active = activeCalculationState(snapshot);
      const r = calculate(active);
      const modeLabel = snapshot.mode === 'cooling' ? 'Kälte' : 'Heizung';
      bindVentilationLineSections(rootEl, r, active, modeLabel, render);
    });
  }
};