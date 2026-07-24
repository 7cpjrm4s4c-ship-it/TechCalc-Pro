import { esc } from '../../core/renderer.js';
import { renderResultModel } from '../../platform/resultRenderer/index.js';
import { parseNumber } from '../../core/numberService.js';

const WATER_HEAT_CAPACITY_KJ_KGK = 4.19;
const STEAM_HEAT_KJ_KG = 2501;
const MIN_COIL_APPROACH_K = 3;
const HUMIDITY_RATIO_EPSILON = 1e-7;
const AIR_VOLUMETRIC_HEAT_CAPACITY_WH_M3K = 0.34;

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

function validNumber(value) {
  return String(value ?? '').trim() !== '' ? parseNumber(value, { fallback: Number.NaN }) : Number.NaN;
}

function waterFlowM3h(powerKw, supplyTempC, returnTempC) {
  const deltaK = Math.abs(validNumber(supplyTempC) - validNumber(returnTempC));
  if (!(powerKw > 0) || !(deltaK > 0)) return Number.NaN;
  return (powerKw / (WATER_HEAT_CAPACITY_KJ_KGK * deltaK)) * 3.6;
}

function segmentRole(process, index, pathLength) {
  if (process === 'adiabatic') {
    if (index === 1) return 'preheater';
    if (index === pathLength - 1) return 'reheater';
  }
  if (process === 'cool-dehumidify' && index === pathLength - 1) return 'reheater';
  return 'heater';
}

function sensibleHeatingPowerKw(volumeM3h, previous, current) {
  const deltaTempK = current.tempC - previous.tempC;
  if (!(volumeM3h > 0) || !(deltaTempK > 0)) return 0;
  return (volumeM3h * AIR_VOLUMETRIC_HEAT_CAPACITY_WH_M3K * deltaTempK) / 1000;
}

function equipmentSizing(state = {}, path = [], process = '') {
  const volumeM3h = validNumber(state.airVolumeM3h);
  const start = path[0];
  if (!(volumeM3h > 0) || !start) return { rows: [], messages: [] };

  const dryAirMassKgS = (volumeM3h / 3600) * start.densityKgm3 / (1 + start.humidityRatio);
  const heatingSupplyTempC = validNumber(state.heatingSupplyTempC);
  const coolingSupplyTempC = validNumber(state.coolingSupplyTempC);
  let heatingKw = 0;
  let preheaterKw = 0;
  let reheaterKw = 0;
  let coolingKw = 0;
  let humidifierKgH = 0;
  const messages = [];

  for (let index = 1; index < path.length; index += 1) {
    const previous = path[index - 1];
    const current = path[index];
    const deltaH = current.enthalpyKjKg - previous.enthalpyKjKg;
    const deltaW = current.humidityRatio - previous.humidityRatio;
    const isSensibleHeating = current.tempC > previous.tempC && Math.abs(deltaW) <= HUMIDITY_RATIO_EPSILON;

    if (isSensibleHeating) {
      const segmentPowerKw = sensibleHeatingPowerKw(volumeM3h, previous, current);
      heatingKw += segmentPowerKw;
      const role = segmentRole(process, index, path.length);
      if (role === 'preheater') preheaterKw += segmentPowerKw;
      if (role === 'reheater') reheaterKw += segmentPowerKw;
      if (Number.isFinite(heatingSupplyTempC) && heatingSupplyTempC < current.tempC + MIN_COIL_APPROACH_K) {
        messages.push(`${current.label || `Heizregister ${index}`}: Heizungs-Vorlauftemperatur muss mindestens ${hxFmt(current.tempC + MIN_COIL_APPROACH_K, 1)} °C betragen (${MIN_COIL_APPROACH_K} K über der Lufttemperatur).`);
      }
    }

    if (deltaH < 0) {
      const segmentPowerKw = dryAirMassKgS * Math.abs(deltaH);
      coolingKw += segmentPowerKw;
      if (Number.isFinite(coolingSupplyTempC) && coolingSupplyTempC > current.tempC - MIN_COIL_APPROACH_K) {
        messages.push(`${current.label || `Kühlregister ${index}`}: Kühlungs-Vorlauftemperatur darf höchstens ${hxFmt(current.tempC - MIN_COIL_APPROACH_K, 1)} °C betragen (${MIN_COIL_APPROACH_K} K unter der Lufttemperatur). Die Systemtemperatur ist für den gewünschten Zielzustand nicht ausreichend.`);
      }
    }

    if (deltaW > 0) humidifierKgH += dryAirMassKgS * deltaW * 3600;
  }

  const rows = [
    { label: 'Luftmenge', value: hxFmt(volumeM3h, 0), unit: 'm³/h' },
    { label: 'Trockenluft-Massenstrom', value: hxFmt(dryAirMassKgS, 3), unit: 'kg/s' }
  ];

  if (process === 'adiabatic') {
    rows.push(
      { label: 'Vorerhitzerleistung', value: hxFmt(preheaterKw, 2), unit: 'kW' },
      { label: 'Nacherhitzerleistung', value: hxFmt(reheaterKw, 2), unit: 'kW' }
    );
  } else {
    rows.push({ label: 'Erhitzerleistung', value: hxFmt(heatingKw, 2), unit: 'kW' });
  }

  rows.push(
    { label: 'Kühlerleistung', value: hxFmt(coolingKw, 2), unit: 'kW' },
    { label: 'Befeuchterleistung', value: hxFmt(humidifierKgH, 2), unit: 'kg/h' },
    { label: 'Dampfleistung äquivalent', value: hxFmt((humidifierKgH / 3600) * STEAM_HEAT_KJ_KG, 2), unit: 'kW' }
  );

  const heatingWater = waterFlowM3h(heatingKw, state.heatingSupplyTempC, state.heatingReturnTempC);
  const coolingWater = waterFlowM3h(coolingKw, state.coolingSupplyTempC, state.coolingReturnTempC);
  if (Number.isFinite(heatingWater)) rows.push({ label: 'Heizwasser-Volumenstrom', value: hxFmt(heatingWater, 3), unit: 'm³/h' });
  if (Number.isFinite(coolingWater)) rows.push({ label: 'Kühlwasser-Volumenstrom', value: hxFmt(coolingWater, 3), unit: 'm³/h' });
  return { rows, messages: [...new Set(messages)] };
}

