import config from './config.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { MEDIA, fmt, fmtInput } from '../../utils/calculations.js';
import { pipeSystems } from '../../utils/pipes.js';
import { card, field, selectField, segmented, renderModuleShell, bindCommonInputs, stack, grid, inlineStats, mainResult } from '../../core/renderer.js';

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


const LINE_STORAGE_KEY = 'techcalcPro.heatingCooling.lineSections';

function readLineSections() {
  try { return JSON.parse(localStorage.getItem(LINE_STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function writeLineSections(items) {
  localStorage.setItem(LINE_STORAGE_KEY, JSON.stringify(items));
}

function lineSectionsCard() {
  const items = readLineSections();
  const rows = items.length
    ? `<div class="result-list">${items.map((item, index) => `<div class="result-row"><span>${item.name || 'Abschnitt ' + (index + 1)}</span><strong>${item.length || '—'} <small>m</small></strong></div>`).join('')}</div>`
    : '<div class="empty-state empty-state--compact">Noch keine Leitungsabschnitte angelegt</div>';
  return card('Leitungsabschnitte', stack([
    grid([
      field({ id: 'lineSectionName', label: 'Bezeichnung', unit: '', placeholder: 'z. B. Strang A' }),
      field({ id: 'lineSectionLength', label: 'Länge', unit: 'm', placeholder: '0' })
    ].join(''), 2),
    '<button type="button" class="action-button" data-line-add>Abschnitt speichern</button>',
    rows
  ].join('')), 'blue');
}

function bindLineSections(root) {
  const btn = root.querySelector('[data-line-add]');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const name = root.querySelector('[data-field="lineSectionName"]')?.value?.trim() || '';
    const length = root.querySelector('[data-field="lineSectionLength"]')?.value?.trim() || '';
    if (!name && !length) return;
    const items = readLineSections();
    items.push({ id: Date.now(), name, length, createdAt: new Date().toISOString() });
    writeLineSections(items);
    btn.dispatchEvent(new CustomEvent('tc-lines-changed', { bubbles: true }));
  });
}

function pressureBadge(r) {
  if (!r?.rating) return '';
  return `<span class="traffic traffic--${r.rating.key}">${r.rating.label}</span>`;
}

function pipeDetails(r) {
  const details = [
    { label: 'Material', value: r.pipe.system.label },
    { label: 'Geschwindigkeit', value: fmt(r.pipe.velocity), unit: 'm/s' },
    { label: 'Druckverlust', value: fmt(r.pipe.pressureLoss), unit: 'Pa/m' },
    { label: 'Norm', value: r.pipe.norm },
    { label: 'Ampel', value: r.pipe.rating?.label || '—' }
  ];
  if (r.pipe.smaller) details.push({ label: 'Eine DN kleiner', value: `DN ${r.pipe.smaller.dn}`, unit: `${fmt(r.pipe.smaller.pressureLoss)} Pa/m` });
  if (r.pipe.larger) details.push({ label: 'Eine DN größer', value: `DN ${r.pipe.larger.dn}`, unit: `${fmt(r.pipe.larger.pressureLoss)} Pa/m` });
  return details;
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

  const recommendation = stack([
    selectField({ id: 'pipeSystemId', label: 'Rohrmaterial', value: s.pipeSystemId, options: pipeSystems.map(p => ({ value: p.id, label: p.label })) }),
    r.pipe
      ? mainResult('', { label: 'Empfohlene Dimension', value: 'DN ' + r.pipe.dn }, pipeDetails(r), 'blue')
      : '<div class="empty-state">Massenstrom berechnen oder eingeben →<br>Rohrdimensionierung</div>'
  ].join(''));

  return renderModuleShell(config, `
    <div class="span-6">${inputColumn}</div>
    <div class="span-6">${stack([card('Rohrdimensionsempfehlung', recommendation, 'blue'), lineSectionsCard()].join(''))}</div>
  `);
}

export default {
  config,
  state,
  mount(root) {
    const render = () => {
      root.innerHTML = view(state.get());
      bindCommonInputs(root, state);
      bindLineSections(root);
      root.addEventListener('tc-lines-changed', render, { once: true });
    };
    state.subscribe(render);
    render();
  }
};
