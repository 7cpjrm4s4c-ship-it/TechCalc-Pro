import config from './config.js';
import { state, saveProcesses, makeProcessRecord, clearLegacyPoints } from './state.js';
import { calculate, calculatePoint, humidityRatioKgKg, PROCESS_OPTIONS } from './logic.js';
import { card, field, renderModuleShell, bindCommonInputs, stack, grid, inlineStats, mainResult, segmented, esc, signedTempField, toggleNumericSign } from '../../core/renderer.js';
import { fmt, fmtInput } from '../../utils/calculations.js';

function hxFmt(value, decimals = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('de-DE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function actionButton(label, attr, variant = '') {
  return `<button type="button" class="tc-action ${variant}" ${attr}>${esc(label)}</button>`;
}

function availableProcesses(s) {
  const t0 = Number(String(s.tempC ?? 0).replace(',', '.')) || 0;
  const t1 = Number(String(s.targetTempC ?? 0).replace(',', '.')) || 0;
  if (t0 < t1) return PROCESS_OPTIONS.filter(option => !['cool', 'cool-dehumidify'].includes(option.value));
  if (t0 > t1) return PROCESS_OPTIONS.filter(option => ['cool', 'cool-dehumidify'].includes(option.value));
  return PROCESS_OPTIONS;
}

function processCard(s) {
  const options = availableProcesses(s);
  return card('Luftbehandlung wählen', `<div class="hx-process-grid">
    ${options.map(option => `<button type="button" data-segment="process" data-value="${esc(option.value)}" class="hx-process ${option.value === s.process ? 'is-active' : ''}">${esc(option.label)}</button>`).join('')}
  </div>`, 'cyan', { compact: true });
}

function inputCard(s) {
  return card('Luftzustand erfassen', stack([
    field({ id: 'label', label: 'Bezeichnung', value: s.label, placeholder: 'z. B. Außenluft Winter', type: 'text', inputmode: 'text' }),
    card('Ausgangszustand', grid([
      signedTempField('tempC', 'Trockenkugeltemperatur θt', fmtInput(s.tempC, 2), 'data-hx-sign'),
      field({ id: 'rhPercent', label: 'Relative Feuchte φ', unit: '%', value: fmtInput(s.rhPercent, 2) })
    ].join(''), 2), 'cyan', { compact: true }),
    card('Zielzustand', grid([
      signedTempField('targetTempC', 'Zieltemperatur θt', fmtInput(s.targetTempC, 2), 'data-hx-sign'),
      field({ id: 'targetRhPercent', label: 'Relative Zielfeuchte φ', unit: '%', value: fmtInput(s.targetRhPercent, 2) })
    ].join(''), 2), 'cyan', { compact: true }),
    processCard(s),
    `<div class="tc-save-actions">${actionButton('Speichern', s.activeProcessId ? 'data-hx-add disabled' : 'data-hx-add')} ${actionButton('Aktualisieren', s.activeProcessId ? 'data-hx-update' : 'data-hx-update disabled')}</div><div class="tc-actions">${actionButton('Diagramm leeren', 'data-hx-clear', 'tc-action--ghost')}</div>`
  ].join('')), 'cyan');
}

function readonlyStateCard(title, point) {
  return card(title, inlineStats([
    { label: 'Temperatur θt', value: hxFmt(point.tempC, 2), unit: '°C' },
    { label: 'rel. Feuchte φ', value: hxFmt(point.rhPercent, 0), unit: '%' },
    { label: 'Feuchtegehalt x', value: hxFmt(point.humidityRatioGkg, 2), unit: 'g/kg' },
    { label: 'Enthalpie h', value: hxFmt(point.enthalpyKjKg, 2), unit: 'kJ/kg' },
    { label: 'Dichte ρ', value: hxFmt(point.densityKgm3, 3), unit: 'kg/m³' },
    { label: 'Taupunkt θp', value: hxFmt(point.dewPointC, 2), unit: '°C' }
  ]), 'cyan');
}

function processPathCard(r) {
  const rows = r.processPath.map((point, index) => `<div class="hx-process-step">
    <strong>${esc(point.label || `Punkt ${index + 1}`)}</strong>
    <span><b>θt</b>${hxFmt(point.tempC, 2)} °C</span>
    <span><b>φ</b>${hxFmt(point.rhPercent, 0)} %</span>
    <span><b>x</b>${hxFmt(point.humidityRatioGkg, 2)} g/kg</span>
    <span><b>h</b>${hxFmt(point.enthalpyKjKg, 2)} kJ/kg</span>
  </div>`).join('');
  return card('Berechnete Zustandspunkte', `<div class="hx-process-path">${rows}</div>`, 'cyan');
}

function resultCard(r, activePath) {
  if (!activePath.length) {
    return card('Automatische Zustandsänderung', '<div class="empty-state">Zustandsänderung wählen oder gespeicherten Prozess auswählen</div>', 'cyan');
  }
  return stack([
    mainResult('Automatische Zustandsänderung', { label: 'Prozess', value: r.changeType, unit: '' }, [
      { label: 'Δθ', value: hxFmt(r.delta.tempK, 2), unit: 'K' },
      { label: 'Δx', value: hxFmt(r.delta.humidityGkg, 2), unit: 'g/kg' },
      { label: 'Δh', value: hxFmt(r.delta.enthalpyKjKg, 2), unit: 'kJ/kg' },
      { label: 'Δφ', value: hxFmt(r.delta.rhPercent, 0), unit: '%' }
    ], 'cyan'),
    processPathCard({ processPath: activePath }),
    `<div class="hx-state-grid">${readonlyStateCard('Ausgang', activePath[0])}${readonlyStateCard('Ziel', activePath[activePath.length - 1])}</div>`
  ].join(''));
}

function historyCard(processes, activeProcessId) {
  const body = processes.length ? `<div class="hx-history">
    ${processes.map((process, index) => {
      const last = process.path?.[process.path.length - 1];
      const selected = process.id === activeProcessId;
      return `<div class="hx-history__row hx-history__row--process ${selected ? 'is-active' : ''}" data-hx-select-process="${esc(process.id)}">
        <div><strong>${esc(index + 1)}. ${esc(process.label)}</strong><small>${esc(process.processLabel || process.process)} · ${process.path?.length || 0} Punkte</small></div>
        <div class="hx-history__values"><span>θt ${hxFmt(last?.tempC, 2)} °C</span><span>φ ${hxFmt(last?.rhPercent, 0)} % r.F.</span></div>
        <button type="button" class="mini-button mini-button--danger" data-hx-remove-process="${esc(process.id)}" aria-label="Prozess löschen">Löschen</button>
      </div>`;
    }).join('')}
  </div>` : '<div class="empty-state">Noch keine Prozesse gespeichert</div>';
  return card('Gespeicherte Prozesse', body, 'cyan');
}

function chartCard(activePath, targetReached = true) {
  const warning = targetReached ? '' : '<div class="hx-target-warning">Zielzustand wird nicht erreicht!</div>';
  return card('h,x-Diagramm', `<div class="hx-chart-wrap">${renderHxSvg(activePath)}</div>${warning}<div class="formula">Näherung bei Luftdruck 1.013 hPa · x horizontal · θt vertikal</div>`, 'cyan');
}


function buildSegmentPath(a, b, px, py) {
  if (!a || !b) return '';
  const parts = [`M${px(a.humidityRatioGkg).toFixed(1)},${py(a.tempC).toFixed(1)}`];
  const bothSaturated = a.rhPercent >= 99 && b.rhPercent >= 99 && Math.abs(a.tempC - b.tempC) > 0.2;
  if (bothSaturated) {
    const steps = Math.max(8, Math.ceil(Math.abs(b.tempC - a.tempC) / 1.5));
    for (let j = 1; j <= steps; j += 1) {
      const t = a.tempC + (b.tempC - a.tempC) * (j / steps);
      const x = humidityRatioKgKg(t, 100) * 1000;
      parts.push(`L${px(x).toFixed(1)},${py(t).toFixed(1)}`);
    }
  } else {
    parts.push(`L${px(b.humidityRatioGkg).toFixed(1)},${py(b.tempC).toFixed(1)}`);
  }
  return parts.join(' ');
}

function buildStateSegments(points, px, py) {
  if (points.length < 2) return '';
  return points.slice(1).map((point, index) => `<path d="${buildSegmentPath(points[index], point, px, py)}" class="hx-state-path hx-state-path--${index % 5}"/>`).join('');
}

const HX_CHART = { w: 760, h: 520, padL: 58, padR: 22, padT: 22, padB: 48, xMax: 28, tMin: -18, tMax: 50 };
const hxPx = x => HX_CHART.padL + (Math.max(0, Math.min(HX_CHART.xMax, x)) / HX_CHART.xMax) * (HX_CHART.w - HX_CHART.padL - HX_CHART.padR);
const hxPy = t => HX_CHART.padT + ((HX_CHART.tMax - Math.max(HX_CHART.tMin, Math.min(HX_CHART.tMax, t))) / (HX_CHART.tMax - HX_CHART.tMin)) * (HX_CHART.h - HX_CHART.padT - HX_CHART.padB);

const STATIC_HX_BACKGROUND = (() => {
  const { w, h, padL, padR, padT, padB, xMax, tMin, tMax } = HX_CHART;
  const tempLines = [];
  for (let t = -15; t <= 50; t += 5) {
    tempLines.push(`<line x1="${padL}" y1="${hxPy(t)}" x2="${w - padR}" y2="${hxPy(t)}" class="hx-grid-line"/><text x="${padL - 10}" y="${hxPy(t) + 4}" class="hx-axis-label" text-anchor="end">${t}</text>`);
  }
  const xLines = [];
  for (let x = 0; x <= xMax; x += 2) {
    xLines.push(`<line x1="${hxPx(x)}" y1="${padT}" x2="${hxPx(x)}" y2="${h - padB}" class="hx-grid-line"/><text x="${hxPx(x)}" y="${h - padB + 20}" class="hx-axis-label" text-anchor="middle">${x}</text>`);
  }
  const rhCurves = [10, 20, 30, 40, 50, 60, 80, 100].map((rh, idx) => {
    const d = [];
    const curvePoints = [];
    for (let t = tMin; t <= tMax; t += 1) {
      const x = humidityRatioKgKg(t, rh) * 1000;
      if (x <= xMax) {
        curvePoints.push({ x, t });
        d.push(`${d.length ? 'L' : 'M'}${hxPx(x).toFixed(1)},${hxPy(t).toFixed(1)}`);
      }
    }
    const preferredT = { 10: 18, 20: 23, 30: 27, 40: 31, 50: 34, 60: 38, 80: 43, 100: 47 }[rh] ?? (18 + idx * 4);
    const safeRight = xMax - 0.9;
    let labelPoint = curvePoints.reduce((best, point) => {
      const inRange = point.x <= safeRight;
      const distance = Math.abs(point.t - preferredT) + (inRange ? 0 : 100);
      return !best || distance < best.distance ? { ...point, distance } : best;
    }, null);
    if (!labelPoint && curvePoints.length) labelPoint = curvePoints[curvePoints.length - 1];
    const labelX = labelPoint?.x ?? 0;
    const labelT = labelPoint?.t ?? preferredT;
    return `<path d="${d.join(' ')}" class="hx-rh hx-rh-${rh}"/><text x="${hxPx(labelX)}" y="${hxPy(labelT) - 4}" class="hx-rh-label">${rh}%</text>`;
  }).join('');
  return `<g>${tempLines.join('')}${xLines.join('')}</g><g>${rhCurves}</g>`;
})();

function renderHxSvg(points) {
  const { w, h } = HX_CHART;
  const px = hxPx;
  const py = hxPy;
  const segments = buildStateSegments(points, px, py);
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
    ${STATIC_HX_BACKGROUND}
    <g>${segments}</g>
    <g>${markers}</g>
    <text x="${w / 2}" y="${h - 12}" class="hx-title" text-anchor="middle">Feuchtegehalt x [g H₂O/kg tr. Luft]</text>
    <text x="16" y="${h / 2}" class="hx-title" transform="rotate(-90 16 ${h / 2})" text-anchor="middle">Trockenkugeltemperatur θt [°C]</text>
  </svg>`;
}

function hasCompleteInput(s) {
  return [s.tempC, s.rhPercent, s.targetTempC, s.targetRhPercent].every(value => String(value ?? '').trim() !== '');
}

function view(s) {
  const r = calculate(s);
  const activePath = (s.activePath?.length ? s.activePath : (hasCompleteInput(s) ? r.processPath : []));
  const body = `<div class="hx-layout">
    <div class="hx-layout__left">${stack([inputCard(s), resultCard(r, activePath), historyCard(s.processes ?? [], s.activeProcessId)].join(''))}</div>
    <div class="hx-layout__right">${chartCard(activePath, !activePath.length || r.targetReached)}</div>
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
      rootEl.querySelectorAll('[data-field]').forEach(el => {
        el.addEventListener('input', () => {
          state.set({ activePath: [], points: [] }, { notify: false });
        });
        el.addEventListener('change', () => {
          state.set({ activePath: [], points: [] }, { notify: false });
        });
      });

      rootEl.querySelectorAll('[data-segment="process"]').forEach(button => {
        button.addEventListener('click', () => {
          state.set({ process: button.dataset.value, activeProcessId: null, activePath: [], points: [] });
        });
      });

      rootEl.querySelectorAll('[data-hx-sign]').forEach(button => {
        button.addEventListener('click', () => {
          const id = button.dataset.hxSign;
          const input = rootEl.querySelector(`[data-field="${id}"]`);
          const next = toggleNumericSign(input?.value);
          state.set({ [id]: next, activeProcessId: null, activePath: [], points: [] });
        });
      });

      rootEl.querySelector('[data-hx-add]')?.addEventListener('click', () => {
        const s = { ...state.get(), activeProcessId: null };
        const result = calculate(s);
        const record = makeProcessRecord({ input: s, result });
        const processes = [record, ...(s.processes ?? [])];
        saveProcesses(processes);
        clearLegacyPoints();
        state.set({
          processes,
          activeProcessId: null,
          activePath: [],
          points: []
        });
      });

      rootEl.querySelector('[data-hx-update]')?.addEventListener('click', () => {
        const s = state.get();
        if (!s.activeProcessId) return;
        const existing = (s.processes ?? []).find(item => item.id === s.activeProcessId);
        if (!existing) return;
        const result = calculate(s);
        const record = makeProcessRecord({ input: { ...s, activeProcessId: existing.id }, result, id: existing.id, existing });
        const processes = (s.processes ?? []).map(item => item.id === existing.id ? record : item);
        saveProcesses(processes);
        clearLegacyPoints();
        state.set({
          processes,
          activeProcessId: record.id,
          activePath: record.path,
          points: []
        });
      });

      rootEl.querySelector('[data-hx-clear]')?.addEventListener('click', () => {
        clearLegacyPoints();
        state.set({
          label: '',
          tempC: '',
          rhPercent: '',
          targetTempC: '',
          targetRhPercent: '',
          activeProcessId: null,
          activePath: [],
          points: []
        });
      });

      rootEl.querySelectorAll('[data-hx-select-process]').forEach(row => {
        row.addEventListener('click', event => {
          if (event.target.closest('[data-hx-remove-process]')) return;
          const process = (state.get().processes ?? []).find(item => item.id === row.dataset.hxSelectProcess);
          if (!process) return;
          state.set({
            ...(process.input ?? {}),
            process: process.process || process.input?.process || 'heat',
            activeProcessId: process.id,
            activePath: process.path ?? []
          });
        });
      });

      rootEl.querySelectorAll('[data-hx-remove-process]').forEach(button => {
        button.addEventListener('click', event => {
          event.stopPropagation();
          const current = state.get();
          const processes = (current.processes ?? []).filter(process => process.id !== button.dataset.hxRemoveProcess);
          saveProcesses(processes);
          const wasActive = current.activeProcessId === button.dataset.hxRemoveProcess;
          state.set({
            processes,
            activeProcessId: wasActive ? null : current.activeProcessId,
            activePath: wasActive ? [] : current.activePath
          });
        });
      });
    };

    state.subscribe(render);
    render();
  }
};
