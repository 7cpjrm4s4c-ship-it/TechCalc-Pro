import config from './config.js';
import { state, saveProcesses, makeProcessRecord, clearLegacyPoints } from './state.js';
import { calculate, calculatePoint, humidityRatioKgKg, PROCESS_OPTIONS } from './logic.js';
import { card, field, renderModuleShell, bindCommonInputs, stack, grid, inlineStats, mainResult, segmented, esc } from '../../core/renderer.js';
import { fmt, fmtInput } from '../../utils/calculations.js';

function hxFmt(value, decimals = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('de-DE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
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
      signedTempField('tempC', 'Trockenkugeltemperatur θt', fmtInput(s.tempC, 2)),
      field({ id: 'rhPercent', label: 'Relative Feuchte φ', unit: '%', value: fmtInput(s.rhPercent, 2) })
    ].join(''), 2), 'cyan', { compact: true }),
    card('Zielzustand', grid([
      signedTempField('targetTempC', 'Zieltemperatur θt', fmtInput(s.targetTempC, 2)),
      field({ id: 'targetRhPercent', label: 'Relative Zielfeuchte φ', unit: '%', value: fmtInput(s.targetRhPercent, 2) })
    ].join(''), 2), 'cyan', { compact: true }),
    processCard(s),
    `<div class="tc-actions">${actionButton('Prozess speichern', 'data-hx-add')} ${actionButton('Diagramm leeren', 'data-hx-clear', 'tc-action--ghost')}</div>`
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
        <button type="button" class="mini-button mini-button--text" data-hx-remove-process="${esc(process.id)}" aria-label="Prozess entfernen">Entfernen</button>
      </div>`;
    }).join('')}
  </div>` : '<div class="empty-state">Noch keine Prozesse gespeichert</div>';
  return card('Gespeicherte Prozesse', body, 'cyan');
}

function chartCard(activePath, targetReached = true) {
  const warning = targetReached ? '' : '<div class="hx-target-warning">Zielzustand wird nicht erreicht!</div>';
  return card('h,x-Diagramm', `<div class="hx-chart-wrap">${renderHxSvg(activePath)}</div>${warning}<div class="formula">Näherung bei Luftdruck 1.013 hPa · x horizontal · θt vertikal</div>`, 'cyan');
}


function buildStatePath(points, px, py) {
  if (!points.length) return '';
  const parts = [`M${px(points[0].humidityRatioGkg).toFixed(1)},${py(points[0].tempC).toFixed(1)}`];
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
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
  }
  return parts.join(' ');
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

  const rhCurves = [10, 20, 30, 40, 50, 60, 80, 100].map((rh, idx) => {
    const d = [];
    for (let t = tMin; t <= tMax; t += 1) {
      const x = humidityRatioKgKg(t, rh) * 1000;
      if (x <= xMax) d.push(`${d.length ? 'L' : 'M'}${px(x).toFixed(1)},${py(t).toFixed(1)}`);
    }
    const labelT = Math.min(46, 18 + idx * 4);
    const labelX = Math.min(xMax - 0.8, humidityRatioKgKg(labelT, rh) * 1000);
    return `<path d="${d.join(' ')}" class="hx-rh hx-rh-${rh}"/><text x="${px(labelX)}" y="${py(labelT) - 4}" class="hx-rh-label">${rh}%</text>`;
  }).join('');

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
    <g>${tempLines.join('')}${xLines.join('')}</g>
    <g>${rhCurves}</g>
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
      rootEl.querySelectorAll('[data-field]').forEach(el => {
        el.addEventListener('change', () => {
          state.set({ activeProcessId: null, activePath: [], points: [] });
        });
        el.addEventListener('blur', () => {
          state.set({ activeProcessId: null, activePath: [], points: [] });
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
        const s = state.get();
        const result = calculate(s);
        const record = makeProcessRecord({ input: s, result });
        const processes = [...(s.processes ?? []).filter(item => item.id !== record.id), record];
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
