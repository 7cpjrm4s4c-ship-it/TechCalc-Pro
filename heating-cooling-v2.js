/* ═══════════════════════════════════════════════════════
   heating-cooling.js — PHASE 3 REFACTORED (v2)
   Mit UI.* Components statt inline HTML
   
   WICHTIG:
   - Berechnung: 100% UNVERÄNDERT
   - HTML: Neu mit UI.* Components
   - CSS: ui-styles.css Klassen
   - Dependencies: window.UI, window.$, window.loc
═══════════════════════════════════════════════════════ */
'use strict';

// ─────────────────────────────────────────
// DATA (100% Original — UNVERÄNDERT)
// ─────────────────────────────────────────

const FL = {
  water: { cp:4.180, rho:998,  frost:null, label:'Wasser' },
  eg25:  { cp:3.870, rho:1032, frost:'bis −12°C', label:'Ethylenglykol 25%' },
  eg30:  { cp:3.740, rho:1038, frost:'bis −16°C', label:'Ethylenglykol 30%' },
  eg35:  { cp:3.620, rho:1044, frost:'bis −21°C', label:'Ethylenglykol 35%' },
  pg25:  { cp:3.870, rho:1024, frost:'bis −10°C', label:'Propylenglykol 25%' },
  pg30:  { cp:3.740, rho:1030, frost:'bis −13°C', label:'Propylenglykol 30%' },
  pg35:  { cp:3.610, rho:1037, frost:'bis −18°C', label:'Propylenglykol 35%' },
};

const PIPES = [
  [ 15,  16.1, 21.3, 2.60, 'DIN EN 10255',  16.0,  18.0, 1.0],
  [ 20,  21.6, 26.9, 2.65, 'DIN EN 10255',  19.6,  22.0, 1.2],
  [ 25,  27.2, 33.7, 3.25, 'DIN EN 10255',  25.6,  28.0, 1.2],
  [ 32,  35.9, 42.4, 3.25, 'DIN EN 10255',  32.0,  35.0, 1.5],
  [ 40,  41.8, 48.3, 3.25, 'DIN EN 10255',  39.0,  42.0, 1.5],
  [ 50,  53.0, 60.3, 3.65, 'DIN EN 10255',  51.0,  54.0, 1.5],
  [ 65,  69.6, 76.1, 3.25, 'DIN EN 10220',  72.1,  76.1, 2.0],
  [ 80,  82.5, 88.9, 3.20, 'DIN EN 10220',  84.9,  88.9, 2.0],
  [100, 107.1,114.3, 3.60, 'DIN EN 10220', 104.0, 108.0, 2.0],
  [125, 131.7,139.7, 4.00, 'DIN EN 10220',  null,  null, null],
  [150, 155.8,168.3, 4.50, 'DIN EN 10220',  null,  null, null],
  [200, 203.1,219.1, 8.00, 'DIN EN 10220',  null,  null, null],
  [250, 254.5,273.0, 8.80, 'DIN EN 10220',  null,  null, null],
  [300, 303.1,323.9, 9.50, 'DIN EN 10220',  null,  null, null],
];

const RHO = 983.2;
const NU  = 0.474e-6;
const ES  = 0.046e-3;
const EM  = 0.015e-3;
const DP0 = 100;
const MAPRESS_MAX_DN = 100;

const HCState = {
  Q: 0,
  dT: 0,
  m: 0,
  fluid: 'water',
  mode: 'q-dt', // q-dt, m-dt, q-m
  vol: 0,
  pMax: 100,
};

// ─────────────────────────────────────────
// CALCULATIONS (100% Original — UNVERÄNDERT)
// ─────────────────────────────────────────

function lambdaCW(Re, eps, D) {
  if (Re < 1e-9) return 0;
  if (Re < 2300) return 64 / Re;
  let l = 0.25 / Math.pow(Math.log10(eps / (3.7 * D) + 5.74 / Math.pow(Re, 0.9)), 2);
  for (let i = 0; i < 60; i++) {
    const n = Math.pow(-2 * Math.log10(eps / (3.71 * D) + 2.51 / (Re * Math.sqrt(l))), -2);
    if (Math.abs(n - l) < 1e-11) { l = n; break; }
    l = n;
  }
  return l;
}

function pdrop(vol, diMm, eps) {
  if (!vol || !diMm) return { dp: 0, v: 0, Re: 0 };
  const D  = diMm / 1e3;
  const A  = Math.PI * D * D / 4;
  const v  = (vol / 3600) / A;
  const Re = v * D / NU;
  return { dp: lambdaCW(Re, eps, D) * RHO * v * v / (2 * D), v, Re };
}

function hcCalc() {
  const fl = FL[HCState.fluid];
  const Q = parseFloat(window.$('hc-q')?.value || 0);
  const dT = parseFloat(window.$('hc-dt')?.value || 0);
  const m = parseFloat(window.$('hc-m')?.value || 0);

  let vol = 0;
  if (HCState.mode === 'q-dt' && Q && dT) {
    HCState.m = Q / (fl.cp * dT);
    vol = (HCState.m / fl.rho) * 3600;
  } else if (HCState.mode === 'm-dt' && m && dT) {
    HCState.Q = m * fl.cp * dT;
    vol = (m / fl.rho) * 3600;
  } else if (HCState.mode === 'q-m' && Q && m) {
    HCState.dT = Q / (m * fl.cp);
    vol = (m / fl.rho) * 3600;
  }

  HCState.Q = Q;
  HCState.dT = dT;
  HCState.m = m;
  HCState.vol = vol;

  return { Q: HCState.Q, dT: HCState.dT, m: HCState.m, vol };
}

// ─────────────────────────────────────────
// UI RENDERING (NEW with UI.* Components)
// ─────────────────────────────────────────

