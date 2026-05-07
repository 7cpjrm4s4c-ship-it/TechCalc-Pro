import config from './config.js';
import { state, savePoints } from './state.js';
import { calculate, calculatePoint, humidityRatioKgKg } from './logic.js';
import { card, field, renderModuleShell, bindCommonInputs, stack, grid, inlineStats, mainResult } from '../../core/renderer.js';
import { fmt, fmtInput } from '../../utils/calculations.js';

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function actionButton(label, attr, variant = '') {
  return `<button type="button" class="tc-action ${variant}" ${attr}>${esc(label)}</button>`;
}

function inputCard(s) {
  return card('Luftzustand erfassen', stack([
    field({ id: 'label', label: 'Bezeichnung', value: s.label, placeholder: 'z. B. Außenluft Winter', type: 'text' }),
    grid([
      field({ id: 'tempC', label: 'Trockenkugeltemperatur θt', unit: '°C', value: fmtInput(s.tempC, 2) }),
      field({ id: 'rhPercent', label: 'Relative Feuchte φ', unit: '%', value: fmtInput(s.rhPercent, 2) }),
      field({ id: 'volumeFlowM3h', label: 'Volumenstrom V̇', unit: 'm³/h', value: fmtInput(s.volumeFlowM3h, 2) })
    ].join(''), 3),
    `<div class="tc-actions">${actionButton('Zustand hinzufügen', 'data-hx-add')} ${actionButton('Verlauf löschen', 'data-hx-clear', 'tc-action--ghost')}</div>`
  ].join('')), 'cyan');
}

function resultCard(current) {
  return mainResult('Aktueller Zustand', { label: 'Enthalpie h', value: fmt(current.enthalpyKjKg, 2), unit: 'kJ/kg tr. Luft' }, [
    { label: 'Feuchtegehalt x', value: fmt(current.humidityRatioGkg, 2), unit: 'g/kg' },
    { label: 'Temperatur θt', value: fmt(current.tempC, 2), unit: '°C' },
    { label: 'rel. Feuchte φ', value: fmt(current.rhPercent, 0), unit: '%' },
    { label: 'Dichte ρ', value: fmt(current.densityKgm3, 3), unit: 'kg/m³' },
    { label: 'Taupunkt θp', value: fmt(current.dewPointC, 2), unit: '°C' },
    { label: 'Feuchtkugel θf', value: fmt(current.wetBulbC, 2), unit: '°C' },
    { label: 'Massenstrom ṁ', value: fmt(current.massFlowKgh, 2), unit: 'kg/h' }
  ], 'cyan');
}

function historyCard(points) {
  const body = points.length ? `<div class="hx-history">
    ${points.map((point, index) => `<div class="hx-history__row">
      <div><strong>${esc(index + 1)}. ${esc(point.label)}</strong><small>${fmt(point.tempC, 2)} °C · ${fmt(point.rhPercent, 0)} % r.F.</small></div>
      <div class="hx-history__values"><span>x ${fmt(point.humidityRatioGkg, 2)} g/kg</span><span>h ${fmt(point.enthalpyKjKg, 2)} kJ/kg</span></div>
      <button type="button" class="mini-button" data-hx-remove="${esc(point.id)}" aria-label="Zustand entfernen">×</button>
    </div>`).join('')}
  </div>` : '<div class="empty-state">Noch keine Luftzustände gespeichert</div>';
  return card('Zustandsverlauf', body, 'cyan');
}

function chartCard(points, current) {
  const chartPoints = points.length ? points : [current];
  return card('h,x-Diagramm', `<div class="hx-chart-wrap">${renderHxSvg(chartPoints)}</div><div class="formula">Näherung bei Luftdruck 1.013 hPa · x horizontal · θt vertikal</div>`, 'cyan');
}

