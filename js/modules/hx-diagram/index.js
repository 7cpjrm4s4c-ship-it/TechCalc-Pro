import config from './config.js';
import { state, saveProcesses } from './state.js';
import { calculate, calculatePoint, humidityRatioKgKg, PROCESS_OPTIONS } from './logic.js';
import { card, field, renderModuleShell, stack, grid, inlineStats, mainResult } from '../../core/renderer.js';
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

function processCard(s, r) {
  return card('Luftbehandlung wählen', `<div class="hx-process-grid">
    ${r.options.map(option => `<button type="button" data-segment="process" data-value="${esc(option.value)}" class="hx-process ${option.value === r.selectedProcess ? 'is-active' : ''}">${esc(option.label)}</button>`).join('')}
  </div>`, 'cyan', { compact: true });
}

function inputCard(s, r) {
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
    processCard(s, r),
    `<div class="tc-actions">${actionButton('Prozess speichern', 'data-hx-add')} ${actionButton('Diagramm leeren', 'data-hx-clear-active', 'tc-action--ghost')}</div>`
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
    `<div class="hx-state-grid">${readonlyStateCard('Ausgang', r.current)}${readonlyStateCard('Ziel', r.target)}</div>`
  ].join(''));
}

function historyCard(processes, activeProcessId) {
  const body = processes.length ? `<div class="hx-history">
    ${processes.map((process, index) => {
      const last = process.points[process.points.length - 1];
      return `<div class="hx-history__row ${process.id === activeProcessId ? 'is-active' : ''}" data-hx-select-process="${esc(process.id)}">
        <div><strong>${esc(index + 1)}. ${esc(process.label)}</strong><small>${esc(process.processLabel)} · ${process.points.length} Punkte</small></div>
        <div class="hx-history__values"><span>θt ${fmt(last.tempC, 2)} °C</span><span>φ ${fmt(last.rhPercent, 0)} % r.F.</span></div>
        <button type="button" class="mini-button" data-hx-remove-process="${esc(process.id)}" aria-label="Prozess entfernen">×</button>
      </div>`;
    }).join('')}
  </div>` : '<div class="empty-state">Noch keine Prozesse gespeichert</div>';
  return card('Gespeicherte Prozesse', body, 'cyan');
}

function chartCard(points) {
  return card('h,x-Diagramm', `<div class="hx-chart-wrap">${renderHxSvg(points)}</div><div class="formula">Näherung bei Luftdruck 1.013 hPa · x horizontal · θt vertikal</div>`, 'cyan');
}

function interpolateLine(a, b, steps = 18) {
  const pts = [];
  for (let i = 0; i <= steps; i += 1) {
    const f = i / steps;
    pts.push({
      tempC: a.tempC + (b.tempC - a.tempC) * f,
      humidityRatioGkg: a.humidityRatioGkg + (b.humidityRatioGkg - a.humidityRatioGkg) * f
    });
  }
  return pts;
}

function renderHxSvg(points = []) {
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

  const labelTemps = { 10: 18, 20: 24, 30: 29, 40: 34, 50: 38, 60: 40, 80: 43, 100: 47 };
  const rhCurves = [10, 20, 30, 40, 50, 60, 80, 100].map(rh => {
    const d = [];
    for (let t = tMin; t <= tMax; t += 0.75) {
      const x = humidityRatioKgKg(t, rh) * 1000;
      if (x <= xMax) d.push(`${d.length ? 'L' : 'M'}${px(x).toFixed(1)},${py(t).toFixed(1)}`);
    }
    const lt = labelTemps[rh] ?? 35;
    const lx = Math.min(xMax - 0.6, humidityRatioKgKg(lt, rh) * 1000);
    return `<path d="${d.join(' ')}" class="hx-rh hx-rh-${rh}"/><text x="${px(lx)}" y="${py(lt) - 4}" class="hx-rh-label hx-rh-label-${rh}">${rh}%</text>`;
  }).join('');

  const segments = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const pts = interpolateLine(a, b, 22);
    const d = pts.map((p, index) => `${index ? 'L' : 'M'}${px(p.humidityRatioGkg).toFixed(1)},${py(p.tempC).toFixed(1)}`).join(' ');
    segments.push(`<path d="${d}" class="hx-state-path hx-state-path--${(i % 6) + 1}"/>`);
  }

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

  const empty = points.length ? '' : `<text x="${w / 2}" y="${h / 2}" class="hx-empty-label" text-anchor="middle">Prozess wählen oder gespeicherten Prozess öffnen</text>`;
  return `<svg class="hx-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="h,x-Diagramm">
    <rect x="0" y="0" width="${w}" height="${h}" rx="18" class="hx-chart-bg"/>
    <g>${tempLines.join('')}${xLines.join('')}</g>
    <g>${rhCurves}</g>
    <g>${segments.join('')}</g>
    <g>${markers}</g>
    ${empty}
    <text x="${w / 2}" y="${h - 12}" class="hx-title" text-anchor="middle">Feuchtegehalt x [g H₂O/kg tr. Luft]</text>
    <text x="16" y="${h / 2}" class="hx-title" transform="rotate(-90 16 ${h / 2})" text-anchor="middle">Trockenkugeltemperatur θt [°C]</text>
  </svg>`;
}