function buildHeatingCoolingUI() {
  let html = '';

  // Title
  html += UI.SectionTitle('Heizung · Kälte Rechner');

  // Fluid Selection
  html += UI.SectionTitle('Fluid', 'small');
  const fluidLabels = Object.keys(FL).map(k => FL[k].label);
  html += UI.SegmentControl('hc-fluid', fluidLabels, 0);

  // Mode Selection (Q-ΔT, m-ΔT, Q-m)
  html += UI.SectionTitle('Berechnungsmodus', 'small');
  html += UI.SegmentControl('hc-mode', ['Q − ΔT', 'm − ΔT', 'Q − m'], 0);

  // Inputs Section
  html += UI.SectionTitle('Eingabe', 'small');

  html += UI.Card(
    UI.InputGroup('Leistung', 'hc-q', { type: 'number', unit: 'kW', value: 0 }),
    'neutral'
  );

  html += UI.Card(
    UI.InputGroup('Massenstrom', 'hc-m', { type: 'number', unit: 'kg/s', value: 0 }),
    'neutral'
  );

  html += UI.Card(
    UI.InputGroup('Temperaturdifferenz', 'hc-dt', { type: 'number', unit: 'K', value: 0 }),
    'neutral'
  );

  // Results Section
  html += UI.SectionTitle('Ergebnisse', 'small');

  html += UI.ResultCard('Leistung', 0, 'kW', { id: 'hc-result-q' });
  html += UI.ResultCard('Massenstrom', 0, 'kg/s', { id: 'hc-result-m' });
  html += UI.ResultCard('Temperaturdifferenz', 0, 'K', { id: 'hc-result-dt' });
  html += UI.ResultCard('Volumenstrom', 0, 'm³/h', { id: 'hc-result-vol' });

  // Pipe Sizing Section
  html += UI.SectionTitle('Rohr-Dimensionierung', 'small');

  html += UI.Card(
    UI.InputGroup('Max. Druckabfall', 'hc-pmax', { type: 'number', unit: 'Pa/m', value: 100 }),
    'neutral'
  );

  html += '<div id="hc-pipe-results"></div>';

  return html;
}

function updateHeatingCoolingResults() {
  const result = hcCalc();

  // Update results
  updateResultDisplay('hc-result-q', result.Q, 'kW');
  updateResultDisplay('hc-result-m', result.m, 'kg/s');
  updateResultDisplay('hc-result-dt', result.dT, 'K');
  updateResultDisplay('hc-result-vol', result.vol, 'm³/h');

  // Update pipe sizing
  updatePipeSizing();
}

function updateResultDisplay(elementId, value, unit) {
  const el = window.$(elementId);
  if (!el) return;

  const valueEl = el.querySelector('.result-card__value');
  if (valueEl) {
    valueEl.textContent = value ? window.loc(value, 2) : '–';
  }
}

function updatePipeSizing() {
  const pMaxEl = window.$('hc-pmax');
  const pMax = parseFloat(pMaxEl?.value || 100);
  const resultsEl = window.$('hc-pipe-results');
  
  if (!resultsEl || !HCState.vol) {
    resultsEl.innerHTML = '<p style="color: var(--t3); text-align: center; padding: 12px;">Eingaben erforderlich</p>';
    return;
  }

  // Render pipe options (simplified with UI components)
  let html = '<div style="display: grid; gap: 8px;">';
  
  const bS = PIPES.findIndex(p => pdrop(HCState.vol, p[1], ES).dp <= pMax);
  const bestPipe = PIPES[bS >= 0 ? bS : PIPES.length - 1];
  const { dp, v } = pdrop(HCState.vol, bestPipe[1], ES);

  html += UI.Card(
    `<strong>Empfohlenes Rohr:</strong><br/>
     DN ${bestPipe[0]} (Ø ${bestPipe[2]} × ${bestPipe[3]} mm)<br/>
     Δp/m: ${window.loc(dp, 1)} Pa/m | v: ${window.loc(v, 2)} m/s`,
    'neutral'
  );

  html += '</div>';
  resultsEl.innerHTML = html;
}

// ─────────────────────────────────────────
// EVENT HANDLERS
// ─────────────────────────────────────────

function hcOnModeChange(modeIndex) {
  HCState.mode = ['q-dt', 'm-dt', 'q-m'][modeIndex];
  updateHeatingCoolingResults();
}

function hcOnFluidChange(fluidIndex) {
  HCState.fluid = Object.keys(FL)[fluidIndex];
  updateHeatingCoolingResults();
}

function hcOnInput() {
  updateHeatingCoolingResults();
}

// ─────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────

function initHeatingCooling() {
  const container = window.$('hc-section');
  if (!container) return;

  container.innerHTML = buildHeatingCoolingUI();

  // Attach event listeners
  ['hc-q', 'hc-m', 'hc-dt', 'hc-pmax'].forEach(id => {
    const el = window.$(id);
    if (el) {
      el.addEventListener('input', hcOnInput);
      el.addEventListener('change', hcOnInput);
    }
  });

  const modeControl = window.$('hc-mode');
  if (modeControl) {
    modeControl.addEventListener('change', (e) => {
      hcOnModeChange(e.target.selectedIndex || 0);
    });
  }

  const fluidControl = window.$('hc-fluid');
  if (fluidControl) {
    fluidControl.addEventListener('change', (e) => {
      hcOnFluidChange(e.target.selectedIndex || 0);
    });
  }

  console.log('✅ Heating-Cooling v2 initialized');
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeatingCooling);
} else {
  initHeatingCooling();
}

// Export for testing
window.hcCalc = hcCalc;
window.hcOnInput = hcOnInput;
