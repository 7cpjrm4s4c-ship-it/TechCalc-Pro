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

function lineSectionsCard(r) {
  const items = readLineSections();
  const rows = items.length
    ? `<div class="line-section-list">${items.map((item, index) => `<article class="line-section-card">
        <div class="line-section-card__head"><strong>${item.name || 'Abschnitt ' + (index + 1)}</strong><button type="button" data-line-delete="${item.id}" aria-label="Abschnitt löschen">×</button></div>
        ${inlineStats([
          { label: 'Bezeichnung', value: item.name || 'Abschnitt ' + (index + 1) },
          { label: 'Leistung', value: item.powerKw || '—', unit: 'kW' },
          { label: 'Massenstrom', value: item.massFlowKgh || '—', unit: 'kg/h' },
          { label: 'Volumenstrom', value: item.volumeFlowM3h || '—', unit: 'm³/h' },
          { label: 'Temperaturdifferenz', value: item.deltaT || '—', unit: 'K' },
          { label: 'Wärmeträger', value: item.medium || '—' }
        ])}
      </article>`).join('')}</div>`
    : '<div class="empty-state empty-state--compact">Noch keine Leitungsabschnitte angelegt</div>';
  return card('Leitungsabschnitte', stack([
    field({ id: 'lineSectionName', label: 'Bezeichnung', unit: '', placeholder: 'z. B. Verteilerabgang Nord' }),
    '<button type="button" class="action-button" data-line-add>Abschnitt speichern</button>',
    rows
  ].join('')), 'blue');
}

function bindLineSections(root, r, rerender) {
  const btn = root.querySelector('[data-line-add]');
  if (btn) {
    btn.addEventListener('click', () => {
      const name = root.querySelector('[data-field="lineSectionName"]')?.value?.trim() || '';
      const items = readLineSections();
      items.push({
        id: Date.now(),
        name: name || `Abschnitt ${items.length + 1}`,
        powerKw: fmt(r.powerKw),
        massFlowKgh: fmt(r.massFlowKgh),
        volumeFlowM3h: fmt(r.volumeFlowM3h, 3),
        deltaT: fmt(r.deltaT),
        medium: r.medium?.label || '—',
        createdAt: new Date().toISOString()
      });
      writeLineSections(items);
      if (typeof rerender === 'function') rerender();
    });
  }
  root.querySelectorAll('[data-line-delete]').forEach(del => {
    del.addEventListener('click', () => {
      const id = Number(del.dataset.lineDelete);
      writeLineSections(readLineSections().filter(item => item.id !== id));
      if (typeof rerender === 'function') rerender();
    });
  });
}

function pressureBadge(r) {
  if (!r?.rating) return '';
  return `<span class="traffic traffic--${r.rating.key}">${r.rating.label}</span>`;
}

function pipeDetails(r) {
  return [
    { label: 'Material', value: r.pipe.system.label },
    { label: 'Geschwindigkeit', value: fmt(r.pipe.velocity), unit: 'm/s' },
    { label: 'Druckverlust', value: fmt(r.pipe.pressureLoss), unit: 'Pa/m' },
    { label: 'Norm', value: r.pipe.norm }
  ];
}

function pipeDimensionCards(r) {
  if (!r?.pipe) return '';
  const pipe = r.pipe;
  const list = [pipe.smaller, pipe, pipe.larger].filter(Boolean);
  const max = Number(pipe.maxPressurePam || 100);
  return `<div class="pipe-dimension-list">${list.map(item => {
    const ratio = max ? item.pressureLoss / max : 0;
    const percent = Math.max(0, Math.min(ratio * 100, 100));
    const key = item.rating?.key || (ratio < .75 ? 'green' : ratio <= 1 ? 'yellow' : 'red');
    const isRecommended = item.dn === pipe.dn;
    const label = isRecommended ? 'Empfohlen' : (item.dn < pipe.dn ? 'Eine DN kleiner' : 'Eine DN größer');
    return `<div class="pipe-dimension-card pipe-dimension-card--${key}${isRecommended ? ' is-recommended' : ''}">
      <div class="pipe-dimension-card__head"><span>${label}</span>${isRecommended ? '<small>★</small>' : ''}</div>
      <strong>DN ${item.dn}</strong>
      <div class="pipe-dimension-card__meta"><span>di ${fmt(item.di, 1)} mm</span><span>${fmt(item.velocity)} m/s</span><span>${fmt(item.pressureLoss)} Pa/m</span></div>
      <div class="pipe-bar"><span style="width:${percent}%"></span></div>
    </div>`;
  }).join('')}</div>`;
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
    : r.pipe.oversized
      ? '<div class="empty-state">Keine Dimensionierung möglich!</div>'
      : mainResult('', { label: 'Empfohlene Dimension', value: 'DN ' + r.pipe.dn }, pipeDetails(r), 'blue');

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
    const render = () => {
      root.innerHTML = view(state.get());
      bindCommonInputs(root, state);
      bindLineSections(root, calculate(activeCalculationState(state.get())), render);
    };
    state.subscribe(render);
    render();
  }
};
