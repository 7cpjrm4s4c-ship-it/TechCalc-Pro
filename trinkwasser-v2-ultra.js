/**
 * TechCalc Pro - Trinkwasser Module v2 (ULTRA ROBUST)
 */

function twPeak(kWert, n) {
  return kWert * Math.sqrt(n);
}

function twCalculateTrinkwasserUltra(container) {
  if (!container) return;
  const inputs = container.querySelectorAll('input[type="number"]');
  if (inputs.length < 3) return;

  let wcCount = window.parseNum(inputs[0]?.value) || 1;
  let waschCount = window.parseNum(inputs[1]?.value) || 1;
  let badeCount = window.parseNum(inputs[2]?.value) || 0;

  let qSum = (wcCount * 0.5 + waschCount * 0.3 + badeCount * 0.75) * 1.5;

  const results = container.querySelectorAll('[class*="result"]');
  if (results.length >= 1) {
    results[0].innerHTML = window.loc(qSum, 2);
  }
}

function buildTrinkwasserUI() {
  const container = window.$('tw-section');
  if (!container) return;

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

  const container = window.$('tw-section');
  if (!container) return;

  const inputs = container.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('input', () => twCalculateTrinkwasserUltra(container));
    input.addEventListener('change', () => twCalculateTrinkwasserUltra(container));
  });

  twCalculateTrinkwasserUltra(container);
}

document.addEventListener('DOMContentLoaded', initTrinkwasser);

window.twCalculateTrinkwasserUltra = twCalculateTrinkwasserUltra;
window.twPeak = twPeak;
