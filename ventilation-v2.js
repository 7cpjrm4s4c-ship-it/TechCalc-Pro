/* ═══════════════════════════════════════════════════════
   ventilation.js — PHASE 3 REFACTORED (v2)
   Mit UI.* Components statt inline HTML
   
   WICHTIG:
   - Berechnung: 100% UNVERÄNDERT
   - HTML: Neu mit UI.* Components
═══════════════════════════════════════════════════════ */
'use strict';

const CP_AIR = 1005;  // J/(kg·K)

const VENT_STATE = {
  mode: 'v',    // v, q, dt
  hk: 'h',      // h (Heizen), k (Kühlen)
  qUnit: 'W',   // W, kW
  V: 0,         // Volumenstrom m³/h
  Tzl: 0,       // Temperatur Zuluft
  Tr: 20,       // Referenz-Temperatur
  Q: 0,         // Leistung W
  dT: 0,        // Temperaturdifferenz
  results: {}
};

// Luftdichte nach idealer Gasgleichung
function rhoAir(t) {
  if (t <= -273.15) return NaN;
  return 353.05 / (t + 273.15);
}

function calcLuft() {
  const V = parseFloat(window.$('vent-v')?.value || 0);
  const Tzl_h = parseFloat(window.$('vent-tzl-h')?.value);
  const Tzl_k = parseFloat(window.$('vent-tzl-k')?.value);
  const Tr_h = parseFloat(window.$('vent-tr-h')?.value) || 20;
  const Tr_k = parseFloat(window.$('vent-tr-k')?.value) || 26;
  const Q_raw = parseFloat(window.$('vent-q-in')?.value || 0);

  const hk = VENT_STATE.hk;
  const Tzl = hk === 'h' ? Tzl_h : Tzl_k;
  const Tr = hk === 'h' ? Tr_h : Tr_k;
  const Q = VENT_STATE.qUnit === 'kW' ? Q_raw * 1000 : Q_raw;
  const mode = VENT_STATE.mode;

  let dT = NaN;
  if (!isNaN(Tzl) && Tzl > -273) {
    dT = hk === 'h' ? Tzl - Tr : Tr - Tzl;
  }

  const tRef = !isNaN(Tzl) && Tzl > -273 ? Tzl : 20;
  const rho = rhoAir(tRef);
  const fac = rho * CP_AIR / 3600;  // Wh/(m³·K)

  let result = { Q: 0, V: 0, dT: 0, m: 0, valid: false };

  if (mode === 'v' && Q > 0 && dT > 0) {
    result.V = Q / (fac * dT);
    result.Q = Q;
    result.dT = dT;
    result.m = (result.V / 3600) * rho;
    result.valid = true;
  } else if (mode === 'q' && V > 0 && dT > 0) {
    result.Q = V * fac * dT;
    result.V = V;
    result.dT = dT;
    result.m = V * rho;
    result.valid = true;
  } else if (mode === 'dt' && V > 0 && Q > 0) {
    result.dT = Q / (V * fac);
    result.Q = Q;
    result.V = V;
    result.m = V * rho;
    result.valid = true;
  }

  VENT_STATE.results = result;
  return result;
}

function buildVentilationUI() {
  let html = '';

  html += UI.SectionTitle('Lüftung Rechner');

  // Mode Selection
  html += UI.SectionTitle('Betriebsart', 'small');
  html += UI.SegmentControl('vent-mode', ['Volumenstrom', 'Leistung', 'Δt'], 0);

  // H/K Selection
  html += UI.SectionTitle('Funktion', 'small');
  html += UI.SegmentControl('vent-hk', ['Heizung', 'Kühlung'], 0);

  // Inputs
  html += UI.SectionTitle('Eingaben', 'small');

  html += UI.Card(
    UI.InputGroup('Volumenstrom', 'vent-v', 
      { type: 'number', unit: 'm³/h', value: 0, step: 100 }),
    'neutral'
  );

  html += UI.Card(
    UI.InputGroup('Temperatur Zuluft (H)', 'vent-tzl-h',
      { type: 'number', unit: '°C', value: 30, step: 0.1 }),
    'neutral'
  );

  html += UI.Card(
    UI.InputGroup('Temperatur Zuluft (K)', 'vent-tzl-k',
      { type: 'number', unit: '°C', value: 15, step: 0.1 }),
    'neutral'
  );

  html += UI.Card(
    UI.InputGroup('Referenz-Temperatur (H)', 'vent-tr-h',
      { type: 'number', unit: '°C', value: 20, step: 0.1 }),
    'neutral'
  );

  html += UI.Card(
    UI.InputGroup('Referenz-Temperatur (K)', 'vent-tr-k',
      { type: 'number', unit: '°C', value: 26, step: 0.1 }),
    'neutral'
  );

  // Power input
  html += UI.SectionTitle('Leistung', 'small');
  const unitLabel = VENT_STATE.qUnit === 'kW' ? 'kW' : 'W';
  html += UI.Card(
    UI.InputGroup('Leistung', 'vent-q-in',
      { type: 'number', unit: unitLabel, value: 0, step: VENT_STATE.qUnit === 'kW' ? 0.1 : 100 }),
    'neutral'
  );

  // Results
  html += UI.SectionTitle('Ergebnisse', 'small');
  html += UI.ResultCard('Volumenstrom', 0, 'm³/h', { id: 'vent-result-v' });
  html += UI.ResultCard('Leistung', 0, 'kW', { id: 'vent-result-q' });
  html += UI.ResultCard('Temperaturdifferenz', 0, 'K', { id: 'vent-result-dt' });
  html += UI.ResultCard('Massenstrom', 0, 'kg/s', { id: 'vent-result-m' });

  return html;
}

function updateVentilationResults() {
  const result = calcLuft();
  updateVentDisplay('vent-result-v', result.V, 'm³/h');
  updateVentDisplay('vent-result-q', result.Q / 1000, 'kW');
  updateVentDisplay('vent-result-dt', result.dT, 'K');
  updateVentDisplay('vent-result-m', result.m, 'kg/s');
}

function updateVentDisplay(elementId, value, unit) {
  const el = window.$(elementId);
  if (!el) return;
  const valueEl = el.querySelector('.result-card__value');
  if (valueEl) {
    valueEl.textContent = value > 0 ? window.loc(value, 2) : '–';
  }
}

function initVentilation() {
  const container = window.$('vent-section');
  if (!container) return;

  container.innerHTML = buildVentilationUI();

  // Listeners
  ['vent-v', 'vent-tzl-h', 'vent-tzl-k', 'vent-tr-h', 'vent-tr-k', 'vent-q-in'].forEach(id => {
    const el = window.$(id);
    if (el) {
      el.addEventListener('input', updateVentilationResults);
      el.addEventListener('change', updateVentilationResults);
    }
  });

  const modeControl = window.$('vent-mode');
  if (modeControl) {
    modeControl.addEventListener('change', (e) => {
      VENT_STATE.mode = ['v', 'q', 'dt'][e.target.selectedIndex || 0];
      updateVentilationResults();
    });
  }

  const hkControl = window.$('vent-hk');
  if (hkControl) {
    hkControl.addEventListener('change', (e) => {
      VENT_STATE.hk = e.target.selectedIndex === 0 ? 'h' : 'k';
      updateVentilationResults();
    });
  }

  console.log('✅ Ventilation v2 initialized');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVentilation);
} else {
  initVentilation();
}

window.calcLuft = calcLuft;