export function buildHxResultModel(vm = {}, accent = 'cyan') {
  const r = vm.result || {};
  const activePath = Array.isArray(vm.activePath) ? vm.activePath : [];

  if (!activePath.length) {
    return { groups: [{ title: 'Automatische Zustandsänderung', html: '<div class="empty-state">Zustandsänderung wählen oder gespeicherten Prozess auswählen</div>', accent }] };
  }

  const start = activePath[0];
  const end = activePath[activePath.length - 1];
  const targetReached = vm.targetReached !== false;
  const notices = targetReached ? [] : [{ title: 'Plausibilität', messages: ['Zielzustand wird mit dem gewählten Prozess nicht erreicht.'], prefix: 'Hinweis', accent }];
  const groups = [
    { title: 'Berechnete Zustandspunkte', html: processPathHtml(activePath), accent },
    { title: 'Ausgang', rows: pointRows(start), accent },
    { title: 'Ziel', rows: pointRows(end), accent }
  ];
  const sizing = equipmentSizing(vm.state, activePath, r.selectedProcess || vm.state?.process || '');
  if (sizing.rows.length) groups.unshift({ title: 'Erhitzer, Kühler und Befeuchter', rows: sizing.rows, accent });
  if (sizing.messages.length) notices.push({ title: 'Systemtemperaturen', messages: sizing.messages, prefix: 'Hinweis', accent });

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
    groups,
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
      airVolumeM3h: String(currentState.airVolumeM3h ?? ''),
      tempC: String(currentState.tempC ?? ''),
      rhPercent: String(currentState.rhPercent ?? ''),
      targetTempC: String(currentState.targetTempC ?? ''),
      targetRhPercent: String(currentState.targetRhPercent ?? ''),
      heatingSupplyTempC: String(currentState.heatingSupplyTempC ?? ''),
      heatingReturnTempC: String(currentState.heatingReturnTempC ?? ''),
      coolingSupplyTempC: String(currentState.coolingSupplyTempC ?? ''),
      coolingReturnTempC: String(currentState.coolingReturnTempC ?? ''),
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