function chartPointsFor(s, r) {
  return s.previewSuppressed ? [] : r.processPath;
}

function processInputPatch(process) {
  const points = Array.isArray(process?.points) ? process.points : [];
  const first = points[0] ?? {};
  const last = points[points.length - 1] ?? first;
  return {
    activeProcessId: process?.id || '',
    previewSuppressed: false,
    label: process?.label || 'Zustand',
    tempC: String(first.tempC ?? ''),
    rhPercent: String(first.rhPercent ?? ''),
    targetTempC: String(last.tempC ?? ''),
    targetRhPercent: String(last.rhPercent ?? ''),
    process: process?.process || 'heat'
  };
}

function view(s) {
  const r = calculate(s);
  const points = chartPointsFor(s, r);
  const body = `<div class="hx-layout">
    <div class="hx-layout__left">${stack([inputCard(s, r), resultCard(r), historyCard(r.processes, s.activeProcessId), processPathCard(r)].join(''))}</div>
    <div class="hx-layout__right">${chartCard(points)}</div>
  </div>`;
  return renderModuleShell(config, `<div class="span-12">${body}</div>`);
}

function toggleNumericSign(value) {
  const raw = String(value ?? '').trim();
  if (!raw || raw === '0') return '-';
  return raw.startsWith('-') ? raw.slice(1) : `-${raw}`;
}

function bindHxInputs(rootEl, renderState) {
  rootEl.querySelectorAll('[data-field]').forEach(el => {
    const apply = () => renderState.set({ [el.dataset.field]: el.value, previewSuppressed: false });
    if (el.matches('input')) {
      el.addEventListener('input', () => renderState.set({ [el.dataset.field]: el.value, previewSuppressed: false }, { notify: false }));
      el.addEventListener('change', apply);
      el.addEventListener('blur', apply);
    } else {
      el.addEventListener('change', apply);
    }
  });
  rootEl.querySelectorAll('[data-segment]').forEach(btn => {
    btn.addEventListener('click', () => renderState.set({ [btn.dataset.segment]: btn.dataset.value, previewSuppressed: false }));
  });
}

export default {
  config,
  state,
  mount(root) {
    const render = () => {
      root.innerHTML = view(state.get());
      bindHxInputs(root, state);
      bindActions(root);
    };

    const bindActions = rootEl => {
      rootEl.querySelectorAll('[data-hx-sign]').forEach(button => {
        button.addEventListener('click', () => {
          const id = button.dataset.hxSign;
          const input = rootEl.querySelector(`[data-field="${id}"]`);
          state.set({ [id]: toggleNumericSign(input?.value), previewSuppressed: false });
        });
      });

      rootEl.querySelector('[data-hx-add]')?.addEventListener('click', () => {
        const s = state.get();
        const result = calculate(s);
        const existingId = s.activeProcessId || '';
        const nextId = existingId || crypto.randomUUID();
        const process = {
          id: nextId,
          label: s.label || `Prozess ${(s.processes ?? []).length + 1}`,
          process: result.selectedProcess,
          processLabel: result.changeType,
          points: result.processPath.map(point => ({
            label: point.label,
            tempC: String(point.tempC),
            rhPercent: String(point.rhPercent)
          }))
        };
        const list = Array.isArray(s.processes) ? s.processes : [];
        const processes = existingId && list.some(item => item.id === existingId)
          ? list.map(item => (item.id === existingId ? process : item))
          : [...list, process];
        saveProcesses(processes);
        state.set({ processes, ...processInputPatch(process) });
      });

      rootEl.querySelector('[data-hx-clear-active]')?.addEventListener('click', () => {
        state.set({ activeProcessId: '', previewSuppressed: true });
      });

      rootEl.querySelectorAll('[data-hx-select-process]').forEach(row => {
        row.addEventListener('click', event => {
          if (event.target.closest('[data-hx-remove-process]')) return;
          const s = state.get();
          const process = (s.processes ?? []).find(item => item.id === row.dataset.hxSelectProcess);
          if (process) state.set(processInputPatch(process));
        });
      });

      rootEl.querySelectorAll('[data-hx-remove-process]').forEach(button => {
        button.addEventListener('click', () => {
          const s = state.get();
          const processes = (s.processes ?? []).filter(process => process.id !== button.dataset.hxRemoveProcess);
          saveProcesses(processes);
          state.set({ processes, activeProcessId: s.activeProcessId === button.dataset.hxRemoveProcess ? '' : s.activeProcessId });
        });
      });
    };

    state.subscribe(render);
    render();
  }
};
