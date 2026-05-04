/**
 * TechCalc Pro - Entwaesserung Module v2 (ULTRA ROBUST)
 */

function calcEntwaesserungUltra(container) {
  if (!container) return;
  const inputs = container.querySelectorAll('input[type="number"]');
  if (inputs.length < 3) return;

  let wc = window.parseNum(inputs[0]?.value) || 0;
  let waschbecken = window.parseNum(inputs[1]?.value) || 0;
  let badewanne = window.parseNum(inputs[2]?.value) || 0;

  let wcSum = wc * 1.5 + waschbecken * 0.5 + badewanne * 1.0;

  const results = container.querySelectorAll('[class*="result"]');
  if (results.length >= 1) {
    results[0].innerHTML = window.loc(wcSum, 2);
  }
}

function buildEntwaesserungUI() {
  const container = window.$('ew-section');
  if (!container) return;

  const title = UI.SectionTitle('Entwässerung');

  const inputWC = UI.InputGroup('WC Anzahl', 'ew-wc', {
    value: 1,
    min: 0,
    max: 20,
    step: 1,
    unit: '–'
  });

  const inputWaschbecken = UI.InputGroup('Waschbecken Anzahl', 'ew-waschbecken', {
    value: 1,
    min: 0,
    max: 20,
    step: 1,
    unit: '–'
  });

  const inputBadewanne = UI.InputGroup('Badewanne Anzahl', 'ew-badewanne', {
    value: 1,
    min: 0,
    max: 10,
    step: 1,
    unit: '–'
  });

  const resultDUSum = UI.ResultCard('DU-Summe', 'ew-du-sum', {
    value: '–',
    unit: 'DU',
    color: 'blue'
  });

  container.innerHTML = 
    title +
    UI.Card('Eingaben', inputWC + inputWaschbecken + inputBadewanne) +
    UI.Card('Ergebnisse', resultDUSum);

  console.log('✅ Entwaesserung v2 initialized');
}

function initEntwaesserung() {
  buildEntwaesserungUI();

  const container = window.$('ew-section');
  if (!container) return;

  const inputs = container.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('input', () => calcEntwaesserungUltra(container));
    input.addEventListener('change', () => calcEntwaesserungUltra(container));
  });

  calcEntwaesserungUltra(container);
}

document.addEventListener('DOMContentLoaded', initEntwaesserung);

window.calcEntwaesserungUltra = calcEntwaesserungUltra;