function renderHxSvg(points) {
  const w = 760;
  const h = 520;
  const padL = 58;
  const padR = 22;
  const padT = 22;
  const padB = 48;
  const xMax = 28;
  const tMin = -18;
  const tMax = 50;
  const px = x => padL + (Math.max(0, Math.min(xMax, x)) / xMax) * (w - padL - padR);
  const py = t => padT + ((tMax - Math.max(tMin, Math.min(tMax, t))) / (tMax - tMin)) * (h - padT - padB);

  const tempLines = [];
  for (let t = -15; t <= 50; t += 5) {
    tempLines.push(`<line x1="${padL}" y1="${py(t)}" x2="${w - padR}" y2="${py(t)}" class="hx-grid-line"/><text x="${padL - 10}" y="${py(t) + 4}" class="hx-axis-label" text-anchor="end">${t}</text>`);
  }

  const xLines = [];
  for (let x = 0; x <= xMax; x += 2) {
    xLines.push(`<line x1="${px(x)}" y1="${padT}" x2="${px(x)}" y2="${h - padB}" class="hx-grid-line"/><text x="${px(x)}" y="${h - padB + 20}" class="hx-axis-label" text-anchor="middle">${x}</text>`);
  }

  const rhCurves = [10, 20, 40, 60, 80, 100].map(rh => {
    const d = [];
    for (let t = tMin; t <= tMax; t += 1) {
      const x = humidityRatioKgKg(t, rh) * 1000;
      if (x <= xMax) d.push(`${d.length ? 'L' : 'M'}${px(x).toFixed(1)},${py(t).toFixed(1)}`);
    }
    return `<path d="${d.join(' ')}" class="hx-rh hx-rh-${rh}"/><text x="${px(Math.min(xMax, humidityRatioKgKg(Math.min(44, tMax), rh) * 1000))}" y="${py(Math.min(44, tMax)) - 4}" class="hx-rh-label">${rh}%</text>`;
  }).join('');

  const path = points.map((point, index) => `${index ? 'L' : 'M'}${px(point.humidityRatioGkg).toFixed(1)},${py(point.tempC).toFixed(1)}`).join(' ');
  const markers = points.map((point, index) => `<g class="hx-point">
    <circle cx="${px(point.humidityRatioGkg)}" cy="${py(point.tempC)}" r="5"/>
    <text x="${px(point.humidityRatioGkg) + 8}" y="${py(point.tempC) - 8}">${esc(index + 1)} ${esc(point.label)}</text>
  </g>`).join('');

  return `<svg class="hx-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="h,x-Diagramm">
    <rect x="0" y="0" width="${w}" height="${h}" rx="18" class="hx-chart-bg"/>
    <g>${tempLines.join('')}${xLines.join('')}</g>
    <g>${rhCurves}</g>
    <path d="${path}" class="hx-state-path"/>
    <g>${markers}</g>
    <text x="${w / 2}" y="${h - 12}" class="hx-title" text-anchor="middle">Feuchtegehalt x [g H₂O/kg tr. Luft]</text>
    <text x="16" y="${h / 2}" class="hx-title" transform="rotate(-90 16 ${h / 2})" text-anchor="middle">Trockenkugeltemperatur θt [°C]</text>
  </svg>`;
}

function view(s) {
  const r = calculate(s);
  const body = `<div class="hx-layout">
    <div class="hx-layout__left">${stack([inputCard(s), resultCard(r.current), historyCard(r.points)].join(''))}</div>
    <div class="hx-layout__right">${chartCard(r.points, r.current)}</div>
  </div>`;
  return renderModuleShell(config, `<div class="span-12">${body}</div>`);
}

export default {
  config,
  state,
  mount(root) {
    const render = () => {
      root.innerHTML = view(state.get());
      bindCommonInputs(root, state);
      bindActions(root);
    };

    const bindActions = rootEl => {
      rootEl.querySelector('[data-hx-add]')?.addEventListener('click', () => {
        const s = state.get();
        const point = calculatePoint({
          label: s.label,
          tempC: s.tempC,
          rhPercent: s.rhPercent,
          volumeFlowM3h: s.volumeFlowM3h
        });
        const points = [...(s.points ?? []), point];
        savePoints(points);
        state.set({ points, label: `Zustand ${points.length + 1}` });
      });

      rootEl.querySelector('[data-hx-clear]')?.addEventListener('click', () => {
        savePoints([]);
        state.set({ points: [] });
      });

      rootEl.querySelectorAll('[data-hx-remove]').forEach(button => {
        button.addEventListener('click', () => {
          const points = (state.get().points ?? []).filter(point => point.id !== button.dataset.hxRemove);
          savePoints(points);
          state.set({ points });
        });
      });
    };

    state.subscribe(render);
    render();
  }
};
