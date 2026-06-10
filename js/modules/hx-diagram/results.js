import { esc } from '../../core/renderer.js';
import { renderResultModel } from '../../platform/resultRenderer/index.js';

export function hxFmt(value, decimals = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('de-DE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function pointRows(point = {}) {
  return [
    { label: 'Temperatur θt', value: hxFmt(point?.tempC, 2), unit: '°C' },
    { label: 'rel. Feuchte φ', value: hxFmt(point?.rhPercent, 0), unit: '%' },
    { label: 'Feuchtegehalt x', value: hxFmt(point?.humidityRatioGkg, 2), unit: 'g/kg' },
    { label: 'Enthalpie h', value: hxFmt(point?.enthalpyKjKg, 2), unit: 'kJ/kg' },
    { label: 'Dichte ρ', value: hxFmt(point?.densityKgm3, 3), unit: 'kg/m³' },
    { label: 'Taupunkt θp', value: hxFmt(point?.dewPointC, 2), unit: '°C' }
  ];
}

function processPathHtml(points = []) {
  return `<div class="hx-process-path">${points.map((point, index) => `<div class="hx-process-step">
    <strong>${esc(point.label || `Punkt ${index + 1}`)}</strong>
    <span><b>θt</b>${hxFmt(point.tempC, 2)} °C</span>
    <span><b>φ</b>${hxFmt(point.rhPercent, 0)} %</span>
    <span><b>x</b>${hxFmt(point.humidityRatioGkg, 2)} g/kg</span>
    <span><b>h</b>${hxFmt(point.enthalpyKjKg, 2)} kJ/kg</span>
  </div>`).join('')}</div>`;
}

export function buildHxResultModel(vm = {}, accent = 'cyan') {
  const r = vm.result || {};
  const activePath = Array.isArray(vm.activePath) ? vm.activePath : [];

  if (!activePath.length) {
    return {
      groups: [{
        title: 'Automatische Zustandsänderung',
        html: '<div class="empty-state">Zustandsänderung wählen oder gespeicherten Prozess auswählen</div>',
        accent
      }]
    };
  }

  const start = activePath[0];
  const end = activePath[activePath.length - 1];
  const targetReached = vm.targetReached !== false;
  const notices = targetReached ? [] : [{
    title: 'Plausibilität',
    messages: ['Zielzustand wird mit dem gewählten Prozess nicht erreicht.'],
    prefix: 'Hinweis',
    accent
  }];

  return {
    primary: {
      title: 'Automatische Zustandsänderung',
      primary: { label: 'Prozess', value: r.changeType || '—', unit: '' },
      rows: [
        { label: 'Δθ', value: hxFmt(r.delta?.tempK, 2), unit: 'K' },
        { label: 'Δx', value: hxFmt(r.delta?.humidityGkg, 2), unit: 'g/kg' },
        { label: 'Δh', value: hxFmt(r.delta?.enthalpyKjKg, 2), unit: 'kJ/kg' },
        { label: 'Δφ', value: hxFmt(r.delta?.rhPercent, 0), unit: '%' }
      ],
      accent
    },
    groups: [
      {
        title: 'Berechnete Zustandspunkte',
        html: processPathHtml(activePath),
        accent
      },
      {
        title: 'Ausgang',
        rows: pointRows(start),
        accent
      },
      {
        title: 'Ziel',
        rows: pointRows(end),
        accent
      }
    ],
    notices
  };
}

export function renderHxResultModel(vm = {}, accent = 'cyan') {
  return renderResultModel(vm.resultModel || buildHxResultModel(vm, accent), accent);
}

export function buildHxProcessRecord(currentState = {}, result = {}, items = [], id = null, name = '', existing = null) {
  const recordId = id || currentState.activeProcessId || existing?.id;
  const processPath = Array.isArray(result.processPath) ? result.processPath : [];
  return {
    id: recordId,
    name: String(name || currentState.label || existing?.name || existing?.label || `h,x-Prozess ${items.length + 1}`),
    label: String(name || currentState.label || existing?.label || existing?.name || `h,x-Prozess ${items.length + 1}`),
    process: result.selectedProcess || currentState.process || existing?.process || 'heat',
    processLabel: result.changeType || existing?.processLabel || 'Prozess',
    input: {
      label: String(name || currentState.label || existing?.input?.label || ''),
      tempC: String(currentState.tempC ?? ''),
      rhPercent: String(currentState.rhPercent ?? ''),
      targetTempC: String(currentState.targetTempC ?? ''),
      targetRhPercent: String(currentState.targetRhPercent ?? ''),
      process: result.selectedProcess || currentState.process || existing?.input?.process || 'heat'
    },
    path: processPath,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function hxProcessStats(item = {}) {
  const path = Array.isArray(item.path) ? item.path : [];
  const first = path[0] || null;
  const last = path[path.length - 1] || null;
  return [
    { label: 'Prozess', value: item.processLabel || item.process || '—' },
    { label: 'Punkte', value: path.length || '—' },
    { label: 'Start', value: first ? `${hxFmt(first.tempC, 2)} °C / ${hxFmt(first.rhPercent, 0)} %` : '—' },
    { label: 'Ziel', value: last ? `${hxFmt(last.tempC, 2)} °C / ${hxFmt(last.rhPercent, 0)} %` : '—' },
    { label: 'x Ziel', value: last ? hxFmt(last.humidityRatioGkg, 2) : '—', unit: last ? 'g/kg' : '' },
    { label: 'h Ziel', value: last ? hxFmt(last.enthalpyKjKg, 2) : '—', unit: last ? 'kJ/kg' : '' }
  ];
}
