/**
 * TechCalc Pro - Ventilation Module v2 (FIXED)
 * Phase 3: Refactored with correct Phase 1 UI-Components interface
 */

// ════════════════════════════════════════════════════════════════
// BERECHNUNGEN (100% unverändert)
// ════════════════════════════════════════════════════════════════

function rhoAir(t) {
  return 1.2 * (273 / (273 + t));
}

function calcLuft() {
  let v = window.parseNum(window.$('vent-v')?.value) || 0;
  let tzlH = window.parseNum(window.$('vent-tzl-h')?.value) || 20;
  let qInput = window.parseNum(window.$('vent-q-in')?.value) || 0;

  if (v <= 0 && qInput <= 0) {
    window.$('vent-q').innerHTML = '–';
    window.$('vent-leistung').innerHTML = '–';
    return;
  }

  let rho = rhoAir(tzlH);
  let Q = (v * rho) / 1.2;
  let qOut = (Q * 1.2 * 35) / 3600;

  window.$('vent-q').innerHTML = window.loc(Q, 2);
  window.$('vent-leistung').innerHTML = window.loc(qOut, 2);
}

// ════════════════════════════════════════════════════════════════
// UI AUFBAU (korrektes Phase 1 Interface)
// ════════════════════════════════════════════════════════════════

function buildVentilationUI() {
  const container = window.$('vent-section');
  if (!container) {
    console.warn('⚠️  vent-section not found');
    return;
  }

  const title = UI.SectionTitle('Lüftung');

  const inputV = UI.InputGroup('Volumenstrom (m³/h)', 'vent-v', {
    value: 5000,
    min: 100,
    max: 50000,
    step: 500,
    unit: 'm³/h'
  });

  const inputT = UI.InputGroup('Zuluft Temperatur (°C)', 'vent-tzl-h', {
    value: 20,
    min: -20,
    max: 50,
    step: 1,
    unit: '°C'
  });

  const inputQIn = UI.InputGroup('Leistung Input (kW)', 'vent-q-in', {
    value: 0,
    min: 0,
    max: 100,
    step: 1,
    unit: 'kW'
  });

  const resultQ = UI.ResultCard('Luftmassenstrom', 'vent-q', {
    value: '–',
    unit: 'kg/h',
    color: 'blue'
  });

  const resultPower = UI.ResultCard('Leistung', 'vent-leistung', {
    value: '–',
    unit: 'kW',
    color: 'blue'
  });

  container.innerHTML = 
    title +
    UI.Card('Eingaben', inputV + inputT + inputQIn) +
    UI.Card('Ergebnisse', resultQ + resultPower);

  console.log('✅ Ventilation v2 initialized');
}

function initVentilation() {
  buildVentilationUI();
  window.$('vent-v')?.addEventListener('input', calcLuft);
  window.$('vent-tzl-h')?.addEventListener('input', calcLuft);
  window.$('vent-q-in')?.addEventListener('input', calcLuft);
  calcLuft();
}

document.addEventListener('DOMContentLoaded', initVentilation);

window.calcLuft = calcLuft;
window.rhoAir = rhoAir;
