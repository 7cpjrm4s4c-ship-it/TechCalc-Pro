import config from './config.js';
import { PROCESS_OPTIONS, humidityRatioKgKg } from './logic.js';
import { createViewModel } from './viewModel.js';
import { renderResultCard } from './results.js';
import { hxProcessCard } from './controller.js';
import { card, field, renderModuleShell, stack, grid, esc, signedTempField } from '../../core/renderer.js';
import { fmtInput } from '../../utils/calculations.js';
import { parseNumber } from '../../core/numberService.js';

function availableProcesses(s) {
  const t0 = parseNumber(s.tempC, { fallback: 0 });
  const t1 = parseNumber(s.targetTempC, { fallback: 0 });
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
    `<div class="tc-actions"><button type="button" class="tc-action tc-action--ghost" data-hx-clear>Diagramm leeren</button></div>`
  ].join('')), 'cyan');
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
  for (let t = -15; t <= 50; t += 5) tempLines.push(`<line x1="${padL}" y1="${hxPy(t)}" x2="${w - padR}" y2="${hxPy(t)}" class="hx-grid-line"/><text x="${padL - 10}" y="${hxPy(t) + 4}" class="hx-axis-label" text-anchor="end">${t}</text>`);
  const xLines = [];
  for (let x = 0; x <= xMax; x += 2) xLines.push(`<line x1="${hxPx(x)}" y1="${padT}" x2="${hxPx(x)}" y2="${h - padB}" class="hx-grid-line"/><text x="${hxPx(x)}" y="${h - padB + 20}" class="hx-axis-label" text-anchor="middle">${x}</text>`);
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
  const segments = buildStateSegments(points, hxPx, hxPy);
  const markers = points.map((point, index) => {
    const cx = hxPx(point.humidityRatioGkg);
    const cy = hxPy(point.tempC);
    const nearRight = cx > w - 150;
    const labelX = nearRight ? cx - 10 : cx + 10;
    const anchor = nearRight ? 'end' : 'start';
    return `<g class="hx-point"><circle cx="${cx}" cy="${cy}" r="5"/><text x="${labelX}" y="${cy - 8}" text-anchor="${anchor}">${esc(index + 1)}</text></g>`;
  }).join('');
  return `<svg class="hx-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="h,x-Diagramm">
    <rect x="0" y="0" width="${w}" height="${h}" rx="18" class="hx-chart-bg"/>
    ${STATIC_HX_BACKGROUND}<g>${segments}</g><g>${markers}</g>
    <text x="${w / 2}" y="${h - 12}" class="hx-title" text-anchor="middle">Feuchtegehalt x [g H₂O/kg tr. Luft]</text>
    <text x="16" y="${h / 2}" class="hx-title" transform="rotate(-90 16 ${h / 2})" text-anchor="middle">Trockenkugeltemperatur θt [°C]</text>
  </svg>`;
}

function chartCard(activePath, targetReached = true) {
  const warning = targetReached ? '' : '<div class="hx-target-warning">Zielzustand wird nicht erreicht!</div>';
  return card('h,x-Diagramm', `<div class="hx-chart-wrap">${renderHxSvg(activePath)}</div>${warning}<div class="formula">Näherung bei Luftdruck 1.013 hPa · x horizontal · θt vertikal</div>`, 'cyan');
}

export function renderView(s) {
  const vm = createViewModel(s);
  const body = `<div class="hx-layout">
    <div class="hx-layout__left">${stack([inputCard(s), renderResultCard(vm), hxProcessCard(vm.state)].join(''))}</div>
    <div class="hx-layout__right">${chartCard(vm.activePath, vm.targetReached)}</div>
  </div>`;
  return renderModuleShell(config, `<div class="span-12">${body}</div>`);
}
