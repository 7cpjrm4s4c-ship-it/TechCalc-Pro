/**
 * TechCalc Pro - Entwässerung Module v2 (FIXED)
 */

// ════════════════════════════════════════════════════════════════
// BERECHNUNGEN (100% unverändert)
// ════════════════════════════════════════════════════════════════

function calcEntwaesserung() {
  let useType = window.$('ew-use')?.value || 'wohnung';
  let wcSum = 0;

  // Fixture counts
  let wc = window.parseNum(window.$('ew-wc')?.value) || 0;
  let waschbecken = window.parseNum(window.$('ew-waschbecken')?.value) || 0;
  let badewanne = window.parseNum(window.$('ew-badewanne')?.value) || 0;

  wcSum = wc * 1.5 + waschbecken * 0.5 + badewanne * 1.0;

  window.$('ew-du-sum').innerHTML = window.loc(wcSum, 2);
}

// ════════════════════════════════════════════════════════════════
// UI AUFBAU
// ════════════════════════════════════════════════════════════════

function buildEntwaesserungUI() {
  const container = window.$('ew-section');
  if (!container) {
    console.warn('⚠️  ew-section not found');
    return;
  }

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
  window.$('ew-wc')?.addEventListener('input', calcEntwaesserung);
  window.$('ew-waschbecken')?.addEventListener('input', calcEntwaesserung);
  window.$('ew-badewanne')?.addEventListener('input', calcEntwaesserung);
  calcEntwaesserung();
}

document.addEventListener('DOMContentLoaded', initEntwaesserung);

window.calcEntwaesserung = calcEntwaesserung;
