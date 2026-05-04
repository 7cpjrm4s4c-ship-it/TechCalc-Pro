/**
 * TechCalc Pro - Heating-Cooling Module v2 (FIXED)
 * Phase 3: Refactored with correct Phase 1 UI-Components interface
 * 
 * Berechnung: Rohrdimensionierung, Druckverlust, Leistung
 * UI: Phase 1 UI.* Components (korrekter Format)
 */

// ════════════════════════════════════════════════════════════════
// BERECHNUNGEN (100% unverändert von Original)
// ════════════════════════════════════════════════════════════════

function lambdaCW(Re, rr) {
  if (Re < 2300) return 64 / Re;
  let x = Math.log10(rr / 3.71 + 5.74 / Math.pow(Re, 0.9)) * (-2);
  return Math.pow(10, x);
}

function pdrop(lam, l, d, rho, v) {
  if (d <= 0 || v <= 0) return 0;
  return lam * (l / d) * (rho * v * v) / 2 / 100000;
}

function hcCalc() {
  // Input values
  let q = window.parseNum(window.$('hc-q')?.value) || 0;
  let dt = window.parseNum(window.$('hc-dt')?.value) || 1;
  let m = window.parseNum(window.$('hc-m')?.value) || 0;

  // Nullcheck
  if (q <= 0 || dt <= 0 || m <= 0) {
    window.$('hc-pdrop')?.innerHTML || (window.$('hc-pdrop').innerHTML = '–');
    window.$('hc-v')?.innerHTML || (window.$('hc-v').innerHTML = '–');
    window.$('hc-d')?.innerHTML || (window.$('hc-d').innerHTML = '–');
    return;
  }

  // Leistungsberechnung
  let qCheck = (m * 4.187 * dt) / 3600;
  
  // Rohrdimensionierung (Richtwert: 0.5 - 1.5 m/s)
  let d = Math.sqrt((4 * m) / (1000 * 3.14159 * 1.0)) * 1000;
  let v = (m / 1000) / (3.14159 * Math.pow(d / 1000, 2) / 4);

  // Druckverlust (L=10m, rho=1000 kg/m³)
  let Re = (v * (d / 1000)) / 0.001;
  let lam = lambdaCW(Re, 0.045 / d);
  let pv = pdrop(lam, 10, d / 1000, 1000, v);

  // Output
  window.$('hc-pdrop').innerHTML = window.loc(pv, 3);
  window.$('hc-v').innerHTML = window.loc(v, 2);
  window.$('hc-d').innerHTML = window.loc(d, 1);
}

// ════════════════════════════════════════════════════════════════
// UI AUFBAU (mit korrektem Phase 1 UI-Components Interface)
// ════════════════════════════════════════════════════════════════

function buildHeatingCoolingUI() {
  const container = window.$('hc-section');
  if (!container) {
    console.warn('⚠️  hc-section not found');
    return;
  }

  // Title
  const title = UI.SectionTitle('Heizung / Kälte');

  // Input Group: Leistung
  const inputQ = UI.InputGroup('Leistung (kW)', 'hc-q', {
    value: 100,
    min: 1,
    max: 1000,
    step: 10,
    unit: 'kW'
  });

  // Input Group: Temperaturdifferenz
  const inputDT = UI.InputGroup('Temperaturdifferenz (K)', 'hc-dt', {
    value: 10,
    min: 1,
    max: 50,
    step: 1,
    unit: 'K'
  });

  // Input Group: Massenstrom
  const inputM = UI.InputGroup('Massenstrom (kg/h)', 'hc-m', {
    value: 1000,
    min: 10,
    max: 10000,
    step: 100,
    unit: 'kg/h'
  });

  // Result Card: Druckverlust
  const resultPDrop = UI.ResultCard('Druckverlust (10m)', 'hc-pdrop', {
    value: '–',
    unit: 'bar',
    color: 'blue'
  });

  // Result Card: Strömungsgeschwindigkeit
  const resultV = UI.ResultCard('Strömungsgeschwindigkeit', 'hc-v', {
    value: '–',
    unit: 'm/s',
    color: 'blue'
  });

  // Result Card: Rohrdurchmesser
  const resultD = UI.ResultCard('Rohrdurchmesser (Richtwert)', 'hc-d', {
    value: '–',
    unit: 'mm',
    color: 'blue'
  });

  // Combine all into container
  container.innerHTML = 
    title +
    UI.Card('Eingaben', inputQ + inputDT + inputM) +
    UI.Card('Ergebnisse', resultPDrop + resultV + resultD);

  console.log('✅ Heating-Cooling v2 initialized');
}

// ════════════════════════════════════════════════════════════════
// EVENT LISTENERS
// ════════════════════════════════════════════════════════════════

function initHeatingCooling() {
  buildHeatingCoolingUI();

  // Input Listener
  window.$('hc-q')?.addEventListener('input', hcCalc);
  window.$('hc-dt')?.addEventListener('input', hcCalc);
  window.$('hc-m')?.addEventListener('input', hcCalc);

  // Initial calculation
  hcCalc();
}

// ════════════════════════════════════════════════════════════════
// INITIALIZATION
// ════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', initHeatingCooling);

// Export for testing
window.hcCalc = hcCalc;
window.lambdaCW = lambdaCW;
window.pdrop = pdrop;
