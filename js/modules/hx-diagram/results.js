import { card, stack, inlineStats, mainResult, esc } from '../../core/renderer.js';

export function hxFmt(value, decimals = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('de-DE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function readonlyStateCard(title, point) {
  return card(title, inlineStats([
    { label: 'Temperatur θt', value: hxFmt(point?.tempC, 2), unit: '°C' },
    { label: 'rel. Feuchte φ', value: hxFmt(point?.rhPercent, 0), unit: '%' },
    { label: 'Feuchtegehalt x', value: hxFmt(point?.humidityRatioGkg, 2), unit: 'g/kg' },
    { label: 'Enthalpie h', value: hxFmt(point?.enthalpyKjKg, 2), unit: 'kJ/kg' },
    { label: 'Dichte ρ', value: hxFmt(point?.densityKgm3, 3), unit: 'kg/m³' },
    { label: 'Taupunkt θp', value: hxFmt(point?.dewPointC, 2), unit: '°C' }
  ]), 'cyan');
}

export function processPathCard(points = []) {
  const rows = points.map((point, index) => `<div class="hx-process-step">
    <strong>${esc(point.label || `Punkt ${index + 1}`)}</strong>
    <span><b>θt</b>${hxFmt(point.tempC, 2)} °C</span>
    <span><b>φ</b>${hxFmt(point.rhPercent, 0)} %</span>
    <span><b>x</b>${hxFmt(point.humidityRatioGkg, 2)} g/kg</span>
    <span><b>h</b>${hxFmt(point.enthalpyKjKg, 2)} kJ/kg</span>
  </div>`).join('');
  return card('Berechnete Zustandspunkte', `<div class="hx-process-path">${rows}</div>`, 'cyan');
}

export function renderResultCard(vm) {
  const r = vm.result;
  const activePath = vm.activePath || [];
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
    processPathCard(activePath),
    `<div class="hx-state-grid">${readonlyStateCard('Ausgang', activePath[0])}${readonlyStateCard('Ziel', activePath[activePath.length - 1])}</div>`
  ].join(''));
}
