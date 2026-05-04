/**
 * TechCalc Pro - Trinkwasser Module v2 (FIXED)
 * Spitzenleistung Berechnung
 */

// ════════════════════════════════════════════════════════════════
// BERECHNUNGEN (100% unverändert)
// ════════════════════════════════════════════════════════════════

function twPeak(kWert, n) {
  return kWert * Math.sqrt(n);
}

function twCalculateTrinkwasser() {
  let building = window.$('tw-building')?.value || 'wohnung';
  
  let wcCount = window.parseNum(window.$('tw-wc')?.value) || 1;
  let waschCount = window.parseNum(window.$('tw-waschbecken')?.value) || 1;
  let badeCount = window.parseNum(window.$('tw-badewanne')?.value) || 0;

  let qSum = (wcCount * 0.5 + waschCount * 0.3 + badeCount * 0.75) * 1.5;

  window.$('tw-qsum').innerHTML = window.loc(qSum, 2);
}

// ════════════════════════════════════════════════════════════════
// UI AUFBAU
// ════════════════════════════════════════════════════════════════

function buildTrinkwasserUI() {
  const container = window.$('tw-section');
  if (!container) {
    console.warn('⚠️  tw-section not found');
    return;
  }

  const title = UI.SectionTitle('Trinkwasser');

  const inputWC = UI.InputGroup('WC Anzahl', 'tw-wc', {
    value: 1,
    min: 0,
    max: 20,
    step: 1,
    unit: '–'
  });

  const inputWaschbecken = UI.InputGroup('Waschbecken Anzahl', 'tw-waschbecken', {
    value: 1,
    min: 0,
    max: 20,
    step: 1,
    unit: '–'
  });

  const inputBadewanne = UI.InputGroup('Badewanne Anzahl', 'tw-badewanne', {
    value: 1,
    min: 0,
    max: 10,
    step: 1,
    unit: '–'
  });

  const resultQSum = UI.ResultCard('Spitzenlast (QSum)', 'tw-qsum', {
    value: '–',
    unit: 'L/min',
    color: 'blue'
  });

  container.innerHTML = 
    title +
    UI.Card('Eingaben', inputWC + inputWaschbecken + inputBadewanne) +
    UI.Card('Ergebnisse', resultQSum);

  console.log('✅ Trinkwasser v2 initialized');
}

function initTrinkwasser() {
  buildTrinkwasserUI();
  window.$('tw-wc')?.addEventListener('input', twCalculateTrinkwasser);
  window.$('tw-waschbecken')?.addEventListener('input', twCalculateTrinkwasser);
  window.$('tw-badewanne')?.addEventListener('input', twCalculateTrinkwasser);
  twCalculateTrinkwasser();
}

document.addEventListener('DOMContentLoaded', initTrinkwasser);

window.twCalculateTrinkwasser = twCalculateTrinkwasser;
window.twPeak = twPeak;
