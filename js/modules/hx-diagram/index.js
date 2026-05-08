import config from './config.js';
import { state, savePoints } from './state.js';
import { calculate, calculatePoint, humidityRatioKgKg, PROCESS_OPTIONS } from './logic.js';
import { card, field, renderModuleShell, bindCommonInputs, stack, grid, inlineStats, mainResult, segmented } from '../../core/renderer.js';
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

function signedTempField(id, label, value) {
  return `<div class="field field--signed-temp">
    <label for="${esc(id)}">${esc(label)}</label>
    <div class="control control--with-sign">
      <button type="button" class="sign-toggle" data-hx-sign="${esc(id)}" aria-label="Vorzeichen umschalten">±</button>
      <input id="${esc(id)}" data-field="${esc(id)}" type="text" inputmode="decimal" value="${esc(value ?? '')}" placeholder="0" autocomplete="off">
      <span class="unit">°C</span>
    </div>
  </div>`;
}

function processCard(s) {
  return card('Luftbehandlung wählen', `<div class="hx-process-grid">
    ${PROCESS_OPTIONS.map(option => `<button type="button" data-segment="process" data-value="${esc(option.value)}" class="hx-process ${option.value === s.process ? 'is-active' : ''}">${esc(option.label)}</button>`).join('')}
  </div>`, 'cyan', { compact: true });
}

function inputCard(s) {
  return card('Luftzustand erfassen', stack([
    field({ id: 'label', label: 'Bezeichnung', value: s.label, placeholder: 'z. B. Außenluft Winter', type: 'text', inputmode: 'text' }),
    card('Ausgangszustand', grid([
      signedTempField('tempC', 'Trockenkugeltemperatur θt', fmtInput(s.tempC, 2)),
      field({ id: 'rhPercent', label: 'Relative Feuchte φ', unit: '%', value: fmtInput(s.rhPercent, 2) })
    ].join(''), 2), 'cyan', { compact: true }),
    card('Zielzustand', grid([
      signedTempField('targetTempC', 'Zieltemperatur θt', fmtInput(s.targetTempC, 2)),
      field({ id: 'targetRhPercent', label: 'Relative Zielfeuchte φ', unit: '%', value: fmtInput(s.targetRhPercent, 2) })
    ].join(''), 2), 'cyan', { compact: true }),
    processCard(s),
    `<div class="tc-actions">${actionButton('Verlauf übernehmen', 'data-hx-add')} ${actionButton('Verlauf löschen', 'data-hx-clear', 'tc-action--ghost')}</div>`
  ].join('')), 'cyan');
}

function readonlyStateCard(title, point) {
  return card(title, inlineStats([
    { label: 'Temperatur θt', value: fmt(point.tempC, 2), unit: '°C' },
    { label: 'rel. Feuchte φ', value: fmt(point.rhPercent, 0), unit: '%' },
    { label: 'Feuchtegehalt x', value: fmt(point.humidityRatioGkg, 2), unit: 'g/kg' },
    { label: 'Enthalpie h', value: fmt(point.enthalpyKjKg, 2), unit: 'kJ/kg' },
    { label: 'Dichte ρ', value: fmt(point.densityKgm3, 3), unit: 'kg/m³' },
    { label: 'Taupunkt θp', value: fmt(point.dewPointC, 2), unit: '°C' }
  ]), 'cyan');
}

function processPathCard(r) {
  const rows = r.processPath.map((point, index) => `<div class="hx-process-step">
    <strong>${esc(point.label || `Punkt ${index + 1}`)}</strong>
    <span><b>θt</b>${fmt(point.tempC, 2)} °C</span>
    <span><b>φ</b>${fmt(point.rhPercent, 0)} %</span>
    <span><b>x</b>${fmt(point.humidityRatioGkg, 2)} g/kg</span>
    <span><b>h</b>${fmt(point.enthalpyKjKg, 2)} kJ/kg</span>
  </div>`).join('');
  return card('Berechnete Zustandspunkte', `<div class="hx-process-path">${rows}</div>`, 'cyan');
}

function resultCard(r) {
  return stack([
    mainResult('Automatische Zustandsänderung', { label: 'Prozess', value: r.changeType, unit: '' }, [
      { label: 'Δθ', value: fmt(r.delta.tempK, 2), unit: 'K' },
      { label: 'Δx', value: fmt(r.delta.humidityGkg, 2), unit: 'g/kg' },
      { label: 'Δh', value: fmt(r.delta.enthalpyKjKg, 2), unit: 'kJ/kg' },
      { label: 'Δφ', value: fmt(r.delta.rhPercent, 0), unit: '%' }
    ], 'cyan'),
    processPathCard(r),
    `<div class="hx-state-grid">${readonlyStateCard('Ausgang', r.current)}${readonlyStateCard('Ziel', r.target)}</div>`
  ].join(''));
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

function chartCard(points, current, target, processPath = []) {
  const chartPoints = points.length ? points : (processPath.length ? processPath : [current, target]);
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
  const markers = points.map((point, index) => {
    const cx = px(point.humidityRatioGkg);
    const cy = py(point.tempC);
    const nearRight = cx > w - 150;
    const labelX = nearRight ? cx - 10 : cx + 10;
    const anchor = nearRight ? 'end' : 'start';
    return `<g class="hx-point">
      <circle cx="${cx}" cy="${cy}" r="5"/>
      <text x="${labelX}" y="${cy - 8}" text-anchor="${anchor}">${esc(index + 1)}</text>
    </g>`;
  }).join('');

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
    <div class="hx-layout__left">${stack([inputCard(s), resultCard(r), historyCard(r.points)].join(''))}</div>
    <div class="hx-layout__right">${chartCard(r.points, r.current, r.target, r.processPath)}</div>
  </div>`;
  return renderModuleShell(config, `<div class="span-12">${body}</div>`);
}

function toggleNumericSign(value) {
  const raw = String(value ?? '').trim();
  if (!raw || raw === '0') return '-';
  return raw.startsWith('-') ? raw.slice(1) : `-${raw}`;
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
      rootEl.querySelectorAll('[data-hx-sign]').forEach(button => {
        button.addEventListener('click', () => {
          const id = button.dataset.hxSign;
          const input = rootEl.querySelector(`[data-field="${id}"]`);
          const next = toggleNumericSign(input?.value);
          state.set({ [id]: next });
        });
      });

      rootEl.querySelector('[data-hx-add]')?.addEventListener('click', () => {
        const s = state.get();
        const result = calculate(s);
        const labelled = result.processPath.map((point, index) => ({
          label: `${s.label || 'Zustand'} · ${index + 1} ${point.label.replace(/^\d+\s*/, '')}`,
          tempC: String(point.tempC),
          rhPercent: String(point.rhPercent)
        }));
        const points = [...(s.points ?? []), ...labelled];
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
